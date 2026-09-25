/**
 * Utility functions for consistent date & time formatting across the Gaming Club app.
 */

// Format full date and time: e.g. "Oct 5, 2026 • 06:30 PM"
export const formatTournamentDateTime = (dateVal) => {
  if (!dateVal) return 'TBD';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'TBD';

  const datePart = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timePart = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} • ${timePart}`;
};

// Format short date and time: e.g. "Oct 5, 6:30 PM"
export const formatShortDateTime = (dateVal) => {
  if (!dateVal) return 'TBD';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'TBD';

  const datePart = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
};

// Format time only: e.g. "06:30 PM"
export const formatTimeOnly = (dateVal) => {
  if (!dateVal) return 'TBD';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'TBD';

  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Convert any date to 'YYYY-MM-DDTHH:mm' in LOCAL timezone for <input type="datetime-local" />
export const toLocalDatetimeInput = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
