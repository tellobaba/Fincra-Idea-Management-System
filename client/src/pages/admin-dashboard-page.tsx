import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { IdeaWithUser, CATEGORY_CONFIG, STATUS_CONFIG } from "@/types/ideas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IdeaManagementTable } from "@/components/admin/idea-management-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, RefreshCw, Settings, Loader2, LayoutDashboard, Database,
  Filter, Search, ChevronDown, PieChart, Activity, CalendarClock,
  Zap, Lightbulb, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function AdminDashboardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("all");

  // Check if user is authenticated as admin using the useAuth hook
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Redirect to login if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthLoading && (!user || !['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role))) {
      navigate("/admin/login");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch all ideas for admin management
  const { data: ideas, isLoading, error } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas", refreshFlag],
    queryFn: async () => {
      // Get all ideas, do not filter by status
      const res = await fetch("/api/ideas?all=true");
      if (!res.ok) {
        throw new Error("Failed to fetch ideas");
      }
      return await res.json();
    },
    enabled: !isAuthLoading && !!user && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role),
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) {
        throw new Error("Failed to fetch metrics");
      }
      return await res.json();
    },
    enabled: !isAuthLoading && !!user && ['admin', 'reviewer', 'transformer', 'implementer'].includes(user.role),
  });

  const { logoutMutation } = useAuth();
  
  // Filter ideas based on current filters and search query
  const filteredIdeas = ideas?.filter(idea => {
    let matchesSearch = true;
    let matchesStatus = true;
    let matchesCategory = true;

    // Apply search filter
    if (searchQuery) {
      matchesSearch = 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.submitter?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    }

    // Apply status filter
    if (statusFilter) {
      matchesStatus = idea.status === statusFilter;
    }

    // Apply category filter
    if (categoryFilter) {
      matchesCategory = idea.category === categoryFilter;
    }

    // Apply tab filter (for the "submitted" tab)
    if (currentTab === "submitted") {
      return matchesSearch && matchesCategory && idea.status === "submitted";
    }

    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  // Count ideas by category
  const ideasByCategory = ideas?.reduce((acc, idea) => {
    acc[idea.category] = (acc[idea.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Count ideas by status
  const ideasByStatus = ideas?.reduce((acc, idea) => {
    acc[idea.status] = (acc[idea.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleLogout = async () => {
    try {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Logged out successfully",
          });
          navigate("/admin/login");
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to log out",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    // Reset other filters when changing tabs
    if (value === "submitted") {
      setStatusFilter(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setCategoryFilter(null);
    setCurrentTab("all");
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <img src="/assets/Logomark.png" alt="Fincra Logo" className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Fincra Admin</h1>
              <p className="text-sm text-muted-foreground">Idea Management System</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center mr-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <span className="text-primary text-sm font-medium">{user?.displayName?.charAt(0) || 'A'}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.displayName || 'Admin'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'admin'}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Settings</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="default"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Dashboard Overview</h2>
            <p className="text-muted-foreground">Manage and review employee submitted ideas.</p>
          </div>
          <div className="flex mt-4 md:mt-0 gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              variant="default"
              size="sm"
              onClick={() => navigate("/")}
            >
              <Zap className="h-4 w-4 mr-2" />
              View Ideas Hub
            </Button>
          </div>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Lightbulb className="h-5 w-5 text-primary mr-2" />
                <div className="text-2xl font-bold">{ideas?.length || 0}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                From {Object.keys(ideasByCategory).length} categories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <div className="text-2xl font-bold">
                  {ideasByStatus["submitted"] || 0}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Awaiting admin feedback
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">
                  {(ideasByStatus["in-review"] || 0) + (ideasByStatus["merged"] || 0)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Being reviewed or merged
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CalendarClock className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold">
                  {ideasByStatus["implemented"] || 0}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Successfully completed
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Category Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <Card key={key} className="border-l-4" style={{ borderLeftColor: config.color }}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">{config.label}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {ideasByCategory[key] || 0} ideas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  {key === 'pain-point' && 'Issues affecting productivity or experience'}
                  {key === 'opportunity' && 'New potential areas for growth or improvement'}
                  {key === 'challenge' && 'Complex problems requiring innovative solutions'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search ideas, titles, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: config.color }}></div>
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Category</SelectLabel>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: config.color }}></div>
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleClearFilters} className="flex-shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Idea Management Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              All Ideas
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Pending Review ({ideasByStatus["submitted"] || 0})
            </TabsTrigger>
          </TabsList>
          
          {error ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-red-500">
                  <p>Failed to load ideas. Please try refreshing the page.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleRefresh}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="all" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>All Submitted Ideas</CardTitle>
                    <CardDescription>
                      {filteredIdeas.length === ideas?.length
                        ? `Showing all ${ideas?.length || 0} ideas`
                        : `Showing ${filteredIdeas.length} of ${ideas?.length || 0} ideas based on current filters`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IdeaManagementTable 
                      ideas={filteredIdeas} 
                      isLoading={isLoading} 
                      onRefresh={handleRefresh}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="submitted" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Ideas Pending Review</CardTitle>
                    <CardDescription>
                      Review and process newly submitted ideas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IdeaManagementTable 
                      ideas={filteredIdeas} 
                      isLoading={isLoading} 
                      onRefresh={handleRefresh}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
