import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, AlertOctagon, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export function NewUserView() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  const handleSubmitIdea = () => {
    setLocation("/submit");
  };

  const handlePostChallenge = () => {
    setLocation("/challenges/new");
  };

  const handleRecordPainPoint = () => {
    setLocation("/pain-points/new");
  };

  return (
    <div className="py-8 px-6">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-2xl font-bold mb-4">
          Welcome back, {user?.displayName.split(' ')[0] || 'User'} ✨
        </h1>
        <p className="text-gray-600">
          Share your pain-points, pitch new ideas, or post a challenge. Let's
          build a better Fincra together!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Ideas Card */}
        <Card className="bg-green-50 border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="mb-4">
              <Lightbulb className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Got Ideas?</h2>
            <p className="text-gray-600 mb-6">
              Got a spark of innovation? Share your ideas to help Fincra move faster and smarter.
            </p>
            <Button 
              onClick={handleSubmitIdea}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit an Idea
            </Button>
          </CardContent>
        </Card>

        {/* Challenge Card */}
        <Card className="bg-blue-50 border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="mb-4">
              <AlertOctagon className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Challenge</h2>
            <p className="text-gray-600 mb-6">
              Have a big question or a tough problem we should solve together?
            </p>
            <Button 
              onClick={handlePostChallenge}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Post a Challenge
            </Button>
          </CardContent>
        </Card>

        {/* Pain Points Card */}
        <Card className="bg-rose-50 border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="mb-4">
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pain points?</h2>
            <p className="text-gray-600 mb-6">
              Spot something that's slowing us down? Share what's blocking progress.
            </p>
            <Button 
              onClick={handleRecordPainPoint}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Record Pain point
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}