import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  submitterId: number;
  submitter?: {
    id: number;
    displayName: string;
    department: string;
    avatarUrl?: string;
  };
}

interface IdeaCommentsProps {
  ideaId: number;
}

export function IdeaComments({ ideaId }: IdeaCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Fetch comments for the idea
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/ideas", ideaId, "comments"],
    queryFn: () => apiRequest("GET", `/api/ideas/${ideaId}/comments`)
      .then(res => res.json())
  });

  // Mutation to add a new comment
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => {
      return apiRequest("POST", `/api/ideas/${ideaId}/comments`, { content })
        .then(res => res.json());
    },
    onSuccess: () => {
      // Reset the form and refetch comments
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/ideas", ideaId, "comments"] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        description: "There was an error adding your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(newComment);
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="space-y-6">
      {commentsLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.submitter?.avatarUrl} />
                  <AvatarFallback>
                    {getInitials(comment.submitter?.displayName || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">
                      {comment.submitter?.displayName || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="mt-6">
        <Textarea
          placeholder="Add your comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px] mb-3"
          disabled={!user || addCommentMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={!user || !newComment.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}