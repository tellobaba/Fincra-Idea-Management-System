import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, Filter, MoreHorizontal, Search, Trash } from "lucide-react";
import { IdeaWithUser, Status, getCategoryConfig, getStatusConfig } from "@/types/ideas";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface IdeaManagementTableProps {
  ideas: IdeaWithUser[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function IdeaManagementTable({ ideas, isLoading, onRefresh }: IdeaManagementTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [viewIdea, setViewIdea] = useState<IdeaWithUser | null>(null);
  const [editIdea, setEditIdea] = useState<IdeaWithUser | null>(null);
  const [newStatus, setNewStatus] = useState<Status | "">("");
  const [adminNote, setAdminNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Apply filters to ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = searchQuery === "" || 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || idea.status === statusFilter;
    const matchesCategory = categoryFilter === "" || idea.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleUpdateStatus = async () => {
    if (!editIdea || !newStatus) return;

    try {
      const response = await fetch(`/api/ideas/${editIdea.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNote.trim() ? adminNote : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to update idea");

      // Success
      toast({
        title: "Idea updated",
        description: `Status changed to ${getStatusConfig(newStatus).label}`,
      });

      // Clean up
      setEditIdea(null);
      setNewStatus("");
      setAdminNote("");

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update idea",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <span>Idea Management</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRefresh}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ideas..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>{statusFilter || "Status"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="merged">Merged</SelectItem>
                    <SelectItem value="parked">Parked</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>{categoryFilter || "Category"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="pain-point">Pain Point</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Loading ideas...</TableCell>
                  </TableRow>
                ) : filteredIdeas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No ideas found</TableCell>
                  </TableRow>
                ) : (
                  filteredIdeas.map((idea) => (
                    <TableRow key={idea.id}>
                      <TableCell className="font-medium max-w-xs truncate">{idea.title}</TableCell>
                      <TableCell>{idea.submitter?.displayName || 'Unknown'}</TableCell>
                      <TableCell>
                        {idea.category && (
                          <Badge 
                            variant="outline" 
                            className={`border-${getCategoryConfig(idea.category).color}-500 text-${getCategoryConfig(idea.category).color}-700 bg-${getCategoryConfig(idea.category).color}-50`}
                          >
                            {getCategoryConfig(idea.category).label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {idea.status && (
                          <Badge 
                            variant="outline" 
                            className={`border-${getStatusConfig(idea.status).color} text-${getStatusConfig(idea.status).color} bg-${getStatusConfig(idea.status).color}/10`}
                          >
                            {getStatusConfig(idea.status).label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(idea.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewIdea(idea)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditIdea(idea);
                              setNewStatus(idea.status as Status);
                              setAdminNote(idea.adminNotes || '');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Idea Dialog */}
      <Dialog open={!!viewIdea} onOpenChange={(open) => !open && setViewIdea(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{viewIdea?.title}</DialogTitle>
            <DialogDescription className="flex gap-2 mt-2">
              {viewIdea?.category && (
                <Badge 
                  variant="outline" 
                  className={`border-${getCategoryConfig(viewIdea.category).color}-500 text-${getCategoryConfig(viewIdea.category).color}-700 bg-${getCategoryConfig(viewIdea.category).color}-50`}
                >
                  {getCategoryConfig(viewIdea.category).label}
                </Badge>
              )}
              {viewIdea?.status && (
                <Badge 
                  variant="outline" 
                  className={`border-${getStatusConfig(viewIdea.status).color} text-${getStatusConfig(viewIdea.status).color} bg-${getStatusConfig(viewIdea.status).color}/10`}
                >
                  {getStatusConfig(viewIdea.status).label}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{viewIdea?.description}</p>
            </div>

            {viewIdea?.impact && (
              <div>
                <h3 className="text-sm font-semibold">Impact</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{viewIdea.impact}</p>
              </div>
            )}

            {viewIdea?.adminNotes && (
              <div>
                <h3 className="text-sm font-semibold">Admin Notes</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{viewIdea.adminNotes}</p>
              </div>
            )}

            <div className="flex gap-4">
              <div>
                <h3 className="text-sm font-semibold">Submitted By</h3>
                <p className="mt-1 text-sm text-gray-700">{viewIdea?.submitter?.displayName || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Department</h3>
                <p className="mt-1 text-sm text-gray-700">{viewIdea?.submitter?.department || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Submitted On</h3>
                <p className="mt-1 text-sm text-gray-700">
                  {viewIdea?.createdAt ? new Date(viewIdea.createdAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>

            {viewIdea?.attachmentUrl && (
              <div>
                <h3 className="text-sm font-semibold">Attachment</h3>
                <div className="mt-2">
                  {viewIdea.attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img 
                      src={viewIdea.attachmentUrl} 
                      alt="Attachment" 
                      className="max-h-64 rounded-md object-contain"
                    />
                  ) : viewIdea.attachmentUrl.match(/\.(pdf)$/i) ? (
                    <a 
                      href={viewIdea.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      View PDF Document
                    </a>
                  ) : (
                    <a 
                      href={viewIdea.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      Download Attachment
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setViewIdea(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setEditIdea(viewIdea);
                setViewIdea(null);
                setNewStatus(viewIdea?.status as Status || 'submitted');
                setAdminNote(viewIdea?.adminNotes || '');
              }}
            >
              Edit Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Idea Dialog */}
      <Dialog open={!!editIdea} onOpenChange={(open) => !open && setEditIdea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Idea Status</DialogTitle>
            <DialogDescription>
              Change the status for "{editIdea?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Status</label>
              {editIdea?.status && (
                <Badge 
                  variant="outline" 
                  className={`border-${getStatusConfig(editIdea.status).color} text-${getStatusConfig(editIdea.status).color} bg-${getStatusConfig(editIdea.status).color}/10`}
                >
                  {getStatusConfig(editIdea.status).label}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
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
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea 
                placeholder="Add internal notes about this idea"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditIdea(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
