import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Idea } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Tag, Plus, Loader2, ArrowLeft, Calendar, Users, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

type FollowedIdeaWithUser = Idea & {
  submitter?: {
    id: number;
    displayName: string;
    department: string;
    avatarUrl?: string;
  };
  isParticipating?: boolean;
};

export default function FollowedIdeasPage() {
  const [_, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'followed' | 'participating'>('followed');
  const [filteredIdeas, setFilteredIdeas] = useState<FollowedIdeaWithUser[]>([]);

  // Fetch user's followed ideas
  const { data: followedIdeas = [], isLoading: followedLoading, error: followedError, refetch: refetchFollowed } = useQuery<FollowedIdeaWithUser[]>({
    queryKey: ['/api/ideas/my-follows'],
    enabled: !!user && viewMode === 'followed',
  });
  
  // Fetch user's participating challenges
  const { data: participatingChallenges = [], isLoading: participatingLoading, error: participatingError, refetch: refetchParticipating } = useQuery<FollowedIdeaWithUser[]>({
    queryKey: ['/api/user/participating-challenges'],
    enabled: !!user && viewMode === 'participating',
  });
  
  // Combined data based on view mode
  const currentData = viewMode === 'followed' ? followedIdeas : participatingChallenges;
  const isLoading = viewMode === 'followed' ? followedLoading : participatingLoading;
  const error = viewMode === 'followed' ? followedError : participatingError;

  useEffect(() => {
    if (!user && !authLoading) {
      // Redirect to auth page if not authenticated
      setLocation('/auth');
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (currentData) {
      // Convert to array if it's not (API might return object)
      const ideasArray = Array.isArray(currentData) ? currentData : [currentData];
      
      // Add isParticipating flag for challenges if we're in participating mode
      const processedData = viewMode === 'participating' 
        ? ideasArray.map(item => ({ ...item, isParticipating: true }))
        : ideasArray;
      
      // Apply search filter
      let filtered = processedData;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = processedData.filter(idea => 
          idea.title?.toLowerCase().includes(query) || 
          idea.description?.toLowerCase().includes(query) ||
          idea.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Apply tab filter
      switch(currentTabIndex) {
        case 0: // All
          // No additional filtering needed
          break;
        case 1: // Ideas (Opportunities)
          filtered = filtered.filter(idea => idea.category === 'opportunity');
          break;
        case 2: // Challenges
          filtered = filtered.filter(idea => idea.category === 'challenge');
          break;
        case 3: // Pain Points
          filtered = filtered.filter(idea => idea.category === 'pain-point');
          break;
      }
      
      // Apply sorting
      switch(sortBy) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'most-voted':
          filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
          break;
        case 'status':
          filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
          break;
      }
      
      setFilteredIdeas(filtered);
    }
  }, [currentData, searchQuery, currentTabIndex, sortBy, viewMode]);

  const handleUnfollow = async (ideaId: number) => {
    try {
      // Send API request to unfollow
      const response = await fetch(`/api/ideas/${ideaId}/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to unfollow');
      }
      
      toast({
        title: 'Success',
        description: 'Item unfollowed successfully',
      });
      
      // Refresh the data
      refetchFollowed();
      
    } catch (error) {
      console.error('Error unfollowing idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to unfollow item',
        variant: 'destructive',
      });
    }
  };
  
  const handleLeavingChallenge = async (challengeId: number) => {
    try {
      // Send API request to leave the challenge
      const response = await fetch(`/api/challenges/${challengeId}/participate`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to leave challenge');
      }
      
      toast({
        title: 'Success',
        description: 'You have withdrawn from the challenge',
      });
      
      // Refresh the data
      refetchParticipating();
      
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave the challenge',
        variant: 'destructive',
      });
    }
  };

  // Format category for display
  const formatCategory = (category: string) => {
    switch(category) {
      case 'opportunity': return 'Idea';
      case 'challenge': return 'Challenge';
      case 'pain-point': return 'Pain Point';
      default: return category;
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
  };

  if (authLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between mb-8">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLocation('/')}
                  className="mr-3"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">
                    {viewMode === 'followed' ? 'Followed Items' : 'Participating Challenges'}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {viewMode === 'followed' 
                      ? "Items you've pinned for later reference" 
                      : "Challenges you're currently participating in"}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant={viewMode === 'followed' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('followed')}
                  className={viewMode === 'followed' ? '' : 'text-muted-foreground'}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Followed Items
                </Button>
                <Button 
                  variant={viewMode === 'participating' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('participating')}
                  className={viewMode === 'participating' ? '' : 'text-muted-foreground'}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Participating Challenges
                </Button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sort-by">Sort by</Label>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-by" className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="most-voted">Most Voted</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs for filtering */}
            <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => {
              switch(value) {
                case 'all': setCurrentTabIndex(0); break;
                case 'ideas': setCurrentTabIndex(1); break;
                case 'challenges': setCurrentTabIndex(2); break;
                case 'pain-points': setCurrentTabIndex(3); break;
              }
            }}>
              <TabsList className="grid grid-cols-4 w-full md:w-1/2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="pain-points">Pain Points</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Display ideas */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load followed items. Please try again later.
                </AlertDescription>
              </Alert>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">
                  {viewMode === 'followed' 
                    ? "No followed items found" 
                    : "You're not participating in any challenges"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {viewMode === 'followed'
                    ? "You haven't followed any items yet or none match your current filters."
                    : "Join a challenge to contribute your ideas and collaborate with others."}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation(viewMode === 'followed' ? '/' : '/challenges')}
                >
                  <Plus className="h-4 w-4 mr-2" /> 
                  {viewMode === 'followed' ? 'Browse Items' : 'Explore Challenges'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => (
                  <Card key={idea.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="mb-2">
                          {formatCategory(idea.category)}
                        </Badge>
                        <Badge className={`
                          ${idea.status === 'submitted' ? 'bg-yellow-200 text-yellow-800' : ''}
                          ${idea.status === 'in-review' ? 'bg-blue-200 text-blue-800' : ''}
                          ${idea.status === 'merged' ? 'bg-green-200 text-green-800' : ''}
                          ${idea.status === 'implemented' ? 'bg-purple-200 text-purple-800' : ''}
                          ${idea.status === 'parked' ? 'bg-gray-200 text-gray-800' : ''}
                        `}>
                          {formatStatus(idea.status)}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 cursor-pointer hover:text-primary"
                          onClick={() => setLocation(idea.category === 'challenge' ? `/challenges/${idea.id}` : `/ideas/${idea.id}`)}>
                        {idea.title}
                      </h3>
                      
                      <p className="text-muted-foreground line-clamp-2 mb-3">
                        {idea.description}
                      </p>
                      
                      {idea.isParticipating && idea.category === 'challenge' && (
                        <div className="border rounded-md p-3 mb-3 bg-blue-50 border-blue-100">
                          <div className="flex items-center mb-2">
                            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                            <h3 className="text-sm font-medium text-blue-700">Challenge Timeline</h3>
                          </div>
                          {idea.adminNotes && (
                            <p className="text-xs text-blue-600 mb-1">Timeframe: {idea.adminNotes}</p>
                          )}
                          <p className="text-xs text-blue-600">
                            Started: {new Date(idea.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={idea.submitter?.avatarUrl} />
                            <AvatarFallback>{idea.submitter?.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{idea.submitter?.displayName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {idea.tags.slice(0, 3).map((tag, index) => (
                            <div key={index} className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </div>
                          ))}
                          {idea.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{idea.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => setLocation(idea.category === 'challenge' ? `/challenges/${idea.id}` : `/ideas/${idea.id}`)}>
                            View Details
                          </Button>
                          {idea.isParticipating && idea.category === 'challenge' && (
                            <Button variant="ghost" size="sm" onClick={() => setLocation(`/submit/idea?challengeId=${idea.id}`)}>
                              Submit Solution
                            </Button>
                          )}
                        </div>
                        {idea.isParticipating ? (
                          <Button variant="outline" size="sm" onClick={() => handleLeavingChallenge(idea.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Leave Challenge
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleUnfollow(idea.id)}>
                            Unfollow
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}