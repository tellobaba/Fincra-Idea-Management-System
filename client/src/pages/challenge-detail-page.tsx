import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Status } from "@shared/schema";
import { Loader2, Calendar, Award, Users, ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";

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
  
  // Fetch challenge details
  const { data: challenge, isLoading } = useQuery({
    queryKey: ["/api/ideas", numericId],
    queryFn: () => apiRequest("GET", `/api/ideas/${numericId}`)
      .then(res => res.json())
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
    mutationFn: () => {
      return apiRequest("POST", `/api/ideas/${numericId}/vote`);
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/vote-check", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-votes"] });
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to vote",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing vote
  const removeVoteMutation = useMutation({
    mutationFn: () => {
      return apiRequest("DELETE", `/api/ideas/${numericId}/vote`);
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/vote-check", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-votes"] });
      toast({
        title: "Vote removed",
        description: "Your vote has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove vote",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="flex justify-center items-center h-[calc(100vh-64px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Challenge not found</h2>
              <p className="text-gray-500 mb-4">
                The challenge you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/challenges")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format dates for display
  const formattedDate = challenge.createdAt
    ? new Date(challenge.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : 'Unknown date';

  // Calculate dates for challenge timeline
  const startDate = new Date('2025-05-01');
  const endDate = new Date('2025-05-15');
  
  // Random but deterministic reward based on challenge ID
  const reward = numericId % 2 === 0 ? 
    `$${(500 + numericId * 100)} Cash Prize` : 
    "Recognition + Team Celebration";
  
  // Remaining days calculation
  const today = new Date();
  const daysTotal = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = daysTotal - daysElapsed;
  
  // Random participants count
  const participants = 3 + (numericId % 13);

  // Handle vote toggle
  const handleVoteToggle = () => {
    if (hasVoted) {
      removeVoteMutation.mutate();
    } else {
      voteMutation.mutate();
    }
  };

  // Get username initial for avatar
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="mb-4 pl-2" 
              onClick={() => navigate("/challenges")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
            </Button>
            
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold">{challenge.title}</h1>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                    Challenge
                  </Badge>
                  <span className="text-sm text-gray-500 ml-3">Posted on {formattedDate}</span>
                </div>
              </div>
              
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
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Title</h4>
                          <p className="mt-1 text-base font-medium">{challenge.title}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Category</h4>
                          <p className="mt-1 capitalize">{challenge.category.replace('-', ' ')}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <div className="mt-1">
                            <Badge 
                              className={`
                                ${challenge.status === 'submitted' ? 'bg-gray-100 text-gray-800' : ''}
                                ${challenge.status === 'in-review' ? 'bg-blue-100 text-blue-800' : ''}
                                ${challenge.status === 'merged' ? 'bg-purple-100 text-purple-800' : ''}
                                ${challenge.status === 'parked' ? 'bg-amber-100 text-amber-800' : ''}
                                ${challenge.status === 'implemented' ? 'bg-green-100 text-green-800' : ''}
                              `}
                            >
                              {challenge.status.replace('-', ' ').charAt(0).toUpperCase() + challenge.status.replace('-', ' ').slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        {challenge.department && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Department</h4>
                            <p className="mt-1">{challenge.department}</p>
                          </div>
                        )}
                        
                        {challenge.priority && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                            <div className="mt-1">
                              <Badge 
                                className={`
                                  ${challenge.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                                  ${challenge.priority === 'medium' ? 'bg-amber-100 text-amber-800' : ''}
                                  ${challenge.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                                `}
                              >
                                {challenge.priority.charAt(0).toUpperCase() + challenge.priority.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Submitted By</h4>
                          <div className="mt-1 flex items-center">
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
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                          <p className="mt-1">{formattedDate}</p>
                        </div>
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

                  {/* Display attachments if available */}
                  {challenge.mediaUrls && Array.isArray(challenge.mediaUrls) && challenge.mediaUrls.length > 0 && (
                    <div className="border-t pt-4 mt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {challenge.mediaUrls.map((media: {type: string; url: string}, index: number) => {
                          // Use absolute URLs for media
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
                                    onError={(e) => {
                                      console.error(`Error loading image:`, { url: media.url, fullUrl });
                                      
                                      // Fall back to placeholder
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Challenge Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-sm text-gray-500">
                          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  
                    <div className="flex items-center gap-4">
                      <Award className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Reward</p>
                        <p className="text-sm text-gray-500">{reward}</p>
                      </div>
                    </div>
                  
                    <div className="flex items-center gap-4">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Participants</p>
                        <p className="text-sm text-gray-500">{participants} people have taken this challenge</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Time remaining</span>
                        <span className="text-sm font-bold">{remainingDays} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-blue-600" 
                          style={{ width: `${Math.min(100, (remainingDays / daysTotal) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    Submit Your Solution
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Discussion</CardTitle>
                  <CardDescription>Share your thoughts and discuss this challenge</CardDescription>
                </CardHeader>
                <CardContent>
                  <CommentSection 
                    comments={challenge.comments || []} 
                    ideaId={numericId}
                    onAddComment={async (content) => {
                      await apiRequest("POST", `/api/ideas/${numericId}/comments`, { content });
                      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <IdeaStatusTracker 
                    currentStatus={challenge.status as Status}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Submitter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={challenge.submitter?.avatarUrl} />
                      <AvatarFallback>
                        {getInitial(challenge.submitter?.displayName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{challenge.submitter?.displayName || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">{challenge.submitter?.department || 'Unknown department'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Created</p>
                    <p className="text-sm text-gray-500">{formattedDate}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Type</p>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                      Challenge
                    </Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}