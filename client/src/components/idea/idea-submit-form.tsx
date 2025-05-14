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
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      // Reset audio chunks
      setAudioChunks([]);
      
      // Set up event handlers
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data]);
        }
      };
      
      // Start recording with timeslice to get data in smaller chunks
      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      setMediaRecorder(recorder);
      
      console.log("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (!mediaRecorder) return;
    
    console.log("Stopping recording...");
    
    // First stop the media tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    // Stop recording
    mediaRecorder.onstop = () => {
      console.log("MediaRecorder stopped, chunks:", audioChunks.length);
      
      // Combine chunks into a single blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("Created audio blob of size:", audioBlob.size);
      
      // Create a File object from the blob
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { 
        type: 'audio/webm',
        lastModified: Date.now() 
      });
      
      // Save the file
      setVoiceNote(audioFile);
      console.log("Voice note created:", audioFile);
    };
    
    // This must be after setting the onstop handler
    try {
      mediaRecorder.stop();
    } catch (e) {
      console.error("Error stopping recorder:", e);
    }
    
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
            <div 
              className={`border-2 border-dashed rounded-md px-6 py-8 flex flex-col items-center transition-all duration-300 
              ${files.length > 0 ? 'border-primary/30 bg-primary/5' : 'border-input bg-background'}`}
            >
              {files.length === 0 ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-primary/70" />
                  </div>
                  <p className="text-center text-muted-foreground text-sm mb-2">
                    Drag and drop files here or click to browse
                  </p>
                  <p className="text-center text-xs text-muted-foreground mb-4">
                    You can attach images, PDFs, Word documents, or audio files
                  </p>
                  
                  {/* File type indicators */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <span className="text-xs mt-1">Docs</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span className="text-xs mt-1">Images</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                        </svg>
                      </div>
                      <span className="text-xs mt-1">Audio</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Attached Files ({files.length})</h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs flex gap-1 hover:text-destructive"
                      onClick={() => setFiles([])}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      </svg>
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                    {files.map((file, index) => {
                      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                      const isImage = file.type.startsWith('image/');
                      const isAudio = file.type.startsWith('audio/');
                      const isPdf = fileExt === 'pdf';
                      const isDoc = ['doc', 'docx'].includes(fileExt);
                      
                      let fileTypeColor = 'bg-gray-100 text-gray-500';
                      let fileTypeIcon = (
                        <div className="text-xs">{fileExt}</div>
                      );
                      
                      if (isImage) {
                        fileTypeColor = 'bg-green-100 text-green-500';
                        fileTypeIcon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        );
                      } else if (isAudio) {
                        fileTypeColor = 'bg-red-100 text-red-500';
                        fileTypeIcon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                          </svg>
                        );
                      } else if (isPdf) {
                        fileTypeColor = 'bg-amber-100 text-amber-600';
                        fileTypeIcon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        );
                      } else if (isDoc) {
                        fileTypeColor = 'bg-blue-100 text-blue-500';
                        fileTypeIcon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        );
                      }
                      
                      return (
                        <div key={index} className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-md ${fileTypeColor} flex items-center justify-center`}>
                              {isImage ? 
                                <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 object-cover rounded-md" /> : 
                                fileTypeIcon
                              }
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate max-w-[180px] md:max-w-[250px]">
                                {file.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(file.size / 1024)} KB
                              </div>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setFiles(files.filter((_, i) => i !== index))}
                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
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
                variant={files.length > 0 ? "outline" : "secondary"}
                className={`${files.length > 0 ? 'mt-4' : 'mt-0'}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {files.length > 0 ? 'Add More Files' : 'Select Files'}
              </Button>
            </div>
          </div>
          
          <div>
            <FormLabel>Voice Note</FormLabel>
            <div className="border-2 border-dashed border-input rounded-md p-6 mt-2 bg-background">
              <div className="flex flex-col items-center">
                {!isRecording && !voiceNote && (
                  <div className="flex flex-col items-center w-full">
                    <Mic className="h-10 w-10 text-primary/70 mb-3" />
                    <p className="text-muted-foreground text-sm mb-4 text-center">Add a voice explanation to provide additional context for your idea</p>
                    <Button 
                      type="button" 
                      variant="default" 
                      onClick={startRecording}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Start Recording
                    </Button>
                  </div>
                )}
                
                {isRecording && (
                  <div className="flex flex-col items-center w-full">
                    <div className="relative flex items-center justify-center w-20 h-20 mb-4">
                      <div className="absolute w-20 h-20 bg-red-100 rounded-full animate-ping opacity-75"></div>
                      <div className="relative w-16 h-16 bg-red-200 rounded-full flex items-center justify-center">
                        <Mic className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                    
                    <div className="w-full max-w-md h-2 bg-red-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-red-500 animate-pulse"></div>
                    </div>
                    
                    <p className="text-sm text-red-600 font-medium mb-4">Recording in progress...</p>
                    
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={stopRecording}
                      className="flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      Stop Recording
                    </Button>
                  </div>
                )}
                
                {voiceNote && !isRecording && (
                  <div className="w-full max-w-md mt-2">
                    <div className="p-4 bg-secondary/40 rounded-lg mb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mic className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Voice Recording</p>
                          <p className="text-xs text-muted-foreground">{(voiceNote.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      
                      <audio controls className="w-full h-10 mb-2">
                        <source src={URL.createObjectURL(voiceNote)} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setVoiceNote(null)}
                        className="flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
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