import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  department: text("department"),
  role: text("role").default("user").notNull(),
  avatarUrl: text("avatar_url"),
});

// Table to track challenge participants
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'pain-point', 'opportunity', 'challenge'
  tags: text("tags").array(),
  department: text("department"), // 'Organisation Health', 'Tech & Systems', 'Commercial & Strategy', etc.
  status: text("status").default("submitted").notNull(), // 'submitted', 'in-review', 'merged', 'parked', 'implemented'
  priority: text("priority"), // 'high', 'medium', 'low'
  votes: integer("votes").default(0).notNull(),
  submittedById: integer("submitted_by_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  
  // New role specific assignments
  reviewerId: integer("reviewer_id"),
  reviewerEmail: text("reviewer_email"),
  transformerId: integer("transformer_id"),
  transformerEmail: text("transformer_email"),
  implementerId: integer("implementer_id"),
  implementerEmail: text("implementer_email"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  impactScore: integer("impact_score"),
  costSaved: integer("cost_saved"),
  revenueGenerated: integer("revenue_generated"),
  attachments: json("attachments").$type<string[]>(),
  mediaUrls: json("media_urls").$type<{type: string, url: string}[]>(), // For images, videos, voice notes
  impact: text("impact"), // Impact description
  adminNotes: text("admin_notes"), // Admin notes
  attachmentUrl: text("attachment_url"), // Single attachment URL for simpler implementation
  organizationCategory: text("organization_category"), // 'Organisation Health', 'Technology & Systems', 'Commercial & Strategy', 'Process', 'Cost Leadership', 'Other'
  inspiration: text("inspiration"), // Inspiration or context behind the submission
  similarSolutions: text("similar_solutions"), // Awareness of similar solutions
  workstream: text("workstream"), // Workstream the idea belongs to
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parentId: integer("parent_id"),
});

// Table to track user votes on ideas
export const userVotes = pgTable("user_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ideaId: integer("idea_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table to track user follows/pins on items
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemId: integer("item_id").notNull(),
  itemType: text("item_type").notNull(), // 'opportunity', 'challenge', 'pain-point'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table for user alerts
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User receiving the notification
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'comment', 'status_change', 'follow', 'vote', 'assignment'
  relatedItemId: integer("related_item_id").notNull(), // ID of the related item (idea, comment, etc.)
  relatedItemType: text("related_item_type").notNull(), // Type of the related item ('opportunity', 'challenge', 'pain-point')
  actorId: integer("actor_id"), // User who triggered the notification (commenter, follower, etc.)
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  department: true,
  role: true,
  avatarUrl: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).pick({
  title: true,
  description: true,
  category: true,
  tags: true,
  department: true,
  priority: true,
  submittedById: true,
  attachments: true,
  mediaUrls: true,
  impact: true,
  organizationCategory: true,
  inspiration: true,
  similarSolutions: true,
  attachmentUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  ideaId: true,
  userId: true,
  content: true,
  parentId: true,
});

export const insertUserVoteSchema = createInsertSchema(userVotes).pick({
  userId: true,
  ideaId: true,
});

export const insertFollowSchema = createInsertSchema(follows).pick({
  userId: true,
  itemId: true,
  itemType: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  relatedItemId: true,
  relatedItemType: true,
  actorId: true,
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).pick({
  userId: true,
  challengeId: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;

export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideas.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertUserVote = z.infer<typeof insertUserVoteSchema>;
export type UserVote = typeof userVotes.$inferSelect;

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Category type
export const categorySchema = z.enum(['pain-point', 'opportunity', 'challenge']);
export type Category = z.infer<typeof categorySchema>;

// Status type
export const statusSchema = z.enum(['submitted', 'in-review', 'merged', 'parked', 'implemented']);
export type Status = z.infer<typeof statusSchema>;

// Priority type
export const prioritySchema = z.enum(['high', 'medium', 'low']);
export type Priority = z.infer<typeof prioritySchema>;

// Notification type
export const notificationTypeSchema = z.enum(['comment', 'status_change', 'follow', 'vote', 'assignment']);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

// Export values for easier usage in frontend
export const categoryValues = categorySchema.options;
export const statusValues = statusSchema.options;
export const priorityValues = prioritySchema.options;
export const notificationTypeValues = notificationTypeSchema.options;

// Department type
export const departmentSchema = z.enum([
  'Organisation Health', 
  'Tech & Systems', 
  'Commercial & Strategy', 
  'Operations',
  'Finance',
  'Marketing',
  'Sales',
  'Product',
  'Other'
]);
export type Department = z.infer<typeof departmentSchema>;

// Organization Category type
export const organizationCategorySchema = z.enum([
  'Organisation Health',
  'Technology & Systems',
  'Commercial & Strategy',
  'Process',
  'Cost Leadership',
  'Other'
]);
export type OrganizationCategory = z.infer<typeof organizationCategorySchema>;
export const organizationCategoryValues = organizationCategorySchema.options;

// Role type
export const roleSchema = z.enum(['user', 'reviewer', 'transformer', 'implementer', 'admin']);
export type Role = z.infer<typeof roleSchema>;
