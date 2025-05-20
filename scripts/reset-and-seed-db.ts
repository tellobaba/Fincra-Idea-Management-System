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
    // Filter out the admin user from regular users
    let regularUsers = users.filter(user => user.id !== adminUser?.id);
    const reviewerUser = users.find(user => user.role === 'reviewer') || adminUser;
    const implementerUser = users.find(user => user.role === 'implementer') || adminUser;
    
    // List of departments
    const departments = ['Tech & Systems', 'Finance', 'Operations', 'Product', 'Marketing', 'Sales', 'Organisation Health', 'Commercial & Strategy'];
    
    // Statuses with weighted distribution
    const statuses = [
      'submitted', 'submitted', 'submitted', // More submissions in submitted state
      'in-review', 'in-review', // Some in review
      'merged', // Fewer in merged
      'parked', // Fewer in parked
      'implemented', 'implemented' // Some implemented
    ];
    
    // Tags for each category
    const painPointTags = [
      ['API', 'Performance', 'Customer Experience'],
      ['Compliance', 'Efficiency', 'Documentation'],
      ['Reconciliation', 'Cross-Border', 'Operational Efficiency'],
      ['Security', 'Risk', 'Fraud'],
      ['Onboarding', 'User Experience', 'Process'],
      ['Reporting', 'Analytics', 'Visibility']
    ];
    
    const ideaTags = [
      ['AI', 'Fraud Prevention', 'Security'],
      ['Merchant Services', 'Settlement', 'Value Proposition'],
      ['Blockchain', 'Cross-Border', 'Innovation'],
      ['Mobile', 'Customer Experience', 'Engagement'],
      ['Data Analytics', 'Business Intelligence', 'Insights'],
      ['Integration', 'API', 'Partner Ecosystem']
    ];
    
    const challengeTags = [
      ['Emerging Markets', 'Payment Processing', 'Reliability'],
      ['Compliance', 'Security', 'Enterprise'],
      ['Multi-Currency', 'Account Management', 'UX'],
      ['Scalability', 'Growth', 'Infrastructure'],
      ['Competition', 'Market Share', 'Differentiation'],
      ['Customer Acquisition', 'Retention', 'Loyalty']
    ];
    
    // Sample data arrays
    const painPointsData = [
      {
        title: 'Slow API Response Times',
        description: 'Our payment processing API has been experiencing significant delays during peak hours, affecting customer experience and increasing transaction abandonment rates.',
      },
      {
        title: 'Compliance Documentation Overhead',
        description: 'The current process for regulatory compliance documentation is manual and time-consuming, requiring staff to spend excessive hours on paperwork rather than value-added tasks.',
      },
      {
        title: 'Reconciliation Errors in Cross-Border Transactions',
        description: 'Our reconciliation process for cross-border payments frequently results in discrepancies that require manual intervention, delaying settlement and increasing operational costs.',
      },
      {
        title: 'High Rate of False Positive Fraud Alerts',
        description: 'Our current fraud detection system generates too many false positive alerts, causing unnecessary transaction declines and negatively impacting legitimate customer experiences.',
      },
      {
        title: 'Lengthy Merchant Onboarding Process',
        description: 'New merchants face a complicated and time-consuming onboarding process that takes an average of 15 days to complete, causing potential customers to seek alternative payment processors.',
      },
      {
        title: 'Limited Real-time Transaction Reporting',
        description: 'Our merchant dashboard lacks real-time transaction reporting capabilities, leading to delays in merchants accessing critical business information and making timely decisions.',
      },
      {
        title: 'Inconsistent Settlement Notifications',
        description: 'Merchants are not consistently notified when funds are settled in their accounts, leading to confusion and increased support tickets regarding payment status.',
      },
      {
        title: 'Manual Chargeback Processing',
        description: 'Our current chargeback handling process is entirely manual, consuming significant operational resources and delaying resolution times for merchants.',
      }
    ];
    
    const ideasData = [
      {
        title: 'AI-Powered Fraud Detection System',
        description: 'Implement a machine learning algorithm that can detect unusual transaction patterns in real-time and flag potential fraud before completion, reducing chargebacks and improving security.',
      },
      {
        title: 'Instant Settlement for Trusted Merchants',
        description: 'Create a trusted merchant program that allows instant settlement of funds for qualifying businesses, improving their cash flow and enhancing our value proposition in the market.',
      },
      {
        title: 'Blockchain-Based Cross-Border Payments',
        description: 'Develop a blockchain solution for cross-border payments to reduce transaction costs, increase transparency, and enable near-instant settlement across currencies.',
      },
      {
        title: 'Mobile-First Payment Experience',
        description: 'Redesign our payment flow with a mobile-first approach, optimizing for smaller screens and incorporating biometric authentication to improve conversion rates on mobile devices.',
      },
      {
        title: 'Merchant Analytics Dashboard',
        description: 'Build a comprehensive analytics dashboard for merchants that provides insights into sales trends, customer behavior, and payment patterns to help them optimize their business.',
      },
      {
        title: 'API Marketplace for Payment Integrations',
        description: 'Create an API marketplace where developers can discover, test, and integrate with our payment services using pre-built components and detailed documentation.',
      },
      {
        title: 'Dynamic Currency Conversion',
        description: 'Implement dynamic currency conversion at checkout to allow international customers to pay in their local currency while merchants receive funds in their preferred currency.',
      },
      {
        title: 'Subscription Management Platform',
        description: 'Develop a robust subscription management system that handles recurring billing, plan changes, prorated charges, and provides detailed subscription analytics for merchants.',
      }
    ];
    
    const challengesData = [
      {
        title: 'Reducing Payment Failures in Emerging Markets',
        description: 'Design a solution to address the high rate of payment failures in emerging markets due to infrastructural limitations, regulatory complexities, and varied banking systems.',
      },
      {
        title: 'Achieving PCI-DSS Level 1 Compliance',
        description: 'Implement the necessary security measures and process changes to attain PCI-DSS Level 1 compliance, enabling us to process larger transaction volumes and partner with enterprise clients.',
      },
      {
        title: 'Streamlining Multi-Currency Account Management',
        description: 'Develop a unified interface and backend system for managing multiple currency accounts to simplify international business operations for our clients.',
      },
      {
        title: 'Scaling Infrastructure for 10x Growth',
        description: 'Prepare our payment processing infrastructure to handle a tenfold increase in transaction volume over the next 18 months without compromising performance or reliability.',
      },
      {
        title: 'Competing with New Fintech Entrants',
        description: 'Develop strategies to maintain and grow market share in the face of increasing competition from well-funded fintech startups offering innovative payment solutions.',
      },
      {
        title: 'Increasing Customer Lifetime Value',
        description: 'Design and implement initiatives to increase the average customer lifetime value by improving retention, encouraging upsells, and increasing product adoption.',
      },
      {
        title: 'Expanding to New Geographic Markets',
        description: 'Identify and overcome regulatory, cultural, and operational barriers to expand our payment processing services into three new geographic markets in the next fiscal year.',
      },
      {
        title: 'Building a Unified Omnichannel Experience',
        description: 'Create a seamless payment experience that works consistently across online, in-store, mobile, and emerging channels while providing unified reporting and reconciliation.',
      }
    ];
    
    console.log(`Admin User ID: ${adminUser?.id}, Regular Users: ${regularUsers.length}, Reviewer: ${reviewerUser?.id}, Implementer: ${implementerUser?.id}`);
    
    // Make sure everyone has at least one submission of each type
    const createdIdeas = [];
    
    // Function to create a random submission for a user
    async function createSubmissionForUser(user, category, dataArray, tagArray) {
      // Pick a random item from the data array
      const dataIndex = Math.floor(Math.random() * dataArray.length);
      const itemData = dataArray[dataIndex];
      
      // Pick random tags
      const tagsIndex = Math.floor(Math.random() * tagArray.length);
      const tags = tagArray[tagsIndex];
      
      // Pick a random department if the user doesn't have one
      const department = user.department || departments[Math.floor(Math.random() * departments.length)];
      
      // Pick a random status
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Determine if it should have financial impact
      const hasFinancialImpact = Math.random() > 0.7;
      const costSaved = hasFinancialImpact && status === 'implemented' ? Math.floor(Math.random() * 500000) : null;
      const revenueGenerated = hasFinancialImpact && status === 'implemented' ? Math.floor(Math.random() * 3000000) : null;
      
      // Determine priority
      const priorities = ['high', 'medium', 'low'];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      // Determine if it should be assigned
      const shouldBeAssigned = status === 'in-review' || status === 'implemented';
      const assignedToId = shouldBeAssigned ? 
        (status === 'in-review' ? reviewerUser?.id : implementerUser?.id) : null;
      
      const submission = {
        title: itemData.title,
        description: itemData.description,
        category,
        tags,
        submittedById: user.id,
        department,
        status,
        costSaved,
        revenueGenerated,
        priority,
        assignedToId
      };
      
      const createdIdea = await storage.createIdea(submission as any);
      createdIdeas.push(createdIdea);
      console.log(`Created ${category}: ${itemData.title} with ID ${createdIdea.id} from user ${user.id}`);
      return createdIdea;
    }
    
    // Create submissions for each user with a better balance
    for (const user of regularUsers) {
      // Create at least one of each category for each user
      await createSubmissionForUser(user, 'pain-point', painPointsData, painPointTags);
      await createSubmissionForUser(user, 'opportunity', ideasData, ideaTags);
      await createSubmissionForUser(user, 'challenge', challengesData, challengeTags);
      
      // Add additional random submissions weighted to create a better mix 
      // in the recent activity section (more opportunities and pain-points)
      const additionalSubmissions = 1 + Math.floor(Math.random() * 3); // 1-3 more submissions
      for (let i = 0; i < additionalSubmissions; i++) {
        // Weighted distribution: 30% pain-points, 50% opportunities, 20% challenges
        const rand = Math.random();
        if (rand < 0.3) {
          await createSubmissionForUser(user, 'pain-point', painPointsData, painPointTags);
        } else if (rand < 0.8) {
          await createSubmissionForUser(user, 'opportunity', ideasData, ideaTags);
        } else {
          await createSubmissionForUser(user, 'challenge', challengesData, challengeTags);
        }
      }
    }
    
    // Create a few very recent submissions to ensure they appear in top activity
    const recentSubmissions = [
      { category: 'pain-point', data: painPointsData, tags: painPointTags },
      { category: 'opportunity', data: ideasData, tags: ideaTags },
      { category: 'challenge', data: challengesData, tags: challengeTags },
      { category: 'pain-point', data: painPointsData, tags: painPointTags },
      { category: 'opportunity', data: ideasData, tags: ideaTags }
    ];
    
    // Get 3 random users for recent submissions
    const recentUsers = [...regularUsers].sort(() => 0.5 - Math.random()).slice(0, 3);
    for (let i = 0; i < Math.min(recentSubmissions.length, recentUsers.length * 2); i++) {
      const user = recentUsers[i % recentUsers.length];
      const submission = recentSubmissions[i];
      await createSubmissionForUser(user, submission.category, submission.data, submission.tags);
    }
    
    // Add some comments to ideas
    const commentTexts = [
      'This is a critical issue that we need to address immediately. I suggest we form a task force to investigate the root causes.',
      'Great idea! We should consider how this integrates with our existing security infrastructure.',
      'Implementation complete. We achieved this ahead of schedule and it\'s already yielding results with our enterprise clients.',
      'I\'ve experienced this issue firsthand. It\'s definitely impacting our team\'s productivity.',
      'Have we considered the regulatory implications of this approach?',
      'The ROI potential here is significant. We should prioritize this initiative.',
      'Can we get more data on how widespread this issue is before proceeding?',
      'This aligns perfectly with our strategic objectives for next quarter.',
      'We might need to consult with the legal team before implementing this solution.',
      'I\'ve seen a similar approach work well at other companies in our industry.'  
    ];
    
    // Add 1-3 comments to about 50% of ideas
    for (let i = 0; i < createdIdeas.length; i++) {
      if (Math.random() > 0.5) { // 50% chance of getting comments
        const numComments = 1 + Math.floor(Math.random() * 3); // 1-3 comments
        for (let j = 0; j < numComments; j++) {
          // Pick a random commenter (not the submitter)
          let commenterId;
          do {
            const commenterIndex = Math.floor(Math.random() * (users.length));
            commenterId = users[commenterIndex]?.id;
          } while (commenterId === createdIdeas[i].submittedById);
          
          if (commenterId) {
            const commentIndex = Math.floor(Math.random() * commentTexts.length);
            const comment = {
              ideaId: createdIdeas[i].id,
              userId: commenterId,
              content: commentTexts[commentIndex],
            };
            
            const createdComment = await storage.createComment(comment as any);
            console.log(`Added comment to idea ${comment.ideaId} by user ${comment.userId}`);
            
            // Create notification for comment
            await storage.createNotification({
              userId: createdIdeas[i].submittedById,
              title: `New comment on your submission`,
              message: `A user commented on your ${createdIdeas[i].category === 'pain-point' ? 'Pain Point' : createdIdeas[i].category === 'challenge' ? 'Challenge' : 'Idea'} "${createdIdeas[i].title}"`,
              type: 'comment',
              relatedItemId: createdIdeas[i].id,
              relatedItemType: 'idea',
              actorId: commenterId
            });
          }
        }
      }
    }
    
    // Function to distribute votes among ideas ensuring each user votes on multiple ideas
    async function distributeVotes() {
      // Every user should vote on several submissions (but not their own)
      for (const user of users) {
        // Vote on 20-50% of ideas that are not their own
        const ideasToVoteOn = createdIdeas.filter(idea => idea.submittedById !== user.id);
        const numVotes = Math.floor(ideasToVoteOn.length * (0.2 + Math.random() * 0.3)); // 20-50% of eligible ideas
        
        // Shuffle the ideas to get random ones to vote on
        const shuffledIdeas = [...ideasToVoteOn].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(numVotes, shuffledIdeas.length); i++) {
          const ideaId = shuffledIdeas[i].id;
          await storage.voteIdea(ideaId, user.id);
          console.log(`Added vote to idea ${ideaId} from user ${user.id}`);
          
          // Create notification for vote if it's not from admin
          if (user.id !== adminUser?.id) {
            await storage.createNotification({
              userId: shuffledIdeas[i].submittedById,
              title: `New vote on your submission`,
              message: `A user voted on your ${shuffledIdeas[i].category === 'pain-point' ? 'Pain Point' : shuffledIdeas[i].category === 'challenge' ? 'Challenge' : 'Idea'} "${shuffledIdeas[i].title}"`,
              type: 'vote',
              relatedItemId: shuffledIdeas[i].id,
              relatedItemType: 'idea',
              actorId: user.id
            });
          }
        }
      }
    }
    
    await distributeVotes();
    
    // Function to distribute follows
    async function distributeFollows() {
      // Every user should follow several submissions (including their own sometimes)
      for (const user of users) {
        // Follow 15-30% of all ideas
        const numFollows = Math.floor(createdIdeas.length * (0.15 + Math.random() * 0.15)); // 15-30% of all ideas
        
        // Shuffle the ideas to get random ones to follow
        const shuffledIdeas = [...createdIdeas].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(numFollows, shuffledIdeas.length); i++) {
          const ideaId = shuffledIdeas[i].id;
          await storage.followItem(user.id, ideaId, 'idea');
          console.log(`User ${user.id} now follows idea ${ideaId}`);
        }
      }
    }
    
    await distributeFollows();
    
    // Function to add participants to challenge ideas
    async function addChallengeParticipants() {
      // Get all challenge-type ideas
      const challengeIdeas = createdIdeas.filter(idea => idea.category === 'challenge');
      console.log(`Found ${challengeIdeas.length} challenges to add participants to`);
      
      for (const challenge of challengeIdeas) {
        // For each challenge, add 3-7 random participants (excluding the submitter)
        const eligibleUsers = users.filter(user => user.id !== challenge.submittedById);
        const participantCount = 3 + Math.floor(Math.random() * 5); // 3-7 participants
        
        // Shuffle and select random users
        const shuffledUsers = [...eligibleUsers].sort(() => 0.5 - Math.random());
        const selectedUsers = shuffledUsers.slice(0, Math.min(participantCount, shuffledUsers.length));
        
        for (const user of selectedUsers) {
          await storage.addChallengeParticipant(user.id, challenge.id);
          console.log(`Added user ${user.id} as participant to challenge ${challenge.id}`);
          
          // Create notification for the challenge creator
          if (challenge.submittedById !== user.id) {
            await storage.createNotification({
              userId: challenge.submittedById,
              title: "New Challenge Participant",
              message: `${user.displayName} has joined your challenge: ${challenge.title}`,
              type: "follow", // Using follow type since there's no specific participant type
              relatedItemId: challenge.id,
              relatedItemType: "challenge",
              actorId: user.id
            });
          }
        }
      }
    }
    
    await addChallengeParticipants();
    
    // Add status change notifications for all non-submitted ideas
    for (const idea of createdIdeas) {
      if (idea.status !== 'submitted') {
        await storage.createNotification({
          userId: idea.submittedById,
          title: `Status updated on your submission`,
          message: `Your ${idea.category === 'pain-point' ? 'Pain Point' : idea.category === 'challenge' ? 'Challenge' : 'Idea'} "${idea.title}" has been updated to ${idea.status}`,
          type: 'status_change',
          relatedItemId: idea.id,
          relatedItemType: 'idea',
          actorId: adminUser?.id
        });
        console.log(`Created status change notification for user ${idea.submittedById} about idea ${idea.id}`);
      }
    }
    
    // Add assignment notifications for all assigned ideas
    for (const idea of createdIdeas) {
      if (idea.assignedToId) {
        // Notify the idea owner
        await storage.createNotification({
          userId: idea.submittedById,
          title: `Your submission has been assigned`,
          message: `Your ${idea.category === 'pain-point' ? 'Pain Point' : idea.category === 'challenge' ? 'Challenge' : 'Idea'} "${idea.title}" has been assigned to a team member`,
          type: 'assignment',
          relatedItemId: idea.id,
          relatedItemType: 'idea',
          actorId: adminUser?.id
        });
        console.log(`Created assignment notification for owner ${idea.submittedById} about idea ${idea.id}`);
        
        // If assigned to someone other than the owner, notify them too
        if (idea.assignedToId !== idea.submittedById) {
          await storage.createNotification({
            userId: idea.assignedToId,
            title: `New submission assigned to you`,
            message: `A ${idea.category === 'pain-point' ? 'Pain Point' : idea.category === 'challenge' ? 'Challenge' : 'Idea'} "${idea.title}" has been assigned to you`,
            type: 'assignment',
            relatedItemId: idea.id,
            relatedItemType: 'idea',
            actorId: adminUser?.id
          });
          console.log(`Created assignment notification for assignee ${idea.assignedToId} about idea ${idea.id}`);
        }
      }
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database reset and seeding:', error);
  }
}

main().catch(console.error);
