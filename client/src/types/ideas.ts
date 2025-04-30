// Import types from shared schema
import { Idea, Comment, User, Category, Status } from "@shared/schema";

// Extended types with additional frontend properties
export interface IdeaWithUser extends Idea {
  submitter: {
    id: number;
    displayName: string;
    department?: string;
    avatarUrl?: string;
  } | null;
  assignedTo?: {
    id: number;
    displayName: string;
    department?: string;
    avatarUrl?: string;
  } | null;
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

export interface IdeaDetailResponse extends IdeaWithUser {
  comments: CommentWithUser[];
}

export interface LeaderboardEntry {
  user: {
    id: number;
    displayName: string;
    department?: string;
    avatarUrl?: string;
  };
  ideasSubmitted: number;
  ideasImplemented: number;
  impactScore: number;
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
  'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  'in-review': { label: 'In Review', color: 'bg-amber-100 text-amber-800' },
  'in-refinement': { label: 'In Refinement', color: 'bg-purple-100 text-purple-800' },
  'implemented': { label: 'Implemented', color: 'bg-green-100 text-green-800' },
  'closed': { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
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
