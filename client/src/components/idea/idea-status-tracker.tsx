import { Status } from "@shared/schema";
import { CheckIcon, ArrowUpDown, Drill, Code, FlagIcon } from "lucide-react";

interface StatusStep {
  status: Status;
  label: string;
  icon: React.ReactNode;
}

interface IdeaStatusTrackerProps {
  currentStatus: Status;
}

export function IdeaStatusTracker({ currentStatus }: IdeaStatusTrackerProps) {
  const statuses: StatusStep[] = [
    { 
      status: "submitted", 
      label: "Submitted", 
      icon: <CheckIcon className="text-sm" />,
    },
    { 
      status: "in-review", 
      label: "In Review", 
      icon: <ArrowUpDown className="text-sm" /> 
    },
    { 
      status: "in-refinement", 
      label: "In Refinement", 
      icon: <Drill className="text-sm" /> 
    },
    { 
      status: "implemented", 
      label: "Implemented", 
      icon: <Code className="text-sm" /> 
    },
    { 
      status: "closed", 
      label: "Closed", 
      icon: <FlagIcon className="text-sm" /> 
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
        <ul className="relative flex justify-between">
          {statuses.map((step, index) => {
            // Status circle color based on current status
            const isActive = index <= currentStatusIndex;
            const bgColor = isActive 
              ? index === currentStatusIndex 
                ? "bg-warning text-white" // Current step
                : "bg-success text-white" // Completed step
              : "bg-gray-200 text-muted-foreground"; // Future step
            
            return (
              <li key={step.status} className="flex flex-col items-center">
                <div className={`rounded-full h-8 w-8 flex items-center justify-center ${bgColor} border-2 border-white`}>
                  {step.icon}
                </div>
                <span className="text-xs font-medium mt-2">{step.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
