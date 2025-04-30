import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { IdeaWithUser, Metrics } from "@/types/ideas";
import { Loader2 } from "lucide-react";
import { NewUserView } from "@/components/dashboard/new-user-view";
import { ExistingUserView } from "@/components/dashboard/existing-user-view";

export default function HomePage() {
  const { user } = useAuth();
  const [isNewUser, setIsNewUser] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch metrics for KPI cards
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });
  
  // Fetch top ideas
  const { data: topIdeas = [], isLoading: ideasLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas/top"],
  });
  
  // Fetch user's ideas
  const { data: userIdeas = [], isLoading: userIdeasLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas", user?.id],
    queryFn: () => fetch(`/api/ideas?submittedById=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // This would typically filter the ideas or redirect to a search results page
    console.log("Searching for:", query);
  };
  
  // Determine if user is new based on whether they have submitted any ideas
  useEffect(() => {
    if (!userIdeasLoading && user) {
      setIsNewUser(userIdeas.length === 0);
    }
  }, [user, userIdeas, userIdeasLoading]);
  
  if (metricsLoading || ideasLoading || userIdeasLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {isNewUser ? (
          <>
            <Header onSearch={handleSearch} />
            <main className="flex-1 overflow-y-auto">
              <NewUserView />
            </main>
          </>
        ) : (
          <>
            <Header 
              onSearch={handleSearch}
              welcomeMessage="Welcome back,"
              showTabs={true}
              showAddNewButton={true}
            />
            <main className="flex-1 overflow-y-auto">
              <ExistingUserView />
            </main>
          </>
        )}
      </div>
    </div>
  );
}
