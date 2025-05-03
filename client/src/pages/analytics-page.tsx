import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, LineChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real data from API endpoints
  const { data: idealVolume = [
    { name: "5D", value: 0 },
    { name: "2W", value: 0 },
    { name: "1M", value: 0 },
    { name: "6M", value: 0 },
    { name: "1Y", value: 0 }
  ], isLoading: volumeLoading } = useQuery<any>({
    queryKey: ["/api/ideas/volume"],
  });
  
  const { data: statusBreakdown = [], isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/chart/categories"],
  });
  
  // Format ideas by category data for chart
  const statusData: ChartData[] = statusBreakdown.length > 0 
    ? statusBreakdown 
    : [
        { name: 'Ideas', value: 0, fill: '#4CAF50' },
        { name: 'Challenges', value: 0, fill: '#2196F3' },
        { name: 'Pain Points', value: 0, fill: '#F44336' }
      ];

  // Fetch leaderboard data for contributors section
  const { data: leaderboardData = [], isLoading: leaderboardLoading } = useQuery<any>({
    queryKey: ["/api/leaderboard"],
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 120000, // Refresh every 2 minutes
  });
  
  // Map leaderboard data to contributors format with error handling
  const contributorsData = leaderboardData && leaderboardData.length > 0
    ? leaderboardData
        .slice(0, 5)
        .map((entry: any) => ({
          id: entry.user?.id || 0,
          name: entry.user?.displayName || 'Anonymous User',
          email: entry.user?.email || '',
          department: entry.user?.department || "N/A",
          value: entry.ideasSubmitted || 0,
          ideas: entry.categoryBreakdown?.ideas || 0,
          challenges: entry.categoryBreakdown?.challenges || 0,
          painPoints: entry.categoryBreakdown?.painPoints || 0,
          avatarUrl: entry.user?.avatarUrl || '',
          impactScore: entry.impactScore || 0,
          votesReceived: entry.votesReceived || 0,
          status: entry.status || ''
        }))
    : [];

  // Combine all loading states for overall loading indicator
  const isLoading = volumeLoading || statusLoading || leaderboardLoading;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          onSearch={handleSearch}
          welcomeMessage="Analytics"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            {isLoading && (
              <div className="flex items-center text-blue-600">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading data...</span>
              </div>
            )}        
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ideas by Category chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Submissions by Category</CardTitle>
                <button className="text-sm text-blue-600 hover:underline">See Report</button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={statusData}
                    layout="vertical"
                    barCategoryGap={12}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    {/* Create a separate bar for each status with its color */}
                    {statusData.map((entry, index) => (
                      <Bar 
                        key={`status-bar-${index}`}
                        dataKey="value" 
                        name={entry.name}
                        data={[entry]}
                        barSize={20}
                        fill={entry.fill}
                        fillOpacity={0.9}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ background: item.fill }}></div>
                      <div className="text-xs text-gray-500">{item.name}: {item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Ideas Volume chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Ideas Volume</CardTitle>
                <button className="text-sm text-blue-600 hover:underline">See Breakdown</button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={idealVolume}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <Tooltip />
                    <Bar 
                      dataKey="value" 
                      fill="#8884d8" 
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 mt-2 text-right">Monday, 22</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Contributors */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Top Contributors</CardTitle>
              <button className="text-sm text-blue-600 hover:underline">See All</button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contributorsData.length > 0 ? (
                  contributorsData.map((contributor: any, index: number) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={contributor.avatarUrl || undefined} alt={contributor.name} />
                            <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{contributor.name}</div>
                            <div className="text-xs text-gray-500">{contributor.department}</div>
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-indigo-600">{contributor.value}</div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500 border-t pt-2">
                        <span>Ideas: {contributor.ideas}</span>
                        <span>Challenges: {contributor.challenges}</span>
                        <span>Pain Points: {contributor.painPoints}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6">
                    <p className="text-gray-500 text-sm">No contributor data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
