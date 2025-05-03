import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, categorySchema } from "@shared/schema";
import { Bold, Italic, List, Link as LinkIcon, Upload, Check, ChevronRight, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EnhancedSubmitFormProps {
  initialCategory?: Category;
  onSubmit: (data: {
    title: string;
    description: string;
    category: Category;
    impact?: string;
    organizationCategory?: string;
    inspiration?: string;
    similarSolutions?: string;
    tags: string[];
  }) => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    category?: Category;
    impact?: string;
    organizationCategory?: string;
    inspiration?: string;
    similarSolutions?: string;
    tags?: string[];
  };
}

// Enhanced form schema for input validation with new fields
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  category: categorySchema,
  impact: z.string().optional(),
  organizationCategory: z.string().optional(),
  inspiration: z.string().optional(),
  similarSolutions: z.string().optional(),
  tags: z.string().optional(), // Keep as string in the form
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

// Define the step titles and descriptions
const steps = [
  {
    title: "Basic Information",
    description: "Provide a title and category for your submission",
    fields: ["title", "category"] as const
  },
  {
    title: "Detailed Description",
    description: "Explain your idea in detail",
    fields: ["description"] as const
  },
  {
    title: "Impact & Context",
    description: "Describe the potential impact and relevance",
    fields: ["impact", "organizationCategory"] as const
  },
  {
    title: "Additional Information",
    description: "Provide background information and context",
    fields: ["inspiration", "similarSolutions", "tags"] as const
  }
];

export function EnhancedSubmitForm({ 
  initialCategory, 
  onSubmit, 
  onCancel,
  initialData = {},
}: EnhancedSubmitFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use FormValues for the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      impact: initialData.impact || "",
      organizationCategory: initialData.organizationCategory || "",
      inspiration: initialData.inspiration || "",
      similarSolutions: initialData.similarSolutions || "",
      category: initialData.category || initialCategory || "opportunity",
      tags: initialData.tags ? initialData.tags.join(", ") : "",
    },
    mode: "onChange"
  });

  // Calculate progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  // Get the current step fields
  const currentStepFields = steps[currentStep].fields;

  // Check if fields in the current step are valid
  const currentStepIsValid = () => {
    const formState = form.getFieldState(currentStepFields[0]);
    return !formState.invalid;
  };

  const goToNextStep = async () => {
    // Validate current step fields
    const isValid = await form.trigger(currentStepFields);
    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // On last step, submit the form
        form.handleSubmit(onFormSubmit)();
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onFormSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSaving(true);
    try {
      // Transform tags string into array before submission
      const transformedValues = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      };
      await onSubmit(transformedValues);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => {
    // This would typically save to local storage or a drafts API
    const currentValues = form.getValues();
    localStorage.setItem('ideaDraft', JSON.stringify(currentValues));
    
    // Show feedback in a more user-friendly way
    // In a real app, you'd likely use a toast instead of alert
    alert('Draft saved successfully');
  };

  // Render field based on field name
  const renderField = (fieldName: (typeof steps)[number]['fields'][number]) => {
    switch (fieldName) {
      case "title":
        return (
          <FormField
            key="title"
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a clear, concise title" {...field} />
                </FormControl>
                <FormDescription>
                  Good titles are specific and descriptive
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "description":
        return (
          <FormField
            key="description"
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Description</FormLabel>
                <div className="border rounded-md focus-within:ring-1 focus-within:ring-ring">
                  <div className="flex border-b">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-auto py-2"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-auto py-2"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-auto py-2"
                      title="List"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-auto py-2"
                      title="Link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your idea in detail..."
                      rows={8}
                      className="border-0 focus-visible:ring-0 rounded-none"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Provide comprehensive details about your idea
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "category":
        return (
          <FormField
            key="category"
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
                  disabled={!!initialCategory}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pain-point">Pain-point</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the most appropriate category for your submission
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "impact":
        return (
          <FormField
            key="impact"
            control={form.control}
            name="impact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact and Relevance</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the potential impact and relevance of your idea..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain how this idea will benefit the organization and its stakeholders
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "organizationCategory":
        return (
          <FormField
            key="organizationCategory"
            control={form.control}
            name="organizationCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Category</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
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
                <FormDescription>
                  Select the organizational area this idea impacts most
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "inspiration":
        return (
          <FormField
            key="inspiration"
            control={form.control}
            name="inspiration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inspiration or Source</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What inspired this idea? (customer feedback, competitor analysis, etc.)" 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Share what inspired this idea or where it originated from
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "similarSolutions":
        return (
          <FormField
            key="similarSolutions"
            control={form.control}
            name="similarSolutions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Similar Solutions or Prior Attempts</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Are there any similar solutions already in place? Have we tried addressing this before?" 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Mention any existing solutions or previous attempts to address this
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "tags":
        return (
          <FormField
            key="tags"
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter tags separated by commas" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  E.g. performance, UX, API, mobile
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress bar and steps */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Step title and description */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
        <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
      </div>
      
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Render fields for current step */}
                {currentStepFields.map(fieldName => renderField(fieldName))}
                
                {/* Upload section only on the last step */}
                {currentStep === steps.length - 1 && (
                  <div>
                    <FormLabel>Attachments</FormLabel>
                    <div className="border-2 border-dashed border-input rounded-md px-6 py-8 flex flex-col items-center mt-2">
                      <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm mb-2">Drag files here or click to upload</p>
                      <p className="text-xs text-muted-foreground">Supports documents, images, or voice recordings</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-4"
                      >
                        Select Files
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
              >
                Save as Draft
              </Button>
              
              <Button 
                type="button"
                onClick={goToNextStep}
                disabled={isSaving}
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    {isSaving ? "Submitting..." : "Submit"}
                    {!isSaving && <Check className="h-4 w-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
