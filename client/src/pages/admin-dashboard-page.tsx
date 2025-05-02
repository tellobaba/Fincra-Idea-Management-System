import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { IdeaWithUser } from "@/types/ideas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaManagementTable } from "@/components/admin/idea-management-table";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Check if user is authenticated as admin
  const authQuery = useQuery({
    queryKey: ["/api/admin/auth-check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/auth-check");
      if (!res.ok) {
        throw new Error("Unauthorized");
      }
      return await res.json();
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authQuery.isError) {
      navigate("/admin/login");
    }
  }, [authQuery.isError, navigate]);

  // Fetch all ideas for admin management
  const { data: ideas, isLoading, error } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/admin/ideas", refreshFlag],
    queryFn: async () => {
      const res = await fetch("/api/admin/ideas");
      if (!res.ok) {
        throw new Error("Failed to fetch ideas");
      }
      return await res.json();
    },
    enabled: !authQuery.isError,
  });

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/admin-logout", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Logout failed");
      
      navigate("/admin/login");
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

  if (authQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <img src="/Logomark.png" alt="Fincra Logo" className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/admin/settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="default"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ideas?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ideas?.filter(idea => idea.status === "submitted").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ideas?.filter(idea => idea.status === "implemented").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

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
        <IdeaManagementTable 
          ideas={ideas || []} 
          isLoading={isLoading} 
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
