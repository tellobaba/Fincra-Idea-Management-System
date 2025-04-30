import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  LightbulbIcon,
  Trophy,
  ListChecks,
  Shield,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const isAdmin = user?.role && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role);
  
  const navigationItems = [
    {
      name: "Overview",
      href: "/",
      icon: Home,
      active: location === "/",
    },
    {
      name: "Submit Idea",
      href: "/submit",
      icon: LightbulbIcon,
      active: location.startsWith("/submit"),
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      active: location === "/leaderboard",
    },
    {
      name: "My Submissions",
      href: "/submissions",
      icon: ListChecks,
      active: location === "/submissions",
    },
  ];
  
  if (isAdmin) {
    navigationItems.push({
      name: "Admin Panel",
      href: "/admin",
      icon: Shield,
      active: location === "/admin",
    });
  }
  
  // For mobile: toggle sidebar visibility
  const toggleSidebar = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // For mobile: close sidebar after navigation
  const closeSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <div className="flex items-center md:hidden p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col h-full transition-all duration-300 w-64 fixed md:static top-0 bottom-0 left-0 z-40",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Sidebar header with logo */}
        <div className="p-4 flex items-center border-b border-sidebar-border">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-8 w-8 mr-3 text-sidebar-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <h1 className="text-xl font-semibold text-sidebar-foreground">Fincra Ideas</h1>
          
          {/* Close button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeSidebar}
            className="ml-auto md:hidden text-sidebar-foreground hover:text-sidebar-foreground/80"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center px-4 py-3 mx-2 rounded-md transition-colors",
                    item.active 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User info */}
        {user && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">{user.displayName}</p>
                <p className="text-xs text-sidebar-foreground/60">{user.department || "No department"}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
      
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}
