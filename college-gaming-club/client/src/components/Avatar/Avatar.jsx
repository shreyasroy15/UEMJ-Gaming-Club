import React from 'react';

/**
 * Avatar Component
 * Displays user avatar with fallback to initials-based avatar with deterministic gradient colors
 * 
 * Props:
 * - user: User object with username, name, avatar properties
 * - src: Direct image URL (takes precedence over user.avatar)
 * - size: 'xs' | 'sm' | 'md' | 'lg' (default: 'md')
 * - className: Additional CSS classes
 */

// Generate deterministic color gradient based on username hash
const generateGradientColor = (text) => {
  if (!text) return 'from-blue-400 to-blue-600';

  // Simple hash function for string
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const colorPairs = [
    'from-cyan-400 to-blue-600',       // Cyan to Blue
    'from-blue-400 to-indigo-600',     // Blue to Indigo
    'from-indigo-400 to-purple-600',   // Indigo to Purple
    'from-purple-400 to-pink-600',     // Purple to Pink
    'from-pink-400 to-red-600',        // Pink to Red
    'from-red-400 to-orange-600',      // Red to Orange
    'from-orange-400 to-amber-600',    // Orange to Amber
    'from-amber-400 to-yellow-600',    // Amber to Yellow
    'from-yellow-400 to-lime-600',     // Yellow to Lime
    'from-lime-400 to-green-600',      // Lime to Green
    'from-green-400 to-emerald-600',   // Green to Emerald
    'from-emerald-400 to-teal-600',    // Emerald to Teal
  ];

  const index = Math.abs(hash) % colorPairs.length;
  return colorPairs[index];
};

// Size mapping for Tailwind classes
const sizeClasses = {
  xs: { container: 'w-6 h-6', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-12 h-12', text: 'text-lg' },
};

export default function Avatar({ user, src, size = 'md', className = '' }) {
  // Get initial letter from username or name
  const getInitial = () => {
    const name = user?.username || user?.name || 'P';
    return name.charAt(0).toUpperCase();
  };

  // Check if image URL is valid
  const hasValidImage = src || user?.avatar;

  const sizeConfig = sizeClasses[size] || sizeClasses.md;
  const gradientColor = generateGradientColor(user?.username || user?.name || '');

  return (
    <div
      className={`
        ${sizeConfig.container}
        relative
        inline-flex
        items-center
        justify-center
        rounded-full
        font-bold
        overflow-hidden
        ${className}
        ${!hasValidImage ? `bg-gradient-to-br ${gradientColor}` : 'bg-gray-200'}
      `}
    >
      {hasValidImage ? (
        <img
          src={src || user?.avatar}
          alt={user?.username || user?.name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.parentElement.textContent = getInitial();
          }}
        />
      ) : (
        <span className={`${sizeConfig.text} text-white select-none`}>
          {getInitial()}
        </span>
      )}
    </div>
  );
}
