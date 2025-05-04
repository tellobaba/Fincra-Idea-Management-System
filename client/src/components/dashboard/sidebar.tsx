import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Menu,
  X,
  BarChart
} from "lucide-react";
import { CustomIcon } from "@/components/ui/custom-icon";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Idea } from "@shared/schema";

// Import custom icons
import ideasIcon from "@/assets/Ideas.png";
import challengesIcon from "@/assets/Challenges.png";
import leaderboardIcon from "@/assets/Leaderboard.png";
import myVotesIcon from "@/assets/MyVotes.png";
import overviewIcon from "@/assets/Overview.png";
import painPointsIcon from "@/assets/Painpoints.png";
import pinnedIdeasIcon from "@/assets/PinnedIdeas.png";

interface Metrics {
  ideasSubmitted: number;
  inReview: number;
  implemented: number;
  costSaved: number;
  revenueGenerated: number;
}

interface SidebarProps {
  className?: string;
}

// Define a simple type for navigation items
type NavItemWithIcon = {
  name: string;
  href: string;
  icon: any; // Using any type to simplify icon handling
  active: boolean;
};

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Fetch metrics for sidebar badges
  const { data: metrics = { ideasSubmitted: 0, inReview: 0, implemented: 0, costSaved: 0, revenueGenerated: 0 } } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });
  
  // Get idea counts by category
  const { data: ideas = [] } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
  });
  
  // My Votes data
  const { data: votedIdeas = [] } = useQuery<Idea[]>({
    queryKey: ["/api/ideas/my-votes"],
  });
  
  const isAdmin = user?.role && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role);

  const mainNavigationItems: NavItemWithIcon[] = [
    {
      name: "Overview",
      href: "/",
      icon: () => <CustomIcon src={overviewIcon} alt="Overview" />,
      active: location === "/",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart,
      active: location === "/analytics",
    },
    {
      name: "Ideas",
      href: "/ideas",
      icon: () => <CustomIcon src={ideasIcon} alt="Ideas" />,
      active: location === "/ideas" || location.startsWith("/ideas/"),
    },
    {
      name: "Challenges",
      href: "/challenges",
      icon: () => <CustomIcon src={challengesIcon} alt="Challenges" />,
      active: location === "/challenges",
    },
    {
      name: "Pain Points",
      href: "/pain-points",
      icon: () => <CustomIcon src={painPointsIcon} alt="Pain Points" />,
      active: location === "/pain-points",
    },
    {
      name: "My Votes",
      href: "/my-votes",
      icon: () => <CustomIcon src={myVotesIcon} alt="My Votes" />,
      active: location === "/my-votes",
    },
    {
      name: "Pinned Ideas",
      href: "/pinned",
      icon: () => <CustomIcon src={pinnedIdeasIcon} alt="Pinned Ideas" />,
      active: location === "/pinned",
    },
  ];

  const subNavigationItems: NavItemWithIcon[] = [
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: () => <CustomIcon src={leaderboardIcon} alt="Leaderboard" />,
      active: location === "/leaderboard",
    },
  ];
  
  if (isAdmin) {
    mainNavigationItems.push({
      name: "Admin Panel",
      href: "/admin",
      icon: LayoutDashboard,
      active: location === "/admin" || location.startsWith("/admin/"),
    });
    
    mainNavigationItems.push({
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: BarChart,
      active: location === "/admin/dashboard",
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

  // Renders a navigation item with icon
  const renderNavItem = (item: NavItemWithIcon) => {
    // Manually handle the icon rendering based on type
    let iconElement;
    if (typeof item.icon === 'function') {
      iconElement = item.icon();
    } else {
      const IconComponent = item.icon;
      iconElement = <IconComponent className="w-5 h-5" />;
    }
    
    return (
      <li key={item.name}>
        <Link 
          href={item.href}
          onClick={closeSidebar}
          className={cn(
            "flex items-center px-2 py-2 rounded-md transition-colors relative",
            item.active 
              ? "bg-sidebar-accent text-sidebar-primary font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-r-full before:bg-primary" 
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <div className="w-5 h-5 mr-3 flex items-center justify-center">
            {iconElement}
          </div>
          <span>{item.name}</span>
        </Link>
      </li>
    );
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
          "bg-sidebar border-r border-sidebar-border flex flex-col h-full transition-all duration-300 w-56 fixed md:static top-0 bottom-0 left-0 z-40 text-sidebar-foreground",
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
              <h1 className="text-sm font-semibold text-sidebar-foreground">Fincra's</h1>
              <p className="text-xs text-sidebar-foreground/70">Ideas Management</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeSidebar}
            className="ml-auto md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-sidebar-foreground/60 px-2 mb-2">MAIN</h2>
            <ul className="space-y-1">
              {mainNavigationItems.map(renderNavItem)}
            </ul>
          </div>
          
          <div>
            <h2 className="text-xs font-semibold text-sidebar-foreground/60 px-2 mb-2">SUB</h2>
            <ul className="space-y-1">
              {subNavigationItems.map(renderNavItem)}
            </ul>
          </div>
        </nav>
        
        {/* User info */}
        {user && (
          <div className="p-4 border-t border-sidebar-border mt-2">
            <Link href="/profile-settings" className="flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.displayName}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user.username}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sidebar-foreground/50">
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