import React from 'react';

interface LuxuryLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'dark' | 'white';
}

export const LuxuryLogo: React.FC<LuxuryLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'gold'
}) => {
  const sizes = {
    sm: { container: 'w-8 h-8' },
    md: { container: 'w-12 h-12' },
    lg: { container: 'w-24 h-24' },
    xl: { container: 'w-36 h-36' }
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <div className={`relative flex items-center justify-center ${selectedSize.container} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-all duration-500"
      >
        <defs>
          <linearGradient id="luxuryGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA73" />
            <stop offset="50%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#9E7B35" />
          </linearGradient>
          <linearGradient id="luxuryDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#222222" />
            <stop offset="100%" stopColor="#0B0B0B" />
          </linearGradient>
        </defs>

        {/* Outer glowing atmospheric rings */}
        <circle
          cx="50"
          cy="50"
          r="47"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="0.5"
          strokeDasharray="4 2"
          className="opacity-40"
        />
        <circle
          cx="50"
          cy="50"
          r="43"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1"
          className="opacity-70"
        />

        {/* Outer Hexagon frame for perfume geometry */}
        <path
          d="M50 14 L81 32 L81 68 L50 86 L19 68 L19 32 Z"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1"
          className="opacity-80 animate-pulse"
          style={{ animationDuration: '4s' }}
        />

        {/* Luxury Perfume Bottle Structure */}
        {/* Cap (Crown) */}
        <rect
          x="42"
          y="22"
          width="16"
          height="6"
          rx="1"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1.5"
          fill="none"
        />
        <line
          x1="45" y1="25" x2="55" y2="25"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1"
        />
        
        {/* Neck */}
        <rect
          x="46"
          y="28"
          width="8"
          height="6"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Bottle Body */}
        <path
          d="M32 34 H68 V72 C68 75.5 65.5 78 62 78 H38 C34.5 78 32 75.5 32 72 V34 Z"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Inner Chamber with scent liquid representation */}
        <path
          d="M36 38 H64 V68 C64 70 62.5 71.5 60.5 71.5 H39.5 C37.5 71.5 36 70 36 68 V38 Z"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="0.75"
          fill={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
          className="opacity-30"
        />

        {/* Intricate monogram "S" in center */}
        <path
          d="M46 48 C46 44, 54 44, 54 48 C54 51, 46 51, 46 54 C46 58, 54 58, 54 54"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Intersecting fine lines (molecular rings / lab aesthetic) */}
        <circle
          cx="50"
          cy="51"
          r="11"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="0.5"
          strokeDasharray="2 1"
          className="opacity-50"
        />

        {/* Scent mist / souls radiating from the bottle top */}
        <path
          d="M50 22 C50 18, 46 16, 46 12 C46 8, 50 6, 50 6"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="0.75"
          strokeLinecap="round"
          className="opacity-60"
        />
        <path
          d="M48 22 C48 19, 42 18, 42 14 C42 10, 47 8, 47 8"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="0.5"
          strokeLinecap="round"
          className="opacity-40"
        />
        <path
          d="M52 22 C52 19, 58 18, 58 14 C58 10, 53 8, 53 8"
          stroke={variant === 'gold' ? 'url(#luxuryGoldGrad)' : variant === 'white' ? '#FFFFFF' : '#0F0F0F'}
          strokeWidth="0.5"
          strokeLinecap="round"
          className="opacity-40"
        />
      </svg>
    </div>
  );
};
