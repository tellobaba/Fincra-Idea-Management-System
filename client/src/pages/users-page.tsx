import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Idea } from "@shared/schema";
import { Loader2, Search, Filter, RefreshCw, UserCircle, Trash, Eye } from "lucide-react";

// User type definition
interface User {
  id: number;
  username: string;
  displayName?: string;
  department?: string;
  avatarUrl?: string;
  role: string;
  email?: string;
}

// User submissions dialog component
function UserSubmissionsDialog({
  isOpen,
  onClose,
  userId,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}) {
  const { toast } = useToast();
  
  const { data: submissions = [], isLoading } = useQuery<Idea[]>({
    queryKey: [`/api/admin/users/${userId}/submissions`],
    enabled: isOpen && userId > 0,
  });
  
  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'opportunity': return "bg-green-100 text-green-800 border-green-200";
      case 'challenge': return "bg-orange-100 text-orange-800 border-orange-200";
      case 'pain-point': return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'opportunity': return "Opportunity";
      case 'challenge': return "Challenge";
      case 'pain-point': return "Pain Point";
      default: return category;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'in-review': return "bg-purple-100 text-purple-800 border-purple-200";
      case 'implemented': return "bg-green-100 text-green-800 border-green-200";
      case 'in-refinement': return "bg-amber-100 text-amber-800 border-amber-200";
      case 'merged': return "bg-teal-100 text-teal-800 border-teal-200";
      case 'parked': return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Format status label
  const formatStatus = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            {userName}'s Submissions
          </DialogTitle>
          <DialogDescription>
            All ideas, challenges, and pain points submitted by this user
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This user has not made any submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(submission.category)}>
                          {getCategoryLabel(submission.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(submission.status)}>
                          {formatStatus(submission.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{submission.votes}</TableCell>
                      <TableCell>{formatDate(submission.createdAt.toString())}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Users Page Component
export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filtering and viewing
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch users
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Get available departments
  const departments = [...new Set(users.map(user => user.department).filter(Boolean))];
  
  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "reviewer": return "bg-blue-100 text-blue-800 border-blue-200";
      case "transformer": return "bg-green-100 text-green-800 border-green-200";
      case "implementer": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Filter users based on search query and filters
  const filteredUsers = users.filter(user => {
    let matches = true;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const displayNameMatches = user.displayName?.toLowerCase().includes(searchLower) || false;
      const usernameMatches = user.username.toLowerCase().includes(searchLower);
      const emailMatches = user.email?.toLowerCase().includes(searchLower) || false;
      
      matches = matches && (displayNameMatches || usernameMatches || emailMatches);
    }
    
    if (roleFilter) {
      matches = matches && user.role === roleFilter;
    }
    
    if (departmentFilter && user.department) {
      matches = matches && user.department === departmentFilter;
    }
    
    return matches;
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      setIsUserDetailOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });
  
  // Handler for viewing user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };
  
  // Handler for confirming user deletion
  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Users Management</h1>
                <p className="text-muted-foreground">Manage users and their details</p>
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
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Role filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="transformer">Transformer</SelectItem>
                  <SelectItem value="implementer">Implementer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Department filter */}
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department!}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Users table */}
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                                <AvatarFallback>
                                  {user.displayName?.charAt(0) || user.username.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{user.displayName || user.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email || user.username}</TableCell>
                          <TableCell>{user.department || "—"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getRoleBadgeColor(user.role)}
                            >
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">User Details</DialogTitle>
              <DialogDescription>
                View user information and manage their account
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.displayName || selectedUser.username} />
                  <AvatarFallback className="text-xl">
                    {selectedUser.displayName?.charAt(0) || selectedUser.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedUser.displayName || selectedUser.username}</h3>
                  <p className="text-muted-foreground">{selectedUser.email || selectedUser.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p>{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p>{selectedUser.department || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p>
                    <Badge 
                      variant="outline" 
                      className={getRoleBadgeColor(selectedUser.role)}
                    >
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p>{selectedUser.username}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between items-center space-x-2">
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                size="sm"
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete User
              </Button>
              
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsUserDetailOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Close user details and open submissions dialog
                    setIsUserDetailOpen(false);
                    // We'll use a state variable to track when to show submissions
                    setIsSubmissionsDialogOpen(true);
                  }}
                >
                  View Submissions
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* User Submissions Dialog */}
      {selectedUser && (
        <UserSubmissionsDialog
          isOpen={isSubmissionsDialogOpen}
          onClose={() => setIsSubmissionsDialogOpen(false)}
          userId={selectedUser.id}
          userName={selectedUser.displayName || selectedUser.username}
        />
      )}
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. The user and all their submissions, comments, votes, and follows will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedUser && (
            <div className="bg-muted/50 p-4 rounded-md flex items-start space-x-3 mt-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.displayName || selectedUser.username} />
                <AvatarFallback>
                  {selectedUser.displayName?.charAt(0) || selectedUser.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.displayName || selectedUser.username}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email || selectedUser.username}</p>
                <Badge 
                  variant="outline" 
                  className={`mt-1 ${getRoleBadgeColor(selectedUser.role)}`}
                >
                  {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                </Badge>
              </div>
            </div>
          )}
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}