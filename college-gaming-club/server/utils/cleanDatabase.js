/**
 * Database Cleanup Script
 * ========================
 * 1. Unsets `stats` field from all User documents
 * 2. Drops all tournament-related data (tournaments, matches, teams, registrations, invitations)
 * 3. Preserves registered user accounts
 *
 * Usage: node utils/cleanDatabase.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gaming_club';

const COLLECTIONS_TO_DROP = [
  'tournaments',
  'matches',
  'teams',
  'registrations',
  'tournamentregistrations',
  'tournamentinvitations',
  'invitations',
  'brackets',
  'formsubmissions',
  'tournamentforms',
  'teammatchresults',
  'pointentries',
  'pointsaudits',
  'lobbies',
  'scoringrules',
  'pollconfigs',
  'pollvotes',
];

async function cleanDatabase() {
  console.log('\n🧹 Database Cleanup Script');
  console.log('='.repeat(50));
  console.log(`📡 Connecting to: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // ── Step 1: Unset stats from all users ──────────────────────────
    console.log('📊 Step 1: Removing stats field from all users...');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`   Found ${userCount} user(s)`);

    const unsetResult = await usersCollection.updateMany(
      {},
      { $unset: { stats: '' } }
    );
    console.log(`   ✅ Modified ${unsetResult.modifiedCount} user document(s) – stats field removed\n`);

    // ── Step 2: Drop tournament-related collections ─────────────────
    console.log('🗑️  Step 2: Dropping tournament-related collections...');
    const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);

    for (const collName of COLLECTIONS_TO_DROP) {
      if (existingCollections.includes(collName)) {
        const count = await db.collection(collName).countDocuments();
        await db.collection(collName).drop();
        console.log(`   ✅ Dropped "${collName}" (${count} documents)`);
      } else {
        console.log(`   ⏭️  Skipping "${collName}" – collection does not exist`);
      }
    }

    // ── Step 3: Clear user team references ─────────────────────────
    console.log('\n🔗 Step 3: Clearing team references from user documents...');
    const teamClearResult = await usersCollection.updateMany(
      {},
      {
        $unset: { teamName: '', team: '' },
        $set: { teams: [] },
      }
    );
    console.log(`   ✅ Cleared team references from ${teamClearResult.modifiedCount} user(s)\n`);

    // ── Final Summary ──────────────────────────────────────────────
    const finalUserCount = await usersCollection.countDocuments();
    const finalCollections = (await db.listCollections().toArray()).map((c) => c.name);

    console.log('='.repeat(50));
    console.log('✅ Database cleanup complete!');
    console.log(`   👤 Users preserved: ${finalUserCount}`);
    console.log(`   📦 Remaining collections: ${finalCollections.join(', ')}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

cleanDatabase();
