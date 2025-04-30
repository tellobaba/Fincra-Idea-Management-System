import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Search, Bell, ChevronDown, PlusCircle } from "lucide-react";
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

interface HeaderProps {
  onSearch?: (query: string) => void;
  welcomeMessage?: string; // Add a message for existing users
  showTabs?: boolean; // For existing users view
  showAddNewButton?: boolean; // For new users view
}

export function Header({ onSearch, welcomeMessage, showTabs = false, showAddNewButton = false }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("ideas");

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
    // In a real application, this would update content or change routes
    // For now we'll just set active tab state
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 md:px-6">
      <div className="flex items-center justify-between h-16">
        {/* Left Section */}
        <div className="flex-1 flex items-center">
          {welcomeMessage && (
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">{welcomeMessage} {user?.displayName.split(' ')[0] || 'User'} ✨</h1>
              <p className="text-sm text-gray-500">Share your pain-points, pitch new ideas, or post a challenge</p>
            </div>
          )}
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-[250px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Add New button - for existing users view or specifically requested */}
          {showAddNewButton && (
            <Button 
              variant="default" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setLocation("/submit")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add new
            </Button>
          )}
          
          {/* Add New Idea button - for new users view */}
          {!showAddNewButton && !welcomeMessage && (
            <Button 
              variant="default" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setLocation("/submit")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Idea
            </Button>
          )}
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500 hover:text-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              3
            </Badge>
          </Button>
          
          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-gray-700">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
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
      
      {/* Tabs - For existing users view */}
      {showTabs && (
        <div className="flex mt-2 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "ideas" ? "border-indigo-500 text-indigo-600" : ""
              }`}
              onClick={() => handleTabChange("ideas")}
            >
              Ideas
            </button>
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "challenge" ? "border-indigo-500 text-indigo-600" : ""
              }`}
              onClick={() => handleTabChange("challenge")}
            >
              Challenge
            </button>
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pain-points" ? "border-indigo-500 text-indigo-600" : ""
              }`}
              onClick={() => handleTabChange("pain-points")}
            >
              Pain points
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
