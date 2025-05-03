import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SearchResult = {
  id: number;
  title: string;
  description: string;
  category: string;
  submittedById: number;
  createdAt: string;
  submitter?: {
    id: number;
    displayName: string;
    department: string;
    avatarUrl?: string;
  };
};

type GroupedResults = {
  ideas: SearchResult[];
  challenges: SearchResult[];
  painPoints: SearchResult[];
};

export default function SearchResultsPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedResults>({ ideas: [], challenges: [], painPoints: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Get the query parameter from the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    } else {
      navigate('/');
    }
  }, [navigate]);
  
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      performSearch(query);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const getTotalResults = () => {
    return results.ideas.length + results.challenges.length + results.painPoints.length;
  };
  
  const getDisplayResults = () => {
    if (activeTab === 'all') {
      return [...results.ideas, ...results.challenges, ...results.painPoints];
    } else if (activeTab === 'ideas') {
      return results.ideas;
    } else if (activeTab === 'challenges') {
      return results.challenges;
    } else if (activeTab === 'pain-points') {
      return results.painPoints;
    }
    return [];
  };
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Search Results</h1>
      </div>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search ideas, challenges & pain points..."
            className="pl-10 pr-4 py-2 h-12 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" className="absolute right-1 top-1 h-10">
            Search
          </Button>
        </form>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : getTotalResults() > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-gray-600">
              Found {getTotalResults()} results for "{query}"
            </p>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({getTotalResults()})
              </TabsTrigger>
              <TabsTrigger value="ideas">
                Ideas ({results.ideas.length})
              </TabsTrigger>
              <TabsTrigger value="challenges">
                Challenges ({results.challenges.length})
              </TabsTrigger>
              <TabsTrigger value="pain-points">
                Pain Points ({results.painPoints.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {getDisplayResults().map((result) => {
                const categoryType = result.category === 'opportunity' 
                  ? 'ideas' 
                  : result.category === 'challenge' 
                    ? 'challenges' 
                    : 'pain-points';
                
                return (
                  <Card key={`${result.id}-${result.category}`} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle 
                            className="text-lg hover:text-violet-600 cursor-pointer"
                            onClick={() => navigate(`/${categoryType}/${result.id}`)}
                          >
                            {result.title}
                          </CardTitle>
                          <div className="flex items-center mt-1">
                            {result.category === 'opportunity' && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Idea</Badge>
                            )}
                            {result.category === 'challenge' && (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Challenge</Badge>
                            )}
                            {result.category === 'pain-point' && (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pain Point</Badge>
                            )}
                            <span className="text-gray-500 text-xs ml-2">{formatDate(result.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-600 mb-4 line-clamp-2">
                        {result.description}
                      </div>
                      {result.submitter && (
                        <div className="flex items-center mt-4">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={result.submitter.avatarUrl} />
                            <AvatarFallback>{result.submitter.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm text-gray-500">
                            {result.submitter.displayName} - {result.submitter.department}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Search className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500 max-w-md">
            We couldn't find any matches for "{query}". Try checking for typos or using different keywords.
          </p>
        </div>
      )}
    </div>
  );
}
