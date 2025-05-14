import { useState, useRef, ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, getCategoryConfig } from "@/types/ideas";
import { Link } from "wouter";
import { Bold, Italic, List, Link as LinkIcon, Upload, X } from "lucide-react";

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
    impact?: string;
    organizationCategory?: string;
    inspiration?: string;
    similarSolutions?: string;
    workstream?: string;
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
    workstream?: string;
    tags?: string[];
  };
}

// Enhanced form schema for input validation with new fields
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  category: z.enum(["pain-point", "opportunity", "challenge"] as const),
  impact: z.string().optional(),
  organizationCategory: z.string().optional(),
  workstream: z.string().optional(),
  inspiration: z.string().optional(),
  similarSolutions: z.string().optional(),
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      workstream: initialData.workstream || "",
      category: initialData.category || initialCategory || "opportunity",
      tags: initialData.tags ? initialData.tags.join(", ") : "",  // this is converted to array by the schema transform
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to selectedFiles
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Reset input value so selecting the same file again triggers the event
      e.target.value = '';
    }
  };

  const handleFileSelect = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSaving(true);
    try {
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      
      // Add all form values to formData
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'tags') {
          // Transform tags string into array before submission
          const tags = value ? value.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
          formData.append(key, JSON.stringify(tags));
        } else {
          formData.append(key, value as string);
        }
      });
      
      // Add files to formData
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Submit the form with formData
      await onSubmit(Object.fromEntries(formData) as any);
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
                    rows={6}
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
        
        <FormField
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
                How will this idea benefit the organization?
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="workstream"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workstream</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workstream" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Payments">Payments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
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
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
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
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
        
        <div>
          <FormLabel>Attachments</FormLabel>
          <div className="border-2 border-dashed border-input rounded-md px-6 py-8 flex flex-col items-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-2">Drag files here or click to upload</p>
            <p className="text-xs text-muted-foreground">Supports images, audio, and documents (max 5 files)</p>
            
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            />
            
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4"
              onClick={handleFileSelect}
            >
              Select Files
            </Button>
            
            {/* Display selected files */}
            {selectedFiles.length > 0 && (
              <div className="w-full mt-4">
                <p className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length})</p>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded flex items-center justify-center">
                          {file.type.startsWith('image/') ? 
                            <img src={URL.createObjectURL(file)} alt="" className="w-8 h-8 object-cover rounded" /> : 
                            <div className="text-xs">{file.name.split('.').pop()}</div>
                          }
                        </div>
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFile(index)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
