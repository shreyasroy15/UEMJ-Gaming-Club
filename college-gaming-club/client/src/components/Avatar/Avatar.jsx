import React, { useState } from 'react';

/**
 * Avatar Component
 * Displays user avatar with fallback to capitalized first-letter avatar with esports gradient colors.
 * Automatically filters out legacy placeholder images and handles loading errors gracefully.
 *
 * Props:
 * - user: User object with username, name, avatar properties
 * - src: Direct image URL (takes precedence over user.avatar)
 * - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'md')
 * - className: Additional CSS classes for the container
 * - imgClassName: Additional CSS classes for the image
 * - textSize: Optional explicit text size override
 */

// Generate deterministic color gradient based on string hash
const generateGradientColor = (text) => {
  if (!text) return 'from-purple-600 via-indigo-600 to-cyan-500';

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients = [
    'from-purple-600 via-indigo-600 to-cyan-500',
    'from-cyan-500 via-blue-600 to-indigo-700',
    'from-emerald-500 via-teal-600 to-cyan-600',
    'from-rose-500 via-pink-600 to-purple-600',
    'from-amber-500 via-orange-600 to-rose-600',
    'from-blue-600 via-indigo-600 to-violet-700',
  ];

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const sizeClasses = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-base' },
  xl: { container: 'w-16 h-16 sm:w-20 sm:h-20', text: 'text-xl sm:text-2xl' },
  '2xl': { container: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-2xl sm:text-3xl' },
};

export default function Avatar({
  user,
  src,
  size = 'md',
  className = '',
  imgClassName = '',
  textSize,
}) {
  const rawSrc = src || user?.avatar;
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [rawSrc]);

  // Capitalized first letter of Name or Username
  const rawName = (user?.name || user?.username || 'Player').trim();
  const firstLetter = rawName.charAt(0).toUpperCase() || 'P';

  const isOldPlaceholder = Boolean(rawSrc && rawSrc.includes('photo-1566492031773-4f4e44671857'));
  const hasValidImage = Boolean(rawSrc && !isOldPlaceholder && !imgError);

  const sizeConfig = sizeClasses[size] || sizeClasses.md;
  const gradientColor = generateGradientColor(user?.username || user?.name || '');
  const resolvedTextSize = textSize || sizeConfig.text;

  return (
    <div
      className={`
        ${sizeConfig.container}
        relative
        inline-flex
        items-center
        justify-center
        rounded-full
        font-mono
        font-black
        overflow-hidden
        shrink-0
        select-none
        ${className}
        ${!hasValidImage ? `bg-gradient-to-tr ${gradientColor} shadow-md` : 'bg-slate-900'}
      `}
    >
      {hasValidImage ? (
        <img
          src={rawSrc}
          alt={rawName}
          className={`w-full h-full object-cover rounded-full ${imgClassName}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${resolvedTextSize} font-black text-white tracking-tighter drop-shadow-sm`}>
          {firstLetter}
        </span>
      )}
    </div>
  );
}
