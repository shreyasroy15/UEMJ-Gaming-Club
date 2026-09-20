const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Tournament = require('./models/Tournament');
const User = require('./models/User');
const TournamentRegistration = require('./models/TournamentRegistration');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const tournamentId = '6aac4e04492fc373464e4fb7';
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    console.error('Tournament not found!');
    process.exit(1);
  }

  tournament.maxTeams = Math.max(tournament.maxTeams || 25, 100);
  await tournament.save();
  console.log('Tournament maxTeams updated to:', tournament.maxTeams);

  const users = await User.find({}).limit(50);
  console.log('Found existing users:', users.length);
  const fallbackUser = users[0];

  const teamAdjectives = [
    'Apex', 'Viper', 'Omega', 'Phoenix', 'Titan', 'Ghost', 'Nova', 'Cyber', 'Shadow', 'Storm',
    'Hydra', 'Falcon', 'Raptor', 'Blaze', 'Iron', 'Echo', 'Chaos', 'Reaper', 'Zenith', 'Phantom',
    'Inferno', 'Thunder', 'Spectre', 'Vanguard', 'Eclipse', 'Rogue', 'Havoc', 'Immortal', 'Frost', 'Pulse',
    'Velocity', 'Quantum', 'Nexus', 'Bullet', 'Dragon', 'Striker', 'Samurai', 'Ninja', 'Matrix', 'Outlaw',
    'Savage', 'Predator', 'Gladiator', 'Vortex', 'Sentinel', 'Dominion', 'Enigma', 'Reign', 'Overdrive', 'Valiant'
  ];

  const needed = 50;
  console.log('Registering ' + needed + ' teams for tournament...');

  for (let i = 1; i <= needed; i++) {
    const adj = teamAdjectives[(i - 1) % teamAdjectives.length];
    const teamNum = String(i).padStart(2, '0');
    const teamName = `${adj} Esports ${teamNum}`;

    const exists = await TournamentRegistration.findOne({ tournament: tournament._id, teamName });
    if (exists) {
      console.log('Team already exists:', teamName);
      continue;
    }

    const assignedUser = users[(i - 1) % users.length] || fallbackUser;
    const teamCode = 'BGMI-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const tag = adj.substring(0, 4).toUpperCase();

    const isRejected = i > 45;
    const isPending = i > 40 && i <= 45;
    const isVerified = !isRejected && !isPending;

    const status = isVerified ? 'verified' : isRejected ? 'rejected' : 'complete';
    const proofStatus = isVerified ? 'verified' : isRejected ? 'rejected' : 'submitted';

    const reg = await TournamentRegistration.create({
      tournament: tournament._id,
      teamName,
      teamType: 'UEM Student Team',
      teamTag: tag,
      teamCode,
      captain: assignedUser._id,
      leader: assignedUser._id,
      identityProof: {
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: `${adj}_Squad_ID_Proofs.pdf`,
        fileSize: 1245000 + i * 1024,
        status: proofStatus,
        submittedAt: new Date(),
        verificationNotes: isRejected ? 'You need to upload all player/team ID proofs merged into a single PDF.' : '',
      },
      verificationNotes: isRejected ? 'You need to upload all player/team ID proofs merged into a single PDF.' : '',
      players: [
        {
          user: assignedUser._id,
          role: 'captain',
          slotNumber: 1,
          status: 'completed',
          responses: {
            player_name: assignedUser.name || `${adj} Captain`,
            college_name: 'University of Engineering & Management',
            college_id: 'UEMJ' + (1000 + i),
            phone_number: '98765' + String(10000 + i).substring(1),
          },
          joinedAt: new Date(),
        },
        {
          user: assignedUser._id,
          role: 'starter',
          slotNumber: 2,
          status: 'completed',
          responses: {
            player_name: `${adj} Fragger`,
            college_name: 'University of Engineering & Management',
            college_id: 'UEMJ' + (2000 + i),
            phone_number: '98765' + String(20000 + i).substring(1),
          },
          joinedAt: new Date(),
        },
        {
          user: assignedUser._id,
          role: 'starter',
          slotNumber: 3,
          status: 'completed',
          responses: {
            player_name: `${adj} Support`,
            college_name: 'University of Engineering & Management',
            college_id: 'UEMJ' + (3000 + i),
            phone_number: '98765' + String(30000 + i).substring(1),
          },
          joinedAt: new Date(),
        },
        {
          user: assignedUser._id,
          role: 'starter',
          slotNumber: 4,
          status: 'completed',
          responses: {
            player_name: `${adj} Sniper`,
            college_name: 'University of Engineering & Management',
            college_id: 'UEMJ' + (4000 + i),
            phone_number: '98765' + String(40000 + i).substring(1),
          },
          joinedAt: new Date(),
        },
      ],
      status,
      isVerified,
      verifiedAt: isVerified ? new Date() : undefined,
    });

    await Tournament.findByIdAndUpdate(tournament._id, {
      $addToSet: {
        registeredTeams: {
          team: reg._id,
          registeredAt: new Date(),
        },
      },
    });
  }

  const finalCount = await TournamentRegistration.countDocuments({ tournament: tournament._id });
  console.log('Final registered teams count for tournament:', finalCount);
  await mongoose.disconnect();
  console.log('DONE_SUCCESS');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
