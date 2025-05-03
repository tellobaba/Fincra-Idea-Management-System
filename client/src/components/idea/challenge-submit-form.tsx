import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";

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

interface ChallengeSubmitFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    criteria: string;
    timeframe: string;
    reward: string;
    files?: FileList;
  }) => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    criteria?: string;
    timeframe?: string;
    reward?: string;
  };
}

// Form schema for input validation
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  criteria: z.string().min(5, { message: "Criteria must be at least 5 characters" }),
  timeframe: z.string().min(1, { message: "Please specify a timeframe" }),
  reward: z.string().min(1, { message: "Please specify a reward" }),
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

export function ChallengeSubmitForm({ 
  onSubmit, 
  onCancel,
  initialData = {},
}: ChallengeSubmitFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  
  // Use FormValues for the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      criteria: initialData.criteria || "",
      timeframe: initialData.timeframe || "",
      reward: initialData.reward || "",
    },
  });

  const onFormSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Transform values and add files with correct field name 'media'
      const transformedValues = {
        ...values,
        media: files || undefined,
      };
      await onSubmit(transformedValues);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSaveDraft = () => {
    const currentValues = form.getValues();
    localStorage.setItem('challengeDraft', JSON.stringify(currentValues));
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
              <FormLabel>Challenge Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a clear, concise title" {...field} />
              </FormControl>
              <FormDescription>
                Good titles clearly state what the challenge is about
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
              <FormLabel>Challenge Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the challenge in detail..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide comprehensive details about what the challenge entails
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Success Criteria</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What are the criteria for a successful solution? (e.g., 'Must be built using Vibe coding')"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Define clear criteria for evaluating submissions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="timeframe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeframe</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="E.g., '14 days', '2 weeks'" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Specify the duration of the challenge
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="E.g., '$500 and dinner with the CEO'" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  What will participants receive for winning?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <FormLabel>Attachments</FormLabel>
          <div className="border-2 border-dashed border-input rounded-md px-6 py-8 flex flex-col items-center mt-2">
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-2">Drag files here or click to upload</p>
            <p className="text-xs text-muted-foreground">Supports documents, images, or recordings</p>
            <Input 
              type="file" 
              className="hidden" 
              id="file-upload" 
              multiple 
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select Files
              </Button>
            </label>
            {files && files.length > 0 && (
              <div className="mt-4 w-full">
                <p className="text-sm font-medium">Selected files:</p>
                <ul className="text-sm mt-1">
                  {Array.from(files).map((file, index) => (
                    <li key={index} className="text-muted-foreground">{file.name}</li>
                  ))}
                </ul>
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
            {isSaving ? "Submitting..." : "Post Challenge"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
