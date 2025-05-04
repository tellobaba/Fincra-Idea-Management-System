import { Status } from "@shared/schema";
import { 
  CheckIcon, 
  ArrowUpDown, 
  Drill, 
  Code, 
  FlagIcon, 
  FileCheck, 
  Search, 
  Wrench, 
  Check, 
  Ban
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusStep {
  status: Status;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface IdeaStatusTrackerProps {
  currentStatus: Status;
}

export function IdeaStatusTracker({ currentStatus }: IdeaStatusTrackerProps) {
  const statuses: StatusStep[] = [
    { 
      status: "submitted", 
      label: "Submitted", 
      icon: <FileCheck className="h-4 w-4" />,
      color: "bg-blue-500",
      description: "Idea has been submitted and is awaiting review"
    },
    { 
      status: "in-review", 
      label: "In Review", 
      icon: <Search className="h-4 w-4" />,
      color: "bg-amber-500",
      description: "Idea is currently being evaluated by the review team"
    },
    { 
      status: "merged", 
      label: "Merged", 
      icon: <Wrench className="h-4 w-4" />,
      color: "bg-orange-500",
      description: "Idea has been merged into the implementation pipeline"
    },
    { 
      status: "implemented", 
      label: "Implemented", 
      icon: <Check className="h-4 w-4" />,
      color: "bg-green-500",
      description: "Idea has been successfully implemented"
    },
    { 
      status: "parked", 
      label: "Parked", 
      icon: <Ban className="h-4 w-4" />,
      color: "bg-gray-500",
      description: "Idea has been parked for future consideration"
    },
  ];

  // Finding the index of the current status
  const currentStatusIndex = statuses.findIndex((s) => s.status === currentStatus);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center mb-2">
        <h3 className="text-lg font-medium">Status Tracker</h3>
      </div>
      
      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="h-0.5 w-full bg-gray-200"></div>
        </div>
        
        {/* Status steps */}
        <TooltipProvider>
          <ul className="relative flex justify-between">
            {statuses.map((step, index) => {
              // Status circle color based on current status
              const isActive = index <= currentStatusIndex;
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              let finalColor = "bg-gray-200 text-gray-500";
              
              if (isCompleted) {
                finalColor = "bg-green-500 text-white";
              } else if (isCurrent) {
                finalColor = `${step.color} text-white`;
              }
              
              // Add animation class if this is the current status
              const animationClass = isCurrent ? "animate-pulse" : "";
              
              return (
                <li key={step.status} className="flex flex-col items-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <div 
                        className={`rounded-full h-10 w-10 flex items-center justify-center ${finalColor} ${animationClass} border-2 border-white shadow-md transition-all duration-300`}
                      >
                        {step.icon}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{step.description}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className={`text-xs font-medium mt-2 ${isCurrent ? 'font-bold' : ''}`}>{step.label}</span>
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </div>
    </div>
  );
}
