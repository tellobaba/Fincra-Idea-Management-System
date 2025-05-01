import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, Sparkles, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Category } from "@shared/schema";

interface AddNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNewModal({ open, onOpenChange }: AddNewModalProps) {
  const [location, navigate] = useLocation();

  const handleSubmitIdea = () => {
    navigate("/submit/opportunity");
    onOpenChange(false);
  };

  const handlePostChallenge = () => {
    navigate("/submit/challenge");
    onOpenChange(false);
  };

  const handleRecordPainPoint = () => {
    navigate("/submit/pain-point");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <img 
              src="/Logomark.png" 
              alt="Fincra Logo" 
              className="h-8 w-8" 
            />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Add new idea, challenge or pain point
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-1">
            Every idea matters, every voice is heard, and innovation never gets lost.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="bg-green-50 border-green-100">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium mb-3">Got Ideas?</h3>
              <CardDescription className="text-sm text-gray-700">
                Got a spark of innovation? Share your ideas to help Fincra move faster and smarter.
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button onClick={handleSubmitIdea} variant="outline" className="bg-white border-green-200 hover:bg-green-100">
                <PlusCircle className="mr-2 h-4 w-4 text-green-600" />
                Submit an Idea
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium mb-3">Challenge</h3>
              <CardDescription className="text-sm text-gray-700">
                Have a big question or a tough problem we should solve together?
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button onClick={handlePostChallenge} variant="outline" className="bg-white border-blue-200 hover:bg-blue-100">
                <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
                Post a Challenge
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-red-50 border-red-100">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium mb-3">Pain points?</h3>
              <CardDescription className="text-sm text-gray-700">
                Spot something that's slowing us down? Share what's blocking progress.
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button onClick={handleRecordPainPoint} variant="outline" className="bg-white border-red-200 hover:bg-red-100">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                Record Pain point
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
