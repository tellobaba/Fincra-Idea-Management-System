import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart } from "lucide-react";
import { IdeaTable } from "./idea-table";
import { useQuery } from "@tanstack/react-query";
import { IdeaWithUser } from "@/types/ideas";

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export function ExistingUserView() {
  const [activeTab, setActiveTab] = useState("ideas");
  
  // Fetch real data from API endpoints
  const { data: topIdeas = [], isLoading: topIdeasLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas/top"],
  });
  
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
    queryKey: ["/api/ideas/by-status"],
  });
  
  // Category colors for the bar chart
  const categoryColors = {
    "Ideas": "#4CAF50", // green 
    "Challenges": "#2196F3", // blue
    "Pain Points": "#F44336", // red
  };
  
  // Format ideas by category data for chart
  const statusData: ChartData[] = statusBreakdown.length > 0 
    ? statusBreakdown 
    : [
        { name: 'Ideas', value: 0, fill: '#4CAF50' },
        { name: 'Challenges', value: 0, fill: '#2196F3' },
        { name: 'Pain Points', value: 0, fill: '#F44336' }
      ];
  
  // Helper function to get status badge styling
  const getStatusBadgeClasses = (status: string) => {
    switch(status) {
      case 'in-review':
        return 'bg-orange-100 text-orange-700';
      case 'submitted':
        return 'bg-green-100 text-green-700';
      case 'merged':
        return 'bg-blue-100 text-blue-700';
      case 'parked':
        return 'bg-red-100 text-red-700';
      case 'implemented':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  
  // Fetch recent activity from dedicated endpoint
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<any>({
    queryKey: ["/api/ideas/recent-activity"],
  });
  
  // Define activity data type
  type ActivityItem = {
    id: number;
    title: string;
    description: string;
    status: string;
    date: string;
    submitter?: any;
  };
  
  // Transform the activity data for display with some error handling
  const activityData: ActivityItem[] = recentActivity && recentActivity.length > 0 
    ? recentActivity.map((activity: any) => ({
        id: activity.id,
        title: activity.title || 'Untitled Idea',
        description: activity.description 
          ? activity.description.substring(0, 80) + (activity.description.length > 80 ? '...' : '')
          : 'No description provided',
        status: activity.status || 'submitted',
        date: activity.createdAt ? formatRelativeTime(new Date(activity.createdAt)) : 'Recently',
        submitter: activity.submitter
      }))
    : [];
  
  // Helper function to format dates in relative time
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      // Format as MM/DD if older than a week
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }
  
  // Fetch leaderboard data for contributors section
  const { data: leaderboardData = [], isLoading: leaderboardLoading } = useQuery<any>({
    queryKey: ["/api/leaderboard"]
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
          value: entry.totalSubmissions || 0,
          ideas: entry.ideas || 0,
          challenges: entry.challenges || 0,
          painPoints: entry.painPoints || 0
        }))
    : [];
  
  // Use topIdeas for the Top Voted section with error handling
  const topVotedData = topIdeas && topIdeas.length > 0
    ? topIdeas
        .slice(0, 3)
        .map(idea => ({
          id: idea.id,
          title: idea.title || 'Untitled Idea',
          description: idea.description 
            ? idea.description.substring(0, 80) + (idea.description.length > 80 ? '...' : '')
            : 'No description provided',
          votes: idea.votes || 0,
          status: idea.status || 'submitted',
          date: idea.createdAt ? formatRelativeTime(new Date(idea.createdAt)) : 'Recently'
        }))
    : [];

  // Combine all loading states for overall loading indicator
  const isLoading = topIdeasLoading || volumeLoading || statusLoading || activityLoading || leaderboardLoading;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Activity section */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Activity</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activityData.length > 0 ? (
                activityData.map((item: ActivityItem) => (
                  <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs rounded-md py-1 px-2 ${getStatusBadgeClasses(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-400">{item.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No recent activity to show</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Contributors */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Top Contributors</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contributorsData.length > 0 ? (
                contributorsData.map((contributor: any, index: number) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                        <div>
                          <div className="text-sm font-medium">{contributor.name}</div>
                          <div className="text-xs text-gray-500">{contributor.email || contributor.department}</div>
                        </div>
                      </div>
                      <div className="text-gray-700 font-medium">{contributor.value}</div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Ideas: {contributor.ideas}</span>
                      <span>Challenges: {contributor.challenges}</span>
                      <span>Pain Points: {contributor.painPoints}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No contributor data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Voted */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Top Voted</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topVotedData.length > 0 ? (
                topVotedData.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-blue-700">{item.votes} Votes</span>
                      <span className={`text-xs rounded-md py-1 px-2 ${getStatusBadgeClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-right text-xs text-gray-400 mt-1">{item.date}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No voted ideas available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}