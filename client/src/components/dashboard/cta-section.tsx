import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircleAlert, LightbulbIcon, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { SubmitIdeaForm } from "@/components/idea/submit-idea-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@shared/schema";

interface CtaSectionProps {
  displayName: string;
}

export function CtaSection({ displayName }: CtaSectionProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const handleOpenModal = (category: Category) => {
    setActiveCategory(category);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    // Reset the category after the dialog closes
    setTimeout(() => setActiveCategory(null), 300);
  };

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    category: Category;
    organizationCategory?: string;
    impact?: string;
    inspiration?: string;
    similarSolutions?: string;
    tags: string[];
  }) => {
    try {
      // Create a properly structured JSON object that matches expected schema fields
      const requestData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        department: formData.organizationCategory || 'Other',
        status: 'submitted', // default status
        priority: 'medium', // default priority
        impact: formData.impact || '',
        inspiration: formData.inspiration || '',
        similarSolutions: formData.similarSolutions || '',
        tags: formData.tags || [],
        attachments: [] // empty array as we're not handling attachments currently
      };
      
      console.log('Submitting idea with data:', requestData);
      
      // Use fetch with JSON data
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to submit idea';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error('Submission errors:', errorData.errors);
        } catch (e) {
          console.error('Error parsing error response:', errorText);
        }
        throw new Error(errorMessage);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Idea submitted",
        description: "Your idea has been submitted successfully.",
      });
      
      handleCloseModal();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit idea",
        variant: "destructive",
      });
    }
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case "pain-point":
        return "Submit a Pain-point";
      case "opportunity":
        return "Submit an Idea";
      case "challenge":
        return "Post a Challenge";
      default:
        return "Submit";
    }
  };

  return (
    <>
      <Card className="w-full mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-xl font-semibold mb-2">Hi {displayName}, what's been on your mind?</h2>
              <p className="text-muted-foreground">Share your thoughts and help us innovate together.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="destructive" 
                className="flex items-center justify-center" 
                onClick={() => handleOpenModal("pain-point")}
              >
                <CircleAlert className="mr-2 h-4 w-4" />
                I've got a PAIN-POINT
              </Button>
              
              <Button 
                className="flex items-center justify-center"
                onClick={() => handleOpenModal("opportunity")}
              >
                <LightbulbIcon className="mr-2 h-4 w-4" />
                I've got an IDEA
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white" 
                onClick={() => handleOpenModal("challenge")}
              >
                <Flag className="mr-2 h-4 w-4" />
                I want to post a CHALLENGE
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Idea Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getCategoryTitle()}</DialogTitle>
            <DialogDescription>
              Share your thoughts in detail to help us understand and implement your ideas better.
            </DialogDescription>
          </DialogHeader>
          
          {activeCategory && (
            <SubmitIdeaForm 
              initialCategory={activeCategory}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
