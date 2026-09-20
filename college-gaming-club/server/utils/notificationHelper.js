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

    const tourneyId = tournament._id || tournament;
    const matchId = match._id || match;

    const notifications = Array.from(recipientUserIds).map((userId) => ({
      recipient: userId,
      title,
      message,
      type,
      link,
      tournament: tourneyId,
      match: matchId,
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

    const tourneyObj = tournament || registration.tournament;
    const tournamentIdentifier =
      tourneyObj?.slug ||
      tourneyObj?._id?.toString() ||
      (typeof tourneyObj === 'string' ? tourneyObj : '');
    const link = `/tournaments/${tournamentIdentifier}/register`;

    const isRejected = status === 'rejected';
    const teamTitleName = registration.teamName || 'Squad';
    const tourneyName = tourneyObj?.name || 'Tournament';

    const cleanReason = reason && reason.trim() ? reason.trim() : 'You need to upload all proofs by merging in a single PDF.';

    const title = isRejected
      ? `❌ Document Verification Rejected: ${teamTitleName}`
      : `✅ Team Verified & Approved: ${teamTitleName}`;

    const message = isRejected
      ? `Verification for ${tourneyName} was rejected: "${cleanReason}". Tap here to re-upload your merged squad document.`
      : `Congratulations! Team "${teamTitleName}" has been verified and approved for ${tourneyName}. Your squad is now an active team!`;

    const notifType = isRejected ? 'verification_rejected' : 'verification_approved';
    const tourneyId = tourneyObj?._id || (typeof tourneyObj === 'string' ? tourneyObj : undefined);

    const notifications = Array.from(recipientUserIds).map((userId) => ({
      recipient: userId,
      title,
      message,
      type: notifType,
      link,
      tournament: tourneyId,
      isRead: false,
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Error in sendRegistrationVerificationNotification:', err);
  }
}

/**
 * Send notification to players and captains when their team is assigned to a lobby
 */
async function sendLobbyAssignmentNotification({
  tournament,
  lobby,
  stageName = '',
  teamIds = [],
}) {
  try {
    if (!tournament || !lobby || !Array.isArray(teamIds) || teamIds.length === 0) return;

    const Match = require('../models/Match');

    // Find any scheduled round/match for this lobby to notify of scheduling
    const scheduledMatch = await Match.findOne({
      tournament: tournament._id,
      lobbyId: lobby._id,
    }).sort({ matchNumber: 1, roundIndex: 1, scheduledAt: 1 });

    const registrations = await TournamentRegistration.find({
      _id: { $in: teamIds },
    }).select('captain leader players teamName');

    if (!registrations || registrations.length === 0) return;

    const tournamentIdentifier = tournament.slug || tournament._id;
    const link = `/tournaments/${tournamentIdentifier}?tab=matches`;
    const tourneyName = tournament.name || 'Tournament';
    const lobbyName = lobby.name || 'Lobby';

    let scheduleInfo = 'Check the Matches tab for upcoming round timings and room credentials!';
    if (scheduledMatch?.scheduledAt) {
      try {
        const timeStr = new Date(scheduledMatch.scheduledAt).toLocaleString([], {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        scheduleInfo = `Round 1 is scheduled for ${timeStr}. Get your squad ready!`;
      } catch (_) {}
    }

    const title = `⚔️ Assigned to ${lobbyName} • ${tourneyName}`;
    const message = `Your squad has been assigned to ${lobbyName}${stageName ? ` (${stageName})` : ''}. ${scheduleInfo}`;

    const notifications = [];
    registrations.forEach((reg) => {
      const userIds = new Set();
      if (reg.captain) userIds.add(reg.captain.toString());
      if (reg.leader) userIds.add(reg.leader.toString());
      (reg.players || []).forEach((p) => {
        const uId = p.user?._id || p.user;
        if (uId) userIds.add(uId.toString());
      });

      userIds.forEach((uId) => {
        notifications.push({
          recipient: uId,
          title,
          message,
          type: 'match_update',
          link,
          tournament: tournament._id,
          match: scheduledMatch?._id,
          isRead: false,
        });
      });
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Error in sendLobbyAssignmentNotification:', err);
  }
}

module.exports = {
  sendMatchNotification,
  sendRegistrationVerificationNotification,
  sendLobbyAssignmentNotification,
};
