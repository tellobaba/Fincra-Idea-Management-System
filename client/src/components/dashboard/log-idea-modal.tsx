import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { categorySchema, organizationCategorySchema } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

interface LogYourIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  impact: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  organizationCategory: z.string().optional(),
  inspiration: z.string().optional(),
  similarSolutions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Export as a named export for normal imports and as default export for dynamic imports
export function LogYourIdeaModal({ open, onOpenChange }: LogYourIdeaModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      impact: "",
      category: "",
      subcategory: "",
      organizationCategory: "",
      inspiration: "",
      similarSolutions: "",
    },
  });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isFileValid(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isFileValid(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isFileValid = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "application/pdf", "video/mp4"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPEG, PNG, PDF, or MP4 files only.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();
      
      // Add form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      
      // Add file if selected
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }
      
      // Make sure submittedById is passed
      if (user) {
        formData.append('submittedById', user.id.toString());
      }
      
      // Submit the idea to the API
      const response = await fetch('/api/ideas', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit idea: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Idea submitted",
        description: "Your idea has been submitted successfully!",
      });
      
      // Invalidate the ideas query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      
      // Reset form and close modal
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting idea:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit your idea. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <img 
              src="/Logomark.png" 
              alt="Fincra Logo" 
              className="h-10 w-10" 
            />
          </div>
          
          <DialogTitle className="text-xl font-bold text-center mb-2">
            Log your idea
          </DialogTitle>
          <DialogHeader className="text-center text-sm text-muted-foreground mb-6">
            Every idea matters
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idea Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title here" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idea Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter description here" className="min-h-[80px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact and relevance</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter impact here" className="min-h-[80px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pain-point">Pain Point</SelectItem>
                      <SelectItem value="opportunity">Opportunity</SelectItem>
                      <SelectItem value="challenge">Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="process">Process</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="customer">Customer Experience</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Organisation Health">Organisation Health</SelectItem>
                      <SelectItem value="Technology & Systems">Technology & Systems</SelectItem>
                      <SelectItem value="Commercial & Strategy">Commercial & Strategy</SelectItem>
                      <SelectItem value="Process">Process</SelectItem>
                      <SelectItem value="Cost Leadership">Cost Leadership</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inspiration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspiration or Source</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What inspired this idea? (customer feedback, competitor analysis, etc.)" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="similarSolutions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Similar Solutions or Prior Attempts</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Are there any similar solutions already in place? Have we tried addressing this before?" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* File upload area */}
            <div className="mt-4">
              <div
                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-[100px] transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-center mb-1">Choose a file or drag & drop it here.</p>
                    <p className="text-xs text-muted-foreground text-center">JPEG, PNG, PDF, and MP4 formats, up to 10 MB.</p>
                  </>
                )}
              </div>
              <div className="mt-2 text-center">
                <Label htmlFor="file-upload" className="inline-block">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="cursor-pointer" 
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Browse File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.mp4"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Idea</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add default export to support dynamic imports
export default { LogYourIdeaModal };