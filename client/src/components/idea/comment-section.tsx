import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { CommentWithUser } from "@/types/ideas";
import { useAuth } from "@/hooks/use-auth";

interface CommentSectionProps {
  comments: CommentWithUser[];
  ideaId: number;
  onAddComment: (content: string, parentId?: number) => Promise<void>;
}

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

export function CommentSection({ comments, ideaId, onAddComment }: CommentSectionProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = async (values: CommentFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(values.content, replyingTo ?? undefined);
      form.reset();
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group comments by parent_id
  const topLevelComments = comments ? comments.filter(comment => !comment.parentId) : [];
  const replies = comments ? comments.filter(comment => comment.parentId) : [];
  
  const getCommentReplies = (commentId: number) => {
    return replies ? replies.filter(reply => reply.parentId === commentId) : [];
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    // Focus the textarea
    setTimeout(() => {
      const textarea = document.getElementById('comment-textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Discussion ({comments.length})</h3>
      
      {/* Comments list */}
      <div className="space-y-6">
        {topLevelComments.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Main comment */}
              <div className="flex">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={comment.user?.avatarUrl} alt={comment.user?.displayName} />
                  <AvatarFallback>{comment.user?.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1 bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {comment.user?.displayName} 
                      {comment.user?.department && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          {comment.user.role === 'admin' ? 'Admin' : comment.user.department}
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <p>{comment.content}</p>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => handleReply(comment.id)}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Replies */}
              {getCommentReplies(comment.id).map((reply) => (
                <div key={reply.id} className="flex pl-10">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={reply.user?.avatarUrl} alt={reply.user?.displayName} />
                    <AvatarFallback>{reply.user?.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1 bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        {reply.user?.displayName}
                        {reply.user?.department && (
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            {reply.user.role === 'admin' ? 'Admin' : reply.user.department}
                          </span>
                        )}
                      </h4>
                      <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <p>{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      
      {/* Comment input */}
      {user && (
        <div className="flex items-start">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
                {replyingTo !== null && (
                  <div className="flex items-center justify-between bg-muted-foreground/10 rounded p-2 mb-2">
                    <span className="text-xs">
                      Replying to comment
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0 px-2 text-xs"
                      onClick={handleCancelReply}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          id="comment-textarea"
                          placeholder={replyingTo !== null ? "Write a reply..." : "Add a comment..."}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Posting..." : "Comment"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
