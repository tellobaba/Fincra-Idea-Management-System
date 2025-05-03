import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, ChevronRight, MessageCircle, ThumbsUp } from "lucide-react";
import { IdeaTable } from "@/components/dashboard/idea-table";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useToast } from "@/hooks/use-toast";
import { format, subWeeks } from 'date-fns';

interface IdeasPageProps {
  categoryType?: 'opportunity' | 'challenge' | 'pain-point';
}

export default function IdeasPage({ categoryType = 'opportunity' }: IdeasPageProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Determine the API endpoint based on the category type
  const apiEndpoint = categoryType === 'opportunity' 
    ? '/api/ideas/opportunity'
    : categoryType === 'challenge'
      ? '/api/ideas/challenge'
      : '/api/ideas/pain-point';

  // State for view mode (my ideas / all ideas)
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
  
  // Fetch the ideas specific to this category
  const { data: ideas = [], isLoading: ideasLoading } = useQuery<any[]>({
    queryKey: [apiEndpoint, viewMode],
    queryFn: () => fetch(`${apiEndpoint}?all=${viewMode === 'all' ? 'true' : 'false'}`).then(res => res.json()),
  });

  // Get the proper title based on category
  const pageTitle = categoryType === 'opportunity' 
    ? 'Ideas' 
    : categoryType === 'challenge' 
      ? 'Challenges' 
      : 'Pain Points';

  // Find the icon based on the category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'opportunity':
        return '💡'; // Idea bulb
      case 'challenge':
        return '🏆'; // Challenge trophy
      case 'pain-point':
        return '🔴'; // Pain point indicator
      default:
        return '📝';
    }
  };

  // Calculate weekly submission data for the chart
  const getWeeklyData = () => {
    interface WeekData {
      name: string;
      date: Date;
      value: number;
    }
    
    const weeks: WeekData[] = [];
    const now = new Date();
    
    // Generate last 5 weeks dates
    for (let i = 4; i >= 0; i--) {
      const weekStart = subWeeks(now, i);
      weeks.push({
        name: format(weekStart, 'MMM d'),
        date: weekStart,
        value: 0
      });
    }
    
    // Count items per week
    ideas.forEach((idea: any) => {
      if (!idea.createdAt) return;
      
      const createdAt = new Date(idea.createdAt);
      
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = weeks[i].date;
        const weekEnd = i < weeks.length - 1 ? weeks[i + 1].date : new Date();
        
        if (createdAt >= weekStart && createdAt < weekEnd) {
          weeks[i].value++;
          break;
        }
      }
    });
    
    // Return just the data needed for the chart
    return weeks.map(week => ({
      name: week.name,
      value: week.value
    }));
  };

  // Get contributors data
  const getContributorsData = () => {
    const contributorsMap = new Map();
    
    ideas.forEach((idea: any) => {
      if (idea.submitter) {
        const id = idea.submitter.id;
        if (!contributorsMap.has(id)) {
          contributorsMap.set(id, {
            id,
            name: idea.submitter.displayName,
            department: idea.submitter.department || 'N/A',
            count: 0
          });
        }
        contributorsMap.get(id).count++;
      }
    });
    
    // Convert map to array and sort by count
    return Array.from(contributorsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 contributors
  };

  const weeklyData = getWeeklyData();
  const contributorsData = getContributorsData();
  
  // Function to handle upvoting
  const handleVote = async (id: number) => {
    try {
      const response = await fetch(`/api/ideas/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote');
      }
      
      // Show success toast
      toast({
        title: "Vote Recorded",
        description: "Your vote has been successfully counted.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [apiEndpoint, viewMode] });
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-votes"] });
    } catch (error) {
      toast({
        title: "Voting Failed",
        description: "There was a problem recording your vote.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <Header 
          onSearch={setSearchQuery} 
          welcomeMessage={`${pageTitle} Dashboard`}
          showTabs={false}
          showAddNewButton={true}
        />
        
        <div className="p-6">
          {/* Top section with analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Submissions Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  {pageTitle} Submissions Over Time
                </CardTitle>
                <button className="text-sm text-blue-600 hover:underline">Export</button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={weeklyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Submissions"
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contributors Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  Top Contributors
                </CardTitle>
                <button className="text-sm text-blue-600 hover:underline">See All</button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={contributorsData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar 
                      dataKey="count" 
                      name="Submissions"
                      fill="#82ca9d" 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Statistics summary */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">Total {pageTitle}</div>
                <div className="text-2xl font-bold mt-1">{ideas.length}</div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">Implemented</div>
                <div className="text-2xl font-bold mt-1">
                  {ideas.filter((idea: any) => idea.status === 'implemented').length}
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">In Review</div>
                <div className="text-2xl font-bold mt-1">
                  {ideas.filter((idea: any) => idea.status === 'in-review').length}
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-500">Contributors</div>
                <div className="text-2xl font-bold mt-1">{contributorsData.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Ideas listing */}
          <div className="bg-white rounded-md shadow-sm">
            <div className="p-4 flex items-center justify-between border-b">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium">{viewMode === 'my' ? 'My' : 'All'} {pageTitle}</h2>
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button 
                    className={`px-3 py-1 text-sm rounded-md transition ${viewMode === 'my' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    onClick={() => setViewMode('my')}
                  >
                    My {pageTitle}
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded-md transition ${viewMode === 'all' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    onClick={() => setViewMode('all')}
                  >
                    All {pageTitle}
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Link href={`/submit/${categoryType}`}>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Ideas table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Submitted By</th>
                    <th className="px-6 py-3">Votes</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ideasLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : ideas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        No {pageTitle.toLowerCase()} found. Be the first to add one!
                      </td>
                    </tr>
                  ) : (
                    ideas.map((idea: any) => (
                      <tr key={idea.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          <Link href={`/ideas/${idea.id}`} className="text-blue-600 hover:underline">
                            {getCategoryIcon(idea.category)} {idea.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            {idea.description && idea.description.length > 90 
                              ? `${idea.description.substring(0, 90)}...` 
                              : idea.description}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium">{idea.submitter?.displayName || 'Anonymous'}</div>
                              <div className="text-xs text-gray-500">{idea.submitter?.department || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="mr-2">{idea.votes || 0}</span>
                            <button 
                              onClick={() => handleVote(idea.id)}
                              className="text-gray-500 hover:text-blue-600"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            idea.status === 'implemented' ? 'bg-green-100 text-green-800' :
                            idea.status === 'in-review' ? 'bg-blue-100 text-blue-800' :
                            idea.status === 'merged' ? 'bg-purple-100 text-purple-800' :
                            idea.status === 'parked' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {idea.status || 'submitted'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link href={`/ideas/${idea.id}`}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/ideas/${idea.id}#comments`}>
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
