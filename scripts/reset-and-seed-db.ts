// Script to reset and seed the database with sample data
import { db } from '../server/db';
import { ideas, comments, userVotes, follows, notifications } from '@shared/schema';
import { storage } from '../server/storage';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log('Starting database reset and seeding process...');
    
    // Get all users for reference
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users in the system`);
    
    if (users.length === 0) {
      console.error('No users found. Cannot seed data without users.');
      return;
    }
    
    // Clear all existing data (in proper order to respect foreign keys)
    console.log('Deleting all notifications...');
    await db.delete(notifications).execute();
    
    console.log('Deleting all follows...');
    await db.delete(follows).execute();
    
    console.log('Deleting all votes...');
    await db.delete(userVotes).execute();
    
    console.log('Deleting all comments...');
    await db.delete(comments).execute();
    
    console.log('Deleting all ideas...');
    await db.delete(ideas).execute();
    
    console.log('All existing data has been cleared successfully.');
    
    // Seed new data
    const adminUser = users.find(user => user.role === 'admin');
    const regularUsers = users.filter(user => user.role === 'user' || !user.role);
    const reviewerUser = users.find(user => user.role === 'reviewer') || adminUser;
    const implementerUser = users.find(user => user.role === 'implementer') || adminUser;
    
    console.log(`Admin User ID: ${adminUser?.id}, Regular Users: ${regularUsers.length}, Reviewer: ${reviewerUser?.id}, Implementer: ${implementerUser?.id}`);
    
    // Create sample data arrays to be inserted
    const sampleIdeas = [
      // Pain points (pain-point)
      {
        title: 'Slow API Response Times',
        description: 'Our payment processing API has been experiencing significant delays during peak hours, affecting customer experience and increasing transaction abandonment rates.',
        category: 'pain-point',
        tags: ['API', 'Performance', 'Customer Experience'],
        submittedById: regularUsers[0]?.id,
        department: regularUsers[0]?.department || 'Tech & Systems',
        status: 'submitted',
        costSaved: null,
        revenueGenerated: null,
        priority: 'high'
      },
      {
        title: 'Compliance Documentation Overhead',
        description: 'The current process for regulatory compliance documentation is manual and time-consuming, requiring staff to spend excessive hours on paperwork rather than value-added tasks.',
        category: 'pain-point',
        tags: ['Compliance', 'Efficiency', 'Documentation'],
        submittedById: regularUsers[1]?.id || regularUsers[0]?.id,
        department: regularUsers[1]?.department || 'Finance',
        status: 'in-review',
        costSaved: null,
        revenueGenerated: null,
        priority: 'medium'
      },
      {
        title: 'Reconciliation Errors in Cross-Border Transactions',
        description: 'Our reconciliation process for cross-border payments frequently results in discrepancies that require manual intervention, delaying settlement and increasing operational costs.',
        category: 'pain-point',
        tags: ['Reconciliation', 'Cross-Border', 'Operational Efficiency'],
        submittedById: regularUsers[0]?.id,
        department: 'Operations',
        status: 'implemented',
        costSaved: 250000,
        revenueGenerated: null,
        priority: 'high',
        assignedToId: implementerUser?.id
      },
      
      // Ideas (opportunity)
      {
        title: 'AI-Powered Fraud Detection System',
        description: 'Implement a machine learning algorithm that can detect unusual transaction patterns in real-time and flag potential fraud before completion, reducing chargebacks and improving security.',
        category: 'opportunity',
        tags: ['AI', 'Fraud Prevention', 'Security'],
        submittedById: regularUsers[1]?.id || regularUsers[0]?.id,
        department: 'Tech & Systems',
        status: 'merged',
        costSaved: 150000,
        revenueGenerated: 500000,
        priority: 'high'
      },
      {
        title: 'Instant Settlement for Trusted Merchants',
        description: 'Create a trusted merchant program that allows instant settlement of funds for qualifying businesses, improving their cash flow and enhancing our value proposition in the market.',
        category: 'opportunity',
        tags: ['Merchant Services', 'Settlement', 'Value Proposition'],
        submittedById: regularUsers[2]?.id || regularUsers[0]?.id,
        department: 'Product',
        status: 'in-review',
        costSaved: null,
        revenueGenerated: null,
        priority: 'medium',
        assignedToId: reviewerUser?.id
      },
      {
        title: 'Blockchain-Based Cross-Border Payments',
        description: 'Develop a blockchain solution for cross-border payments to reduce transaction costs, increase transparency, and enable near-instant settlement across currencies.',
        category: 'opportunity',
        tags: ['Blockchain', 'Cross-Border', 'Innovation'],
        submittedById: regularUsers[0]?.id,
        department: 'Tech & Systems',
        status: 'submitted',
        costSaved: null,
        revenueGenerated: null,
        priority: 'medium'
      },
      
      // Challenges (challenge)
      {
        title: 'Reducing Payment Failures in Emerging Markets',
        description: 'Design a solution to address the high rate of payment failures in emerging markets due to infrastructural limitations, regulatory complexities, and varied banking systems.',
        category: 'challenge',
        tags: ['Emerging Markets', 'Payment Processing', 'Reliability'],
        submittedById: regularUsers[1]?.id || regularUsers[0]?.id,
        department: 'Operations',
        status: 'parked',
        costSaved: null,
        revenueGenerated: null,
        priority: 'low'
      },
      {
        title: 'Achieving PCI-DSS Level 1 Compliance',
        description: 'Implement the necessary security measures and process changes to attain PCI-DSS Level 1 compliance, enabling us to process larger transaction volumes and partner with enterprise clients.',
        category: 'challenge',
        tags: ['Compliance', 'Security', 'Enterprise'],
        submittedById: regularUsers[0]?.id,
        department: 'Tech & Systems',
        status: 'implemented',
        costSaved: null,
        revenueGenerated: 3000000,
        priority: 'high',
        assignedToId: implementerUser?.id
      },
      {
        title: 'Streamlining Multi-Currency Account Management',
        description: 'Develop a unified interface and backend system for managing multiple currency accounts to simplify international business operations for our clients.',
        category: 'challenge',
        tags: ['Multi-Currency', 'Account Management', 'UX'],
        submittedById: regularUsers[2]?.id || regularUsers[0]?.id,
        department: 'Product',
        status: 'in-review',
        costSaved: null,
        revenueGenerated: null,
        priority: 'medium',
        assignedToId: reviewerUser?.id
      }
    ];
    
    // Insert ideas and track the created IDs
    const createdIdeas = [];
    for (const idea of sampleIdeas) {
      const createdIdea = await storage.createIdea(idea as any);
      createdIdeas.push(createdIdea);
      console.log(`Created ${idea.category}: ${idea.title} with ID ${createdIdea.id}`);
    }
    
    // Add some comments to ideas
    const sampleComments = [
      {
        ideaId: createdIdeas[0].id,
        userId: adminUser?.id || regularUsers[0]?.id,
        content: 'This is a critical issue that we need to address immediately. I suggest we form a task force to investigate the root causes.',
      },
      {
        ideaId: createdIdeas[3].id,
        userId: reviewerUser?.id || regularUsers[1]?.id,
        content: 'Great idea! We should consider how this integrates with our existing security infrastructure.',
      },
      {
        ideaId: createdIdeas[7].id,
        userId: implementerUser?.id || regularUsers[0]?.id,
        content: 'Implementation complete. We achieved this ahead of schedule and it\'s already yielding results with our enterprise clients.',
      },
    ];
    
    for (const comment of sampleComments) {
      const createdComment = await storage.createComment(comment as any);
      console.log(`Added comment to idea ${comment.ideaId} by user ${comment.userId}`);
    }
    
    // Add some votes to ideas
    for (let i = 0; i < createdIdeas.length; i++) {
      // Distribute votes across ideas
      const ideaId = createdIdeas[i].id;
      
      // Assign different users to vote on different ideas
      const voterIndices = [];
      for (let j = 0; j < Math.min(regularUsers.length, 3); j++) {
        const index = (i + j) % regularUsers.length;
        if (!voterIndices.includes(index)) {
          voterIndices.push(index);
        }
      }
      
      for (const voterIndex of voterIndices) {
        const voterId = regularUsers[voterIndex]?.id;
        if (voterId && createdIdeas[i].submittedById !== voterId) {
          await storage.voteIdea(ideaId, voterId);
          console.log(`Added vote to idea ${ideaId} from user ${voterId}`);
        }
      }
    }
    
    // Add follows for some ideas
    for (let i = 0; i < createdIdeas.length; i += 2) { // Follow every other idea
      const ideaId = createdIdeas[i].id;
      const followerIndex = (i + 1) % regularUsers.length;
      
      if (regularUsers[followerIndex] && createdIdeas[i].submittedById !== regularUsers[followerIndex].id) {
        await storage.followItem(regularUsers[followerIndex].id, ideaId, 'idea');
        console.log(`User ${regularUsers[followerIndex].id} now follows idea ${ideaId}`);
      }
    }
    
    // Create notifications for various activities
    // Sample notifications for idea submissions, status changes, etc.
    const notificationTypes = ['comment', 'status_change', 'vote', 'assignment'];
    
    for (let i = 0; i < createdIdeas.length; i++) {
      const ideaId = createdIdeas[i].id;
      const submitterId = createdIdeas[i].submittedById;
      
      // Only create notifications if there's a valid submitter
      if (submitterId) {
        // Create a status change notification
        if (createdIdeas[i].status !== 'submitted') {
          await storage.createNotification({
            userId: submitterId,
            title: `Status updated on your submission`,
            message: `Your ${createdIdeas[i].category === 'pain-point' ? 'Pain Point' : createdIdeas[i].category === 'challenge' ? 'Challenge' : 'Idea'} "${createdIdeas[i].title}" has been updated to ${createdIdeas[i].status}`,
            type: 'status_change',
            relatedItemId: ideaId,
            relatedItemType: 'idea',
            actorId: adminUser?.id
          });
          console.log(`Created status change notification for user ${submitterId} about idea ${ideaId}`);
        }
        
        // Create a random notification for other types
        if (i % 2 === 0) { // Only create for every other idea
          const randomType = notificationTypes[Math.floor(Math.random() * (notificationTypes.length - 1))];
          await storage.createNotification({
            userId: submitterId,
            title: `New ${randomType} on your submission`,
            message: `There has been a new ${randomType} on your ${createdIdeas[i].category === 'pain-point' ? 'Pain Point' : createdIdeas[i].category === 'challenge' ? 'Challenge' : 'Idea'} "${createdIdeas[i].title}"`,
            type: randomType as any,
            relatedItemId: ideaId,
            relatedItemType: 'idea',
            actorId: randomType === 'comment' ? reviewerUser?.id : adminUser?.id
          });
          console.log(`Created ${randomType} notification for user ${submitterId} about idea ${ideaId}`);
        }
      }
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database reset and seeding:', error);
  }
}

main().catch(console.error);
