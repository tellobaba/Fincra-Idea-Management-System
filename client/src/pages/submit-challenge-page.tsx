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
      files?: File[];
    }) => {
      // Create FormData object to handle both text data and files
      const formDataObj = new FormData();
      
      // Add all form fields to FormData
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('impact', formData.criteria || ''); // Map criteria to impact field
      formDataObj.append('adminNotes', formData.timeframe || ''); // Map timeframe to adminNotes
      formDataObj.append('inspiration', formData.reward || ''); // Map reward to inspiration
      formDataObj.append('category', 'challenge'); // Set category explicitly
      formDataObj.append('department', user?.department || 'Engineering');
      formDataObj.append('status', 'submitted'); // default status
      formDataObj.append('priority', 'medium'); // default priority
      formDataObj.append('similarSolutions', '');
      formDataObj.append('tags', JSON.stringify([]));
      
      // Add files if provided
      if (formData.files && formData.files.length > 0) {
        formData.files.forEach(file => {
          formDataObj.append('files', file);
        });
        console.log(`Adding ${formData.files.length} files to challenge submission`);
      }
      
      console.log('Submitting challenge with FormData'); 
      
      // Use fetch with FormData (no Content-Type header as it's set automatically with boundary)
      const response = await fetch('/api/ideas', {
        method: 'POST',
        body: formDataObj,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to submit challenge';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error('Submission errors:', errorData.errors);
        } catch (e) {
          console.error('Error parsing error response:', errorText);
        }
        throw new Error(errorMessage);
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
