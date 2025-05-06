import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Check,
  X,
  Archive,
  MessageSquare,
  TrendingUp,
  FileIcon as File,
  ImageIcon as Image,
  VideoIcon as Video,
  Music as Music,
  Tag
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { IdeaWithUser, Status, getCategoryConfig, getStatusConfig } from "@/types/ideas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminSubmissionsPage() {
  const { toast } = useToast();
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // State for idea detail viewing and editing
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithUser | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  
  // State for editing
  const [newStatus, setNewStatus] = useState<Status | "">("");
  const [adminNote, setAdminNote] = useState("");
  
  // State for role assignments
  const [assignedRoles, setAssignedRoles] = useState({
    reviewer: "",
    transformer: "",
    implementer: ""
  });
  
  // Email inputs for direct assignment
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [transformerEmail, setTransformerEmail] = useState("");
  const [implementerEmail, setImplementerEmail] = useState("");
  
  const [commentText, setCommentText] = useState("");

  // Fetch all ideas with their relationships
  const { data: ideas, isLoading, refetch } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas", "admin"],
    queryFn: async () => {
      const res = await fetch("/api/ideas?all=true");
      if (!res.ok) throw new Error("Failed to fetch ideas");
      return res.json();
    },
  });

  // Fetch users for role assignment
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Mutation for updating idea status
  const updateIdeaMutation = useMutation({
    mutationFn: async (data: { id: number; status?: string; adminNotes?: string }) => {
      await apiRequest("PATCH", `/api/ideas/${data.id}`, {
        status: data.status,
        adminNotes: data.adminNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Idea updated successfully",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update idea",
        variant: "destructive",
      });
    },
  });

  // Mutation for assigning roles
  const assignRoleMutation = useMutation({
    mutationFn: async (data: { ideaId: number; roleName: string; userId: string }) => {
      await apiRequest("POST", `/api/ideas/${data.ideaId}/assign`, {
        role: data.roleName,
        userId: data.userId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
      setIsRoleDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: async (data: { ideaId: number; content: string }) => {
      await apiRequest("POST", `/api/ideas/${data.ideaId}/comments`, {
        content: data.content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      setIsCommentDialogOpen(false);
      setCommentText("");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Filter ideas based on search query and filters
  const filteredIdeas = ideas?.filter(idea => {
    let matches = true;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const titleMatches = idea.title.toLowerCase().includes(searchLower);
      const descriptionMatches = idea.description.toLowerCase().includes(searchLower);
      const submitterMatches = idea.submitter?.displayName?.toLowerCase().includes(searchLower) || false;
      
      matches = matches && (titleMatches || descriptionMatches || submitterMatches);
    }
    
    if (statusFilter) {
      matches = matches && idea.status === statusFilter;
    }
    
    if (categoryFilter) {
      matches = matches && idea.category === categoryFilter;
    }
    
    if (departmentFilter && idea.submitter?.department) {
      matches = matches && idea.submitter.department === departmentFilter;
    }
    
    return matches;
  }) || [];

  // Paginate ideas
  const paginatedIdeas = filteredIdeas.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredIdeas.length / pageSize);

  // Handle view idea
  const handleViewIdea = (idea: IdeaWithUser) => {
    setSelectedIdea(idea);
    setIsViewDialogOpen(true);
  };

  // Handle edit idea
  const handleEditIdea = (idea: IdeaWithUser) => {
    setSelectedIdea(idea);
    setNewStatus(idea.status as Status);
    setAdminNote(idea.adminNotes || "");
    setIsEditDialogOpen(true);
  };

  // Handle assign roles
  const handleAssignRoles = (idea: IdeaWithUser) => {
    console.log('Handling assign roles for idea:', idea);
    setSelectedIdea(idea);
    
    // Set role selections based on existing assignments
    setAssignedRoles({
      reviewer: idea.reviewerId ? String(idea.reviewerId) : "",
      transformer: idea.transformerId ? String(idea.transformerId) : "",
      implementer: idea.implementerId ? String(idea.implementerId) : ""
    });
    
    // Reset email inputs
    setReviewerEmail(idea.reviewerEmail || "");
    setTransformerEmail(idea.transformerEmail || "");
    setImplementerEmail(idea.implementerEmail || "");
    
    setIsRoleDialogOpen(true);
  };

  // Handle add comment
  const handleAddComment = (idea: IdeaWithUser) => {
    setSelectedIdea(idea);
    setCommentText("");
    setIsCommentDialogOpen(true);
  };

  // Save updates to idea
  const handleSaveEdit = () => {
    if (!selectedIdea) return;
    
    updateIdeaMutation.mutate({
      id: selectedIdea.id,
      status: newStatus,
      adminNotes: adminNote
    });
  };

  // Save role assignments
  const handleSaveRoles = () => {
    if (!selectedIdea) return;
    
    // Handle existing user assignments
    Object.entries(assignedRoles).forEach(([role, userId]) => {
      if (userId && userId !== "none") {
        assignRoleMutation.mutate({
          ideaId: selectedIdea.id,
          roleName: role,
          userId
        });
      }
    });
    
    // Handle email invitations
    if (reviewerEmail) {
      // Send invitation email and create pending assignment
      assignRoleMutation.mutate({
        ideaId: selectedIdea.id,
        roleName: "reviewer",
        userId: "email:" + reviewerEmail // Special format to indicate email assignment
      });
      
      toast({
        title: "Email Invitation",
        description: `Invitation sent to ${reviewerEmail} for reviewer role`,
      });
    }
    
    if (transformerEmail) {
      assignRoleMutation.mutate({
        ideaId: selectedIdea.id,
        roleName: "transformer",
        userId: "email:" + transformerEmail
      });
      
      toast({
        title: "Email Invitation",
        description: `Invitation sent to ${transformerEmail} for transformer role`,
      });
    }
    
    if (implementerEmail) {
      assignRoleMutation.mutate({
        ideaId: selectedIdea.id,
        roleName: "implementer",
        userId: "email:" + implementerEmail
      });
      
      toast({
        title: "Email Invitation",
        description: `Invitation sent to ${implementerEmail} for implementer role`,
      });
    }
    
    // Reload idea data to reflect changes
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${selectedIdea.id}`] });
      refetch();
    }, 500);
    
    // Close the dialog
    setIsRoleDialogOpen(false);
  };

  // Save comment
  const handleSaveComment = () => {
    if (!selectedIdea || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      ideaId: selectedIdea.id,
      content: commentText
    });
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Submissions Management</h1>
            <p className="text-muted-foreground">Review and manage all ideas, challenges, and pain points</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{statusFilter || "Filter by Status"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="parked">Parked</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{categoryFilter || "Filter by Category"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="pain-point">Pain Point</SelectItem>
              <SelectItem value="opportunity">Opportunity</SelectItem>
              <SelectItem value="challenge">Challenge</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Filter */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{departmentFilter || "Filter by Department"}</span>
              </div>
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

        {/* Submissions Table */}
        <Card>
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg font-medium">All Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        <div className="flex justify-center">
                          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedIdeas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No submissions found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedIdeas.map((idea) => (
                      <TableRow key={idea.id}>
                        <TableCell className="font-medium">{idea.title}</TableCell>
                        <TableCell>
                          {idea.category && (
                            <Badge 
                              variant="outline" 
                              className={getCategoryConfig(idea.category).color}
                            >
                              {getCategoryConfig(idea.category).label}
                            </Badge>
                          )}
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
                        <TableCell>{idea.submitter?.department || "N/A"}</TableCell>
                        <TableCell>{formatDate(idea.createdAt)}</TableCell>
                        <TableCell>
                          {idea.status && (
                            <Badge 
                              variant="outline" 
                              className={getStatusConfig(idea.status).color}
                            >
                              {getStatusConfig(idea.status).label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{
                          // TODO: Implement vote count display when data is available
                          idea.voteCount || 0
                        }</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-2">
                            {/* Direct action buttons */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewIdea(idea)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditIdea(idea)}
                              title="Update status"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                console.log('Assign roles button clicked', idea.id);
                                handleAssignRoles(idea);
                              }}
                              title="Assign roles"
                              className="text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            
                            {/* More actions dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAddComment(idea)}>
                                  <MessageSquare className="h-4 w-4 mr-2" /> Add Comment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => 
                                    updateIdeaMutation.mutate({ 
                                      id: idea.id, 
                                      status: idea.status === "parked" ? "submitted" : "parked"
                                    })
                                  }
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  {idea.status === "parked" ? "Unarchive" : "Archive"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>{Math.min((page - 1) * pageSize + 1, filteredIdeas.length)}</strong> to{" "}
                  <strong>{Math.min(page * pageSize, filteredIdeas.length)}</strong> of{" "}
                  <strong>{filteredIdeas.length}</strong> submissions
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page => Math.max(page - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page => Math.min(page + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Idea Dialog - Detailed Submission Information */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              {selectedIdea?.title}
            </DialogTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedIdea?.category && (
                <Badge variant="outline" className={getCategoryConfig(selectedIdea.category).color}>
                  {getCategoryConfig(selectedIdea.category).label}
                </Badge>
              )}
              {selectedIdea?.status && (
                <Badge variant="outline" className={getStatusConfig(selectedIdea.status).color}>
                  {getStatusConfig(selectedIdea.status).label}
                </Badge>
              )}
              {selectedIdea?.priority && (
                <Badge variant="outline" className={`${selectedIdea.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' : 
                  selectedIdea.priority === 'medium' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                  'bg-blue-100 text-blue-800 border-blue-200'}`}>
                  {selectedIdea.priority.charAt(0).toUpperCase() + selectedIdea.priority.slice(1)} Priority
                </Badge>
              )}
              {selectedIdea?.voteCount && selectedIdea.voteCount > 0 && (
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {selectedIdea.voteCount} {selectedIdea.voteCount === 1 ? 'Vote' : 'Votes'}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Left column: Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <span className="bg-primary/10 p-1 rounded-md">
                    <Search className="h-4 w-4 text-primary" />
                  </span>
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea?.description}</p>
              </div>

              {selectedIdea?.impact && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-green-100 p-1 rounded-md">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </span>
                    Impact
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.impact}</p>
                </div>
              )}

              {selectedIdea?.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span className="bg-yellow-100 p-1 rounded-md">
                      <Edit className="h-4 w-4 text-yellow-600" />
                    </span>
                    Admin Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.adminNotes}</p>
                </div>
              )}

              {/* Additional fields */}
              {selectedIdea?.inspiration && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Inspiration/Context</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.inspiration}</p>
                </div>
              )}

              {selectedIdea?.similarSolutions && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-medium mb-2">Similar Solutions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.similarSolutions}</p>
                </div>
              )}
              
              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedIdea?.impactScore !== undefined && selectedIdea.impactScore !== null && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1">IMPACT SCORE</h4>
                    <p className="text-2xl font-bold text-purple-900">{selectedIdea.impactScore}</p>
                  </div>
                )}
                
                {selectedIdea?.costSaved !== undefined && selectedIdea.costSaved !== null && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                    <h4 className="text-xs font-semibold text-green-700 mb-1">COST SAVED</h4>
                    <p className="text-2xl font-bold text-green-900">${selectedIdea.costSaved.toLocaleString()}</p>
                  </div>
                )}
                
                {selectedIdea?.revenueGenerated !== undefined && selectedIdea.revenueGenerated !== null && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">REVENUE GENERATED</h4>
                    <p className="text-2xl font-bold text-blue-900">${selectedIdea.revenueGenerated.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedIdea?.tags && selectedIdea.tags.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdea.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {(selectedIdea?.attachments?.length || selectedIdea?.attachmentUrl || selectedIdea?.mediaUrls?.length) ? (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Attachments & Media</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedIdea?.attachmentUrl && (
                      <a 
                        href={selectedIdea.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                      >
                        <File className="h-4 w-4" />
                        Attachment
                      </a>
                    )}
                    
                    {selectedIdea?.attachments?.map((url, index) => (
                      <a 
                        key={index}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                      >
                        <File className="h-4 w-4" />
                        File {index + 1}
                      </a>
                    ))}
                    
                    {selectedIdea?.mediaUrls?.map((media, index) => (
                      <a 
                        key={index}
                        href={media.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                      >
                        {media.type.includes('image') ? (
                          <Image className="h-4 w-4" />
                        ) : media.type.includes('video') ? (
                          <Video className="h-4 w-4" />
                        ) : media.type.includes('audio') ? (
                          <Music className="h-4 w-4" />
                        ) : (
                          <File className="h-4 w-4" />
                        )}
                        {media.type.split('/')[0].charAt(0).toUpperCase() + media.type.split('/')[0].slice(1)} {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              ): null}

              {/* Comments section */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </h3>
                <div className="space-y-3">
                  {/* Would loop through comments here if we had them in the selectedIdea */}
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
              </div>
            </div>
            
            {/* Right column: Metadata and actions */}
            <div className="space-y-6">
              {/* Submission info card */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium mb-3">Submission Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs text-gray-500">SUBMITTED BY</h4>
                    <div className="flex items-center mt-1">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={selectedIdea?.submitter?.avatarUrl} />
                        <AvatarFallback>
                          {selectedIdea?.submitter?.displayName ? selectedIdea.submitter.displayName.charAt(0) : 
                           (selectedIdea?.submitter?.username ? selectedIdea.submitter.username.charAt(0) : '?')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {selectedIdea?.submitter?.displayName || selectedIdea?.submitter?.username || `User ${selectedIdea?.submitter?.id}` || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedIdea?.submitter?.department || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs text-gray-500">CREATED</h4>
                    <p className="text-sm mt-1">
                      {selectedIdea?.createdAt ? formatDate(selectedIdea.createdAt) : "Unknown"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs text-gray-500">LAST UPDATED</h4>
                    <p className="text-sm mt-1">
                      {selectedIdea?.updatedAt ? formatDate(selectedIdea.updatedAt) : "Unknown"}
                    </p>
                  </div>
                  
                  {selectedIdea?.category && (
                    <div>
                      <h4 className="text-xs text-gray-500">CATEGORY</h4>
                      <p className="text-sm mt-1">{getCategoryConfig(selectedIdea.category).label}</p>
                    </div>
                  )}
                  
                  {selectedIdea?.department && (
                    <div>
                      <h4 className="text-xs text-gray-500">RELATED DEPARTMENT</h4>
                      <p className="text-sm mt-1">{selectedIdea.department}</p>
                    </div>
                  )}
                  
                  {selectedIdea?.organizationCategory && (
                    <div>
                      <h4 className="text-xs text-gray-500">ORG. CATEGORY</h4>
                      <p className="text-sm mt-1">{selectedIdea.organizationCategory}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Role assignments section */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Assigned Roles</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-primary"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleAssignRoles(selectedIdea!);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="border p-3 rounded-md">
                    <h4 className="text-xs font-medium text-gray-500">REVIEWER</h4>
                    {selectedIdea?.reviewer ? (
                      <div className="flex items-center mt-1">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarImage src={selectedIdea.reviewer.avatarUrl} />
                          <AvatarFallback>
                            {selectedIdea.reviewer.displayName?.charAt(0) || selectedIdea.reviewer.email?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {selectedIdea.reviewer.displayName || selectedIdea.reviewer.email || `User ${selectedIdea.reviewer.id}`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-gray-500">Not Assigned</p>
                    )}
                  </div>
                  
                  <div className="border p-3 rounded-md">
                    <h4 className="text-xs font-medium text-gray-500">TRANSFORMER</h4>
                    {selectedIdea?.transformer ? (
                      <div className="flex items-center mt-1">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarImage src={selectedIdea.transformer.avatarUrl} />
                          <AvatarFallback>
                            {selectedIdea.transformer.displayName?.charAt(0) || selectedIdea.transformer.email?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {selectedIdea.transformer.displayName || selectedIdea.transformer.email || `User ${selectedIdea.transformer.id}`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-gray-500">Not Assigned</p>
                    )}
                  </div>
                  
                  <div className="border p-3 rounded-md">
                    <h4 className="text-xs font-medium text-gray-500">IMPLEMENTER</h4>
                    {selectedIdea?.implementer ? (
                      <div className="flex items-center mt-1">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarImage src={selectedIdea.implementer.avatarUrl} />
                          <AvatarFallback>
                            {selectedIdea.implementer.displayName?.charAt(0) || selectedIdea.implementer.email?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {selectedIdea.implementer.displayName || selectedIdea.implementer.email || `User ${selectedIdea.implementer.id}`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm mt-1 text-gray-500">Not Assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditIdea(selectedIdea!);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Status
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleAddComment(selectedIdea!);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Idea Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Idea Status</DialogTitle>
            <DialogDescription>
              Change the status for "{selectedIdea?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              {selectedIdea?.status && (
                <Badge 
                  variant="outline" 
                  className={getStatusConfig(selectedIdea.status).color}
                >
                  {getStatusConfig(selectedIdea.status).label}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Status)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="merged">Merged</SelectItem>
                  <SelectItem value="parked">Parked</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea 
                placeholder="Add any notes about this idea..." 
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="h-32"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Assign Roles
            </DialogTitle>
            <DialogDescription>
              Assign roles for "{selectedIdea?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Reviewer assignment section */}
            <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Reviewer</h3>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Required</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Reviews the submission and provides feedback.</p>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="col-span-1">
                  <Label className="text-xs">Select User</Label>
                  <Select 
                    value={assignedRoles.reviewer}
                    onValueChange={(value) => setAssignedRoles({...assignedRoles, reviewer: value})}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={`reviewer-${user.id}`} value={String(user.id)}>
                          {user.displayName || user.username || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1">
                  <Label className="text-xs">Or Enter Email</Label>
                  <Input 
                    type="email" 
                    className="h-8" 
                    placeholder="Email address" 
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Transformer assignment section */}
            <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium">Transformer</h3>
              <p className="text-xs text-muted-foreground">Transforms the idea into a viable solution.</p>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="col-span-1">
                  <Label className="text-xs">Select User</Label>
                  <Select 
                    value={assignedRoles.transformer}
                    onValueChange={(value) => setAssignedRoles({...assignedRoles, transformer: value})}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={`transformer-${user.id}`} value={String(user.id)}>
                          {user.displayName || user.username || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1">
                  <Label className="text-xs">Or Enter Email</Label>
                  <Input 
                    type="email" 
                    className="h-8" 
                    placeholder="Email address" 
                    value={transformerEmail}
                    onChange={(e) => setTransformerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Implementer assignment section */}
            <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
              <h3 className="font-medium">Implementer</h3>
              <p className="text-xs text-muted-foreground">Implements the final solution.</p>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="col-span-1">
                  <Label className="text-xs">Select User</Label>
                  <Select 
                    value={assignedRoles.implementer}
                    onValueChange={(value) => setAssignedRoles({...assignedRoles, implementer: value})}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={`implementer-${user.id}`} value={String(user.id)}>
                          {user.displayName || user.username || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1">
                  <Label className="text-xs">Or Enter Email</Label>
                  <Input 
                    type="email" 
                    className="h-8" 
                    placeholder="Email address" 
                    value={implementerEmail}
                    onChange={(e) => setImplementerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-2 rounded-md text-blue-700 text-xs flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Role Assignment</p>
                <p>You can either select an existing user from the dropdown or invite a new user by email.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles}>
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to "{selectedIdea?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea 
                placeholder="Add your comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="h-32"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveComment}>
              Post Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}