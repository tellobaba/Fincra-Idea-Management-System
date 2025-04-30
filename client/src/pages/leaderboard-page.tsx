import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { LeaderboardEntry } from "@/types/ideas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<"ideas" | "impact" | "votes">("ideas");
  
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });
  
  // Sort the leaderboard based on selected criteria
  const sortedLeaderboard = leaderboard ? [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case "ideas":
        return b.ideasSubmitted - a.ideasSubmitted;
      case "impact":
        return b.impactScore - a.impactScore;
      case "votes":
        // In a real app, votes would be a field in the leaderboard data
        return b.impactScore - a.impactScore; // Using impact score as proxy
      default:
        return 0;
    }
  }) : [];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-6">Leaderboard</h1>
          
          <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Top Contributors</h2>
              
              <Tabs defaultValue={sortBy} onValueChange={(value) => setSortBy(value as "ideas" | "impact" | "votes")}>
                <TabsList>
                  <TabsTrigger value="ideas">Most Ideas</TabsTrigger>
                  <TabsTrigger value="impact">Highest Impact</TabsTrigger>
                  <TabsTrigger value="votes">Most Votes</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No data available yet. Start submitting ideas to appear on the leaderboard!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Ideas Submitted</TableHead>
                      <TableHead>Ideas Implemented</TableHead>
                      <TableHead>Impact Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLeaderboard.map((entry, index) => (
                      <TableRow key={entry.user.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <span 
                              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                index === 0 
                                  ? "bg-amber-100 text-amber-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={entry.user.avatarUrl} alt={entry.user.displayName} />
                              <AvatarFallback>{entry.user.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{entry.user.displayName}</div>
                              <div className="text-xs text-muted-foreground">{entry.user.id}@fincra.com</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.user.department || "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.ideasSubmitted}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.ideasImplemented}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{entry.impactScore.toFixed(1)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
