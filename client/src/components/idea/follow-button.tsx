import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkX, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';

interface FollowButtonProps {
  ideaId: number;
  isFollowed: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const FollowButton = ({ ideaId, isFollowed, disabled = false, variant = 'default', size = 'default' }: FollowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [followed, setFollowed] = useState(isFollowed);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to log in to follow items",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const method = followed ? 'DELETE' : 'POST';
      const response = await fetch(`/api/ideas/${ideaId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${followed ? 'unfollow' : 'follow'} item`);
      }

      setFollowed(!followed);
      
      toast({
        title: 'Success',
        description: followed ? 'Item unfollowed successfully' : 'Item followed successfully',
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-follows"] });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: `Failed to ${followed ? 'unfollow' : 'follow'} item. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading || disabled || !user}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : followed ? (
        <>
          <BookmarkX className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
