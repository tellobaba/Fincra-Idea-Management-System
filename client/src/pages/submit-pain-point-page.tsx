import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { PainPointSubmitForm } from "@/components/idea/pain-point-submit-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function SubmitPainPointPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Mutation for submitting pain point
  const submitPainPointMutation = useMutation({
    mutationFn: async (formData: {
      title: string;
      department: string;
      description: string;
      urgency: string;
      rootCause: string;
      files?: FileList;
      voiceNote?: File;
    }) => {
      // Create FormData for file uploads
      const data = new FormData();
      data.append('title', formData.title);
      data.append('department', formData.department);
      data.append('description', formData.description);
      data.append('priority', formData.urgency); // Map urgency to priority
      data.append('impact', formData.rootCause || ''); // Map rootCause to impact
      data.append('category', 'pain-point'); // Set category explicitly

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
        throw new Error(errorData.message || 'Failed to submit pain point');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/pain-point"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Pain Point submitted",
        description: "Your pain point has been submitted successfully.",
      });
      
      // Redirect to pain points page
      setLocation("/pain-points");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit pain point",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = async (formData: any) => {
    await submitPainPointMutation.mutateAsync(formData);
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
            <h1 className="text-2xl font-semibold">Submit a Pain Point</h1>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <PainPointSubmitForm 
              onSubmit={handleSubmit}
              onCancel={() => window.history.back()}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
