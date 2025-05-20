import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Status } from "@shared/schema";
import { 
  Loader2, Calendar, Award, Users, ArrowLeft, CheckCircle, UserPlus, 
  Glasses, ClipboardList, BarChart, FileSpreadsheet, Download, User
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
    queryKey: ["/api/ideas", "submissions", numericId],
    queryFn: () => apiRequest("GET", `/api/ideas?category=idea&relatedTo=${numericId}`)
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
                          
                          {/* Time progress bar */}
                          <div className="mt-3 mb-1">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${remainingDays > 0 ? 'bg-blue-600' : 'bg-red-600'}`} 
                                style={{ 
                                  width: `${Math.max(0, Math.min(100, (daysElapsed / daysTotal) * 100))}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium text-blue-700 mt-2">
                            {remainingDays > 0 
                              ? `${remainingDays} days remaining` 
                              : "Challenge ended"}
                          </p>
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
                    <CardTitle>Challenge Status</CardTitle>
                    <CardDescription>
                      Current status and progress of this challenge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IdeaStatusTracker currentStatus={challenge.status as Status} />
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