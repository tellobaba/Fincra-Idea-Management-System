import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { IdeaTable } from "@/components/dashboard/idea-table";
import { IdeaWithUser } from "@/types/ideas";
import { Status } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  
  // Fetch user's ideas
  const { data: ideas, isLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas", { submittedById: user?.id }],
    enabled: !!user?.id,
  });
  
  // Filter ideas based on selected status
  const filteredIdeas = ideas 
    ? statusFilter === "all" 
      ? ideas 
      : ideas.filter(idea => idea.status === statusFilter)
    : [];
  
  // Count ideas by status for tab counters
  const counts = {
    all: ideas?.length || 0,
    submitted: ideas?.filter(i => i.status === "submitted").length || 0,
    "in-review": ideas?.filter(i => i.status === "in-review").length || 0,
    "in-refinement": ideas?.filter(i => i.status === "in-refinement").length || 0,
    implemented: ideas?.filter(i => i.status === "implemented").length || 0,
    closed: ideas?.filter(i => i.status === "closed").length || 0,
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-6">My Submissions</h1>
          
          <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
            <div className="border-b border-border">
              <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value as Status | "all")}>
                <TabsList className="h-auto p-0">
                  <TabsTrigger 
                    value="all" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                  >
                    All ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="in-review" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                  >
                    In Review ({counts["in-review"]})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="in-refinement" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                  >
                    In Refinement ({counts["in-refinement"]})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="implemented" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                  >
                    Implemented ({counts.implemented})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="closed" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                  >
                    Closed ({counts.closed})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <IdeaTable 
                  title="" 
                  ideas={filteredIdeas} 
                  showSubmittedBy={false}
                  showSubmittedDate={true}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
