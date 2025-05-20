// Script to clean the database without seeding
import { db } from '../server/db';
import { ideas, comments, userVotes, follows, notifications, challengeParticipants } from '@shared/schema';

async function main() {
  try {
    console.log('Starting database cleaning process...');
    
    // Clear all existing data (in proper order to respect foreign keys)
    console.log('Deleting all notifications...');
    await db.delete(notifications).execute();
    
    console.log('Deleting all follows...');
    await db.delete(follows).execute();
    
    console.log('Deleting all votes...');
    await db.delete(userVotes).execute();
    
    console.log('Deleting all challenge participants...');
    await db.delete(challengeParticipants).execute();
    
    console.log('Deleting all comments...');
    await db.delete(comments).execute();
    
    console.log('Deleting all ideas...');
    await db.delete(ideas).execute();
    
    console.log('All existing data has been cleared successfully.');
    
  } catch (error) {
    console.error('Error during database cleaning:', error);
  }
}

main().catch(console.error);