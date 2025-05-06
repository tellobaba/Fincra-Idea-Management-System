import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MessageCircle, ThumbsUp } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useToast } from "@/hooks/use-toast";

export default function MyVotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's voted ideas
  const { data: votedIdeas = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/ideas/my-votes"],
  });

  // Function to handle removing a vote
  const handleRemoveVote = async (id: number) => {
    try {
      // This would be a POST or DELETE to remove the vote
      // For now, show a toast since this functionality would be added later
      toast({
        title: "Feature Coming Soon",
        description: "Vote removal will be available in a future update.",
      });
      
      // When this functionality is implemented, we'll need to invalidate these queries
      // For now just showing the comment for reference
      /*
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/my-votes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/opportunity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/challenge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/pain-point"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      */
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "There was a problem processing your request.",
        variant: "destructive"
      });
    }
  };

  // Get icon based on the category
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <Header 
          onSearch={setSearchQuery} 
          welcomeMessage="My Votes"
          showTabs={false}
          showAddNewButton={false}
        />
        
        <div className="p-6">
          {/* Statistics card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">You've voted on {votedIdeas.length} ideas</h2>
                  <p className="text-muted-foreground mt-1">
                    Your votes help the team prioritize the most important ideas.
                  </p>
                </div>
                <div className="flex items-center bg-primary/10 text-primary px-4 py-2 rounded-lg">
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  <span className="font-medium">{votedIdeas.length} total votes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voted ideas table */}
          <Card>
            <CardHeader>
              <CardTitle>Ideas You've Voted For</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted">
                    <tr>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Submitted By</th>
                      <th className="px-6 py-3">Total Votes</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          Loading your voted ideas...
                        </td>
                      </tr>
                    ) : votedIdeas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          You haven't voted on any ideas yet. Browse ideas to start voting!
                        </td>
                      </tr>
                    ) : (
                      votedIdeas.map((idea: any) => (
                        <tr key={idea.id} className="bg-card border-b border-border hover:bg-muted">
                          <td className="px-6 py-4 font-medium">
                            <Link href={`/ideas/${idea.id}`} className="text-primary hover:underline">
                              {getCategoryIcon(idea.category)} {idea.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">
                              {idea.description && idea.description.length > 90 
                                ? `${idea.description.substring(0, 90)}...` 
                                : idea.description}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              idea.category === 'opportunity' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                              idea.category === 'challenge' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              idea.category === 'pain-point' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {idea.category === 'opportunity' ? 'Idea' :
                               idea.category === 'challenge' ? 'Challenge' :
                               idea.category === 'pain-point' ? 'Pain Point' :
                               idea.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-muted mr-2 flex-shrink-0"></div>
                              <div>
                                <div className="font-medium">{idea.submitter?.displayName || 'Anonymous'}</div>
                                <div className="text-xs text-muted-foreground">{idea.submitter?.department || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="mr-2">{idea.votes || 0}</span>
                              <button 
                                onClick={() => handleRemoveVote(idea.id)}
                                className="text-primary hover:text-destructive"
                              >
                                <ThumbsUp className="h-4 w-4 fill-current" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              idea.status === 'implemented' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                              idea.status === 'in-review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              idea.status === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              idea.status === 'parked' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                              'bg-muted text-muted-foreground'
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
