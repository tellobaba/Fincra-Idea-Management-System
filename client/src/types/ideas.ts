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
  'submitted': { label: 'Submitted', color: 'blue' },
  'in-review': { label: 'In Review', color: 'amber' },
  'merged': { label: 'Merged', color: 'purple' },
  'parked': { label: 'Parked', color: 'gray' },
  'implemented': { label: 'Implemented', color: 'green' },
};

// Category labels and colors for UI
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  'pain-point': { 
    label: 'Pain-point', 
    color: 'bg-red-100 text-red-800',
    icon: 'exclamation-circle'
  },
  'opportunity': { 
    label: 'Opportunity', 
    color: 'bg-blue-100 text-blue-800',
    icon: 'lightbulb'
  },
  'challenge': { 
    label: 'Challenge', 
    color: 'bg-amber-100 text-amber-800',
    icon: 'flag'
  },
};

// Helper function to safely access configs with string values
export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category as Category] || {
    label: category,
    color: 'bg-gray-100 text-gray-800',
    icon: 'help-circle'
  };
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as Status] || {
    label: status,
    color: 'gray'
  };
}
