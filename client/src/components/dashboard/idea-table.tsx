import { Link } from "wouter";
import { IdeaWithUser } from "@/types/ideas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STATUS_CONFIG, CATEGORY_CONFIG } from "@/types/ideas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IdeaTableProps {
  ideas: IdeaWithUser[];
  title: string;
  showCategory?: boolean;
  showStatus?: boolean;
  showSubmittedBy?: boolean;
  showSubmittedDate?: boolean;
  showVotes?: boolean;
  showSla?: boolean;
  isLoading?: boolean;
}

export function IdeaTable({
  ideas,
  title,
  showCategory = true,
  showStatus = true,
  showSubmittedBy = true,
  showSubmittedDate = false,
  showVotes = true,
  showSla = false,
  isLoading = false,
}: IdeaTableProps) {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              {showCategory && <TableHead>Category</TableHead>}
              {showSubmittedBy && <TableHead>Submitted By</TableHead>}
              {showSubmittedDate && <TableHead>Submitted Date</TableHead>}
              {showVotes && <TableHead>Votes</TableHead>}
              {showStatus && <TableHead>Status</TableHead>}
              {showSla && <TableHead>SLA</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <div className="w-full h-4 bg-slate-200 rounded animate-pulse"></div>
                  </TableCell>
                  {showCategory && <TableCell><div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>}
                  {showSubmittedBy && (
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse mr-3"></div>
                        <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  )}
                  {showSubmittedDate && <TableCell><div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>}
                  {showVotes && <TableCell><div className="w-8 h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>}
                  {showStatus && <TableCell><div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>}
                  {showSla && <TableCell><div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>}
                  <TableCell><div className="w-12 h-4 bg-slate-200 rounded animate-pulse"></div></TableCell>
                </TableRow>
              ))
            ) : ideas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No ideas found. Be the first to submit one!
                </TableCell>
              </TableRow>
            ) : (
              ideas.map((idea) => (
                <TableRow key={idea.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {idea.title}
                  </TableCell>
                  {showCategory && (
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.color}
                      >
                        {CATEGORY_CONFIG[idea.category as keyof typeof CATEGORY_CONFIG]?.label}
                      </Badge>
                    </TableCell>
                  )}
                  {showSubmittedBy && (
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
                  )}
                  {showSubmittedDate && (
                    <TableCell className="text-muted-foreground">
                      {formatDate(idea.createdAt)}
                    </TableCell>
                  )}
                  {showVotes && (
                    <TableCell>
                      {idea.votes}
                    </TableCell>
                  )}
                  {showStatus && (
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={STATUS_CONFIG[idea.status as keyof typeof STATUS_CONFIG]?.color}
                      >
                        {STATUS_CONFIG[idea.status as keyof typeof STATUS_CONFIG]?.label}
                      </Badge>
                    </TableCell>
                  )}
                  {showSla && (
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getSlaStatus(idea.createdAt).color}
                      >
                        {getSlaStatus(idea.createdAt).label}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto"
                      asChild
                    >
                      <Link href={`/ideas/${idea.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
