import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { LeaderboardEntry, CATEGORY_CONFIG } from "@/types/ideas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrophyIcon, Award, Star, Clock, BarChart3, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { departmentSchema, categoryValues } from "@shared/schema";

type TimeRange = 'all-time' | 'this-week' | 'this-month' | 'this-year';
type SortBy = 'ideas' | 'votes' | 'approved'; // 'impact' removed as per user request

export default function LeaderboardPage() {
  // Default to 'ideas' sorting (ensure it's not 'impact' which was removed)
  const [sortBy, setSortBy] = useState<SortBy>("ideas");
  const [timeRange, setTimeRange] = useState<TimeRange>("all-time");
  const [category, setCategory] = useState<string>("none");
  const [department, setDepartment] = useState<string>("none");
  
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", timeRange, category, department, sortBy],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (timeRange !== 'all-time') searchParams.set('timeRange', timeRange);
      if (category && category !== 'none') searchParams.set('category', category);
      if (department && department !== 'none') searchParams.set('department', department);
      if (sortBy) searchParams.set('sortBy', mapSortByToApiParam(sortBy));
      
      const url = `/api/leaderboard${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      return response.json();
    }
  });
  
  // Maps frontend sort values to backend API parameters
  function mapSortByToApiParam(sort: SortBy): string {
    switch (sort) {
      case 'ideas': return 'submissions';
      case 'votes': return 'votes';
      case 'approved': return 'approved';
      default: return 'submissions';
    }
  }

  // Format time range for display
  function formatTimeRange(range: TimeRange): string {
    switch (range) {
      case 'all-time': return 'All Time';
      case 'this-week': return 'This Week';
      case 'this-month': return 'This Month';
      case 'this-year': return 'This Year';
      default: return 'All Time';
    }
  }
  
  // Format category for display
  function formatCategory(category: string): string {
    if (!category || category === 'none') return 'All Categories';
    
    switch (category) {
      case 'opportunity': return 'Ideas';
      case 'challenge': return 'Challenges';
      case 'pain-point': return 'Pain Points';
      default: return category;
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Leaderboard</h1>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className={timeRange === 'all-time' ? 'bg-primary/10' : ''}
                onClick={() => setTimeRange('all-time')}
              >
                All Time
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={timeRange === 'this-week' ? 'bg-primary/10' : ''}
                onClick={() => setTimeRange('this-week')}
              >
                This Week
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={timeRange === 'this-month' ? 'bg-primary/10' : ''}
                onClick={() => setTimeRange('this-month')}
              >
                This Month
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={timeRange === 'this-year' ? 'bg-primary/10' : ''}
                onClick={() => setTimeRange('this-year')}
              >
                This Year
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Category Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Categories</SelectItem>
                    {categoryValues.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Department Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Departments</SelectItem>
                    {departmentSchema.options.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ranking By</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={sortBy} onValueChange={(value) => setSortBy(value as SortBy)} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="ideas" className="flex-1">Ideas</TabsTrigger>
                    {/* Impact tab removed as per user request */}
                    <TabsTrigger value="votes" className="flex-1">Votes</TabsTrigger>
                    <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-amber-500" />
                  Top Contributors
                </h2>
                <div className="text-sm text-muted-foreground">
                  Showing results for: {formatTimeRange(timeRange)}
                  {category && category !== 'none' && <span> · {formatCategory(category)}</span>}
                  {department && department !== 'none' && <span> · {department}</span>}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {(category !== 'none' || department !== 'none' || timeRange !== 'all-time') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setCategory('none');
                      setDepartment('none');
                      setTimeRange('all-time');
                    }}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !leaderboard || leaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-2">No data available with the current filters.</div>
                  {(category !== 'none' || department !== 'none' || timeRange !== 'all-time') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCategory('none');
                        setDepartment('none');
                        setTimeRange('all-time');
                      }}
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Ideas</TableHead>
                      <TableHead className="text-center">Implementation Rate</TableHead>
                      {/* Impact Score column removed as per user request */}
                      <TableHead className="text-center">Votes</TableHead>
                      <TableHead className="text-center">Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={entry.user.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {index < 3 ? (
                              <div 
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  index === 0 ? "bg-amber-100 text-amber-800" : 
                                  index === 1 ? "bg-slate-100 text-slate-800" :
                                  "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {index === 0 ? <Trophy className="h-4 w-4" /> : 
                                 index === 1 ? <Award className="h-4 w-4" /> : 
                                 <Star className="h-4 w-4" />}
                              </div>
                            ) : (
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={entry.user.avatarUrl} alt={entry.user.displayName || `User ${entry.user.id}`} />
                              <AvatarFallback>{entry.user.displayName ? entry.user.displayName.charAt(0) : '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{entry.user.displayName || `User ${entry.user.id}`}</div>
                              <div className="text-xs text-muted-foreground">{entry.user.email || `user-${entry.user.id}@fincra.com`}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.user.department || "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          {entry.status && (
                            <Badge 
                              variant="outline"
                              className={`${entry.status === 'Top Contributor' ? 'border-amber-200 bg-amber-50 text-amber-800' : 
                                         entry.status === 'Active Contributor' ? 'border-green-200 bg-green-50 text-green-800' : 
                                         'border-blue-200 bg-blue-50 text-blue-800'}`}
                            >
                              {entry.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">{entry.ideasSubmitted}</span>
                            <span className="text-xs text-muted-foreground">
                              (I: {entry.categoryBreakdown.ideas || 0}/C: {entry.categoryBreakdown.challenges || 0}/P: {entry.categoryBreakdown.painPoints || 0})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm font-medium">
                            {entry.ideasSubmitted ? ((entry.ideasImplemented / entry.ideasSubmitted) * 100).toFixed(1) : 0}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.ideasImplemented} implemented
                          </div>
                        </TableCell>
                        {/* Impact Score cell removed as per user request */}
                        <TableCell className="text-center">
                          <div className="text-sm font-medium">{entry.votesReceived}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {entry.lastSubmissionDate ? (
                              <span className="flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(entry.lastSubmissionDate).toLocaleDateString()}
                              </span>
                            ) : 'No activity'}
                          </div>
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

// Icons for top 3 ranks
function Trophy({ className }: { className?: string }) {
  return <TrophyIcon className={className} />;
}

