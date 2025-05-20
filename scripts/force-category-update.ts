// Script to directly update categories for specific items in the activity feed
import { db } from '../server/db';
import { ideas } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Map of titles to their correct categories
const titleToCategoryMap = {
  "Building a Unified Omnichannel Experience": "challenge",
  "Manual Chargeback Processing": "pain-point", 
  "Mobile-First Payment Experience": "opportunity",
  "High Rate of False Positive Fraud Alerts": "pain-point",
  "AI-Powered Fraud Detection System": "opportunity",
  "Scaling Infrastructure for 10x Growth": "challenge",
  "Reducing Payment Failures in Emerging Markets": "challenge",
  "Blockchain-Based Cross-Border Payments": "opportunity",
  "Limited Real-time Transaction Reporting": "pain-point",
  "Lengthy Merchant Onboarding Process": "pain-point"
};

async function main() {
  try {
    console.log('Starting direct category update...');
    
    // Get the most recent items first to make sure we update the activity feed items
    const recentItems = await db.select()
      .from(ideas)
      .orderBy(ideas.createdAt, { direction: 'desc' })
      .limit(20);
    
    console.log(`Found ${recentItems.length} recent items to check`);
    
    // Count how many of each category we have
    let opportunityCount = 0;
    let painPointCount = 0;
    let challengeCount = 0;
    
    // Track updates
    const updatedItems = [];
    
    // Loop through and update categories based on titles
    for (const item of recentItems) {
      if (item.title && titleToCategoryMap[item.title]) {
        const correctCategory = titleToCategoryMap[item.title];
        
        console.log(`Updating ${item.id}: ${item.title} to category "${correctCategory}"`);
        
        await db.update(ideas)
          .set({ category: correctCategory })
          .where(eq(ideas.id, item.id))
          .execute();
        
        updatedItems.push({
          id: item.id,
          title: item.title,
          category: correctCategory
        });
        
        if (correctCategory === 'opportunity') opportunityCount++;
        if (correctCategory === 'pain-point') painPointCount++;
        if (correctCategory === 'challenge') challengeCount++;
      }
    }
    
    console.log('Category counts in activity feed:');
    console.log(`Opportunities: ${opportunityCount}`);
    console.log(`Pain Points: ${painPointCount}`);
    console.log(`Challenges: ${challengeCount}`);
    
    // If we don't have at least 1 of each category, create more
    if (opportunityCount < 1 || painPointCount < 1 || challengeCount < 1) {
      console.log('Creating additional items to ensure mix...');
      
      // Add a new opportunity if needed
      if (opportunityCount < 1) {
        const now = new Date();
        const result = await db.insert(ideas)
          .values({
            title: "AI-Powered Fraud Detection System",
            description: "Implement a machine learning algorithm that can detect unusual transaction patterns in real-time and flag potential fraud before completion, reducing chargebacks and improving security.",
            category: "opportunity",
            submittedById: 3,
            status: "submitted",
            department: "Tech & Systems",
            tags: ["AI", "Fraud Prevention", "Security"],
            createdAt: now,
            updatedAt: now,
            votes: 10
          })
          .returning();
        
        console.log(`Created new opportunity with ID ${result[0].id}`);
      }
      
      // Add a new pain-point if needed
      if (painPointCount < 1) {
        const now = new Date();
        const result = await db.insert(ideas)
          .values({
            title: "High Rate of False Positive Fraud Alerts",
            description: "Our current fraud detection system generates too many false positive alerts, causing unnecessary transaction declines and negatively impacting legitimate customer experiences.",
            category: "pain-point",
            submittedById: 2,
            status: "submitted",
            department: "Finance",
            tags: ["Security", "Risk", "Fraud"],
            createdAt: now,
            updatedAt: now,
            votes: 12
          })
          .returning();
        
        console.log(`Created new pain-point with ID ${result[0].id}`);
      }
      
      // Add a new challenge if needed
      if (challengeCount < 1) {
        const now = new Date();
        const result = await db.insert(ideas)
          .values({
            title: "Scaling Infrastructure for 10x Growth",
            description: "Prepare our payment processing infrastructure to handle a tenfold increase in transaction volume over the next 18 months without compromising performance or reliability.",
            category: "challenge",
            submittedById: 4,
            status: "submitted",
            department: "Tech & Systems",
            tags: ["Scalability", "Growth", "Infrastructure"],
            createdAt: now,
            updatedAt: now,
            votes: 8
          })
          .returning();
        
        console.log(`Created new challenge with ID ${result[0].id}`);
      }
    }
    
    console.log('Category updates completed successfully!');
    
  } catch (error) {
    console.error('Error updating categories:', error);
  }
}

main().catch(console.error);