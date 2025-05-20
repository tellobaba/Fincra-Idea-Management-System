// Script to add a mix of data types (ideas, challenges, pain-points) to the database
import { db } from '../server/db';
import { storage } from '../server/storage';

// Sample data arrays with proper context
const painPointsData = [
  {
    title: 'High Rate of False Positive Fraud Alerts',
    description: 'Our current fraud detection system generates too many false positive alerts, causing unnecessary transaction declines and negatively impacting legitimate customer experiences.',
    tags: ['Security', 'Risk', 'Fraud']
  },
  {
    title: 'Manual Chargeback Processing',
    description: 'Our current chargeback handling process is entirely manual, consuming significant operational resources and delaying resolution times for merchants.',
    tags: ['Operational Efficiency', 'Process', 'Customer Experience']
  },
  {
    title: 'Limited Real-time Transaction Reporting',
    description: 'Our merchant dashboard lacks real-time transaction reporting capabilities, leading to delays in merchants accessing critical business information and making timely decisions.',
    tags: ['Reporting', 'Analytics', 'Visibility']
  },
];

const ideasData = [
  {
    title: 'AI-Powered Fraud Detection System',
    description: 'Implement a machine learning algorithm that can detect unusual transaction patterns in real-time and flag potential fraud before completion, reducing chargebacks and improving security.',
    tags: ['AI', 'Fraud Prevention', 'Security']
  },
  {
    title: 'Mobile-First Payment Experience',
    description: 'Redesign our payment flow with a mobile-first approach, optimizing for smaller screens and incorporating biometric authentication to improve conversion rates on mobile devices.',
    tags: ['Mobile', 'Customer Experience', 'Engagement']
  },
  {
    title: 'Blockchain-Based Cross-Border Payments',
    description: 'Develop a blockchain solution for cross-border payments to reduce transaction costs, increase transparency, and enable near-instant settlement across currencies.',
    tags: ['Blockchain', 'Cross-Border', 'Innovation']
  },
];

const challengesData = [
  {
    title: 'Reducing Payment Failures in Emerging Markets',
    description: 'Design a solution to address the high rate of payment failures in emerging markets due to infrastructural limitations, regulatory complexities, and varied banking systems.',
    tags: ['Emerging Markets', 'Payment Processing', 'Reliability']
  },
  {
    title: 'Scaling Infrastructure for 10x Growth',
    description: 'Prepare our payment processing infrastructure to handle a tenfold increase in transaction volume over the next 18 months without compromising performance or reliability.',
    tags: ['Scalability', 'Growth', 'Infrastructure']
  },
  {
    title: 'Building a Unified Omnichannel Experience',
    description: 'Create a seamless payment experience that works consistently across online, in-store, mobile, and emerging channels while providing unified reporting and reconciliation.',
    tags: ['Integration', 'API', 'Partner Ecosystem']
  },
];

// Function to create submissions with proper status distribution
async function createSubmissionWithProperStatus(submittedById: number, data: any, category: string) {
  // Statuses with weighted distribution
  const statuses = [
    'submitted', 'submitted', // More submissions in submitted state
    'in-review',  // Some in review
    'merged', // Fewer in merged
    'implemented', // Some implemented
  ];
  
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  // Random priority
  const priorities = ['high', 'medium', 'low'];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  
  // Random department
  const departments = ['Tech & Systems', 'Finance', 'Operations', 'Product', 'Marketing', 'Sales'];
  const department = departments[Math.floor(Math.random() * departments.length)];
  
  // Create the idea
  const submissionData = {
    title: data.title,
    description: data.description,
    category,
    tags: data.tags,
    submittedById,
    department,
    status,
    priority
  };
  
  const createdIdea = await storage.createIdea(submissionData);
  console.log(`Created ${category}: ${data.title} with ID ${createdIdea.id} from user ${submittedById}`);
  
  return createdIdea;
}

