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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Reply,
  Search,
  Trash2,
  Edit
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CommentWithUser } from "@/types/ideas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminCommentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [hideReviewerOnly, setHideReviewerOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // State for comment management
  const [selectedComment, setSelectedComment] = useState<CommentWithUser | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState("");

  // Fetch all comments with their relationships
  const { data: comments, isLoading, refetch } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/comments"],
    queryFn: async () => {
      const res = await fetch("/api/comments");
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  // Fetch users for user filter
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Mutation for adding a reply
  const addReplyMutation = useMutation({
    mutationFn: async (data: { ideaId: number; content: string; parentId?: number }) => {
      await apiRequest("POST", `/api/ideas/${data.ideaId}/comments`, {
        content: data.content,
        parentId: data.parentId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
      setIsReplyDialogOpen(false);
      setReplyText("");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add reply",
        variant: "destructive",
      });
    },
  });

  // Mutation for editing a comment
  const editCommentMutation = useMutation({
    mutationFn: async (data: { commentId: number; content: string }) => {
      await apiRequest("PATCH", `/api/comments/${data.commentId}`, {
        content: data.content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  // Filter comments based on filters
  const filteredComments = comments?.filter(comment => {
    let matches = true;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const contentMatches = comment.content.toLowerCase().includes(searchLower);
      const userMatches = comment.user?.displayName?.toLowerCase().includes(searchLower) || 
                          comment.user?.username?.toLowerCase().includes(searchLower) || false;
      
      matches = matches && (contentMatches || userMatches);
    }
    
    if (statusFilter) {
      // This would filter by some status if comments had statuses
      // For now, let's assume we're not filtering by status
    }
    
    if (userFilter) {
      matches = matches && comment.user?.id.toString() === userFilter;
    }
    
    if (hideReviewerOnly) {
      // If this is set to true, hide comments that are marked as reviewer-only
      // For now, let's assume comments don't have a reviewer-only flag
    }
    
    return matches;
  }) || [];

  // Paginate comments
  const paginatedComments = filteredComments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredComments.length / pageSize);

  // Handle reply to comment
  const handleReplyToComment = (comment: CommentWithUser) => {
    setSelectedComment(comment);
    setReplyText("");
    setIsReplyDialogOpen(true);
  };

  // Handle edit comment
  const handleEditComment = (comment: CommentWithUser) => {
    setSelectedComment(comment);
    setEditText(comment.content);
    setIsEditDialogOpen(true);
  };

  // Handle delete comment
  const handleDeleteComment = (comment: CommentWithUser) => {
    setSelectedComment(comment);
    setIsDeleteDialogOpen(true);
  };

  // Save reply
  const handleSaveReply = () => {
    if (!selectedComment || !replyText.trim()) return;
    
    addReplyMutation.mutate({
      ideaId: selectedComment.ideaId,
      content: replyText,
      parentId: selectedComment.id
    });
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!selectedComment || !editText.trim()) return;
    
    editCommentMutation.mutate({
      commentId: selectedComment.id,
      content: editText
    });
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!selectedComment) return;
    
    deleteCommentMutation.mutate(selectedComment.id);
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Truncate text if too long
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Comments Management</h1>
            <p className="text-muted-foreground">Review and manage all comments and discussions</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* User Filter */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{userFilter ? "Filter by User" : "All Users"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Users</SelectItem>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.displayName || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reviewer Only Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="reviewer-only" 
              checked={hideReviewerOnly}
              onCheckedChange={(checked) => setHideReviewerOnly(!!checked)}
            />
            <Label htmlFor="reviewer-only">Hide reviewer-only comments</Label>
          </div>
        </div>

        {/* Comments Table */}
        <Card>
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg font-medium">All Comments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comment</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Idea</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <div className="flex justify-center">
                          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedComments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No comments found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="max-w-xs">
                          <div className="whitespace-normal break-words">  
                            {truncateText(comment.content)}
                          </div>
                          {comment.parentId && (
                            <Badge variant="outline" className="mt-1">
                              Reply
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={comment.user?.avatarUrl} />
                              <AvatarFallback>
                                {comment.user?.displayName ? comment.user.displayName.charAt(0) : 
                                 (comment.user?.username ? comment.user.username.charAt(0) : '?')}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {comment.user?.displayName || comment.user?.username || 'Unknown'}
                              {comment.user?.role && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {comment.user.role}
                                </Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="link" className="p-0 h-auto" asChild>
                            <a href={`/ideas/${comment.ideaId}`} target="_blank" rel="noopener noreferrer">
                              View Idea
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell>{formatDate(comment.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleReplyToComment(comment)}>
                                <Reply className="h-4 w-4 mr-2" /> Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteComment(comment)}
                                className="text-red-600 hover:text-red-700 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                  Showing <strong>{Math.min((page - 1) * pageSize + 1, filteredComments.length)}</strong> to{" "}
                  <strong>{Math.min(page * pageSize, filteredComments.length)}</strong> of{" "}
                  <strong>{filteredComments.length}</strong> comments
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

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
          </DialogHeader>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedComment?.user?.avatarUrl} />
                <AvatarFallback>
                  {selectedComment?.user?.displayName?.charAt(0) || 
                   selectedComment?.user?.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {selectedComment?.user?.displayName || selectedComment?.user?.username || 'Unknown'}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{selectedComment?.content}</p>
          </div>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Your Reply</Label>
              <Textarea 
                placeholder="Write your reply here..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="h-32"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReply}>
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Comment Text</Label>
              <Textarea 
                placeholder="Edit your comment..." 
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedComment?.user?.avatarUrl} />
                  <AvatarFallback>
                    {selectedComment?.user?.displayName?.charAt(0) || 
                     selectedComment?.user?.username?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {selectedComment?.user?.displayName || selectedComment?.user?.username || 'Unknown'}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{truncateText(selectedComment?.content || '', 200)}</p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}