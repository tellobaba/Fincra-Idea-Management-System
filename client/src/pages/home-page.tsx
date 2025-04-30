import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CtaSection } from "@/components/dashboard/cta-section";
import { IdeaTable } from "@/components/dashboard/idea-table";
import { IdeaWithUser, Metrics } from "@/types/ideas";
import { BarChart2, LightbulbIcon, Search, CheckCircle, DollarSign, TrendingUp } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch metrics for KPI cards
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });
  
  // Fetch top ideas
  const { data: topIdeas, isLoading: ideasLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas/top"],
  });
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // This would typically filter the ideas or redirect to a search results page
    console.log("Searching for:", query);
  };
  
  // Trend calculation helpers (would typically come from real data)
  const getTrend = (value: number, base: number = 100) => {
    const percentage = Math.floor(Math.random() * 30) - 10; // Just for demonstration
    return {
      value: Math.abs(percentage),
      direction: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral",
      label: "from last month"
    };
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onSearch={handleSearch} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard
              title="Ideas Submitted"
              value={metrics?.ideasSubmitted || 0}
              icon={<LightbulbIcon className="h-5 w-5" />}
              trend={metrics && getTrend(metrics.ideasSubmitted)}
            />
            <KpiCard
              title="In Review"
              value={metrics?.inReview || 0}
              icon={<Search className="h-5 w-5" />}
              trend={metrics && getTrend(metrics.inReview)}
            />
            <KpiCard
              title="Implemented"
              value={metrics?.implemented || 0}
              icon={<CheckCircle className="h-5 w-5" />}
              trend={metrics && getTrend(metrics.implemented)}
            />
            <KpiCard
              title="Cost Saved"
              value={`$${((metrics?.costSaved || 0) / 1000).toFixed(1)}k`}
              icon={<DollarSign className="h-5 w-5" />}
              trend={metrics && getTrend(metrics.costSaved)}
            />
            <KpiCard
              title="Revenue Generated"
              value={`$${((metrics?.revenueGenerated || 0) / 1000).toFixed(1)}k`}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={metrics && getTrend(metrics.revenueGenerated)}
            />
          </div>
          
          {/* CTA Section */}
          {user && <CtaSection displayName={user.displayName} />}
          
          {/* Top Ideas Table */}
          <IdeaTable 
            title="Top 5 Ideas" 
            ideas={topIdeas || []} 
            isLoading={ideasLoading}
          />
        </main>
      </div>
    </div>
  );
}
