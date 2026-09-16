const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Gallery = require('../models/Gallery');

async function removeDemoData() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);

    // 1. Remove Events
    const eventsRes = await Event.deleteMany({});
    console.log(`Removed ${eventsRes.deletedCount} demo events.`);

    // 2. Remove Matches
    const matchRes = await Match.deleteMany({});
    console.log(`Removed ${matchRes.deletedCount} demo matches.`);

    // 3. Remove Tournaments
    const tourRes = await Tournament.deleteMany({});
    console.log(`Removed ${tourRes.deletedCount} demo tournaments.`);

    // 4. Remove Teams
    const teamRes = await Team.deleteMany({});
    console.log(`Removed ${teamRes.deletedCount} demo teams.`);

    // 5. Remove Announcements
    const annRes = await Announcement.deleteMany({});
    console.log(`Removed ${annRes.deletedCount} demo announcements.`);

    // 6. Remove Galleries
    const galRes = await Gallery.deleteMany({});
    console.log(`Removed ${galRes.deletedCount} demo gallery items.`);

    // 7. Reset Game tournamentCount to 0
    await Game.updateMany({}, { $set: { tournamentCount: 0 } });
    console.log('Reset tournamentCount to 0 for all games.');

    // 8. Remove demo users (keep admin and genuine registered accounts)
    const preservedEmails = [
      'admin@uemjgaming.club',
      'shreyasroy53@gmail.com',
      'riddhi@gmail.com',
      'sanglapghosh51@gmail.com'
    ];

    const demoUsersRes = await User.deleteMany({
      email: { $nin: preservedEmails }
    });
    console.log(`Removed ${demoUsersRes.deletedCount} demo user accounts.`);

    const remainingUsers = await User.find({}, { username: 1, email: 1, role: 1 });
    console.log('Remaining active users in database:', remainingUsers);

    await mongoose.disconnect();
    console.log('MongoDB connection closed. Clean-up complete!');
  } catch (error) {
    console.error('Error removing demo data:', error);
    process.exit(1);
  }
}

removeDemoData();
