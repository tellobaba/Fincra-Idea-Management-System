import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from './use-auth';

export type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'comment' | 'status_change' | 'follow' | 'vote' | 'assignment';
  relatedItemId: number;
  relatedItemType: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: number;
    displayName: string;
    avatarUrl?: string;
  };
};

export function useNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Query to get user's notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/notifications?limit=20');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return await res.json();
    },
    // Don't fetch if user is not logged in
    enabled: !!user,
    // Refresh every 30 seconds when the tab is active
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // Query to get unread notification count
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery<{count: number}, Error, number>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      if (!user) return {count: 0};
      const res = await apiRequest('GET', '/api/notifications/unread-count');
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return await res.json();
    },
    // Extract the count from the response
    select: (data) => data.count,
    // Don't fetch if user is not logged in
    enabled: !!user,
    // Refresh every 10 seconds when the tab is active
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });

  // Mutation to mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('POST', `/api/notifications/${notificationId}/mark-as-read`);
      if (!res.ok) throw new Error('Failed to mark notification as read');
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-all-as-read');
      if (!res.ok) throw new Error('Failed to mark all notifications as read');
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-refetch when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      refetch();
      refetchUnreadCount();
    }
  }, [isOpen, refetch, refetchUnreadCount]);

  const toggleOpen = () => setIsOpen(!isOpen);
  const closeNotifications = () => setIsOpen(false);

  const markAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isOpen,
    toggleOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
  };
}
