import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
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
import { Link } from "wouter";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        {/* Mobile sidebar toggle is in the Sidebar component */}
      </div>
      
      <div className="flex-1 max-w-2xl mx-auto md:mx-0">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ideas, challenges, or pain-points..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
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
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user.displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
    </header>
  );
}
