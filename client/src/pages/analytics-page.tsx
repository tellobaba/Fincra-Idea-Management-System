import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

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
  
  // Format ideas by category data for chart with explicit colors
  const statusData: ChartData[] = statusBreakdown.length > 0 
    ? statusBreakdown.map((item: any) => {
        // Ensure the colors match the requirement
        let fill = item.fill;
        if (item.name === 'Ideas') fill = '#4CAF50'; // Green
        if (item.name === 'Challenges') fill = '#2196F3'; // Blue
        if (item.name === 'Pain Points') fill = '#F44336'; // Red

        return {
          ...item,
          fill
        };
      })
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
  
  // Fetch recent highlights for the highlights section
  const { data: recentHighlights = [], isLoading: highlightsLoading } = useQuery<any>({
    queryKey: ["/api/ideas/recent-highlights"],
  });
  
  // Fetch all ideas for the modal view
  const { data: allSubmissions = [], isLoading: allSubmissionsLoading } = useQuery<any>({
    queryKey: ["/api/ideas"],
    enabled: showAllSubmissions, // Only fetch when modal is open
  });
  
  // Map leaderboard data to contributors format with error handling
  const contributorsData = leaderboardData && leaderboardData.length > 0
    ? leaderboardData
        .slice(0, 5)
        .map((entry: any) => {
          // For debugging
          console.log('Entry user data:', entry.user);
          
          // The server response now uses displayName and avatarUrl from the backend
          let name = entry.user?.displayName;
          let avatarUrl = entry.user?.avatarUrl;
          
          return {
            id: entry.user?.id || 0,
            name: name || 'Anonymous User',
            department: entry.user?.department || "N/A",
            value: entry.ideasSubmitted || 0,
            ideas: entry.categoryBreakdown?.ideas || 0,
            challenges: entry.categoryBreakdown?.challenges || 0,
            painPoints: entry.categoryBreakdown?.painPoints || 0,
            avatarUrl: avatarUrl || '',
            impactScore: entry.impactScore || 0,
            votesReceived: entry.votesReceived || 0,
            status: entry.status || ''
          };
        })
    : [];

  // Combine all loading states for overall loading indicator
  const isLoading = volumeLoading || statusLoading || leaderboardLoading || highlightsLoading;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Helper functions for formatting and display
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'opportunity': return 'Idea';
      case 'challenge': return 'Challenge';
      case 'pain-point': return 'Pain Point';
      default: return 'Other';
    }
  };
  
  const getCategoryBadgeClasses = (category: string) => {
    switch(category) {
      case 'opportunity':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'challenge':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'pain-point':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };
  
  const getStatusBadgeClasses = (status: string) => {
    switch(status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'in-review':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'merged':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'parked':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'implemented':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };
  
  // Filter submissions for the modal
  const filteredSubmissions = allSubmissions.filter((submission: any) => {
    let matchesCategory = true;
    let matchesStatus = true;
    let matchesDate = true;
    
    if (categoryFilter) {
      matchesCategory = submission.category === categoryFilter;
    }
    
    if (statusFilter) {
      matchesStatus = submission.status === statusFilter;
    }
    
    if (dateFilter) {
      const submissionDate = new Date(submission.createdAt);
      const filterDate = new Date(dateFilter);
      matchesDate = submissionDate.toDateString() === filterDate.toDateString();
    }
    
    return matchesCategory && matchesStatus && matchesDate;
  });

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
              <CardHeader>
                <CardTitle className="text-lg font-medium">Submissions by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Custom DIV-based Bar chart for categories */}
                <div className="h-[200px] w-full flex flex-col justify-center space-y-4 mt-6 mb-4">
                  {statusData.map((item, index) => {
                    // Determine color based on category name
                    let color = '#4CAF50'; // Green (Ideas)
                    if (item.name === 'Challenges') color = '#2196F3'; // Blue 
                    if (item.name === 'Pain Points') color = '#F44336'; // Red
                    
                    // Calculate percentage of max for bar width
                    const maxValue = Math.max(...statusData.map(d => d.value));
                    const percentage = maxValue ? (item.value / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-24 flex-shrink-0 text-sm font-medium text-gray-700">{item.name}</div>
                        <div className="flex-grow h-8 bg-gray-100 rounded overflow-hidden relative">
                          <div 
                            className="h-full rounded" 
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                        <div className="w-8 flex-shrink-0 text-right text-sm font-semibold ml-2">
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {statusData.map((item, index) => {
                    let color = '#4CAF50'; // Green (Ideas)
                    if (item.name === 'Challenges') color = '#2196F3'; // Blue 
                    if (item.name === 'Pain Points') color = '#F44336'; // Red
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                        <div className="text-xs text-gray-500">{item.name}: {item.value}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Ideas Volume chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Ideas Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Trendline chart for Ideas Volume using recharts */}
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={idealVolume.map((item: {name: string; value: number}) => ({
                        name: item.name, // Date in MM/DD format
                        submissions: item.value
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888" 
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Date (MM/DD)', position: 'insideBottom', offset: -10, fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#888" 
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        domain={[0, 30]} // Set upper bound to 30 to show upward trend
                        ticks={[0, 5, 10, 15, 20, 25, 30]} // Set specific ticks in increments of 5
                        label={{ value: 'Submissions', angle: -90, position: 'insideLeft', offset: 0, fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} submissions`, 'Total']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          padding: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="submissions"
                        stroke="#6B46C1"
                        strokeWidth={2}
                        dot={{
                          stroke: '#6B46C1',
                          strokeWidth: 2,
                          fill: '#fff',
                          r: 4
                        }}
                        activeDot={{
                          stroke: '#6B46C1',
                          strokeWidth: 2,
                          fill: '#6B46C1',
                          r: 6
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Highlights */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Highlights</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAllSubmissions(true)}
                className="text-xs"
              >
                See All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlightsLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 h-48 animate-pulse">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                          <div className="h-3 w-16 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-3 w-full bg-gray-100 rounded"></div>
                        <div className="h-3 w-4/5 bg-gray-100 rounded"></div>
                        <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : recentHighlights.length > 0 ? (
                  recentHighlights.map((highlight: any, index: number) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 h-full flex flex-col">
                      <div className="flex items-center mb-3">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={highlight.submitter?.avatarUrl || undefined} alt={highlight.submitter?.displayName || 'User'} />
                          <AvatarFallback>{highlight.submitter?.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{highlight.submitter?.displayName || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500">{highlight.submitter?.department || 'Unassigned'}</div>
                        </div>
                      </div>
                      <div className="mb-3 flex-grow">
                        <h3 className="text-sm font-semibold mb-1">{highlight.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-3">{highlight.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className={`text-xs px-2 py-1 rounded-md ${getCategoryBadgeClasses(highlight.category)}`}>
                          {getCategoryName(highlight.category)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-md ${getStatusBadgeClasses(highlight.status)}`}>
                          {highlight.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6">
                    <p className="text-gray-500 text-sm">No recent highlights available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Top Contributors */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Top Contributors</CardTitle>
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
      
      {/* Modal for All Submissions */}
      <Dialog open={showAllSubmissions} onOpenChange={setShowAllSubmissions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>All Submissions</DialogTitle>
            <DialogDescription>
              Browse and filter all submissions in the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={categoryFilter || ''} onValueChange={(value) => setCategoryFilter(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="opportunity">Ideas</SelectItem>
                  <SelectItem value="challenge">Challenges</SelectItem>
                  <SelectItem value="pain-point">Pain Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter || ''} onValueChange={(value) => setStatusFilter(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="merged">Merged</SelectItem>
                  <SelectItem value="parked">Parked</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? (
                      format(dateFilter, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter || undefined}
                    onSelect={(date) => setDateFilter(date)}
                    initialFocus
                  />
                  {dateFilter && (
                    <div className="p-2 border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full text-xs"
                        onClick={() => setDateFilter(null)}
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-4 mt-2">
            <div className="text-sm text-gray-500">
              Showing {filteredSubmissions.length} submissions
            </div>
            
            {allSubmissionsLoading ? (
              <div className="py-10 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full inline-block"></div>
                <p className="mt-2 text-sm text-gray-500">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubmissions.map((submission: any) => (
                  <div key={submission.id} className="border rounded-lg p-4 flex flex-col h-full">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={submission.submitter?.avatarUrl || undefined} />
                        <AvatarFallback>{submission.submitter?.displayName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">{submission.submitter?.displayName || 'Anonymous'}</div>
                    </div>
                    
                    <h4 className="text-sm font-semibold mb-1">{submission.title}</h4>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-grow">{submission.description}</p>
                    
                    <div className="flex justify-between mt-auto">
                      <span className={`text-xs px-2 py-1 rounded-md ${getCategoryBadgeClasses(submission.category)}`}>
                        {getCategoryName(submission.category)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-md ${getStatusBadgeClasses(submission.status)}`}>
                        {submission.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    {submission.createdAt && (
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500">No submissions match your filters</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setCategoryFilter(null);
                    setStatusFilter(null);
                    setDateFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
