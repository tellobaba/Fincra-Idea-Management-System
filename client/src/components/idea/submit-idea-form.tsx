import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, getCategoryConfig } from "@/types/ideas";
import { Link } from "wouter";
import { Bold, Italic, List, Link as LinkIcon, Upload } from "lucide-react";

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

interface SubmitIdeaFormProps {
  initialCategory?: Category;
  onSubmit: (data: {
    title: string;
    description: string;
    category: Category;
    tags: string[];
  }) => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    category?: Category;
    tags?: string[];
  };
}

// Simple form schema for input validation
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  category: z.enum(["pain-point", "opportunity", "challenge"] as const),
  tags: z.string(), // Keep as string in the form
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

export function SubmitIdeaForm({ 
  initialCategory, 
  onSubmit, 
  onCancel,
  initialData = {},
}: SubmitIdeaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  // Use FormValues for the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      category: initialData.category || initialCategory || "opportunity",
      tags: initialData.tags ? initialData.tags.join(", ") : "",  // this is converted to array by the schema transform
    },
  });

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
    
    // Show toast or feedback
    alert('Draft saved successfully');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
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
                    rows={6}
                    className="border-0 focus-visible:ring-0 rounded-none"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                Supports Markdown formatting
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
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
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
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
        </div>
        
        <div>
          <FormLabel>Attachments</FormLabel>
          <div className="border-2 border-dashed border-input rounded-md px-6 py-8 flex flex-col items-center">
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
        
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
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
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Submitting..." : "Submit Idea"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
