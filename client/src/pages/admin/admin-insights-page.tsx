import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FilterX, BarChart, MoveUp, Vote, Users, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function AdminInsightsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("all");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  
  // Fetch voting insights
  const { data: votingInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights/votes", timeRange, category, department, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange !== "all") params.append("timeRange", timeRange);
      if (category) params.append("category", category);
      if (department) params.append("department", department);
      if (sortBy) params.append("sortBy", sortBy);
      
      const res = await fetch(`/api/insights/votes?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch voting insights");
      return res.json();
    },
  });

  // Fetch top voted ideas
  const { data: topVoted, isLoading: votedLoading } = useQuery({
    queryKey: ["/api/ideas/top", timeRange, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange !== "all") params.append("timeRange", timeRange);
      if (category) params.append("category", category);
      params.append("limit", "5");
      
      const res = await fetch(`/api/ideas/top?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch top voted ideas");
      return res.json();
    },
  });

  // Fetch top voters
  const { data: topVoters, isLoading: votersLoading } = useQuery({
    queryKey: ["/api/insights/voters", timeRange, department],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange !== "all") params.append("timeRange", timeRange);
      if (department) params.append("department", department);
      params.append("limit", "10");
      
      const res = await fetch(`/api/insights/voters?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch top voters");
      return res.json();
    },
  });

  // Prepare data for vote distribution chart
  const voteDistributionData = useMemo(() => {
    if (!votingInsights) return [];
    
    // Format data for chart
    return votingInsights.categoryDistribution?.map((item: any) => ({
      name: item.category === 'opportunity' ? 'Ideas' : 
            item.category === 'pain-point' ? 'Pain Points' : 'Challenges',
      votes: item.votes
    })) || [];
  }, [votingInsights]);

  // Get badge color for category
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "opportunity": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pain-point": return "bg-red-100 text-red-800 border-red-200";
      case "challenge": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format timeframe for display
  const formatTimeframe = (timeframe: string) => {
    switch (timeframe) {
      case "week": return "This Week";
      case "month": return "This Month";
      case "quarter": return "This Quarter";
      case "year": return "This Year";
      default: return "All Time";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Voting Insights</h1>
          <p className="text-muted-foreground">Analyze voting patterns and engagement metrics</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Time Range Filter */}
          <div>
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

          {/* Category Filter */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="opportunity">Ideas</SelectItem>
                <SelectItem value="pain-point">Pain Points</SelectItem>
                <SelectItem value="challenge">Challenges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
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

          {/* Sorting */}
          <div>
            <Label htmlFor="sort-by">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Votes</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="ideas">Most Ideas</SelectItem>
                <SelectItem value="department">By Department</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset Filters Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setTimeRange("all");
              setCategory("");
              setDepartment("");
              setSortBy("votes");
            }}
          >
            <FilterX className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>

        {/* Insight Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="top-ideas">
              <MoveUp className="h-4 w-4 mr-2" />
              Top Ideas
            </TabsTrigger>
            <TabsTrigger value="voters">
              <Vote className="h-4 w-4 mr-2" />
              Top Voters
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Vote Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Votes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {votingInsights?.totalVotes || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeframe(timeRange)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Voters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {votingInsights?.uniqueVoters || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique participants
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Votes Per Idea
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {votingInsights?.avgVotesPerIdea?.toFixed(1) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Engagement level
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vote Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Vote Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {insightsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : voteDistributionData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No voting data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={voteDistributionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #ddd", 
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="votes" name="Votes" fill="#8884d8" barSize={60} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Department Participation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Department Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {insightsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : (votingInsights?.departmentDistribution?.length || 0) === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No department data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={votingInsights?.departmentDistribution}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="department" 
                          width={120}
                          tick={{
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} votes`, `Total Votes`]}
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #ddd", 
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                          }}
                        />
                        <Bar dataKey="votes" fill="#82ca9d" name="Votes" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Ideas Tab */}
          <TabsContent value="top-ideas">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Most Voted Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Submitter</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {votedLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <div className="flex justify-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : topVoted?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            No voted ideas available
                          </TableCell>
                        </TableRow>
                      ) : (
                        topVoted?.map((idea: any, index: number) => (
                          <TableRow key={idea.id}>
                            <TableCell className="font-bold">{index + 1}</TableCell>
                            <TableCell className="font-medium">{idea.title}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={getCategoryBadgeColor(idea.category)}
                              >
                                {idea.category === 'opportunity' ? 'Idea' : 
                                 idea.category === 'pain-point' ? 'Pain Point' : 'Challenge'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={idea.submitter?.avatarUrl} />
                                  <AvatarFallback>
                                    {idea.submitter?.displayName ? idea.submitter.displayName.charAt(0) : 
                                    (idea.submitter?.username ? idea.submitter.username.charAt(0) : '?')}
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  {idea.submitter?.displayName || idea.submitter?.username || `User ${idea.submitter?.id}` || 'Unknown'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Vote className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{idea.voteCount || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={idea.status === 'implemented' ? 'bg-green-50 text-green-700 border-green-200' : 
                                         idea.status === 'in-review' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                         'bg-gray-50 text-gray-700 border-gray-200'}
                              >
                                {idea.status.charAt(0).toUpperCase() + idea.status.slice(1).replace('-', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Voters Tab */}
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Most Active Voters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Votes Cast</TableHead>
                        <TableHead>Most Voted Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {votersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10">
                            <div className="flex justify-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : topVoters?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10">
                            No voter data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        topVoters?.map((voter: any, index: number) => (
                          <TableRow key={voter.user.id}>
                            <TableCell className="font-bold">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={voter.user?.avatarUrl} />
                                  <AvatarFallback>
                                    {voter.user?.displayName ? voter.user.displayName.charAt(0) : 
                                    (voter.user?.username ? voter.user.username.charAt(0) : '?')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{voter.user?.displayName || voter.user?.username}</div>
                                  <div className="text-xs text-muted-foreground">{voter.user?.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{voter.user?.department || "N/A"}</TableCell>
                            <TableCell className="font-semibold">{voter.votesCast}</TableCell>
                            <TableCell>
                              {voter.topCategory ? (
                                <Badge 
                                  variant="outline" 
                                  className={getCategoryBadgeColor(voter.topCategory)}
                                >
                                  {voter.topCategory === 'opportunity' ? 'Ideas' : 
                                   voter.topCategory === 'pain-point' ? 'Pain Points' : 'Challenges'}
                                </Badge>
                              ) : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}