const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Models
const User = require('../models/User');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Gallery = require('../models/Gallery');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gaming_club');
    console.log(`MongoDB Connected for Seeding: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Game.deleteMany({});
    await Team.deleteMany({});
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    await Event.deleteMany({});
    await Announcement.deleteMany({});
    await Gallery.deleteMany({});

    console.log('Seeding Games...');
    const gamesData = [
      {
        name: 'Valorant',
        slug: 'valorant',
        genre: 'Tactical Hero Shooter',
        platform: 'PC',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
        description: 'A 5v5 character-based tactical shooter where precise gunplay meets unique agent abilities.',
        teamSize: 5,
        tournamentCount: 3,
        active: true,
      },
      {
        name: 'BGMI',
        slug: 'bgmi',
        genre: 'Battle Royale',
        platform: 'Mobile',
        logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1400&q=80',
        description: 'Battlegrounds Mobile India: Squad up, loot up, and survive the ultimate 100-player battlefield.',
        teamSize: 4,
        tournamentCount: 2,
        active: true,
      },
      {
        name: 'Counter-Strike 2',
        slug: 'counter-strike-2',
        genre: 'Tactical FPS',
        platform: 'PC',
        logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80',
        description: 'The premier competitive tactical shooter built on the Source 2 engine with revamped smokes and lighting.',
        teamSize: 5,
        tournamentCount: 2,
        active: true,
      },
      {
        name: 'EA Sports FC',
        slug: 'ea-sports-fc',
        genre: 'Sports / Football Simulation',
        platform: 'PC / Console',
        logo: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1400&q=80',
        description: 'World Class 1v1 and 2v2 football action featuring HyperMotion technology and club rivalries.',
        teamSize: 1,
        tournamentCount: 1,
        active: true,
      },
      {
        name: 'Minecraft',
        slug: 'minecraft',
        genre: 'Sandbox / PvP',
        platform: 'PC',
        logo: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1400&q=80',
        description: 'Bedwars, Speedrunning, and Building Showdowns on our custom low-latency campus server.',
        teamSize: 4,
        tournamentCount: 1,
        active: true,
      },
      {
        name: 'Free Fire',
        slug: 'free-fire',
        genre: 'Fast-Paced Battle Royale',
        platform: 'Mobile',
        logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
        description: 'Fast 10-minute battle royale action designed for mobile warriors with unique character attributes.',
        teamSize: 4,
        tournamentCount: 1,
        active: true,
      },
    ];

    const createdGames = await Game.insertMany(gamesData);
    console.log(`Inserted ${createdGames.length} games`);

    console.log('Seeding Users...');
    // Create Admin and 20+ Players
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const studentPassword = await bcrypt.hash('password123', salt);

    const usersData = [
      {
        name: 'Alex Rivera (Admin)',
        username: 'admin',
        email: 'admin@uemjgaming.club',
        password: adminPassword,
        role: 'admin',
        college: 'UEM Jaipur - Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Head of Esports & Gaming Club President. Organizing competitive campus leagues.',
        games: ['Valorant', 'Counter-Strike 2'],
        stats: { matchesPlayed: 45, wins: 38, losses: 7, mvpCount: 19 },
        achievements: [
          { title: 'Club Founder', badge: '👑', description: 'Established the college gaming club' },
          { title: 'Campus MVP 2024', badge: '🏆', description: 'Tournament highest fragger' },
        ],
      },
      {
        name: 'Shreyas Sharma',
        username: 'apex_shreyas',
        email: 'shreyas@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Duelist main in Valorant. CS veteran & tournament referee.',
        games: ['Valorant', 'Counter-Strike 2'],
        stats: { matchesPlayed: 32, wins: 26, losses: 6, mvpCount: 12 },
        achievements: [
          { title: 'Ace Master', badge: '🎯', description: 'Scored 10+ tournament aces' },
          { title: 'Clutch King', badge: '⚡', description: 'Won 1v4 match-point clutch' },
        ],
      },
      {
        name: 'Rohit Verma',
        username: 'ghost_rohit',
        email: 'rohit@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of IT',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'BGMI IGL and sniper specialist. Always hunting for the chicken dinner.',
        games: ['BGMI', 'Free Fire'],
        stats: { matchesPlayed: 28, wins: 19, losses: 9, mvpCount: 9 },
        achievements: [{ title: 'Sharpshooter', badge: '🎯', description: '80% headshot accuracy in BGMI' }],
      },
      {
        name: 'Aarav Patel',
        username: 'aarav_strike',
        email: 'aarav@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of ECE',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        bio: 'CS2 AWPer & entry fragger.',
        games: ['Counter-Strike 2', 'Valorant'],
        stats: { matchesPlayed: 24, wins: 18, losses: 6, mvpCount: 7 },
        achievements: [{ title: 'Flick God', badge: '⚡', description: 'Insane reflex AWP shots' }],
      },
      {
        name: 'Anya Sen',
        username: 'anya_val',
        email: 'anya@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of AI/ML',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Initiator/Controller main. Smoke line-ups ready for every site.',
        games: ['Valorant'],
        stats: { matchesPlayed: 30, wins: 22, losses: 8, mvpCount: 8 },
        achievements: [{ title: 'Tactical Genius', badge: '🧠', description: 'Mastered 50+ lineup setups' }],
      },
      {
        name: 'Kabir Das',
        username: 'kabir_fifa',
        email: 'kabir@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of Mechanical',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        bio: 'Tiki-taka football simulator champion. EA FC rank 1.',
        games: ['EA Sports FC'],
        stats: { matchesPlayed: 22, wins: 19, losses: 3, mvpCount: 14 },
        achievements: [{ title: 'Golden Boot', badge: '⚽', description: 'Top tournament goalscorer' }],
      },
      {
        name: 'Dev Mehra',
        username: 'craft_dev',
        email: 'dev@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of Civil',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        bio: 'Minecraft Bedwars speedster and Redstone engineer.',
        games: ['Minecraft'],
        stats: { matchesPlayed: 18, wins: 15, losses: 3, mvpCount: 6 },
        achievements: [{ title: 'Bed Destroyer', badge: '🛏️', description: '50 beds broken in 1 tourney' }],
      },
      {
        name: 'Ishaan Singh',
        username: 'ishaan_ff',
        email: 'ishaan@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of EE',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        bio: 'Free Fire rusher. Quick gloo wall king.',
        games: ['Free Fire', 'BGMI'],
        stats: { matchesPlayed: 20, wins: 14, losses: 6, mvpCount: 5 },
        achievements: [{ title: 'Speed Demon', badge: '🔥', description: 'Fastest gloo wall deployer' }],
      },
      {
        name: 'Priya Nair',
        username: 'priya_omen',
        email: 'priya@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        bio: 'Omen one-trick. Lurking in the shadows.',
        games: ['Valorant'],
        stats: { matchesPlayed: 25, wins: 17, losses: 8, mvpCount: 4 },
        achievements: [{ title: 'Shadow Walker', badge: '👻', description: 'Unseen flank master' }],
      },
      {
        name: 'Vikram Joshi',
        username: 'vikram_ak',
        email: 'vikram@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of BCA',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
        bio: 'CS2 AK spray transfer king.',
        games: ['Counter-Strike 2'],
        stats: { matchesPlayed: 26, wins: 16, losses: 10, mvpCount: 6 },
        achievements: [{ title: 'Spray Master', badge: '🔫', description: 'Flawless 30-bullet spray' }],
      },
      {
        name: 'Tanvi Roy',
        username: 'tanvi_sage',
        email: 'tanvi@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of Biotech',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        bio: 'Sage / Skye support that gives you the resurrect when it matters most.',
        games: ['Valorant'],
        stats: { matchesPlayed: 21, wins: 15, losses: 6, mvpCount: 5 },
        achievements: [{ title: 'Guardian Angel', badge: '👼', description: '50+ tournament revives' }],
      },
      {
        name: 'Rohan Gupta',
        username: 'rohan_m4',
        email: 'rohan@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80',
        bio: 'BGMI assaulter. Red dot M416 laser beam.',
        games: ['BGMI'],
        stats: { matchesPlayed: 19, wins: 13, losses: 6, mvpCount: 4 },
        achievements: [{ title: 'Laser Aim', badge: '🎯', description: 'Zero recoil spray accuracy' }],
      },
      {
        name: 'Siddharth Rao',
        username: 'sid_reyna',
        email: 'sid@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of IT',
        avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=300&q=80',
        bio: 'Reyna dismiss into site. Top fragger mentality.',
        games: ['Valorant'],
        stats: { matchesPlayed: 27, wins: 18, losses: 9, mvpCount: 11 },
        achievements: [{ title: 'Berserker', badge: '🩸', description: 'Most first bloods in campus history' }],
      },
      {
        name: 'Neha Kulkarni',
        username: 'neha_cs',
        email: 'neha@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'CS2 support & flashbang expert.',
        games: ['Counter-Strike 2'],
        stats: { matchesPlayed: 16, wins: 10, losses: 6, mvpCount: 3 },
        achievements: [{ title: 'Flash Master', badge: '💥', description: 'Blind time record holder' }],
      },
      {
        name: 'Karan Malhotra',
        username: 'karan_ea',
        email: 'karan@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of BBA',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Custom tactics & skill move wizard in FC 24.',
        games: ['EA Sports FC'],
        stats: { matchesPlayed: 17, wins: 12, losses: 5, mvpCount: 7 },
        achievements: [{ title: 'Clean Sheet King', badge: '🧤', description: 'Conceded zero goals in groups' }],
      },
      {
        name: 'Aniket Deshmukh',
        username: 'aniket_mine',
        email: 'aniket@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of MCA',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'Speedrunner and bridge god in Minecraft PvP.',
        games: ['Minecraft'],
        stats: { matchesPlayed: 14, wins: 9, losses: 5, mvpCount: 4 },
        achievements: [{ title: 'Godbridger', badge: '🌉', description: 'Fastest 30-block bridge' }],
      },
      {
        name: 'Meera Kapoor',
        username: 'meera_ff',
        email: 'meera@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of Law',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        bio: 'Free Fire sniper & safe zone tactician.',
        games: ['Free Fire'],
        stats: { matchesPlayed: 15, wins: 8, losses: 7, mvpCount: 3 },
        achievements: [{ title: 'Survivalist', badge: '🛡️', description: 'Average placement top 3' }],
      },
      {
        name: 'Varun Saxena',
        username: 'varun_viper',
        email: 'varun@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of Mechanical',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        bio: 'Viper post-plant poison lineups. Denying defuse 24/7.',
        games: ['Valorant'],
        stats: { matchesPlayed: 23, wins: 15, losses: 8, mvpCount: 6 },
        achievements: [{ title: 'Poisonous', badge: '🧪', description: '30 round wins on molly ticks' }],
      },
      {
        name: 'Sameer Khan',
        username: 'sam_bgmi',
        email: 'sameer@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of CSE',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        bio: 'Drop at Bootcamp / Pochinki or go home.',
        games: ['BGMI'],
        stats: { matchesPlayed: 22, wins: 14, losses: 8, mvpCount: 5 },
        achievements: [{ title: 'Hot Drop King', badge: '🔥', description: 'Survives Pochinki with 8+ kills' }],
      },
      {
        name: 'Divya Nair',
        username: 'divya_killjoy',
        email: 'divya@uemjgaming.club',
        password: studentPassword,
        role: 'student',
        college: 'UEM Jaipur - Dept of AI/ML',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Killjoy lockdown lockdowns that win championships.',
        games: ['Valorant'],
        stats: { matchesPlayed: 19, wins: 13, losses: 6, mvpCount: 4 },
        achievements: [{ title: 'Iron Clad', badge: '🔒', description: 'Zero sites breached under watch' }],
      },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`Inserted ${createdUsers.length} users`);

    console.log('Seeding Teams...');
    // Create 10+ teams
    const teamsData = [
      {
        name: 'Phantom Strikers',
        tag: 'PHTM',
        game: 'Valorant',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[0]._id, // Admin
        members: [
          { user: createdUsers[0]._id, role: 'captain', inGameName: 'PHTM_Phantom' },
          { user: createdUsers[1]._id, role: 'starter', inGameName: 'PHTM_Apex' },
          { user: createdUsers[4]._id, role: 'starter', inGameName: 'PHTM_Anya' },
          { user: createdUsers[8]._id, role: 'starter', inGameName: 'PHTM_Priya' },
          { user: createdUsers[12]._id, role: 'starter', inGameName: 'PHTM_Reyna' },
        ],
        description: 'Defending champions of the College Esports Invitational. High strategy, unmatched aim.',
        matchesPlayed: 15,
        wins: 13,
        losses: 2,
        points: 39,
      },
      {
        name: 'Vortex Esports',
        tag: 'VTX',
        game: 'Valorant',
        logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[17]._id, // Varun
        members: [
          { user: createdUsers[17]._id, role: 'captain', inGameName: 'VTX_Viper' },
          { user: createdUsers[10]._id, role: 'starter', inGameName: 'VTX_Sage' },
          { user: createdUsers[19]._id, role: 'starter', inGameName: 'VTX_KJ' },
        ],
        description: 'The swirling hurricane of tactical executions and ruthless retakes.',
        matchesPlayed: 12,
        wins: 9,
        losses: 3,
        points: 27,
      },
      {
        name: 'Apex Titans',
        tag: 'TITN',
        game: 'Counter-Strike 2',
        logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[3]._id, // Aarav
        members: [
          { user: createdUsers[3]._id, role: 'captain', inGameName: 'TITN_Aarav' },
          { user: createdUsers[9]._id, role: 'starter', inGameName: 'TITN_Vikram' },
          { user: createdUsers[13]._id, role: 'starter', inGameName: 'TITN_Neha' },
        ],
        description: 'Dominating Mirage, Inferno, and Nuke with clinical precision.',
        matchesPlayed: 14,
        wins: 11,
        losses: 3,
        points: 33,
      },
      {
        name: 'Inferno Blaze',
        tag: 'BLZ',
        game: 'BGMI',
        logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[2]._id, // Rohit
        members: [
          { user: createdUsers[2]._id, role: 'captain', inGameName: 'BLZ_Rohit' },
          { user: createdUsers[11]._id, role: 'starter', inGameName: 'BLZ_Rohan' },
          { user: createdUsers[18]._id, role: 'starter', inGameName: 'BLZ_Sameer' },
        ],
        description: 'Aggressive zone rotations and high-kill games across Erangel and Miramar.',
        matchesPlayed: 16,
        wins: 12,
        losses: 4,
        points: 36,
      },
      {
        name: 'Delta Force',
        tag: 'DLTA',
        game: 'BGMI',
        logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[18]._id, // Sameer
        members: [
          { user: createdUsers[18]._id, role: 'captain', inGameName: 'DLTA_Sam' },
          { user: createdUsers[2]._id, role: 'starter', inGameName: 'DLTA_Ghost' },
        ],
        description: 'Special tactics squad specializing in compound defenses.',
        matchesPlayed: 10,
        wins: 6,
        losses: 4,
        points: 18,
      },
      {
        name: 'Cyber Spartans',
        tag: 'SPRT',
        game: 'Counter-Strike 2',
        logo: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[9]._id, // Vikram
        members: [
          { user: createdUsers[9]._id, role: 'captain', inGameName: 'SPRT_Vikram' },
          { user: createdUsers[1]._id, role: 'starter', inGameName: 'SPRT_Shreyas' },
        ],
        description: 'Discipline, crosshair placement, and unflinching resolve.',
        matchesPlayed: 11,
        wins: 7,
        losses: 4,
        points: 21,
      },
      {
        name: 'Pixel Gladiators',
        tag: 'PXGL',
        game: 'Minecraft',
        logo: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[6]._id, // Dev
        members: [
          { user: createdUsers[6]._id, role: 'captain', inGameName: 'PXGL_Dev' },
          { user: createdUsers[15]._id, role: 'starter', inGameName: 'PXGL_Aniket' },
        ],
        description: 'Fast bridging, clutch block placements, and Bedwars dominance.',
        matchesPlayed: 8,
        wins: 7,
        losses: 1,
        points: 21,
      },
      {
        name: 'Golden Strikers',
        tag: 'GLDN',
        game: 'EA Sports FC',
        logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[5]._id, // Kabir
        members: [
          { user: createdUsers[5]._id, role: 'captain', inGameName: 'GLDN_Kabir' },
          { user: createdUsers[14]._id, role: 'starter', inGameName: 'GLDN_Karan' },
        ],
        description: 'Unmatched dribbling, tactical formations, and free kick accuracy.',
        matchesPlayed: 14,
        wins: 11,
        losses: 3,
        points: 33,
      },
      {
        name: 'Frost Wolves',
        tag: 'FRST',
        game: 'Free Fire',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[7]._id, // Ishaan
        members: [
          { user: createdUsers[7]._id, role: 'captain', inGameName: 'FRST_Ishaan' },
          { user: createdUsers[16]._id, role: 'starter', inGameName: 'FRST_Meera' },
        ],
        description: 'Pack hunters on Bermuda and Purgatory maps.',
        matchesPlayed: 9,
        wins: 6,
        losses: 3,
        points: 18,
      },
      {
        name: 'Shadow Protocol',
        tag: 'SHDW',
        game: 'Valorant',
        logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80',
        captain: createdUsers[4]._id, // Anya
        members: [
          { user: createdUsers[4]._id, role: 'captain', inGameName: 'SHDW_Anya' },
          { user: createdUsers[12]._id, role: 'starter', inGameName: 'SHDW_Sid' },
        ],
        description: 'Unorthodox playstyles, sneaky defuses, and cyber warfare.',
        matchesPlayed: 10,
        wins: 5,
        losses: 5,
        points: 15,
      },
    ];

    const createdTeams = await Team.insertMany(teamsData);
    console.log(`Inserted ${createdTeams.length} teams`);

    // Link teams to Users
    for (const team of createdTeams) {
      for (const member of team.members) {
        await User.findByIdAndUpdate(member.user, {
          $addToSet: { teams: team._id },
        });
      }
    }

    console.log('Seeding Tournaments...');
    // Create 6 Tournaments
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const tournamentsData = [
      {
        name: 'College Esports Championship 2025',
        slug: 'college-esports-championship-2025',
        game: 'Valorant',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
        description: 'The flagship inter-college Valorant tournament. Battle through the knockout brackets for college glory and the grand prize pool!',
        rules: [
          'All teams must submit valid college student IDs prior to match kickoff.',
          'Format: 5v5 Tournament Mode on standard competitive map pool.',
          'Overtime is win by 2 with auto money reset.',
          'Coaches and substitutes must be registered before the bracket lock.',
          'Stream sniping, offensive language, and toxic behaviour will result in a match forfeit.',
        ],
        format: 'Single Elimination',
        prizePool: { total: 25000, currency: 'INR (₹)', first: 15000, second: 7000, third: 3000 },
        entryFee: 0,
        maxTeams: 16,
        registeredTeams: [
          { team: createdTeams[0]._id, registeredAt: new Date(now.getTime() - 5 * day) },
          { team: createdTeams[1]._id, registeredAt: new Date(now.getTime() - 4 * day) },
          { team: createdTeams[9]._id, registeredAt: new Date(now.getTime() - 2 * day) },
        ],
        registrationDeadline: new Date(now.getTime() + 12 * day + 8 * 3600000 + 32 * 60000), // ~12 days
        startDate: new Date(now.getTime() + 14 * day),
        endDate: new Date(now.getTime() + 16 * day),
        status: 'upcoming',
        organizer: 'UEM Gaming Club Executive Board',
        streamUrl: 'https://twitch.tv',
        createdBy: createdUsers[0]._id,
      },
      {
        name: 'Campus BGMI Mayhem Season 4',
        slug: 'campus-bgmi-mayhem-season-4',
        game: 'BGMI',
        banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1400&q=80',
        description: 'Drop onto Erangel, Miramar, and Sanhok. 16 squads clash in a battle of survival, mechanical gunplay, and strategic zone rotations.',
        rules: [
          'Mobile devices only (No Emulators or iPad aspect ratios allowed).',
          'Standard BGIS point distribution (15 points for WWCD, 1 point per finish).',
          'Screen recording of the last circle must be kept for verification.',
        ],
        format: 'Round Robin',
        prizePool: { total: 15000, currency: 'INR (₹)', first: 9000, second: 4000, third: 2000 },
        entryFee: 100,
        maxTeams: 16,
        registeredTeams: [
          { team: createdTeams[3]._id, registeredAt: new Date(now.getTime() - 8 * day) },
          { team: createdTeams[4]._id, registeredAt: new Date(now.getTime() - 6 * day) },
        ],
        registrationDeadline: new Date(now.getTime() - 1 * day),
        startDate: new Date(now.getTime() - 2 * 3600000), // LIVE NOW!
        endDate: new Date(now.getTime() + 2 * day),
        status: 'live',
        organizer: 'Esports Mobile Division',
        streamUrl: 'https://youtube.com',
        createdBy: createdUsers[1]._id,
      },
      {
        name: 'CS2 Campus Major: Defuse Royale',
        slug: 'cs2-campus-major-defuse-royale',
        game: 'Counter-Strike 2',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80',
        description: 'MR12 format on custom 128-tick sub-tick local servers. Experience true tactical FPS at zero ping in the campus computer lab.',
        rules: [
          'Valve Anti-Cheat + local server demo recording mandatory.',
          'Knife round for side selection.',
          'Overtime MR3 $10,000.',
        ],
        format: 'Single Elimination',
        prizePool: { total: 20000, currency: 'INR (₹)', first: 12000, second: 6000, third: 2000 },
        entryFee: 0,
        maxTeams: 8,
        registeredTeams: [
          { team: createdTeams[2]._id, registeredAt: new Date(now.getTime() - 15 * day) },
          { team: createdTeams[5]._id, registeredAt: new Date(now.getTime() - 12 * day) },
        ],
        registrationDeadline: new Date(now.getTime() - 3 * day),
        startDate: new Date(now.getTime() - 1 * day),
        endDate: new Date(now.getTime() + 1 * day),
        status: 'live',
        organizer: 'UEM CS:GO / CS2 Chapter',
        streamUrl: 'https://twitch.tv',
        createdBy: createdUsers[0]._id,
      },
      {
        name: 'EA Sports FC 24 Collegiate Cup',
        slug: 'ea-sports-fc-24-collegiate-cup',
        game: 'EA Sports FC',
        banner: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1400&q=80',
        description: '1v1 Ultimate Team and 95-rated squad competition. Bring your controllers, show off your skills, and take the campus crown!',
        rules: [
          'Standard 6-minute halves on Legendary difficulty.',
          'Legacy defending prohibited; tactical defending required.',
          'Extra time and penalties apply in knockout stages.',
        ],
        format: 'Single Elimination',
        prizePool: { total: 10000, currency: 'INR (₹)', first: 6000, second: 3000, third: 1000 },
        entryFee: 0,
        maxTeams: 16,
        registeredTeams: [
          { team: createdTeams[7]._id, registeredAt: new Date(now.getTime() - 2 * day) },
        ],
        registrationDeadline: new Date(now.getTime() + 5 * day),
        startDate: new Date(now.getTime() + 7 * day),
        endDate: new Date(now.getTime() + 8 * day),
        status: 'upcoming',
        organizer: 'Gaming Club Sports Section',
        createdBy: createdUsers[0]._id,
      },
      {
        name: 'Bedwars & Speedbuild Bash',
        slug: 'bedwars-speedbuild-bash',
        game: 'Minecraft',
        banner: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1400&q=80',
        description: 'Squad Bedwars tournaments on our dedicated campus Minecraft realm. Speed bridge, collect diamonds, and protect your bed at all costs.',
        rules: [
          'Minecraft Java Edition 1.8.9 or 1.20 compatible.',
          'No auto-clickers, hacked clients, or macros.',
          'Fair play agreement enforced by student admins.',
        ],
        format: 'Double Elimination',
        prizePool: { total: 5000, currency: 'INR (₹)', first: 3000, second: 1500, third: 500 },
        entryFee: 0,
        maxTeams: 8,
        registeredTeams: [
          { team: createdTeams[6]._id, registeredAt: new Date(now.getTime() - 20 * day) },
        ],
        registrationDeadline: new Date(now.getTime() - 10 * day),
        startDate: new Date(now.getTime() - 8 * day),
        endDate: new Date(now.getTime() - 6 * day),
        status: 'completed',
        organizer: 'Minecraft Club Society',
        createdBy: createdUsers[0]._id,
      },
      {
        name: 'Free Fire Survival Series',
        slug: 'free-fire-survival-series',
        game: 'Free Fire',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
        description: 'Fast-paced mobile battle royale. Rush, deploy gloo walls, and dominate the island against fellow university rivals.',
        rules: [
          'Only mobile phones allowed (No PC emulators).',
          'All gun skins with stat attributes disabled in custom room settings.',
        ],
        format: 'Round Robin',
        prizePool: { total: 8000, currency: 'INR (₹)', first: 5000, second: 2000, third: 1000 },
        entryFee: 50,
        maxTeams: 12,
        registeredTeams: [
          { team: createdTeams[8]._id, registeredAt: new Date(now.getTime() - 3 * day) },
        ],
        registrationDeadline: new Date(now.getTime() + 9 * day),
        startDate: new Date(now.getTime() + 11 * day),
        endDate: new Date(now.getTime() + 12 * day),
        status: 'upcoming',
        organizer: 'Mobile Gaming Chapter',
        createdBy: createdUsers[1]._id,
      },
    ];

    const createdTournaments = await Tournament.insertMany(tournamentsData);
    console.log(`Inserted ${createdTournaments.length} tournaments`);

    console.log('Seeding Matches...');
    // Create 10+ Matches across tournaments
    const matchesData = [
      // Tournament 0: College Esports Championship (Upcoming/Bracket preview)
      {
        tournament: createdTournaments[0]._id,
        round: 'Quarter Finals',
        roundIndex: 1,
        matchNumber: 1,
        teamA: createdTeams[0]._id, // Phantom Strikers
        teamB: createdTeams[1]._id, // Vortex Esports
        scoreA: 0,
        scoreB: 0,
        scheduledAt: new Date(now.getTime() + 14 * day + 14 * 3600000),
        status: 'scheduled',
        streamUrl: 'https://twitch.tv',
      },
      {
        tournament: createdTournaments[0]._id,
        round: 'Quarter Finals',
        roundIndex: 1,
        matchNumber: 2,
        teamA: createdTeams[9]._id, // Shadow Protocol
        teamB: createdTeams[0]._id,
        scoreA: 0,
        scoreB: 0,
        scheduledAt: new Date(now.getTime() + 14 * day + 16 * 3600000),
        status: 'scheduled',
      },
      {
        tournament: createdTournaments[0]._id,
        round: 'Semi Finals',
        roundIndex: 2,
        matchNumber: 3,
        teamA: createdTeams[0]._id,
        scoreA: 0,
        scoreB: 0,
        scheduledAt: new Date(now.getTime() + 15 * day + 15 * 3600000),
        status: 'scheduled',
      },
      {
        tournament: createdTournaments[0]._id,
        round: 'Grand Final',
        roundIndex: 3,
        matchNumber: 4,
        scoreA: 0,
        scoreB: 0,
        scheduledAt: new Date(now.getTime() + 16 * day + 17 * 3600000),
        status: 'scheduled',
      },

      // Tournament 1: Campus BGMI Mayhem (LIVE NOW)
      {
        tournament: createdTournaments[1]._id,
        round: 'Match 1 - Erangel',
        roundIndex: 1,
        matchNumber: 1,
        teamA: createdTeams[3]._id, // Inferno Blaze
        teamB: createdTeams[4]._id, // Delta Force
        scoreA: 18,
        scoreB: 12,
        winner: createdTeams[3]._id,
        scheduledAt: new Date(now.getTime() - 2 * 3600000),
        status: 'completed',
      },
      {
        tournament: createdTournaments[1]._id,
        round: 'Match 2 - Miramar',
        roundIndex: 1,
        matchNumber: 2,
        teamA: createdTeams[3]._id,
        teamB: createdTeams[4]._id,
        scoreA: 14,
        scoreB: 16,
        scheduledAt: new Date(now.getTime()),
        status: 'live',
        streamUrl: 'https://youtube.com',
      },
      {
        tournament: createdTournaments[1]._id,
        round: 'Match 3 - Sanhok',
        roundIndex: 1,
        matchNumber: 3,
        teamA: createdTeams[4]._id,
        teamB: createdTeams[3]._id,
        scoreA: 0,
        scoreB: 0,
        scheduledAt: new Date(now.getTime() + 3 * 3600000),
        status: 'scheduled',
      },

      // Tournament 2: CS2 Campus Major (LIVE NOW)
      {
        tournament: createdTournaments[2]._id,
        round: 'Semi Finals',
        roundIndex: 1,
        matchNumber: 1,
        teamA: createdTeams[2]._id, // Apex Titans
        teamB: createdTeams[5]._id, // Cyber Spartans
        scoreA: 13,
        scoreB: 9,
        winner: createdTeams[2]._id,
        scheduledAt: new Date(now.getTime() - 24 * 3600000),
        status: 'completed',
      },
      {
        tournament: createdTournaments[2]._id,
        round: 'Grand Final',
        roundIndex: 2,
        matchNumber: 2,
        teamA: createdTeams[2]._id,
        teamB: createdTeams[5]._id,
        scoreA: 11,
        scoreB: 12,
        scheduledAt: new Date(now.getTime()),
        status: 'live',
        streamUrl: 'https://twitch.tv',
      },

      // Tournament 4: Minecraft Bedwars (Completed)
      {
        tournament: createdTournaments[4]._id,
        round: 'Grand Final',
        roundIndex: 2,
        matchNumber: 1,
        teamA: createdTeams[6]._id, // Pixel Gladiators
        scoreA: 3,
        scoreB: 1,
        winner: createdTeams[6]._id,
        scheduledAt: new Date(now.getTime() - 6 * day),
        status: 'completed',
      },
    ];

    const createdMatches = await Match.insertMany(matchesData);
    console.log(`Inserted ${createdMatches.length} matches`);

    console.log('Seeding Events...');
    // Create 5 Events
    const eventsData = [
      {
        title: 'LAN Gaming Night 2025',
        description: 'All-night high-octane gaming in Lab 3 & 4. High-speed LAN, pizza, energy drinks, and casual tournaments for CS2, Valorant, FIFA, and Rocket League.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        category: 'LAN Gaming',
        date: new Date(now.getTime() + 3 * day),
        time: '7:00 PM - 5:00 AM (Overnight)',
        location: 'University Computer Center, Lab 3 & 4',
        capacity: 120,
        registrations: [
          { user: createdUsers[0]._id, registeredAt: new Date() },
          { user: createdUsers[1]._id, registeredAt: new Date() },
          { user: createdUsers[2]._id, registeredAt: new Date() },
        ],
        status: 'upcoming',
      },
      {
        title: 'Esports Career & Casting Workshop',
        description: 'Learn the ins and outs of esports broadcasting, game analysis, shoutcasting, and tournament production from professional casters.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        category: 'Workshop',
        date: new Date(now.getTime() + 8 * day),
        time: '2:00 PM - 5:00 PM',
        location: 'Seminar Hall 2 & Discord Stage',
        capacity: 80,
        registrations: [
          { user: createdUsers[3]._id, registeredAt: new Date() },
          { user: createdUsers[4]._id, registeredAt: new Date() },
        ],
        status: 'upcoming',
      },
      {
        title: 'Game Development & Unreal Engine 5 Meetup',
        description: 'Showcase student indie games, learn game loop logic, 3D asset pipelines, and network with fellow programmers and creators.',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        category: 'Meetup',
        date: new Date(now.getTime() + 18 * day),
        time: '3:30 PM - 6:00 PM',
        location: 'Innovation Lab, 2nd Floor',
        capacity: 60,
        registrations: [],
        status: 'upcoming',
      },
      {
        title: 'College Gaming Championship Grand Finale Ceremony',
        description: 'Trophy presentation, live musical performance, award distribution for MVPs, and declaration of the annual champion department.',
        image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=800&q=80',
        category: 'Championship',
        date: new Date(now.getTime() + 25 * day),
        time: '5:00 PM - 9:00 PM',
        location: 'Main University Auditorium',
        capacity: 350,
        registrations: [],
        status: 'upcoming',
      },
      {
        title: 'Retro Arcade & Smash Throwdown',
        description: 'Step back into the golden age of arcade fighters: Street Fighter III, Tekken 3, Super Smash Bros, and Pac-Man on vintage CRTs and emulators.',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        category: 'LAN Gaming',
        date: new Date(now.getTime() - 10 * day),
        time: '4:00 PM - 8:00 PM',
        location: 'Student Activity Center',
        capacity: 90,
        registrations: [],
        status: 'completed',
      },
    ];

    const createdEvents = await Event.insertMany(eventsData);
    console.log(`Inserted ${createdEvents.length} events`);

    console.log('Seeding Announcements...');
    // Create 10 Announcements
    const announcementsData = [
      {
        title: '🔥 College Esports Championship 2025 Registrations are NOW OPEN!',
        slug: 'college-esports-championship-2025-registrations-open',
        content: 'Get your rosters locked and strats prepared. We are thrilled to announce registrations for the ₹25,000 Valorant College Esports Championship. Check the tournaments tab to register your squad before brackets lock on the 28th!',
        category: 'Tournament',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[0]._id,
        pinned: true,
        status: 'published',
        publishedAt: new Date(now.getTime() - 2 * day),
      },
      {
        title: '⚡ Official Discord Bot & Scrims Matchmaking Live',
        slug: 'official-discord-bot-live',
        content: 'We have upgraded our Discord community server with an automated scrim bot! You can now queue for internal 5v5 customs, record your Elo, and earn leaderboard points straight from our Discord server.',
        category: 'Update',
        image: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[1]._id,
        pinned: true,
        status: 'published',
        publishedAt: new Date(now.getTime() - 4 * day),
      },
      {
        title: '🍕 All-Night LAN Gaming Night Scheduled for This Weekend',
        slug: 'all-night-lan-gaming-night-scheduled',
        content: 'Pack your peripherals! Labs 3 and 4 will be open all night with gigabit LAN, zero latency local servers, and unlimited snacks sponsored by our university committee.',
        category: 'Community',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[0]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 5 * day),
      },
      {
        title: '🛡️ Fair Play & Competitive Integrity Policy Update',
        slug: 'fair-play-policy-update',
        content: 'In alignment with collegiate esports standards, all participants must play on clean systems without hardware macros, unauthorized script injectors, or illicit mods. Any violations will result in a 1-year ban from university sports.',
        category: 'Important',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[0]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 7 * day),
      },
      {
        title: '🎮 New Game Title Added: Counter-Strike 2 Campus League',
        slug: 'cs2-campus-league-added',
        content: 'Following widespread student demand, CS2 is officially recognized as a varsity esports title in our club. Create your 5-man roster in the Teams section now!',
        category: 'General',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[1]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 10 * day),
      },
      {
        title: '🏆 Phantom Strikers Win Summer Invitational Finals',
        slug: 'phantom-strikers-win-summer-invitational',
        content: 'Huge congratulations to Phantom Strikers for lifting the trophy with a 3-1 victory over Vortex Esports in the grand finals. Replays and match vods are uploaded to our media gallery.',
        category: 'Tournament',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[0]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 14 * day),
      },
      {
        title: '📢 Shoutcaster Auditions for Fall Championship',
        slug: 'shoutcaster-auditions-open',
        content: 'Have high game sense and great vocal energy? We are scouting color commentators and play-by-play casters for our upcoming tournament broadcast streams.',
        category: 'Community',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[1]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 18 * day),
      },
      {
        title: '💻 High-Refresh 240Hz Monitors Arrive at Club Arena',
        slug: '240hz-monitors-arrive-at-club-arena',
        content: 'Thanks to department funding, 20 new 240Hz 1ms IPS gaming displays have been installed in Room 204 for team scrims and tournament finals.',
        category: 'Update',
        image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[0]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 22 * day),
      },
      {
        title: '📱 BGMI Custom Rooms Scheduled Every Wednesday & Friday',
        slug: 'bgmi-custom-rooms-schedule',
        content: 'Join 100-player custom rooms every Wednesday and Friday at 8:00 PM. Room ID and password are shared exclusively in our verified students WhatsApp & Discord groups.',
        category: 'Community',
        image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[2]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 25 * day),
      },
      {
        title: '🌟 Welcome Class of 2028: How to Join Club Rosters',
        slug: 'welcome-freshers-gaming-club',
        content: 'Welcome to all freshers! Create your player profile on this portal, connect with team captains, and register for rookie tryouts taking place all month.',
        category: 'General',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        author: createdUsers[0]._id,
        pinned: false,
        status: 'published',
        publishedAt: new Date(now.getTime() - 30 * day),
      },
    ];

    const createdAnnouncements = await Announcement.insertMany(announcementsData);
    console.log(`Inserted ${createdAnnouncements.length} announcements`);

    console.log('Seeding Gallery...');
    // Create Gallery items
    const galleryData = [
      {
        title: 'LAN Arena Main Stage Crowd',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        description: 'Electric atmosphere during the College Finals with over 300 students cheering in the auditorium.',
        category: 'Tournaments',
        event: 'College Esports 2024',
        uploadedBy: createdUsers[0]._id,
      },
      {
        title: 'Trophy Presentation & Winners',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        description: 'Captains hoisting the championship trophy after a nail-biting overtime round.',
        category: 'Ceremonies',
        event: 'Summer Invitational',
        uploadedBy: createdUsers[0]._id,
      },
      {
        title: 'Late Night LAN Scrims',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        description: 'Tactical discussions, strategy boards, and intense matches at 3 AM.',
        category: 'LAN Parties',
        event: 'Overnight LAN 2024',
        uploadedBy: createdUsers[1]._id,
      },
      {
        title: 'Pro Battle Station Setups',
        image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&w=800&q=80',
        description: 'Dual monitor tournament stage setups with 240Hz refresh rates.',
        category: 'Setups',
        event: 'Campus Lab Upgrade',
        uploadedBy: createdUsers[0]._id,
      },
      {
        title: 'Mobile Esports Finals Zone',
        image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
        description: 'BGMI squads locked in during the final circle rotations.',
        category: 'Tournaments',
        event: 'Mobile Mayhem 2024',
        uploadedBy: createdUsers[2]._id,
      },
      {
        title: 'Club Executive Committee',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        description: 'The organizing team that keeps our collegiate gaming thriving year-round.',
        category: 'Community',
        event: 'Club Meet 2025',
        uploadedBy: createdUsers[0]._id,
      },
    ];

    const createdGallery = await Gallery.insertMany(galleryData);
    console.log(`Inserted ${createdGallery.length} gallery items`);

    console.log('✅ ALL SEED DATA SUCCESSFULLY GENERATED!');
    console.log('==============================================');
    console.log('Admin Account:');
    console.log('  Email: admin@uemjgaming.club');
    console.log('  Password: admin123');
    console.log('Student Accounts:');
    console.log('  Email: shreyas@uemjgaming.club | password123');
    console.log('  Email: rohit@uemjgaming.club   | password123');
    console.log('==============================================');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
