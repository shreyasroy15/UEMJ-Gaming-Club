// Utility for generating deterministic capitalized first-letter avatars

const AVATAR_COLORS = [
  '7c3aed', // Purple
  '06b6d4', // Cyan
  '059669', // Emerald
  'e11d48', // Rose
  'ea580c', // Orange
  '2563eb', // Blue
  'd97706', // Amber
  '9333ea', // Violet
];

const getCapitalLetterAvatarUrl = (name, username) => {
  const displayName = (name || username || 'Player').trim();
  const firstLetter = displayName.charAt(0).toUpperCase();
  
  let hash = 0;
  const str = (username || name || 'player').toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=${color}&color=ffffff&size=256&bold=true&font-size=0.6`;
};

module.exports = {
  getCapitalLetterAvatarUrl,
  AVATAR_COLORS,
};
