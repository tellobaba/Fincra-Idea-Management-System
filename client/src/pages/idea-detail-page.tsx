import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { IdeaStatusTracker } from "@/components/idea/idea-status-tracker";
import { CommentSection } from "@/components/idea/comment-section";
import { IdeaDetailResponse, CommentWithUser, CATEGORY_CONFIG, STATUS_CONFIG } from "@/types/ideas";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ThumbsUp } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function IdeaDetailPage() {
  const params = useParams();
  const ideaId = params.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  
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
  const handleStatusChange = () => {
    if (!idea || !isAdmin) return;
    
    let nextStatus: string;
    switch (idea.status) {
      case "submitted":
        nextStatus = "in-review";
        break;
      case "in-review":
        nextStatus = "in-refinement";
        break;
      case "in-refinement":
        nextStatus = "implemented";
        break;
      case "implemented":
        nextStatus = "closed";
        break;
      default:
        nextStatus = "submitted";
    }
    
    updateStatusMutation.mutate(nextStatus);
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
              <h2 className="text-xl font-semibold mb-2">{idea.title}</h2>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge 
                  variant="outline" 
                  className={CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.color}
                >
                  {CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.label}
                </Badge>
                
                {idea.tags && idea.tags.map((tag, index) => (
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
              
              <IdeaStatusTracker currentStatus={idea.status as any} />
              
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Description</h3>
                
                <div className="prose max-w-none text-foreground">
                  {/* Display idea description with support for line breaks */}
                  {idea.description.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                
                {/* Display attachments if available */}
                {idea.mediaUrls && idea.mediaUrls.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Attachments</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {idea.mediaUrls.map((media: {type: string; url: string}, index) => (
                        <div key={index} className="border rounded-md overflow-hidden">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                          ) : media.type === 'video' ? (
                            <video 
                              src={media.url} 
                              controls 
                              className="w-full h-48 object-cover"
                            />
                          ) : media.type === 'audio' ? (
                            <div className="p-4 bg-muted flex items-center justify-center h-48">
                              <audio src={media.url} controls className="w-full" />
                            </div>
                          ) : (
                            <div className="p-4 bg-muted flex items-center justify-center h-48">
                              <a 
                                href={media.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary-dark flex flex-col items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>View Document</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* File attachment link - fallback for older format */}
                {idea.attachmentUrl && !idea.mediaUrls && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Attachment</h3>
                    <a 
                      href={idea.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>View Attachment</span>
                    </a>
                  </div>
                )}
                
                <div className="mt-4 flex items-center">
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
                </div>
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
          
          {/* Admin Actions (Visible for admin roles) */}
          {isAdmin && (
            <div className="fixed bottom-4 right-4 shadow-lg rounded-lg overflow-hidden">
              <Button 
                onClick={handleStatusChange}
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
                    Change Status
                  </>
                )}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
