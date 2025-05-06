import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import { CATEGORY_CONFIG } from "@/types/ideas";

interface IdeaDetailRowProps {
  detailView: any;
  formatDate: (date: string | Date) => string;
}

export function IdeaDetailRow({ detailView, formatDate }: IdeaDetailRowProps) {
  if (!detailView) return null;
  
  return (
    <TableRow>
      <TableCell colSpan={7} className="bg-muted/30 p-0">
        <div className="p-4">
          <ScrollArea className="h-[400px] rounded-md border p-4 bg-card">
            <div className="space-y-8">
              {/* Idea Details */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{detailView.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{detailView.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Category</p>
                    <Badge variant="outline" className={CATEGORY_CONFIG[detailView.category as keyof typeof CATEGORY_CONFIG]?.color}>
                      {CATEGORY_CONFIG[detailView.category as keyof typeof CATEGORY_CONFIG]?.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm">{detailView.department || 'Not specified'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant="outline">
                      {detailView.status.charAt(0).toUpperCase() + detailView.status.slice(1).replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Priority</p>
                    <Badge variant="outline">
                      {detailView.priority.charAt(0).toUpperCase() + detailView.priority.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Submitted by</p>
                    <div className="flex items-center">
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={detailView.submitter?.avatarUrl} alt={detailView.submitter?.displayName} />
                        <AvatarFallback>{detailView.submitter?.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{detailView.submitter?.displayName}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Submission Date</p>
                    <p className="text-sm">{formatDate(detailView.createdAt)}</p>
                  </div>
                  
                  {detailView.tags && detailView.tags.length > 0 && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm font-medium">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {detailView.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Assigned Roles */}
              <div>
                <h3 className="text-base font-semibold mb-4">Assigned Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 border rounded-md p-3">
                    <p className="text-sm font-medium">Reviewer</p>
                    {detailView.reviewer ? (
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={detailView.reviewer.avatarUrl} alt={detailView.reviewer.displayName} />
                          <AvatarFallback>{detailView.reviewer.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{detailView.reviewer.displayName || detailView.reviewer.email}</span>
                      </div>
                    ) : detailView.reviewerEmail ? (
                      <p className="text-sm">Pending: {detailView.reviewerEmail}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not assigned</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 border rounded-md p-3">
                    <p className="text-sm font-medium">Transformer</p>
                    {detailView.transformer ? (
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={detailView.transformer.avatarUrl} alt={detailView.transformer.displayName} />
                          <AvatarFallback>{detailView.transformer.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{detailView.transformer.displayName || detailView.transformer.email}</span>
                      </div>
                    ) : detailView.transformerEmail ? (
                      <p className="text-sm">Pending: {detailView.transformerEmail}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not assigned</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 border rounded-md p-3">
                    <p className="text-sm font-medium">Implementer</p>
                    {detailView.implementer ? (
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={detailView.implementer.avatarUrl} alt={detailView.implementer.displayName} />
                          <AvatarFallback>{detailView.implementer.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{detailView.implementer.displayName || detailView.implementer.email}</span>
                      </div>
                    ) : detailView.implementerEmail ? (
                      <p className="text-sm">Pending: {detailView.implementerEmail}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comments */}
              {detailView.comments && detailView.comments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-base font-semibold mb-4">Comments</h3>
                    <div className="space-y-4">
                      {detailView.comments.map((comment: any) => (
                        <div key={comment.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={comment.user?.avatarUrl} alt={comment.user?.displayName} />
                                <AvatarFallback>{comment.user?.displayName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{comment.user?.displayName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </TableCell>
    </TableRow>
  );
}