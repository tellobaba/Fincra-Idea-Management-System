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
  MessageSquare
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
  const [assignedRoles, setAssignedRoles] = useState({
    reviewer: "",
    transformer: "",
    implementer: ""
  });
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
    setSelectedIdea(idea);
    // Reset role selections
    setAssignedRoles({
      reviewer: "",
      transformer: "",
      implementer: ""
    });
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
    
    // Save each role that has been assigned
    Object.entries(assignedRoles).forEach(([role, userId]) => {
      if (userId) {
        assignRoleMutation.mutate({
          ideaId: selectedIdea.id,
          roleName: role,
          userId
        });
      }
    });
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewIdea(idea)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditIdea(idea)}>
                                <Edit className="h-4 w-4 mr-2" /> Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignRoles(idea)}>
                                <UserPlus className="h-4 w-4 mr-2" /> Assign Roles
                              </DropdownMenuItem>
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

      {/* View Idea Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedIdea?.title}</DialogTitle>
            <div className="flex gap-2 mt-2">
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
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{selectedIdea?.description}</p>
            </div>

            {selectedIdea?.impact && (
              <div>
                <h3 className="text-sm font-semibold">Impact</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{selectedIdea.impact}</p>
              </div>
            )}

            {selectedIdea?.adminNotes && (
              <div>
                <h3 className="text-sm font-semibold">Admin Notes</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{selectedIdea.adminNotes}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold">Submitted By</h3>
                <div className="flex items-center mt-1">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={selectedIdea?.submitter?.avatarUrl} />
                    <AvatarFallback>
                      {selectedIdea?.submitter?.displayName ? selectedIdea.submitter.displayName.charAt(0) : 
                       (selectedIdea?.submitter?.username ? selectedIdea.submitter.username.charAt(0) : '?')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {selectedIdea?.submitter?.displayName || selectedIdea?.submitter?.username || `User ${selectedIdea?.submitter?.id}` || 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Department</h3>
                <p className="mt-1 text-sm">{selectedIdea?.submitter?.department || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Submitted On</h3>
                <p className="mt-1 text-sm">
                  {selectedIdea?.createdAt ? formatDate(selectedIdea.createdAt) : "Unknown"}
                </p>
              </div>
            </div>

            {/* Role assignments section */}
            <div>
              <h3 className="text-sm font-semibold">Assigned Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="border p-3 rounded-md">
                  <h4 className="text-xs font-medium text-muted-foreground">Reviewer</h4>
                  <p className="text-sm mt-1">Not Assigned</p>
                </div>
                <div className="border p-3 rounded-md">
                  <h4 className="text-xs font-medium text-muted-foreground">Transformer</h4>
                  <p className="text-sm mt-1">Not Assigned</p>
                </div>
                <div className="border p-3 rounded-md">
                  <h4 className="text-xs font-medium text-muted-foreground">Implementer</h4>
                  <p className="text-sm mt-1">Not Assigned</p>
                </div>
              </div>
            </div>

            {/* Comments section would go here */}
            <div>
              <h3 className="text-sm font-semibold">Comments</h3>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">No comments yet</p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditIdea(selectedIdea!);
              }}
            >
              Edit Status
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Roles</DialogTitle>
            <DialogDescription>
              Assign roles for "{selectedIdea?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Reviewer</Label>
              <Select 
                value={assignedRoles.reviewer}
                onValueChange={(value) => setAssignedRoles({...assignedRoles, reviewer: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={`reviewer-${user.id}`} value={String(user.id)}>
                      {user.displayName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transformer</Label>
              <Select 
                value={assignedRoles.transformer}
                onValueChange={(value) => setAssignedRoles({...assignedRoles, transformer: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a transformer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={`transformer-${user.id}`} value={String(user.id)}>
                      {user.displayName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Implementer</Label>
              <Select 
                value={assignedRoles.implementer}
                onValueChange={(value) => setAssignedRoles({...assignedRoles, implementer: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an implementer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={`implementer-${user.id}`} value={String(user.id)}>
                      {user.displayName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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