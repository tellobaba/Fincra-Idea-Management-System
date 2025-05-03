import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { IdeaSubmitForm } from "@/components/idea/idea-submit-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function SubmitIdeaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Mutation for submitting idea
  const submitIdeaMutation = useMutation({
    mutationFn: async (formData: {
      title: string;
      description: string;
      workstream: string;
      impact?: string;
      inspiration?: string;
      similarSolutions?: string;
      tags: string[];
      files?: FileList;
      voiceNote?: File;
    }) => {
      // Create FormData for file uploads
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('workstream', formData.workstream);
      data.append('impact', formData.impact || '');
      data.append('inspiration', formData.inspiration || '');
      data.append('similarSolutions', formData.similarSolutions || '');
      data.append('category', 'opportunity'); // Set category explicitly
      
      // Add tags
      if (formData.tags && formData.tags.length > 0) {
        data.append('tags', JSON.stringify(formData.tags));
      }

      // Add files if present - use 'media' field as expected by server
      if (formData.files) {
        for (let i = 0; i < formData.files.length; i++) {
          data.append('media', formData.files[i]);
        }
      }

      // Add voice note if present - also as 'media'
      if (formData.voiceNote) {
        data.append('media', formData.voiceNote);
      }

      const response = await fetch('/api/ideas', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit idea');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/opportunity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Idea submitted",
        description: "Your idea has been submitted successfully.",
      });
      
      // Redirect to ideas page
      setLocation("/ideas");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit idea",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = async (formData: any) => {
    await submitIdeaMutation.mutateAsync(formData);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Link href="/ideas" className="text-primary hover:text-primary-dark mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold">Submit an Idea</h1>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <IdeaSubmitForm 
              onSubmit={handleSubmit}
              onCancel={() => setLocation("/ideas")}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
