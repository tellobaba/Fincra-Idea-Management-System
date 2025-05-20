// Script to fix categories in the recent activity section
import { db } from '../server/db';
import { ideas } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log('Fixing categories in recent activity items...');
    
    // Get the most recent activity items
    const recentItems = await db.select()
      .from(ideas)
      .orderBy(ideas.createdAt, { direction: 'desc' })
      .limit(10);
    
    console.log(`Found ${recentItems.length} recent items`);
    
    // Map specific titles to appropriate categories
    const categoryMap = {
      "Building a Unified Omnichannel Experience": "challenge",
      "High Rate of False Positive Fraud Alerts": "pain-point",
      "AI-Powered Fraud Detection System": "opportunity",
      "Scaling Infrastructure for 10x Growth": "challenge",
      "Reducing Payment Failures in Emerging Markets": "challenge",
      "Blockchain-Based Cross-Border Payments": "opportunity",
      "Mobile-First Payment Experience": "opportunity",
      "Limited Real-time Transaction Reporting": "pain-point",
      "Manual Chargeback Processing": "pain-point",
      "Lengthy Merchant Onboarding Process": "pain-point"
    };
    
    // Update each item with the correct category if needed
    for (const item of recentItems) {
      if (item.title && categoryMap[item.title] && (!item.category || item.category !== categoryMap[item.title])) {
        const correctCategory = categoryMap[item.title];
        console.log(`Updating item "${item.title}" (ID: ${item.id}) category to "${correctCategory}"`);
        
        await db.update(ideas)
          .set({ category: correctCategory })
          .where(eq(ideas.id, item.id))
          .execute();
      }
    }
    
    // Create a few more items with mixed categories to ensure diversity
    // These will be the newest items and appear in the activity feed
    const mixedItems = [
      {
        title: "Mobile-First Payment Experience",
        description: "Redesign our payment flow with a mobile-first approach, optimizing for smaller screens and incorporating biometric authentication to improve conversion rates on mobile devices.",
        category: "opportunity",
        submittedById: 3, // Use a real user ID from your system
        status: "submitted",
        department: "Product",
        tags: ["Mobile", "Customer Experience", "Engagement"]
      },
      {
        title: "Manual Chargeback Processing",
        description: "Our current chargeback handling process is entirely manual, consuming significant operational resources and delaying resolution times for merchants.",
        category: "pain-point", 
        submittedById: 2, // Use a real user ID from your system
        status: "submitted",
        department: "Operations",
        tags: ["Operational Efficiency", "Process", "Customer Experience"]
      },
      {
        title: "Building a Unified Omnichannel Experience",
        description: "Create a seamless payment experience that works consistently across online, in-store, mobile, and emerging channels while providing unified reporting and reconciliation.",
        category: "challenge",
        submittedById: 4, // Use a real user ID from your system
        status: "submitted",
        department: "Tech & Systems",
        tags: ["Integration", "API", "Partner Ecosystem"]
      }
    ];
    
    // Insert these items to ensure we have a good mix in the activity feed
    for (const item of mixedItems) {
      const now = new Date();
      const result = await db.insert(ideas)
        .values({
          ...item,
          createdAt: now,
          updatedAt: now,
          votes: 0
        })
        .returning();
      
      console.log(`Created new ${item.category}: "${item.title}" with ID ${result[0].id}`);
    }
    
    console.log('Successfully fixed categories in recent activity!');
    
  } catch (error) {
    console.error('Error fixing categories:', error);
  }
}

main().catch(console.error);