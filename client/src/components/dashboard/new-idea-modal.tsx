import { useState, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

// Lazy load the LogYourIdeaModal to prevent circular dependency
const LogYourIdeaModal = lazy(() => import("./log-idea-modal").then(module => ({ 
  default: module.LogYourIdeaModal 
})));

interface NewIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewIdeaModal({ open, onOpenChange }: NewIdeaModalProps) {
  const [logIdeaOpen, setLogIdeaOpen] = useState(false);

  const handleSubmitIdea = () => {
    onOpenChange(false);
    setLogIdeaOpen(true);
  };

  const handleSubmitChallenge = () => {
    // Handle challenge submission
    onOpenChange(false);
  };

  const handleSubmitPainPoint = () => {
    // Handle pain point submission
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
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
              Add new idea, challenge or pain point
            </DialogTitle>
            <DialogDescription className="text-center mb-6">
              Every idea matters, every voice is heard, and innovation never gets lost.
            </DialogDescription>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ideas Card */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Got Ideas?</h3>
              <p className="text-gray-600 text-sm mb-8">
                Got a spark of innovation? Share your ideas to help Fincra move faster and smarter.
              </p>
              <Button 
                onClick={handleSubmitIdea}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Submit an Idea
              </Button>
            </div>

            {/* Challenge Card */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Challenge</h3>
              <p className="text-gray-600 text-sm mb-8">
                Have a big question or a tough problem we should solve together?
              </p>
              <Button 
                onClick={handleSubmitChallenge}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Post a Challenge
              </Button>
            </div>

            {/* Pain Points Card */}
            <div className="bg-rose-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Pain points?</h3>
              <p className="text-gray-600 text-sm mb-8">
                Spot something that's slowing us down? Share what's blocking progress.
              </p>
              <Button 
                onClick={handleSubmitPainPoint}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              >
                Record Pain point
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<div>Loading...</div>}>
        <LogYourIdeaModal open={logIdeaOpen} onOpenChange={setLogIdeaOpen} />
      </Suspense>
    </>
  );
}