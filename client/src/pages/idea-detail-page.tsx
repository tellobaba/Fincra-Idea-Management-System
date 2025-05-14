import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { IdeaStatusTracker } from "@/components/idea/idea-status-tracker";
import { CommentSection } from "@/components/idea/comment-section";
import FollowButton from "@/components/idea/follow-button";
import { IdeaDetailResponse, CommentWithUser, CATEGORY_CONFIG, STATUS_CONFIG } from "@/types/ideas";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ThumbsUp, Trash2, ChevronDown } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Status, statusValues } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function IdeaDetailPage() {
  const params = useParams();
  const ideaId = params.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [, navigate] = useLocation();
  
  // Check if current user has admin privileges
  const isAdmin = user?.role && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role);
  
  // Fetch idea details
  const { data: idea, isLoading, error } = useQuery<IdeaDetailResponse>({
    queryKey: [`/api/ideas/${ideaId}`],
    enabled: !isNaN(ideaId),
  });
  
  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: number }) => {
      await apiRequest("POST", `/api/ideas/${ideaId}/comments`, { 
        content,
        parentId
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh comments
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Comment failed",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for voting on an idea
  const voteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/ideas/${ideaId}/vote`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh idea data
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
      
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
      
      setIsVoting(false);
    },
    onError: (error) => {
      toast({
        title: "Vote failed",
        description: error instanceof Error ? error.message : "Failed to record vote",
        variant: "destructive",
      });
      
      setIsVoting(false);
    },
  });
  
  // Mutation for deleting an idea (admin only)
  const deleteIdeaMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/ideas/${ideaId}`);
    },
    onSuccess: () => {
      // Show a success toast
      toast({
        title: "Idea deleted",
        description: "The idea has been permanently deleted.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/recent-activity"] });
      
      // Navigate back to the ideas list
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete idea",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating idea status (admin only)
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/ideas/${ideaId}`, { status });
    },
    onSuccess: () => {
      // Invalidate queries to refresh idea data
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Status updated",
        description: "The idea status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update idea status",
        variant: "destructive",
      });
    },
  });
  
  // Helper to format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Handle comment submission
  const handleAddComment = async (content: string, parentId?: number) => {
    await addCommentMutation.mutateAsync({ content, parentId });
  };
  
  // Handle vote
  const handleVote = () => {
    if (isVoting) return;
    
    setIsVoting(true);
    voteMutation.mutate();
  };
  
  // Handle status change (for admins)
  const handleStatusChange = (status: Status) => {
    if (!idea || !isAdmin) return;
    updateStatusMutation.mutate(status);
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error || !idea) {
    return (
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Idea</h2>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "The requested idea could not be found."}
              </p>
              <Button asChild>
                <Link href="/">Return to Dashboard</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Link href="/" className="text-primary hover:text-primary-dark mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold">Idea Details</h1>
          </div>
          
          <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">{idea.title}</h2>
                
                {/* Admin delete button with confirmation dialog */}
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this submission?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the submission
                          and all associated data including comments, votes, and follow status.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteIdeaMutation.mutate()}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge 
                  variant="outline" 
                  className={CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.color}
                >
                  {CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.label}
                </Badge>
                
                {idea.tags && idea.tags.map((tag: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </Badge>
                ))}
                
                <div className="ml-auto flex items-center text-muted-foreground text-sm">
                  <Calendar className="mr-1 h-4 w-4" /> 
                  Submitted on {formatDate(idea.createdAt)}
                </div>
              </div>
              
              <IdeaStatusTracker currentStatus={idea.status as Status} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Idea Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Title</h4>
                          <p className="mt-1 text-base font-medium">{idea.title}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Category</h4>
                          <p className="mt-1 capitalize">{idea.category.replace('-', ' ')}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <div className="mt-1">
                            <Badge 
                              className={`
                                ${idea.status === 'submitted' ? 'bg-gray-100 text-gray-800' : ''}
                                ${idea.status === 'in-review' ? 'bg-blue-100 text-blue-800' : ''}
                                ${idea.status === 'merged' ? 'bg-purple-100 text-purple-800' : ''}
                                ${idea.status === 'parked' ? 'bg-amber-100 text-amber-800' : ''}
                                ${idea.status === 'implemented' ? 'bg-green-100 text-green-800' : ''}
                              `}
                            >
                              {idea.status.replace('-', ' ').charAt(0).toUpperCase() + idea.status.replace('-', ' ').slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        {idea.department && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Department</h4>
                            <p className="mt-1">{idea.department}</p>
                          </div>
                        )}
                        
                        {idea.priority && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                            <div className="mt-1">
                              <Badge 
                                className={`
                                  ${idea.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                                  ${idea.priority === 'medium' ? 'bg-amber-100 text-amber-800' : ''}
                                  ${idea.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                                `}
                              >
                                {idea.priority.charAt(0).toUpperCase() + idea.priority.slice(1)}
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
                              <AvatarImage src={idea.submitter?.avatarUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {idea.submitter?.displayName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{idea.submitter?.displayName || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{idea.submitter?.department || ''}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                          <p className="mt-1">{formatDate(idea.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="mb-6 border-t pt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-gray-50">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 border-gray-100">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <div className="prose max-w-none text-foreground">
                      {/* Display idea description with support for line breaks */}
                      {idea.description.split('\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  {/* Display Impact and Relevance */}
                  {idea.impact && (
                    <div className="border-t pt-4 mt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Impact and Relevance</h4>
                      <div className="prose max-w-none text-foreground">
                        {idea.impact.split('\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display Organization Category (Workstream) */}
                  {idea.organizationCategory && (
                    <div className="border-t pt-4 mt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Workstream</h4>
                      <p>{idea.organizationCategory}</p>
                    </div>
                  )}

                  {/* Display Inspiration */}
                  {idea.inspiration && (
                    <div className="border-t pt-4 mt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Inspiration or Source</h4>
                      <div className="prose max-w-none text-foreground">
                        {idea.inspiration.split('\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display Similar Solutions */}
                  {idea.similarSolutions && (
                    <div className="border-t pt-4 mt-4 border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Similar Solutions or Prior Attempts</h4>
                      <div className="prose max-w-none text-foreground">
                        {idea.similarSolutions.split('\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
                
              {/* Display attachments if available */}
              {idea.mediaUrls && Array.isArray(idea.mediaUrls) && idea.mediaUrls.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Attachments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {idea.mediaUrls.map((media: {type: string; url: string}, index: number) => {
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
                                  // Try to fetch the image to see if it exists on the server
                                  fetch(fullUrl, { method: 'HEAD' })
                                    .then(response => {
                                      console.log(`Image HEAD response:`, { 
                                        status: response.status, 
                                        ok: response.ok, 
                                        statusText: response.statusText,
                                        headers: Array.from(response.headers.entries())
                                      });
                                    })
                                    .catch(error => {
                                      console.error(`Failed to fetch image HEAD:`, error);
                                    });
                                  
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
              
              <div className="mt-4 flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleVote}
                  disabled={isVoting}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{isVoting ? "Voting..." : `Upvote (${idea.votes})`}</span>
                </Button>
                
                {/* Add Follow button */}
                <FollowButton 
                  ideaId={idea.id} 
                  isFollowed={idea.isFollowed || false} 
                  variant="outline"
                  size="sm"
                />
              </div>
              
              <div className="border-t border-border pt-6">
                <CommentSection 
                  comments={idea.comments as CommentWithUser[]} 
                  ideaId={idea.id}
                  onAddComment={handleAddComment}
                />
              </div>
            </div>
          </div>
        </main>
        
        {/* Admin Actions (Visible for admin roles) */}
        {isAdmin && (
          <div className="fixed bottom-4 right-4 shadow-lg rounded-lg overflow-hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 px-4 py-3 font-medium flex items-center"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                      Change Status <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {statusValues.map((status) => {
                  // Get style based on status
                  const isCurrentStatus = idea.status === status;
                  const statusColor = isCurrentStatus ? "bg-primary/10 font-medium" : "";
                  
                  // Format status for display
                  const displayStatus = status
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                    
                  return (
                    <DropdownMenuItem
                      key={status}
                      className={`${statusColor} cursor-pointer ${isCurrentStatus ? 'cursor-not-allowed' : ''}`}
                      disabled={isCurrentStatus || updateStatusMutation.isPending}
                      onClick={() => handleStatusChange(status as Status)}
                    >
                      {displayStatus}
                      {isCurrentStatus && " (Current)"}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
