import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bold, Italic, List, Link as LinkIcon, Upload, Mic } from "lucide-react";

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

interface IdeaSubmitFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    workstream: string;
    impact?: string;
    inspiration?: string;
    similarSolutions?: string;
    tags: string[];
    files?: FileList;
    voiceNote?: File;
  }) => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    workstream?: string;
    impact?: string;
    inspiration?: string;
    similarSolutions?: string;
    tags?: string[];
  };
}

// Form schema for input validation
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  workstream: z.string().min(1, { message: "Please select a workstream" }),
  impact: z.string().optional(),
  inspiration: z.string().optional(),
  similarSolutions: z.string().optional(),
  tags: z.string().optional(), // Keep as string in the form
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

export function IdeaSubmitForm({ 
  onSubmit, 
  onCancel,
  initialData = {},
}: IdeaSubmitFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [voiceNote, setVoiceNote] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Use FormValues for the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      impact: initialData.impact || "",
      workstream: initialData.workstream || "",
      inspiration: initialData.inspiration || "",
      similarSolutions: initialData.similarSolutions || "",
      tags: initialData.tags ? initialData.tags.join(", ") : "",
    },
  });

  const onFormSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Transform tags string into array before submission
      const transformedValues = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        // Use the correct field name 'media' for file uploads
        media: files || undefined,
        // Add voice note to media if available
        voiceNote: voiceNote || undefined,
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

  const startRecording = async () => {
    try {
      // Check for microphone support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use webm for better browser compatibility
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      // Clear any previous chunks
      setAudioChunks([]);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = () => {
        // Create blob from all chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
        setVoiceNote(audioFile);
        // Clear chunks after creating file
        setAudioChunks([]);
      };
      
      // Request data at 1-second intervals
      recorder.start(1000);
      setIsRecording(true);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions and make sure you\'re using a secure connection (HTTPS).');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSaveDraft = () => {
    const currentValues = form.getValues();
    localStorage.setItem('ideaDraft', JSON.stringify(currentValues));
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
            name="workstream"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workstreams</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workstream" />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div>
          <FormLabel>Voice Note</FormLabel>
          <div className="border rounded-md p-4 mt-2">
            <div className="flex flex-col items-center">
              <Mic className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-2">Record a voice note to accompany your idea</p>
              
              {!isRecording && !voiceNote && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={startRecording}
                  className="mt-2"
                >
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <div className="flex flex-col items-center">
                  <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-red-500 animate-pulse"></div>
                  </div>
                  <p className="text-sm text-red-500 mb-2">Recording...</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={stopRecording}
                  >
                    Stop Recording
                  </Button>
                </div>
              )}
              
              {voiceNote && !isRecording && (
                <div className="w-full mt-2">
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(voiceNote)} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="flex justify-center mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setVoiceNote(null)}
                    >
                      Delete & Record Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
