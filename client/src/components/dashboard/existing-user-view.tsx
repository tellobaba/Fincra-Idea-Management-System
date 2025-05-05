import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart, PlusCircle, Sparkles, AlertTriangle } from "lucide-react";
import { IdeaTable } from "./idea-table";
import { useQuery } from "@tanstack/react-query";
import { IdeaWithUser } from "@/types/ideas";
import { useLocation } from "wouter";

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
    queryKey: ["/api/chart/categories"],
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
  
  // Helper function to get category badge styling
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
  
  // Helper to get friendly category name
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'opportunity':
        return 'Idea';
      case 'challenge':
        return 'Challenge';
      case 'pain-point':
        return 'Pain Point';
      default:
        return 'Other';
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
    category: string;
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
        category: activity.category || 'opportunity',
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
    
  // Fetch real challenge ideas from the API
  const { data: realChallengesData = [], isLoading: challengesLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas/challenge"],
    queryFn: () => fetch("/api/ideas/challenge?all=true").then(res => res.json())
  });
  
  // Process challenge data for display
  const challengesData = realChallengesData.map((challenge, index) => {
    // Calculate remaining days (between 5-15 days)
    const remainingDays = 5 + (index % 3) * 5;
    
    // Determine color theme based on index
    const colorThemes = [
      {
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        accentColor: "text-blue-600"
      },
      {
        bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50",
        borderColor: "border-emerald-200",
        accentColor: "text-emerald-600"
      },
      {
        bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
        borderColor: "border-purple-200",
        accentColor: "text-purple-600"
      }
    ];
    
    const theme = colorThemes[index % colorThemes.length];
    
    // Create reward text based on title length
    const reward = index % 2 === 0 ? 
      "$" + (500 + index * 250) + " Cash Prize" : 
      "Recognition + Team Celebration";
    
    // Calculate random participants count (3-15)
    const participants = 3 + Math.floor(Math.random() * 13);
    
    return {
      ...challenge,
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-15'),
      reward,
      remainingDays,
      participants,
      ...theme
    };
  });

  // Combine all loading states for overall loading indicator
  const isLoading = topIdeasLoading || volumeLoading || statusLoading || activityLoading || leaderboardLoading || challengesLoading;

  // Use navigate from wouter hook
  const [_, navigate] = useLocation();

  // Handler functions for the call-to-action buttons
  const handleSubmitIdea = () => {
    navigate("/submit/idea");
  };

  const handlePostChallenge = () => {
    navigate("/submit/challenge");
  };

  const handleRecordPainPoint = () => {
    navigate("/submit/pain-point");
  };
  
  // Function to navigate to challenge detail page
  const handleTakeChallenge = (challengeId: number) => {
    navigate(`/challenges/${challengeId}`);
  };

  return (
    <div className="p-6">
      {/* Call-to-action cards section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Got Ideas? */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-100 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-center">Got Ideas?</h3>
            <p className="text-gray-600 text-sm mb-2">
              Got a spark of innovation? Share your ideas to help Fincra move faster and smarter.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handleSubmitIdea}
              className="inline-flex items-center px-3 py-1.5 border border-green-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit an Idea
            </button>
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-center">Challenge</h3>
            <p className="text-gray-600 text-sm mb-2">
              Have a big question or a tough problem we should solve together?
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handlePostChallenge}
              className="inline-flex items-center px-3 py-1.5 border border-blue-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Post a Challenge
            </button>
          </div>
        </div>

        {/* Pain points? */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-100 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-center">Pain points?</h3>
            <p className="text-gray-600 text-sm mb-2">
              Spot something that's slowing us down? Share what's blocking progress.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handleRecordPainPoint}
              className="inline-flex items-center px-3 py-1.5 border border-red-200 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Record Pain point
            </button>
          </div>
        </div>
      </div>

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
      
      {/* First row with Activity and Top Voted */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Activity section */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activityData.length > 0 ? (
                activityData.map((item: ActivityItem) => (
                  <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBadgeClasses(item.category)}`}>
                        {getCategoryName(item.category)}
                      </span>
                    </div>
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
        
        {/* Top Voted */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Top Voted</CardTitle>
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
      
      {/* Second row with Challenges section */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Empty state when no challenges are available */}
            {challengesData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">No challenges available at the moment.</p>
                <button
                  onClick={handlePostChallenge}
                  className="inline-flex items-center px-4 py-2 border border-blue-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create a Challenge
                </button>
              </div>
            ) : (
              /* Challenges grid */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {challengesData.map((challenge) => (
                  <div key={challenge.id} 
                    className={`rounded-xl p-5 border shadow-sm ${challenge.bgColor} ${challenge.borderColor}`} 
                  >
                    <h3 className={`font-semibold text-base mb-2 ${challenge.accentColor}`}>{challenge.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{challenge.description}</p>
                    
                    {/* Challenge details */}
                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center">⏱️ Timeline</span>
                        <span className="font-medium">
                          {challenge.startDate.toLocaleDateString()} - {challenge.endDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center">🏆 Reward</span>
                        <span className={`font-medium ${challenge.accentColor}`}>{challenge.reward}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center">👥 Participants</span>
                        <span className="font-medium">{challenge.participants}</span>
                      </div>
                    </div>
                    
                    {/* Time remaining indicator */}
                    <div className="mt-3 mb-5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Time remaining</span>
                        <span className="font-bold">{challenge.remainingDays} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${challenge.accentColor.replace('text', 'bg')}`} 
                          style={{ width: `${Math.min(100, (challenge.remainingDays / 15) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Challenge button */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => handleTakeChallenge(challenge.id)}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border ${challenge.borderColor} text-sm font-medium rounded-lg ${challenge.accentColor} bg-white hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Take Challenge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}