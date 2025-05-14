import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bold, Italic, List, Link as LinkIcon, Upload, Mic, X } from "lucide-react";

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
    files?: File[]; // Changed from FileList to File[] to match submit-idea-page
    category?: string;
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
  const [files, setFiles] = useState<File[]>([]);
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
        // Add files if available
        files: files.length > 0 ? files : undefined,
        // Add category for idea
        category: 'opportunity'
      };
      
      // Log submission details for debugging
      console.log('Submitting idea with form values:', transformedValues);
      
      // Log file details if present
      if (files.length > 0) {
        console.log(`Submitting ${files.length} file(s):`, 
          files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      }
      
      // Add voice note to files if available
      if (voiceNote) {
        console.log('Adding voice recording to submission:', { 
          name: voiceNote.name, 
          type: voiceNote.type, 
          size: voiceNote.size 
        });
        // Add voice note to the files array
        const filesWithVoice = [...(transformedValues.files || []), voiceNote];
        transformedValues.files = filesWithVoice;
      }
      
      await onSubmit(transformedValues);
    } catch (error) {
      console.error('Error submitting idea:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to existing files
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Reset input value so selecting the same file again triggers the event
      e.target.value = '';
    }
  };
  
  const startRecording = async () => {
    try {
      // Check for microphone support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser doesn't support voice recording");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      // Reset audio chunks
      setAudioChunks([]);
      
      // Set up event handlers
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data]);
        }
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (!mediaRecorder) return;
    
    // Stop recording
    mediaRecorder.onstop = () => {
      // Combine chunks into a single blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Create a File object from the blob
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { 
        type: 'audio/webm',
        lastModified: Date.now() 
      });
      
      // Save the file
      setVoiceNote(audioFile);
      
      // Clean up
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.stop();
    setIsRecording(false);
  };
  
  const handleSaveDraft = () => {
    // This is a placeholder for save as draft functionality
    alert("Save as draft functionality will be implemented soon!");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter a clear, concise title for your idea" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Good titles are brief but descriptive
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="workstream"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workstream*</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workstream" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="customer_success">Customer Success</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Which area of the business does this idea belong to?
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
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide details about your idea. What problem does it solve? How will it work?" 
                  rows={6}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Be specific and include all relevant details
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
              <FormLabel>Impact or Relevance</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="How will this idea impact the organization? What are the benefits?" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6">
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
                    placeholder="Are there any similar solutions or previous attempts to solve this problem?" 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormLabel>Attachments</FormLabel>
            <div className="border-2 border-dashed border-input rounded-md px-6 py-8 flex flex-col items-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-2">Drag files here or click to upload</p>
              <p className="text-xs text-muted-foreground">Supports images, audio, and documents (max 5 files)</p>
              
              {/* Hidden file input */}
              <input 
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
              />
              
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select Files
              </Button>
              
              {/* Display selected files */}
              {files.length > 0 && (
                <div className="w-full mt-4">
                  <p className="text-sm font-medium mb-2">Selected Files ({files.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded flex items-center justify-center">
                            {file.type.startsWith('image/') ? 
                              <img src={URL.createObjectURL(file)} alt="" className="w-8 h-8 object-cover rounded" /> : 
                              <div className="text-xs">{file.name.split('.').pop()}</div>
                            }
                          </div>
                          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
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