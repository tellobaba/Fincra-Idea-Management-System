import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { PlusCircle, LightbulbIcon, AlertCircle, Trophy, Bell } from "lucide-react";
import { NotificationDropdown } from "./notification-dropdown";
import SearchBar from "../../components/search/search-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { AddNewModal } from "./add-new-modal";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onSearch?: (query: string) => void;
  welcomeMessage?: string; // Add a message for existing users
  showTabs?: boolean; // For existing users view
  showAddNewButton?: boolean; // For new users view
}

export function Header({ onSearch, welcomeMessage, showTabs = false, showAddNewButton = false }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ideas");
  const [newIdeaModalOpen, setNewIdeaModalOpen] = useState(false);
  const [location, navigate] = useLocation();

  // Fetch statistics for the welcome section buttons
  const { data: statusBreakdown = [] } = useQuery<any>({
    queryKey: ["/api/chart/categories"],
  });

  // Get counts by category for the welcome buttons
  const ideasCount = statusBreakdown.find((item: any) => item.name === "Ideas")?.value || 0;
  const challengesCount = statusBreakdown.find((item: any) => item.name === "Challenges")?.value || 0;
  const painPointsCount = statusBreakdown.find((item: any) => item.name === "Pain Points")?.value || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Navigate to the appropriate page based on the tab
    switch(tab) {
      case "ideas":
        navigate("/ideas");
        break;
      case "challenges":
        navigate("/challenges");
        break;
      case "pain-points":
        navigate("/pain-points");
        break;
    }
  };
  
  const handleAddNew = () => {
    // Check if the current location contains a category indicator to determine where to navigate
    if (location.includes('/ideas')) {
      navigate('/submit/idea');
    } else if (location.includes('/challenges')) {
      navigate('/submit/challenge');
    } else if (location.includes('/pain-points')) {
      navigate('/submit/pain-point');
    } else {
      // If not on a specific page, show the modal with all options
      setNewIdeaModalOpen(true);
    }
  };

  return (
    <header className="bg-header border-b border-header-border sticky top-0 z-30 px-4 md:px-6">
      <div className="flex items-center justify-between h-16">
        {/* Left Section */}
        <div className="flex-1 flex items-center">
          {welcomeMessage && (
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-header-foreground">{welcomeMessage} {user?.displayName.split(' ')[0] || 'User'} ✨</h1>
              <p className="text-sm text-muted-foreground">Share your pain-points, pitch new ideas, or post a challenge</p>
            </div>
          )}
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:block w-64">
            <SearchBar className="w-full" />
          </div>
          
          {/* Add New button - always show as per user request */}
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleAddNew}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add new
          </Button>
          
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-header-foreground/80 hover:text-header-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile-settings">Profile & Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Analytics buttons */}
      {welcomeMessage && (
        <div className="flex mt-2 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`flex items-center border-transparent text-muted-foreground hover:text-header-foreground hover:border-header-border whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "ideas" ? "border-primary text-primary" : ""
              }`}
              onClick={() => handleTabChange("ideas")}
            >
              <LightbulbIcon className="w-4 h-4 mr-2" />
              Ideas {ideasCount > 0 && `(${ideasCount})`}
            </button>
            <button
              className={`flex items-center border-transparent text-muted-foreground hover:text-header-foreground hover:border-header-border whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "challenges" ? "border-primary text-primary" : ""
              }`}
              onClick={() => handleTabChange("challenges")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Challenge {challengesCount > 0 && `(${challengesCount})`}
            </button>
            <button
              className={`flex items-center border-transparent text-muted-foreground hover:text-header-foreground hover:border-header-border whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pain-points" ? "border-primary text-primary" : ""
              }`}
              onClick={() => handleTabChange("pain-points")}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Pain points {painPointsCount > 0 && `(${painPointsCount})`}
            </button>
          </nav>
        </div>
      )}
      
      {/* New Idea Modal */}
      <AddNewModal open={newIdeaModalOpen} onOpenChange={setNewIdeaModalOpen} />
    </header>
  );
}