// Add participants to a challenge
async function addParticipantsToChallenge(challengeId: number, participantIds: number[]) {
  for (const userId of participantIds) {
    await storage.addChallengeParticipant(userId, challengeId);
    console.log(`Added user ${userId} as participant to challenge ${challengeId}`);
  }
}

async function main() {
  try {
    console.log('Starting to add mixed data to the database...');
    
    // Get all users for reference
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users in the system`);
    
    if (users.length === 0) {
      console.error('No users found. Cannot add data without users.');
      return;
    }
    
    // Create a mix of submissions to show in the activity feed
    const createdItems = [];
    let currentUserIndex = 1;
    
    // Create 5 pain points from different users
    for (let i = 0; i < 5; i++) {
      const userId = users[currentUserIndex % users.length].id;
      currentUserIndex++;
      
      const item = painPointsData[i % painPointsData.length];
      const createdItem = await createSubmissionWithProperStatus(userId, item, 'pain-point');
      createdItems.push(createdItem);
    }
    
    // Create 5 ideas from different users
    for (let i = 0; i < 5; i++) {
      const userId = users[currentUserIndex % users.length].id;
      currentUserIndex++;
      
      const item = ideasData[i % ideasData.length];
      const createdItem = await createSubmissionWithProperStatus(userId, item, 'opportunity');
      createdItems.push(createdItem);
    }
    
    // Create 5 challenges from different users and add participants
    for (let i = 0; i < 5; i++) {
      const userId = users[currentUserIndex % users.length].id;
      currentUserIndex++;
      
      const item = challengesData[i % challengesData.length];
      const createdChallenge = await createSubmissionWithProperStatus(userId, item, 'challenge');
      createdItems.push(createdChallenge);
      
      // Select 3-5 random participants for each challenge
      const participantCount = 3 + Math.floor(Math.random() * 3);
      const eligibleUsers = users.filter(u => u.id !== userId);
      const shuffledUsers = [...eligibleUsers].sort(() => 0.5 - Math.random());
      const participants = shuffledUsers.slice(0, participantCount).map(u => u.id);
      
      await addParticipantsToChallenge(createdChallenge.id, participants);
    }
    
    // Add some votes to make items appear in top activity
    for (const item of createdItems) {
      // Each item gets 1-5 random votes
      const voteCount = 1 + Math.floor(Math.random() * 5);
      const eligibleVoters = users.filter(u => u.id !== item.submittedById);
      const shuffledVoters = [...eligibleVoters].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(voteCount, shuffledVoters.length); i++) {
        const voterId = shuffledVoters[i].id;
        await storage.voteIdea(item.id, voterId);
        console.log(`User ${voterId} voted for item ${item.id}`);
      }
    }
    
    // Add a few comments to items
    const commentTexts = [
      'This is a critical issue that we need to address immediately.',
      'Great idea! I fully support this initiative.',
      'Implementation should be our top priority this quarter.',
      'I\'ve experienced this issue firsthand. It\'s definitely impacting our team\'s productivity.',
      'The ROI potential here is significant. We should prioritize this initiative.',
      'This aligns perfectly with our strategic objectives for next quarter.'
    ];
    
    for (const item of createdItems) {
      // Each item gets 0-3 random comments
      const commentCount = Math.floor(Math.random() * 4);
      const eligibleCommenters = users.filter(u => u.id !== item.submittedById);
      const shuffledCommenters = [...eligibleCommenters].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(commentCount, shuffledCommenters.length); i++) {
        const commenterId = shuffledCommenters[i].id;
        const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        
        await storage.createComment({
          ideaId: item.id,
          userId: commenterId,
          content: commentText
        });
        console.log(`User ${commenterId} commented on item ${item.id}`);
      }
    }
    
    console.log('Successfully added mixed data to the database!');
    
  } catch (error) {
    console.error('Error adding mixed data:', error);
  }
}

main().catch(console.error);