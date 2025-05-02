import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  Settings,
  LogOut,
  BarChart,
  MessageSquare,
  Vote,
} from "lucide-react";

type AdminNavItem = {
  title: string;
  href: string;
  icon: ReactNode;
};

const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: "Submissions",
    href: "/admin/submissions",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart2 className="w-5 h-5" />,
  },
  {
    title: "Voting Insights",
    href: "/admin/insights",
    icon: <Vote className="w-5 h-5" />,
  },
  {
    title: "Comments",
    href: "/admin/comments",
    icon: <MessageSquare className="w-5 h-5" />,
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Logged out successfully",
        });
        window.location.href = "/admin/login";
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to log out",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="h-16 px-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <img src="/assets/Logomark.png" alt="Fincra Logo" className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Admin Portal</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-700 dark:text-gray-200"
                )}
              >
                <span className={cn("mr-3", isActive ? "text-primary" : "text-gray-500 dark:text-gray-400")}>
                  {item.icon}
                </span>
                {item.title}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <span className="text-primary text-sm font-medium">{user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'A'}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{user?.displayName || user?.username || 'Admin'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 w-full fixed top-0 z-10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <img src="/assets/Logomark.png" alt="Fincra Logo" className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <main className="py-6 px-4 md:py-8 md:px-6 md:pt-8 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}
