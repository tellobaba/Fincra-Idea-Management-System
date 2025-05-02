import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LightbulbIcon,
  Trophy,
  ListChecks,
  AlertCircle,
  Menu,
  X,
  Vote,
  Bookmark,
  BarChart
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Fetch metrics for sidebar badges
  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });
  
  // Get idea counts by category
  const { data: ideas = [] } = useQuery<any[]>({
    queryKey: ["/api/ideas"],
  });
  
  // Count ideas by category
  const challenges = ideas.filter(idea => idea.category === 'challenge').length || 0;
  const painPoints = ideas.filter(idea => idea.category === 'pain-point').length || 0;
  
  // Calculate my votes (ideas where current user voted)
  // Assuming votes is stored as an array in the database
  const myVotes = ideas.filter(idea => {
    // Handle votes being undefined or not an array
    if (!idea.votes || !Array.isArray(idea.votes)) return false;
    return idea.votes.includes(user?.id);
  }).length || 0;
  
  const isAdmin = user?.role && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role);
  
  const mainNavigationItems = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutDashboard,
      active: location === "/",
      badge: undefined,
    },
    {
      name: "Ideas",
      href: "/ideas",
      icon: LightbulbIcon,
      active: location === "/ideas" || location.startsWith("/ideas/"),
      badge: metrics?.ideasSubmitted?.toString(),
    },
    {
      name: "Challenges",
      href: "/challenges",
      icon: AlertCircle,
      active: location === "/challenges",
      badge: challenges ? challenges.toString() : undefined,
    },
    {
      name: "Pain Points",
      href: "/pain-points",
      icon: AlertCircle,
      active: location === "/pain-points",
      badge: painPoints ? painPoints.toString() : undefined,
    },
    {
      name: "My Votes",
      href: "/my-votes",
      icon: Vote,
      active: location === "/my-votes",
      badge: myVotes ? myVotes.toString() : undefined,
    },
    {
      name: "Pinned Ideas",
      href: "/pinned",
      icon: Bookmark,
      active: location === "/pinned",
      badge: undefined,
    },
  ];

  const subNavigationItems = [
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      active: location === "/leaderboard",
      badge: undefined,
    },
    {
      name: "Polls",
      href: "/polls",
      icon: BarChart,
      active: location === "/polls",
      badge: undefined,
    },
  ];
  
  if (isAdmin) {
    mainNavigationItems.push({
      name: "Admin Panel",
      href: "/admin",
      icon: LayoutDashboard,
      active: location === "/admin" || location.startsWith("/admin/"),
      badge: undefined,
    });
    
    mainNavigationItems.push({
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: BarChart,
      active: location === "/admin/dashboard",
      badge: undefined,
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
          "bg-white border-r border-gray-100 flex flex-col h-full transition-all duration-300 w-56 fixed md:static top-0 bottom-0 left-0 z-40",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Sidebar header with logo */}
        <div className="p-4 flex items-center">
          <div className="flex items-center">
            <img 
              src="/assets/Logomark.png" 
              alt="Fincra Logo" 
              className="h-8 w-8 mr-3" 
            />
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Fincra's</h1>
              <p className="text-xs text-gray-500">Ideas Management</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeSidebar}
            className="ml-auto md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 px-2 mb-2">MAIN</h2>
            <ul className="space-y-1">
              {mainNavigationItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "flex items-center px-2 py-2 rounded-md transition-colors relative",
                      item.active 
                        ? "bg-indigo-50 text-indigo-700 font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-r-full before:bg-indigo-700" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="text-xs font-semibold text-gray-400 px-2 mb-2">SUB</h2>
            <ul className="space-y-1">
              {subNavigationItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "flex items-center px-2 py-2 rounded-md transition-colors",
                      item.active 
                        ? "bg-indigo-50 text-indigo-700 font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-r-full before:bg-indigo-700" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        
        {/* User info */}
        {user && (
          <div className="p-4 border-t border-gray-100 mt-2">
            <Link href="/profile" className="flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.username}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
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
