import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart, BarChart2, LineChart, PieChart, TrendingUp, Users, Vote } from "lucide-react";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RePieChart, Pie, Cell, AreaChart, Area, LineChart as ReLineChart, Line, Sector } from "recharts";

// Custom color palette for charts
const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", 
  "#ffbb28", "#ff8042", "#a4de6c", "#d0ed57", "#83a6ed", "#8dd1e1"
];

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("all");
  const [department, setDepartment] = useState("all");
  
  // Fetch metrics data
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
  });

  // Fetch category data for charts
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/chart/categories"],
    queryFn: async () => {
      const res = await fetch("/api/chart/categories");
      if (!res.ok) throw new Error("Failed to fetch category data");
      return res.json();
    },
  });

  // Fetch submission volume data
  const { data: volumeData, isLoading: volumeLoading } = useQuery({
    queryKey: ["/api/chart/volume", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/chart/volume?timeRange=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch volume data");
      return res.json();
    },
  });

  // Fetch top contributors data
  const { data: topContributors, isLoading: contributorsLoading } = useQuery({
    queryKey: ["/api/chart/contributors", timeRange, department],
    queryFn: async () => {
      const res = await fetch(`/api/chart/contributors?timeRange=${timeRange}&department=${department}`);
      if (!res.ok) throw new Error("Failed to fetch contributors data");
      return res.json();
    },
  });

  // Fetch top voted ideas
  const { data: topVoted, isLoading: votedLoading } = useQuery({
    queryKey: ["/api/ideas/top"],
    queryFn: async () => {
      const res = await fetch("/api/ideas/top?limit=5");
      if (!res.ok) throw new Error("Failed to fetch top voted ideas");
      return res.json();
    },
  });

  // Generate metrics cards
  const metricCards = [
    { title: "Total Ideas", value: metrics?.ideasSubmitted || 0, icon: <BarChart size={20} className="text-blue-500" />, description: "Total ideas submitted", color: "bg-blue-50 border-blue-100" },
    { title: "In Review", value: metrics?.inReview || 0, icon: <TrendingUp size={20} className="text-yellow-500" />, description: "Ideas being reviewed", color: "bg-yellow-50 border-yellow-100" },
    { title: "Implemented", value: metrics?.implemented || 0, icon: <BarChart2 size={20} className="text-green-500" />, description: "Successfully implemented", color: "bg-green-50 border-green-100" },
  ];

  // Format data for category distribution chart
  const pieData = categoriesData || [];

  // Placeholder for volume data if API doesn't return real data
  const volumeChartData = volumeData || [
    { name: "Week 1", submissions: 0 },
    { name: "Week 2", submissions: 0 },
    { name: "Week 3", submissions: 0 },
    { name: "Week 4", submissions: 0 },
  ];

  // Format data for top contributors chart
  const contributorsChartData = topContributors || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track and analyze submission metrics and trends</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <Label htmlFor="time-range">Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="time-range">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Customer Success">Customer Success</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCards.map((card, index) => (
            <Card key={index} className={`${card.color}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Submission Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {volumeLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={volumeChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ddd" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" tickLine={false} />
                      <YAxis stroke="#888" tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #ddd", 
                          borderRadius: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="submissions" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {categoriesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [value, name]}
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #ddd", 
                          borderRadius: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }} 
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </RePieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {contributorsLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : contributorsChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No contributor data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={contributorsChartData.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid horizontal strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                        tick={{
                          fontSize: 12,
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #ddd", 
                          borderRadius: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Ideas Submitted" />
                    </ReBarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Most Voted Ideas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Most Voted Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {votedLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : topVoted?.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    No voted ideas available
                  </div>
                ) : (
                  topVoted?.map((idea: any, index: number) => (
                    <div key={idea.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                      <div className="flex-none rounded-full bg-primary/10 p-2 text-primary font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{idea.title}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{idea.category}</Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Vote className="h-3 w-3 mr-1" /> {idea.voteCount || 0} votes
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}