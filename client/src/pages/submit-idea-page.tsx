import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { EnhancedSubmitForm } from "@/components/idea/enhanced-submit-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function SubmitIdeaPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get category from URL if available
  const initialCategory = params.type as Category | undefined;
  
  // Mutation for submitting idea
  const submitIdeaMutation = useMutation({
    mutationFn: async (formData: {
      title: string;
      description: string;
      category: Category;
      impact?: string;
      organizationCategory?: string;
      inspiration?: string;
      similarSolutions?: string;
      tags: string[];
    }) => {
      const response = await apiRequest("POST", "/api/ideas", formData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      toast({
        title: "Idea submitted",
        description: "Your idea has been submitted successfully.",
      });
      
      // Redirect to home page
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit idea",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = async (formData: {
    title: string;
    description: string;
    category: Category;
    impact?: string;
    organizationCategory?: string;
    inspiration?: string;
    similarSolutions?: string;
    tags: string[];
  }) => {
    await submitIdeaMutation.mutateAsync(formData);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Link href="/" className="text-primary hover:text-primary-dark mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold">
              {initialCategory 
                ? initialCategory === "pain-point" 
                  ? "Submit a Pain-point" 
                  : initialCategory === "opportunity" 
                    ? "Submit an Idea" 
                    : "Post a Challenge"
                : "Submit New Idea"
              }
            </h1>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <EnhancedSubmitForm 
              initialCategory={initialCategory}
              onSubmit={handleSubmit}
              onCancel={() => setLocation("/")}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
