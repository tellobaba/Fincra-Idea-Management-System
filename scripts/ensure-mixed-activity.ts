// Script to ensure mixed data in recent activity
import { db } from '../server/db';
import { storage } from '../server/storage';
import { eq } from 'drizzle-orm';
import { ideas } from '@shared/schema';

// Sample data with proper context
const topActivityItems = [
  {
    title: 'AI-Powered Fraud Detection System',
    description: 'Implement a machine learning algorithm that can detect unusual transaction patterns in real-time and flag potential fraud before completion, reducing chargebacks and improving security.',
    category: 'opportunity',
    tags: ['AI', 'Fraud Prevention', 'Security']
  },
  {
    title: 'High Rate of False Positive Fraud Alerts',
    description: 'Our current fraud detection system generates too many false positive alerts, causing unnecessary transaction declines and negatively impacting legitimate customer experiences.',
    category: 'pain-point',
    tags: ['Security', 'Risk', 'Fraud']
  },
  {
    title: 'Building a Unified Omnichannel Experience',
    description: 'Create a seamless payment experience that works consistently across online, in-store, mobile, and emerging channels while providing unified reporting and reconciliation.',
    category: 'challenge',
    tags: ['Integration', 'API', 'Partner Ecosystem']
  },
  {
    title: 'Blockchain-Based Cross-Border Payments',
    description: 'Develop a blockchain solution for cross-border payments to reduce transaction costs, increase transparency, and enable near-instant settlement across currencies.',
    category: 'opportunity',
    tags: ['Blockchain', 'Cross-Border', 'Innovation']
  },
  {
    title: 'Limited Real-time Transaction Reporting',
    description: 'Our merchant dashboard lacks real-time transaction reporting capabilities, leading to delays in merchants accessing critical business information and making timely decisions.',
    category: 'pain-point',
    tags: ['Reporting', 'Analytics', 'Visibility']
  }
];

async function createHighVoteItem(data: any, userId: number) {
  // Create the idea with proper category and high vote count
  const submissionData = {
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags,
    submittedById: userId,
    department: 'Tech & Systems',
    status: 'submitted',
    priority: 'high'
  };
  
  const createdIdea = await storage.createIdea(submissionData);
  console.log(`Created top activity ${data.category}: ${data.title} with ID ${createdIdea.id}`);
  
  // Update timestamp to ensure it appears in recent activity
  const now = new Date();
  await db.update(ideas)
    .set({ 
      createdAt: now,
      updatedAt: now
    })
    .where(eq(ideas.id, createdIdea.id))
    .execute();
  
  // Add votes to make it appear in top activity
  for (let i = 0; i < 10; i++) {
    // Get a random user that's not the submitter
    const voterUsers = await storage.getUsers();
    const eligibleVoters = voterUsers.filter(u => u.id !== userId);
    if (eligibleVoters.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleVoters.length);
      await storage.voteIdea(createdIdea.id, eligibleVoters[randomIndex].id);
      console.log(`Added vote to ${data.category} ${createdIdea.id} from user ${eligibleVoters[randomIndex].id}`);
    }
  }
  
  return createdIdea;
}

async function main() {
  try {
    console.log('Ensuring mixed content in top activity...');
    
    // Get users for reference
    const users = await storage.getUsers();
    if (users.length < 5) {
      console.error('Not enough users to proceed');
      return;
    }
    
    // Create 5 items that will appear in recent activity with different users
    for (let i = 0; i < topActivityItems.length; i++) {
      const userId = users[i + 1].id; // Skip admin user at index 0
      await createHighVoteItem(topActivityItems[i], userId);
    }
    
    console.log('Successfully added mixed content to recent activity!');
    
  } catch (error) {
    console.error('Error ensuring mixed activity:', error);
  }
}

main().catch(console.error);