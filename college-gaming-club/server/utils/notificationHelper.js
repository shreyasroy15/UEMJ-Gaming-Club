const Notification = require('../models/Notification');
const TournamentRegistration = require('../models/TournamentRegistration');

/**
 * Send notification to players and captains of the teams in a match
 */
async function sendMatchNotification({
  match,
  tournament,
  title,
  message,
  type = 'match_update',
  customLink = null,
}) {
  try {
    if (!match || !tournament) return;

    // Extract team IDs assigned to this match
    const teamIds = (match.teams || []).map((t) => (t._id || t).toString());
    if (teamIds.length === 0) return;

    // Fetch team registrations to retrieve captains, leaders, and players
    const registrations = await TournamentRegistration.find({
      _id: { $in: teamIds },
    }).select('captain leader players teamName');

    const recipientUserIds = new Set();

    registrations.forEach((reg) => {
      if (reg.captain) recipientUserIds.add(reg.captain.toString());
      if (reg.leader) recipientUserIds.add(reg.leader.toString());
      (reg.players || []).forEach((p) => {
        if (p.user) recipientUserIds.add(p.user.toString());
      });
    });

    if (recipientUserIds.size === 0) return;

    const tournamentIdentifier = tournament.slug || tournament._id;
    const link =
      customLink ||
      `/tournaments/${tournamentIdentifier}?tab=${type === 'match_results' ? 'leaderboard' : 'matches'}`;

    const notifications = Array.from(recipientUserIds).map((userId) => ({
      recipient: userId,
      title,
      message,
      type,
      link,
      tournament: tournament._id,
      match: match._id,
      isRead: false,
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Error in sendMatchNotification:', err);
  }
}

/**
 * Send notification to squad members when team registration/documents are verified or rejected
 */
async function sendRegistrationVerificationNotification({
  registration,
  tournament,
  status, // 'verified' | 'rejected'
  reason = '',
}) {
  try {
    if (!registration) return;

    const recipientUserIds = new Set();
    if (registration.captain) {
      recipientUserIds.add(registration.captain._id ? registration.captain._id.toString() : registration.captain.toString());
    }
    if (registration.leader) {
      recipientUserIds.add(registration.leader._id ? registration.leader._id.toString() : registration.leader.toString());
    }
    (registration.players || []).forEach((p) => {
      const uId = p.user?._id || p.user;
      if (uId) recipientUserIds.add(uId.toString());
    });

    if (recipientUserIds.size === 0) return;

    const tournamentIdentifier = tournament?.slug || tournament?._id || registration.tournament?.slug || registration.tournament?._id || registration.tournament;
    const link = `/tournaments/${tournamentIdentifier}/register`;

    const isRejected = status === 'rejected';
    const teamTitleName = registration.teamName || 'Squad';
    const tourneyName = tournament?.name || registration.tournament?.name || 'Tournament';

    const title = isRejected
      ? `❌ Document Verification Rejected: ${teamTitleName}`
      : `✅ Team Verified & Approved: ${teamTitleName}`;

    const message = isRejected
      ? `Verification for ${tourneyName} was rejected: "${reason || 'All proofs must be merged into a single PDF.'}". Tap here to re-upload your merged squad document.`
      : `Congratulations! Team "${teamTitleName}" has been verified and approved for ${tourneyName}. Your squad is now an active team!`;

    const notifType = isRejected ? 'verification_rejected' : 'verification_approved';

    const notifications = Array.from(recipientUserIds).map((userId) => ({
      recipient: userId,
      title,
      message,
      type: notifType,
      link,
      tournament: tournament?._id || registration.tournament?._id || registration.tournament,
      isRead: false,
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Error in sendRegistrationVerificationNotification:', err);
  }
}

module.exports = { sendMatchNotification, sendRegistrationVerificationNotification };
