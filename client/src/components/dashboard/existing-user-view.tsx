import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart, PlusCircle, Sparkles, AlertTriangle, ThumbsUp } from "lucide-react";
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
        return 'bg-orange-100 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/20 font-medium';
      case 'submitted':
        return 'bg-green-100 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/20 font-medium';
      case 'merged':
        return 'bg-blue-100 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/20 font-medium';
      case 'parked':
        return 'bg-red-100 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/20 font-medium';
      case 'implemented':
        return 'bg-purple-100 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/20 font-medium';
      default:
        return 'bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700/20 font-medium';
    }
  };
  
  // Helper function to get category badge styling
  const getCategoryBadgeClasses = (category: string) => {
    switch(category) {
      case 'opportunity':
        return 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/20';
      case 'challenge':
        return 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/20 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/20';
      case 'pain-point':
        return 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/20 shadow-sm hover:bg-red-100 dark:hover:bg-red-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700/20 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700/20';
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
          category: idea.category || 'opportunity',
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
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10",
        borderColor: "border-blue-200 dark:border-blue-900/20",
        accentColor: "text-blue-600 dark:text-blue-400"
      },
      {
        bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10",
        borderColor: "border-emerald-200 dark:border-emerald-900/20",
        accentColor: "text-emerald-600 dark:text-emerald-400"
      },
      {
        bgColor: "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10",
        borderColor: "border-purple-200 dark:border-purple-900/20",
        accentColor: "text-purple-600 dark:text-purple-400"
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
        <div className="bg-[#f0faf0] dark:bg-green-900/20 rounded-lg p-4 border border-[#e0f0e0] dark:border-green-900/30 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-center">Got Ideas?</h3>
            <p className="text-[#475f56] dark:text-gray-400 text-sm mb-2">
              Got a spark of innovation? Share your ideas to help Fincra move faster and smarter.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handleSubmitIdea}
              className="inline-flex items-center px-4 py-2 border-none text-sm font-medium rounded-md text-white dark:text-green-50 bg-green-600 dark:bg-green-700/90 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit an Idea
            </button>
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-[#f0f5ff] dark:bg-blue-900/20 rounded-lg p-4 border border-[#e0ebff] dark:border-blue-900/30 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-center">Challenge</h3>
            <p className="text-[#47556f] dark:text-gray-400 text-sm mb-2">
              Have a big question or a tough problem we should solve together?
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handlePostChallenge}
              className="inline-flex items-center px-4 py-2 border-none text-sm font-medium rounded-md text-white dark:text-blue-50 bg-blue-600 dark:bg-blue-700/90 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Post a Challenge
            </button>
          </div>
        </div>

        {/* Pain points? */}
        <div className="bg-[#fff5f5] dark:bg-red-900/20 rounded-lg p-4 border border-[#ffe0e0] dark:border-red-900/30 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-center">Pain points?</h3>
            <p className="text-[#6f4747] dark:text-gray-400 text-sm mb-2">
              Spot something that's slowing us down? Share what's blocking progress.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={handleRecordPainPoint}
              className="inline-flex items-center px-4 py-2 border-none text-sm font-medium rounded-md text-white dark:text-red-50 bg-red-600 dark:bg-red-700/90 hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Record Pain point
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
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
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activityData.length > 0 ? (
                activityData.map((item: ActivityItem) => (
                  <div key={item.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getCategoryBadgeClasses(item.category)}`}>
                        {getCategoryName(item.category)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs rounded-md py-1 px-2 ${getStatusBadgeClasses(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-medium bg-muted dark:bg-gray-700 px-2 py-1 rounded-md text-muted-foreground dark:text-gray-300">{item.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity to show</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Voted */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Top Voted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topVotedData.length > 0 ? (
                topVotedData.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getCategoryBadgeClasses(item.category)}`}>
                        {getCategoryName(item.category)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className={`text-xs font-medium rounded-md py-1 px-2 ${getStatusBadgeClasses(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900"><ThumbsUp className="inline-block w-3 h-3 mr-1" /> {item.votes} Votes</span>
                    </div>
                    {/* Time submitted removed as per user request */}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No voted ideas available</p>
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
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Empty state when no challenges are available */}
            {challengesData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-3">No challenges available at the moment.</p>
                <button
                  onClick={handlePostChallenge}
                  className="inline-flex items-center px-4 py-2 border-none text-sm font-medium rounded-md text-white dark:text-blue-50 bg-blue-600 dark:bg-blue-700/90 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none"
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{challenge.description}</p>
                    
                    {/* Challenge details */}
                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">⏱️ Timeline</span>
                        <span className="font-medium">
                          {challenge.startDate.toLocaleDateString()} - {challenge.endDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">🏆 Reward</span>
                        <span className={`font-medium ${challenge.accentColor}`}>{challenge.reward}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">👥 Participants</span>
                        <span className="font-medium">{challenge.participants}</span>
                      </div>
                    </div>
                    
                    {/* Time remaining indicator */}
                    <div className="mt-3 mb-5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Time remaining</span>
                        <span className="font-bold">{challenge.remainingDays} days</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-md font-medium h-2.5">
                        <div 
                          className={`h-2.5 rounded-md font-medium ${challenge.accentColor.replace('text', 'bg')}`} 
                          style={{ width: `${Math.min(100, (challenge.remainingDays / 15) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Challenge button */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => handleTakeChallenge(challenge.id)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border-none text-sm font-medium rounded-lg text-white bg-blue-600 dark:bg-blue-700/90 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none"
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