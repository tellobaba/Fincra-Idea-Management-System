import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, X, Check, MessageCircle, Star, UserCheck, ThumbsUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    toggleOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeNotifications();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeNotifications]);

  // Icon mapping for notification types
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'vote':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'follow':
        return <Star className="h-4 w-4 text-amber-500" />;
      case 'status_change':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case 'assignment':
        return <UserCheck className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-header-foreground/70 hover:text-header-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full"
      >
        <span className="sr-only">Notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/20">
            <h3 className="text-lg font-medium text-popover-foreground">Notifications</h3>
            <div className="flex space-x-2">
              <Button
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className="text-sm"
                disabled={notifications.length === 0 || notifications.every(n => n.read)}
              >
                <Check className="h-4 w-4 mr-1" /> Mark all as read
              </Button>
              <Button onClick={closeNotifications} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Test button for developers - hidden in production */}
          {import.meta.env.MODE !== 'production' && (
            <div className="p-2 border-b border-border bg-secondary/20">
              <Button
                onClick={createTestNotification}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Create Test Notification
              </Button>
            </div>
          )}

          <ScrollArea className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-secondary/20 transition-colors duration-100 cursor-pointer',
                      !notification.read && 'bg-blue-50/20'
                    )}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-popover-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-popover-foreground/80">{notification.message}</p>
                        {notification.actor && (
                          <div className="mt-2 flex items-center">
                            <div className="flex-shrink-0">
                              {notification.actor.avatarUrl ? (
                                <img
                                  className="h-8 w-8 rounded-full"
                                  src={notification.actor.avatarUrl}
                                  alt={notification.actor.displayName}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                                  {notification.actor.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-2">
                              <p className="text-xs font-medium text-popover-foreground">{notification.actor.displayName}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
