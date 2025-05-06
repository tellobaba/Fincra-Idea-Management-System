// Import types from shared schema
import { Idea, Comment, User, categoryValues, statusValues } from "@shared/schema";

// Define types for frontend use
export type Category = "pain-point" | "opportunity" | "challenge";
export type Status = "submitted" | "in-review" | "merged" | "parked" | "implemented";

// Extended types with additional frontend properties
export interface IdeaWithUser extends Idea {
  submitter: {
    id: number;
    displayName: string;
    username?: string;
    department?: string;
    avatarUrl?: string;
  } | null;
  
  // Person assigned to the idea
  assignedTo?: {
    id: number;
    displayName: string;
    username?: string;
    department?: string;
    avatarUrl?: string;
  } | null;
  
  // Role-specific assignments
  reviewer?: {
    id: number;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    department?: string;
  } | null;
  
  transformer?: {
    id: number;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    department?: string;
  } | null;
  
  implementer?: {
    id: number;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    department?: string;
  } | null;
  
  // Explicitly define mediaUrls to match schema type
  mediaUrls: Array<{type: string; url: string}> | null;
  // Add vote count field for display
  voteCount?: number;
  // Note: These fields are already in the schema, here for clarity
  // impact: string | null;
  // adminNotes: string | null;
  // attachmentUrl: string | null;
}

export interface CommentWithUser extends Comment {
  user: {
    id: number;
    displayName: string;
    department?: string;
    avatarUrl?: string;
    role: string;
  } | null;
}

export interface IdeaDetailResponse extends Omit<IdeaWithUser, 'mediaUrls'> {
  comments: CommentWithUser[];
  mediaUrls?: Array<{type: string; url: string}> | null;
  isFollowed?: boolean;
}

export interface LeaderboardEntry {
  user: {
    id: number;
    displayName: string;
    department?: string;
    avatarUrl?: string;
    email?: string;
  };
  ideasSubmitted: number;
  ideasImplemented: number;
  impactScore: number;
  votesReceived: number;
  lastSubmissionDate?: string;
  categoryBreakdown: {
    ideas: number; // opportunity
    challenges: number;
    painPoints: number; // pain-point
  };
  status?: 'Top Contributor' | 'Active Contributor' | 'New Contributor';
}

export interface Metrics {
  ideasSubmitted: number;
  inReview: number;
  implemented: number;
  costSaved: number;
  revenueGenerated: number;
}

// Form submission types
export interface SubmitIdeaForm {
  title: string;
  description: string;
  category: Category;
  tags: string[];
  attachments?: string[];
}

export interface SubmitCommentForm {
  content: string;
  parentId?: number;
}

// Status labels and colors for UI
export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  'in-review': { label: 'In Review', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  'merged': { label: 'Merged', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  'parked': { label: 'Parked', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  'implemented': { label: 'Implemented', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
};

// Category labels and colors for UI
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  'pain-point': { 
    label: 'Pain-point', 
    color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    icon: 'exclamation-circle'
  },
  'opportunity': { 
    label: 'Opportunity', 
    color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    icon: 'lightbulb'
  },
  'challenge': { 
    label: 'Challenge', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    icon: 'flag'
  },
};

// Helper function to safely access configs with string values
export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category as Category] || {
    label: category,
    color: 'bg-muted text-muted-foreground',
    icon: 'help-circle'
  };
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as Status] || {
    label: status,
    color: 'bg-muted text-muted-foreground'
  };
}
