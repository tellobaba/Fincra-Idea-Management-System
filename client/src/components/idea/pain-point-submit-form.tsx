import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Mic } from "lucide-react";

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

interface PainPointSubmitFormProps {
  onSubmit: (data: {
    title: string;
    department: string;
    description: string;
    urgency: string;
    rootCause: string;
    files?: FileList;
    voiceNote?: File;
  }) => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    department?: string;
    description?: string;
    urgency?: string;
    rootCause?: string;
  };
}

// Form schema for input validation
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  department: z.string().min(1, { message: "Please select a department" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  urgency: z.string().min(1, { message: "Please select an urgency level" }),
  rootCause: z.string().min(10, { message: "Root cause analysis must be at least 10 characters" }),
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

export function PainPointSubmitForm({ 
  onSubmit, 
  onCancel,
  initialData = {},
}: PainPointSubmitFormProps) {
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
      department: initialData.department || "",
      description: initialData.description || "",
      urgency: initialData.urgency || "",
      rootCause: initialData.rootCause || "",
    },
  });

  const onFormSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Transform values and add files/voice note
      const transformedValues = {
        ...values,
        files: files || undefined,
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data]);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-note.wav', { type: 'audio/wav' });
        setVoiceNote(audioFile);
        setAudioChunks([]);
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
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
    localStorage.setItem('painPointDraft', JSON.stringify(currentValues));
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
                <Input placeholder="Enter a clear, concise title for the pain point" {...field} />
              </FormControl>
              <FormDescription>
                Briefly describe the issue you're experiencing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Related to Problem</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
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
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the pain point in detail..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide comprehensive details about the issue and its impact
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="rootCause"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Root Cause</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What do you believe is causing this issue?"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your analysis of what's causing the problem
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Upload File</FormLabel>
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
          <FormLabel>Record Voice Note</FormLabel>
          <div className="border rounded-md p-4 mt-2">
            <div className="flex flex-col items-center">
              <Mic className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-2">Record a voice note to explain the pain point</p>
              
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
                    <source src={URL.createObjectURL(voiceNote)} type="audio/wav" />
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
            {isSaving ? "Submitting..." : "Submit Pain Point"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
