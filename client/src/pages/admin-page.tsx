import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { IdeaWithUser } from "@/types/ideas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_CONFIG } from "@/types/ideas";
import { Loader2, CheckIcon, MessageSquare, UserPlus, X, ChevronDown, ChevronRight, Eye } from "lucide-react";
import { IdeaDetailRow } from "./admin/idea-detail-row";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIdeas, setSelectedIdeas] = useState<number[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignIdea, setAssignIdea] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reviewer");
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<any>(null);
  
  // Fetch ideas for review
  const { data: ideasForReview, isLoading } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas/review"],
  });
  
  // Mutation for updating idea status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest("PATCH", `/api/ideas/${id}`, { status });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Status updated",
        description: "The idea status has been updated successfully.",
      });
      
      // Clear selection
      setSelectedIdeas([]);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update idea status",
        variant: "destructive",
      });
    },
  });
  
  // Helper to calculate SLA status based on created date
  const getSlaStatus = (createdAt: string | Date) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 3) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-800' };
    } else if (diffDays >= 2) {
      return { label: '1 day left', color: 'bg-amber-100 text-amber-800' };
    } else {
      return { label: `${3 - diffDays} days left`, color: 'bg-green-100 text-green-800' };
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Handle checkbox selection
  const toggleSelection = (id: number) => {
    setSelectedIdeas(prev => 
      prev.includes(id) 
        ? prev.filter(ideaId => ideaId !== id) 
        : [...prev, id]
    );
  };
  
  // Handle select all checkbox
  const toggleSelectAll = () => {
    if (ideasForReview) {
      if (selectedIdeas.length === ideasForReview.length) {
        setSelectedIdeas([]);
      } else {
        setSelectedIdeas(ideasForReview.map(idea => idea.id));
      }
    }
  };
  
  // Function to fetch idea details
  const fetchIdeaDetails = async (ideaId: number) => {
    if (expandedIdea === ideaId) {
      // Toggle off if already expanded
      setExpandedIdea(null);
      setDetailView(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/ideas/${ideaId}`);
      if (!response.ok) throw new Error('Failed to fetch idea details');
      
      const data = await response.json();
      setDetailView(data);
      setExpandedIdea(ideaId);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch idea details",
        variant: "destructive"
      });
    }
  };

  // Handle role assignment submission
  const handleRoleAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignIdea) return;
    
    if (!email || !role) {
      toast({
        title: "Missing information",
        description: "Please provide both email and role",
        variant: "destructive"
      });
      return;
    }
    
    // Call API to assign role
    apiRequest("POST", `/api/ideas/${assignIdea}/assign`, {
      role,
      userId: 'email:' + email // Special format to indicate email assignment
    }).then(() => {
      toast({
        title: "Role assigned",
        description: `Successfully assigned ${role} role to ${email}`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/review"] });
      if (expandedIdea === assignIdea) {
        // Refresh detail view if this idea is expanded
        fetchIdeaDetails(assignIdea);
      }
      setAssignModalOpen(false);
      setEmail("");
      setRole("reviewer");
    }).catch((error) => {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Failed to assign role",
        variant: "destructive"
      });
    });
  };

  // Generate rows for the table - idea rows and detail rows
  const renderTableRows = () => {
    if (!ideasForReview) return null;
    
    const rows: React.ReactNode[] = [];
    
    ideasForReview.forEach((idea) => {
      // Main idea row
      rows.push(
        <TableRow 
          key={`idea-${idea.id}`}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => fetchIdeaDetails(idea.id)}
        >
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={selectedIdeas.includes(idea.id)} 
              onCheckedChange={() => toggleSelection(idea.id)}
              aria-label={`Select idea ${idea.title}`}
            />
          </TableCell>
          <TableCell className="font-medium flex items-center gap-2">
            {expandedIdea === idea.id ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
            {idea.title}
          </TableCell>
          <TableCell>
            <Badge 
              variant="outline" 
              className={CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.color}
            >
              {CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.label}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={idea.submitter?.avatarUrl} alt={idea.submitter?.displayName} />
                <AvatarFallback>{idea.submitter?.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">
                {idea.submitter?.displayName}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground">
            {formatDate(idea.createdAt)}
          </TableCell>
          <TableCell>
            <Badge 
              variant="outline" 
              className={getSlaStatus(idea.createdAt).color}
            >
              {getSlaStatus(idea.createdAt).label}
            </Badge>
          </TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                title="Approve"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatusMutation.mutate({ id: idea.id, status: "in-review" });
                }}
                disabled={updateStatusMutation.isPending}
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="Request comment"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="Assign user"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAssignIdea(idea.id);
                  setAssignModalOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="View details"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchIdeaDetails(idea.id);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
      
      // Add detail row if expanded
      if (expandedIdea === idea.id && detailView) {
        rows.push(
          <IdeaDetailRow 
            key={`detail-${idea.id}`} 
            detailView={detailView} 
            formatDate={formatDate} 
          />
        );
      }
    });
    
    return rows;
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Link href="/" className="text-primary hover:text-primary-dark mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold">Admin Panel</h1>
          </div>
          
          <div className="bg-card rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pending Review Queue</h2>
              
              <div className="flex space-x-2">
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Request More Info
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ideasForReview && ideasForReview.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No ideas pending review at this time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={ideasForReview && ideasForReview.length > 0 && selectedIdeas.length === ideasForReview.length} 
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all ideas"
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderTableRows()}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Role</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setAssignModalOpen(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-4">Assign a user to this idea with a specific role.</p>
            
            <form onSubmit={handleRoleAssignment}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email" 
                    placeholder="user@example.com" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Select role</Label>
                  <select 
                    id="role" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="reviewer">Reviewer</option>
                    <option value="transformer">Transformer</option>
                    <option value="implementer">Implementer</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setAssignModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Assign Role</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}