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

module.exports = { sendMatchNotification };
