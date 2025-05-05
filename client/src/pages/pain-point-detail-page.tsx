import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Award, Calendar, Users, ThumbsUp, MessageSquare } from "lucide-react";
import { format } from "date-fns";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import FollowButton from "@/components/idea/follow-button";
import { CommentSection } from "@/components/idea/comment-section";
import { IdeaStatusTracker } from "@/components/idea/idea-status-tracker";
import { type Status } from "@shared/schema";

// Helper to get initials from name
const getInitial = (name: string) => {
  return name.charAt(0).toUpperCase();
};

// Type definition for User interface
interface User {
  id: number;
  displayName: string;
  department: string;
  avatarUrl?: string;
}

// Type definition for Comment interface
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  submitterId: number;
  submitter?: User;
}

// Type definition for PainPoint interface
interface PainPoint {
  id: number;
  title: string;
  description: string;
  category: string;
  urgency: string;
  rootCause: string;
  status: string;
  createdAt: string;
  votes: number;
  comments: Comment[];
  submitterId: number;
  submitter?: User;
  mediaUrls?: { type: string; url: string }[];
  department?: string;
}

export default function PainPointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const numericId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch pain point details
  const { data: painPoint, isLoading } = useQuery({
    queryKey: ["/api/ideas", numericId],
    queryFn: () => apiRequest("GET", `/api/ideas/${numericId}`)
      .then(res => res.json())
  });

  // Check if user has voted for this pain point
  const { data: hasVoted, isLoading: voteCheckLoading } = useQuery({
    queryKey: ["/api/ideas/vote-check", numericId],
    queryFn: () => apiRequest("GET", `/api/ideas/${numericId}/vote-check`)
      .then(res => res.json())
      .then(data => data.hasVoted)
  });

  // Check if user has followed this pain point
  const { data: isFollowed, isLoading: followCheckLoading } = useQuery({
    queryKey: ["/api/follows/check", numericId],
    queryFn: () => apiRequest("GET", `/api/follows/check?itemId=${numericId}&itemType=idea`)
      .then(res => res.json())
      .then(data => data.isFollowed)
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/ideas/${numericId}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/vote-check", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-votes"] });
      toast({
        title: "Vote added",
        description: "Your vote has been recorded",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove vote mutation
  const removeVoteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/ideas/${numericId}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/vote-check", numericId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-votes"] });
      toast({
        title: "Vote removed",
        description: "Your vote has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVoteToggle = async () => {
    if (hasVoted) {
      await removeVoteMutation.mutateAsync();
    } else {
      await voteMutation.mutateAsync();
    }
  };

  if (isLoading || voteCheckLoading || followCheckLoading) {
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

  if (!painPoint) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <Button 
              variant="ghost" 
              className="mb-4 pl-2" 
              onClick={() => navigate("/pain-points")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pain Points
            </Button>
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <h2 className="text-2xl font-bold mb-2">Pain Point Not Found</h2>
              <p className="text-muted-foreground mb-6">The pain point you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate("/pain-points")}>View All Pain Points</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(painPoint.createdAt), "MMM d, yyyy");

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
              onClick={() => navigate("/pain-points")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pain Points
            </Button>
            
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold">{painPoint.title}</h1>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                    Pain Point
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
                  {hasVoted ? "Voted" : "Vote"} ({painPoint.votes || 0})
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
              {/* Main content cards */}
              <Card>
                <CardHeader>
                  <CardTitle>Pain Point Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Problem Description</h3>
                        <div className="prose max-w-none">
                          {painPoint.description.split('\n').map((paragraph: string, i: number) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Root Cause Analysis</h3>
                        <div className="prose max-w-none">
                          {painPoint.rootCause ? (
                            painPoint.rootCause.split('\n').map((paragraph: string, i: number) => (
                              <p key={i}>{paragraph}</p>
                            ))
                          ) : (
                            <p>No root cause analysis provided</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Urgency Level</h3>
                        <Badge className={`
                          ${painPoint.urgency === 'high' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                          ${painPoint.urgency === 'medium' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''}
                          ${painPoint.urgency === 'low' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                        `}>
                          {painPoint.urgency?.charAt(0).toUpperCase() + painPoint.urgency?.slice(1)}
                        </Badge>
                      </div>

                      {painPoint.department && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Department</h3>
                          <p>{painPoint.department}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media attachments if available */}
              {painPoint.mediaUrls && Array.isArray(painPoint.mediaUrls) && painPoint.mediaUrls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {painPoint.mediaUrls.map((media: {type: string; url: string}, index: number) => {
                        // Use absolute URLs for media
                        const fullUrl = media.url.startsWith('http') 
                          ? media.url 
                          : `${window.location.origin}${media.url}`;
                          
                        // Determine media type from both type and URL
                        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                        const isImage = media.type === 'image' || 
                          imageExts.some(ext => media.url.toLowerCase().endsWith(ext));
                        
                        // Special handling for audio
                        const audioExts = ['.mp3', '.wav', '.webm', '.ogg', '.m4a'];
                        const isAudio = media.type === 'audio' || 
                          audioExts.some(ext => media.url.toLowerCase().endsWith(ext));
                        
                        if (isImage) {
                          return (
                            <div key={index} className="overflow-hidden rounded-md border border-gray-200">
                              <img 
                                src={fullUrl} 
                                alt={`Attachment ${index + 1}`}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          );
                        } else if (isAudio) {
                          return (
                            <div key={index} className="p-4 border rounded-md bg-gray-50">
                              <p className="text-sm font-medium mb-2">Voice Note {index + 1}</p>
                              <audio controls className="w-full">
                                <source src={fullUrl} type="audio/mpeg" />
                                Your browser does not support audio playback.
                              </audio>
                            </div>
                          );
                        } else {
                          // Generic file attachment display
                          return (
                            <div key={index} className="p-4 border rounded-md flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-blue-600">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Attachment {index + 1}</p>
                                <a 
                                  href={fullUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Download File
                                </a>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments section */}
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <CommentSection 
                    comments={painPoint.comments || []} 
                    ideaId={numericId}
                    onAddComment={async (content) => {
                      await apiRequest("POST", `/api/ideas/${numericId}/comments`, { content });
                      queryClient.invalidateQueries({ queryKey: ["/api/ideas", numericId] });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <IdeaStatusTracker 
                    currentStatus={painPoint.status as Status}
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
                      <AvatarImage src={painPoint.submitter?.avatarUrl} />
                      <AvatarFallback>
                        {getInitial(painPoint.submitter?.displayName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{painPoint.submitter?.displayName}</p>
                      <p className="text-sm text-gray-500">{painPoint.submitter?.department}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">Votes</span>
                      </div>
                      <span className="font-medium">{painPoint.votes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">Comments</span>
                      </div>
                      <span className="font-medium">{painPoint.comments?.length || 0}</span>
                    </div>
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
