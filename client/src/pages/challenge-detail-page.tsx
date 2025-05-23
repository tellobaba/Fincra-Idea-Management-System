import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Status } from "@shared/schema";
import { 
  Loader2, Calendar, Award, Users, ArrowLeft, CheckCircle, UserPlus, 
  Glasses, ClipboardList, BarChart, FileSpreadsheet, Download, User, Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define CommentWithUser interface for proper typing
interface CommentWithUser {
  id: number;
  content: string;
  createdAt: string;
  submitterId: number;
  parentId?: number;
  submitter?: {
    id: number;
    displayName: string;
    department: string;
    avatarUrl?: string;
  };
};

import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import FollowButton from "@/components/idea/follow-button";
import { CommentSection } from "@/components/idea/comment-section";
import { IdeaStatusTracker } from "@/components/idea/idea-status-tracker";

// Challenge detail page that uses the same IdeaDetailPage structure but with challenge-specific UI elements
export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const numericId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Fetch challenge details - we use ideas API for now as challenges use the same data structure
  const { data: challenge, isLoading } = useQuery({
    queryKey: ["/api/ideas", numericId],
    queryFn: () => apiRequest("GET", `/api/ideas/${numericId}`)
      .then(res => res.json())
  });
  
  // Check if user is a participant
  const { data: participantData, isLoading: isParticipantLoading } = useQuery({
    queryKey: ["/api/challenges", numericId, "isParticipant"],
    queryFn: () => apiRequest("GET", `/api/challenges/${numericId}/isParticipant`)
      .then(res => res.json()),
    enabled: !!user // Only run if user is logged in
  });
  
  // Extract isParticipant from API response
  const isParticipant = participantData?.isParticipant || false;
  
  // Get all participants
  const { data: participants = [], isLoading: isParticipantsLoading } = useQuery({
    queryKey: ["/api/challenges", numericId, "participants"],
    queryFn: () => apiRequest("GET", `/api/challenges/${numericId}/participants`)
      .then(res => res.json()),
    enabled: showParticipants // Only fetch when dialog is shown
  });
  
  // Mutation for participating in a challenge
  const participateMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/challenges/${numericId}/participate`),
    onSuccess: () => {
      toast({
        title: "Joined Challenge",
        description: "You are now participating in this challenge!",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", numericId, "isParticipant"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", numericId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/participating-challenges"] });
    },
    onError: (error) => {
      console.error("Error participating in challenge:", error);
      toast({
        title: "Error",
        description: "Failed to join the challenge. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for withdrawing from a challenge
  const withdrawMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/challenges/${numericId}/participate`),
    onSuccess: () => {
      toast({
        title: "Left Challenge",
        description: "You have withdrawn from this challenge",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", numericId, "isParticipant"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", numericId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/participating-challenges"] });
    },
    onError: (error) => {
      console.error("Error withdrawing from challenge:", error);
      toast({
        title: "Error",
        description: "Failed to leave the challenge. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if user has voted for this challenge
  const { data: hasVoted, isLoading: voteCheckLoading } = useQuery({
    queryKey: ["/api/ideas/vote-check", numericId],
    queryFn: () => apiRequest("GET", `/api/ideas/${numericId}/vote-check`)
      .then(res => res.json())
      .then(data => data.hasVoted)
  });

  // Check if user has followed this challenge
  const { data: isFollowed, isLoading: followCheckLoading } = useQuery({
    queryKey: ["/api/follows/check", numericId],
    queryFn: () => apiRequest("GET", `/api/follows/check?itemId=${numericId}&itemType=idea`)
      .then(res => res.json())
      .then(data => data.followed)
  });

  // Mutation for voting
  const voteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/ideas/${numericId}/vote`),
    onSuccess: () => {
      toast({
        title: "Vote added",
        description: "Your vote has been recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/vote-check", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
    }
  });

  // Mutation for removing vote
  const removeVoteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/ideas/${numericId}/vote`),
    onSuccess: () => {
      toast({
        title: "Vote removed",
        description: "Your vote has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/vote-check", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
    }
  });

  // Handle vote toggle
  const handleVoteToggle = () => {
    if (hasVoted) {
      removeVoteMutation.mutate();
    } else {
      voteMutation.mutate();
    }
  };

  // Format dates for display
  function formatDate(dateStr: string | Date) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  // Get initial of a name for avatar fallback
  function getInitial(name: string) {
    return name.charAt(0).toUpperCase();
  }
  
  // Check if user is admin or has admin-like role
  const isAdmin = user && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role);
  
  // Fetch submissions related to this challenge (for admin view)
  const { data: relatedSubmissions = [], isLoading: isRelatedSubmissionsLoading } = useQuery({
    queryKey: ["/api/challenges", numericId, "submissions"],
    queryFn: () => apiRequest("GET", `/api/challenges/${numericId}/submissions`)
      .then(res => res.json()),
    enabled: !!isAdmin // Only load for admin users
  });
  
  // Comment submission handler
  const handleAddComment = async (content: string, parentId?: number) => {
    if (!user) return;
    
    const comment = {
      content,
      parentId: parentId || null
    };
    
    try {
      await apiRequest("POST", `/api/ideas/${numericId}/comments`, comment);
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      toast({
        title: "Comment added",
        description: "Your comment has been added to the discussion"
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Comment failed",
        description: "There was an error adding your comment",
        variant: "destructive"
      });
    }
  }

  // Start/End date calculations
  const today = new Date();
  const startDate = challenge?.createdAt ? new Date(challenge.createdAt) : today;
  const endDate = new Date(startDate);
  const timeFrame = challenge?.adminNotes || "1 month"; // Default to one month if not specified
  
  // Extract number from timeframe
  const timeValue = parseInt(timeFrame.match(/\d+/)?.[0] || "30");
  const timeUnit = timeFrame.includes("week") ? "weeks" : "months";
  
  if (timeUnit === "weeks") {
    endDate.setDate(startDate.getDate() + (timeValue * 7));
  } else {
    endDate.setMonth(startDate.getMonth() + timeValue);
  }
  
  const formattedDate = challenge?.createdAt ? formatDate(challenge.createdAt) : '';
  const formattedEndDate = formatDate(endDate);
  
  // Calculate remaining days
  const daysTotal = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = daysTotal - daysElapsed;
  
  // Random participants count for display before data is loaded
  const participantsCount = 3 + (numericId % 13);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </main>
        </div>
      </div>
    );
  }

  // If challenge is not found
  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-5xl mx-auto">
              <Button 
                variant="outline" 
                className="mb-4"
                onClick={() => navigate("/challenges")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Challenges
              </Button>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center py-8">Challenge not found. It may have been removed.</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="mb-4 flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate("/challenges")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Challenges
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant={hasVoted ? "default" : "outline"}
                  className={hasVoted ? "bg-blue-600 hover:bg-blue-700" : ""}
                  onClick={handleVoteToggle}
                  disabled={voteMutation.isPending || removeVoteMutation.isPending}
                >
                  {voteMutation.isPending || removeVoteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {hasVoted ? "Voted" : "Vote"} ({challenge.votes || 0})
                </Button>
                
                <FollowButton 
                  ideaId={numericId} 
                  isFollowed={isFollowed || false} 
                  variant="outline"
                />
                
                {user && (
                  <Button
                    variant={isParticipant ? "outline" : "default"}
                    className={isParticipant ? "" : "bg-green-600 hover:bg-green-700"}
                    onClick={() => isParticipant ? withdrawMutation.mutate() : participateMutation.mutate()}
                    disabled={
                      participateMutation.isPending || 
                      withdrawMutation.isPending || 
                      isParticipantLoading || 
                      user.id === challenge.submittedById // Disable if user is the creator
                    }
                    title={user.id === challenge.submittedById ? "You cannot participate in your own challenge" : ""}
                  >
                    {participateMutation.isPending || withdrawMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isParticipant ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : user.id === challenge.submittedById ? (
                      <UserPlus className="mr-2 h-4 w-4 opacity-50" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {isParticipant ? "Participating" : user.id === challenge.submittedById ? "Creator" : "Participate"}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowParticipants(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  See Participants
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl font-bold mb-2">{challenge.title}</CardTitle>
                        <Badge 
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 mb-2"
                        >
                          Challenge
                        </Badge>
                        {challenge.department && (
                          <Badge 
                            variant="outline" 
                            className="ml-2 mb-2"
                          >
                            {challenge.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="shadow-none bg-blue-50 border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                            <h3 className="font-medium">Challenge Timeline</h3>
                          </div>
                          <p className="text-sm mb-2">Start: {formattedDate}</p>
                          <p className="text-sm mb-2">End: {formattedEndDate}</p>
                          
                          {/* Enhanced time progress bar */}
                          <div className="mt-4 mb-3">
                            <div className="flex justify-between mb-1 text-xs">
                              <span>Started {formattedDate}</span>
                              <span>Ends {formattedEndDate}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-4 border border-gray-200">
                              <div 
                                className={`h-3.5 rounded-full ${remainingDays > 0 
                                  ? remainingDays < 3 
                                    ? 'bg-orange-500' 
                                    : 'bg-blue-600' 
                                  : 'bg-red-600'}`} 
                                style={{ 
                                  width: `${Math.max(0, Math.min(100, (daysElapsed / daysTotal) * 100))}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center mt-2">
                            <Clock className="h-4 w-4 mr-1 text-blue-700" />
                            <p className="text-sm font-medium text-blue-700">
                              {remainingDays > 0 
                                ? `${remainingDays} days remaining` 
                                : "Challenge ended"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-none bg-green-50 border-green-100">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <Users className="h-5 w-5 mr-2 text-green-600" />
                            <h3 className="font-medium">Participation</h3>
                          </div>
                          <p className="text-sm mb-2">
                            {isParticipantsLoading 
                              ? `Loading participants...` 
                              : `${participants.length || participantsCount} participants`}
                          </p>
                          {isParticipant && (
                            <p className="text-sm font-medium text-green-700">
                              You're participating in this challenge!
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Submitted by</p>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={challenge.submitter?.avatarUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitial(challenge.submitter?.displayName || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{challenge.submitter?.displayName || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{challenge.submitter?.department || ''}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                          <p className="mt-1">{formattedDate}</p>
                        </div>
                      </div>
                    </div>
                  
                    {challenge.tags && challenge.tags.length > 0 && (
                      <div className="mb-6 border-t pt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {challenge.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-gray-50">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                      <div className="prose max-w-none text-foreground">
                        {/* Display idea description with support for line breaks */}
                        {challenge.description.split('\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </div>

                    {/* Display Success Criteria / Impact */}
                    {challenge.impact && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Success Criteria</h4>
                        <div className="prose max-w-none text-foreground">
                          {challenge.impact.split('\n').map((paragraph: string, i: number) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display Timeframe (stored in adminNotes field) */}
                    {challenge.adminNotes && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Timeframe</h4>
                        <div className="prose max-w-none text-foreground">
                          {challenge.adminNotes.split('\n').map((paragraph: string, i: number) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display Reward (stored in inspiration field) */}
                    {challenge.inspiration && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Reward</h4>
                        <div className="prose max-w-none text-foreground">
                          {challenge.inspiration.split('\n').map((paragraph: string, i: number) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display Similar Solutions or Prior Attempts */}
                    {challenge.similarSolutions && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Similar Solutions or Prior Attempts</h4>
                        <div className="prose max-w-none text-foreground">
                          {challenge.similarSolutions.split('\n').map((paragraph: string, i: number) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display Workstream */}
                    {challenge.workstream && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Workstream</h4>
                        <div className="prose max-w-none text-foreground">
                          {challenge.workstream.split('\n').map((paragraph: string, i: number) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit Solution button */}
                    {user && isParticipant && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <Button 
                          className="w-full"
                          onClick={() => navigate(`/submit/idea?challengeId=${numericId}`)}
                        >
                          Submit Your Solution
                        </Button>
                      </div>
                    )}
                    
                    {/* Display attachments if available */}
                    {challenge.mediaUrls && Array.isArray(challenge.mediaUrls) && challenge.mediaUrls.length > 0 && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Attachments</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {challenge.mediaUrls.map((media: {type: string; url: string}, index: number) => {
                            // Use absolute URLs for images
                            const fullUrl = media.url.startsWith('http') 
                              ? media.url 
                              : `${window.location.origin}${media.url}`;
                              
                            // Determine media type from both type and URL
                            let mediaType = media.type || 'unknown';
                            
                            // Special handling for images
                            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                            const isImage = mediaType === 'image' || 
                              imageExts.some(ext => media.url.toLowerCase().endsWith(ext));
                            
                            // Special handling for audio
                            const audioExts = ['.mp3', '.wav', '.webm', '.ogg', '.m4a'];
                            const isAudio = mediaType === 'audio' || 
                              audioExts.some(ext => media.url.toLowerCase().endsWith(ext));
                            
                            return (
                              <div key={index} className="border rounded-md overflow-hidden">
                                {isImage ? (
                                  <div className="h-auto p-2">
                                    <img 
                                      src={fullUrl} 
                                      alt={`Attachment ${index + 1}`}
                                      className="w-full object-contain max-h-48"
                                      onLoad={() => console.log(`Image loaded successfully:`, { url: media.url, fullUrl })}
                                      onError={(e) => {
                                        console.error(`Error loading image:`, { url: media.url, fullUrl });
                                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                      }}
                                    />
                                    <div className="mt-2 text-xs text-center text-muted-foreground">
                                      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">View image</a>
                                    </div>
                                  </div>
                                ) : isAudio ? (
                                  <div className="p-4 bg-muted flex items-center justify-center h-48">
                                    <div className="w-full">
                                      <p className="text-xs text-muted-foreground mb-2">Audio Recording</p>
                                      <audio src={fullUrl} controls className="w-full" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-muted flex items-center justify-center h-48">
                                    <a 
                                      href={fullUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex flex-col items-center text-primary hover:text-primary-dark"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                      </svg>
                                      <span>View Attachment</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Admin section for challenge management */}
                    {isAdmin && (
                      <div className="border-t pt-4 mt-4 border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Admin Management</h4>
                        
                        <Tabs defaultValue="participants" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="participants" className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Participants
                            </TabsTrigger>
                            <TabsTrigger value="submissions" className="flex items-center">
                              <ClipboardList className="h-4 w-4 mr-2" />
                              Submissions
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="participants" className="mt-4">
                            <div className="rounded-md border">
                              <div className="p-4 bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">Challenge Participants</h4>
                                  <p className="text-sm text-gray-500">Total: {participants.length}</p>
                                </div>
                              </div>
                              
                              <div className="max-h-80 overflow-y-auto p-2">
                                {isParticipantsLoading ? (
                                  <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                  </div>
                                ) : participants.length === 0 ? (
                                  <div className="text-center py-6 text-gray-500">
                                    No participants yet.
                                  </div>
                                ) : (
                                  <div className="divide-y">
                                    {participants.map((participant: any) => (
                                      <div key={participant.id} className="flex items-center justify-between p-3">
                                        <div className="flex items-center">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={typeof participant.avatarUrl === 'string' ? participant.avatarUrl : undefined} />
                                            <AvatarFallback>{participant.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <div className="ml-3">
                                            <p className="font-medium text-sm">{participant.displayName}</p>
                                            <p className="text-xs text-gray-500">{participant.department || 'No department'}</p>
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {participant.role || 'Participant'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="submissions" className="mt-4">
                            <div className="rounded-md border">
                              <div className="p-4 bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">Challenge Submissions</h4>
                                  <p className="text-sm text-gray-500">Total: {relatedSubmissions.length}</p>
                                </div>
                              </div>
                              
                              <div className="max-h-80 overflow-y-auto">
                                {isRelatedSubmissionsLoading ? (
                                  <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                  </div>
                                ) : relatedSubmissions.length === 0 ? (
                                  <div className="text-center py-6 text-gray-500">
                                    No submissions yet.
                                  </div>
                                ) : (
                                  <div className="divide-y">
                                    {relatedSubmissions.map((submission: any) => (
                                      <div key={submission.id} className="p-3">
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <a 
                                              onClick={() => navigate(`/ideas/${submission.id}`)}
                                              className="font-medium text-blue-600 hover:underline cursor-pointer"
                                            >
                                              {submission.title}
                                            </a>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Submitted by {submission.submitter?.displayName || 'Unknown'} on {formatDate(submission.createdAt)}
                                            </p>
                                          </div>
                                          <Badge 
                                            variant="outline"
                                            className={`capitalize ${
                                              submission.status === 'in-review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                              submission.status === 'implemented' ? 'bg-green-50 text-green-700 border-green-200' :
                                              submission.status === 'merged' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                              submission.status === 'parked' ? 'bg-red-50 text-red-700 border-red-200' :
                                              'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}
                                          >
                                            {submission.status.replace('-', ' ')}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{submission.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex flex-col items-start border-t">
                    {/* Comments section */}
                    <div className="w-full">
                      <CommentSection 
                        ideaId={numericId}
                        comments={challenge.comments || []}
                        onAddComment={handleAddComment}
                      />
                    </div>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Challenge Timeline</CardTitle>
                    <CardDescription>
                      Time remaining for this challenge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Enhanced time progress bar */}
                    <div className="mb-6">
                      <div className="flex justify-between mb-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Started: {formattedDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Ends: {formattedEndDate}</span>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-5 border border-gray-200 mt-3">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-in-out flex items-center justify-center text-xs font-medium text-white ${
                            remainingDays > 0 
                              ? remainingDays < 3 
                                ? 'bg-orange-500' 
                                : 'bg-blue-600' 
                              : 'bg-red-600'
                          }`} 
                          style={{ 
                            width: `${Math.max(0, Math.min(100, (daysElapsed / daysTotal) * 100))}%` 
                          }}
                        >
                          {Math.floor((daysElapsed / daysTotal) * 100)}%
                        </div>
                      </div>
                      
                      {/* Time remaining indicator */}
                      <div className="flex items-center justify-center mt-4">
                        <div className={`flex items-center justify-center px-4 py-2 rounded-full ${
                          remainingDays > 0 
                            ? remainingDays < 3 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-blue-100 text-blue-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <Clock className="h-5 w-5 mr-2" />
                          <p className="font-medium">
                            {remainingDays > 0 
                              ? `${remainingDays} days remaining` 
                              : "Challenge ended"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Current Status:</p>
                      <Badge 
                        variant="outline"
                        className={`capitalize ${
                          challenge.status === 'in-review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          challenge.status === 'implemented' ? 'bg-green-50 text-green-700 border-green-200' :
                          challenge.status === 'merged' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          challenge.status === 'parked' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {challenge.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {challenge.priority && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge 
                        variant="outline"
                        className={`capitalize ${
                          challenge.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                          challenge.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {challenge.priority}
                      </Badge>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Challenge Reward</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-start space-x-4">
                    <Award className="h-10 w-10 text-yellow-500" />
                    <div>
                      <p className="font-medium">{challenge.inspiration || "Recognition and Impact"}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Complete this challenge to earn the reward
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dialog to display challenge participants */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Challenge Participants</DialogTitle>
            <DialogDescription>
              Users participating in this challenge
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {isParticipantsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No participants yet. Be the first to join!
              </div>
            ) : (
              <div className="grid gap-4">
                {participants.map((participant: any) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100">
                    <Avatar>
                      <AvatarImage src={typeof participant.avatarUrl === 'string' ? participant.avatarUrl : undefined} />
                      <AvatarFallback>{participant.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.displayName}</p>
                      <p className="text-sm text-gray-500">{participant.department || 'No department'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}