import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ChallengeSubmitForm } from "@/components/idea/challenge-submit-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function SubmitChallengePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Mutation for submitting challenge
  const submitChallengeMutation = useMutation({
    mutationFn: async (formData: {
      title: string;
      description: string;
      criteria: string;
      timeframe: string;
      reward: string;
      files?: FileList;
    }) => {
      // Create FormData for file uploads
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('impact', formData.criteria || ''); // Map criteria to impact field
      data.append('adminNotes', formData.timeframe || ''); // Map timeframe to adminNotes 
      data.append('inspiration', formData.reward || ''); // Map reward to inspiration
      data.append('category', 'challenge'); // Set category explicitly

      // Add empty tags array as required by schema
      data.append('tags', JSON.stringify([]));
      
      // Department is required by the schema
      data.append('department', user?.department || 'Engineering');
      
      // Add files if present - use 'media' field as expected by server
      if (formData.files) {
        console.log('Adding files to request:', formData.files.length);
        for (let i = 0; i < formData.files.length; i++) {
          console.log(`Adding file ${i+1}:`, formData.files[i].name, formData.files[i].type);
          data.append('media', formData.files[i]);
        }
      }

      const response = await fetch('/api/ideas', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit challenge');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/challenge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Challenge submitted",
        description: "Your challenge has been submitted successfully.",
      });
      
      // Redirect to challenges page
      setLocation("/challenges");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit challenge",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = async (formData: any) => {
    await submitChallengeMutation.mutateAsync(formData);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <button onClick={() => window.history.back()} className="text-primary hover:text-primary-dark mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </button>
            <h1 className="text-2xl font-semibold">Post a Challenge</h1>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <ChallengeSubmitForm 
              onSubmit={handleSubmit}
              onCancel={() => window.history.back()}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
