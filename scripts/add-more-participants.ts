// Script to add more participants to existing challenges
import { db } from '../server/db';
import { storage } from '../server/storage';
import { ideas } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Adding more participants to challenges...');
    
    // Get all users for reference
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users in the system`);
    
    if (users.length === 0) {
      console.error('No users found. Cannot add participants without users.');
      return;
    }
    
    // Get all challenges 
    const allChallenges = await db.select()
      .from(ideas)
      .where(eq(ideas.category, 'challenge'));
    
    console.log(`Found ${allChallenges.length} total challenges`);
    
    // Initialize array to track processed challenges
    const challengesProcessed = [];
    
    // Process each challenge
    for (const challenge of allChallenges) {
      // Check if the challenge already has participants
      const participants = await storage.getChallengeParticipants(challenge.id);
      
      // Skip challenges that already have at least 3 participants
      if (participants.length >= 3) {
        console.log(`Challenge ${challenge.id}: "${challenge.title}" already has ${participants.length} participants. Skipping.`);
        continue;
      }
      
      // Add more participants if needed
      const participantsToAdd = 5 - participants.length; // Add up to a total of 5 participants
      
      if (participantsToAdd <= 0) {
        continue;
      }
      
      // Get eligible users (excluding the submitter and existing participants)
      const participantIds = participants.map(p => p.id);
      const eligibleUsers = users.filter(user => 
        user.id !== challenge.submittedById && 
        !participantIds.includes(user.id)
      );
      
      if (eligibleUsers.length === 0) {
        console.log(`No eligible users for challenge ${challenge.id}`);
        continue;
      }
      
      // Shuffle and select random users
      const shuffledUsers = [...eligibleUsers].sort(() => 0.5 - Math.random());
      const selectedParticipants = shuffledUsers.slice(0, Math.min(participantsToAdd, shuffledUsers.length));
      
      console.log(`Adding ${selectedParticipants.length} participants to challenge ${challenge.id}: "${challenge.title}"`);
      
      // Add each participant
      for (const user of selectedParticipants) {
        await storage.addChallengeParticipant(user.id, challenge.id);
        console.log(`Added user ${user.id} (${user.displayName}) as participant to challenge ${challenge.id}`);
      }
      
      // Track the processed challenge
      challengesProcessed.push(challenge.id);
    }
    
    console.log('Successfully added more participants to challenges!');
    
  } catch (error) {
    console.error('Error adding participants:', error);
  }
}

main().catch(console.error);