import React from 'react';

// 1. Icon Only Component
export function GramConnectIcon({ size = 28, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Blue Shield Shoulder (Right Contour) */}
      <path 
        d="M 50 15 C 65 15 80 20 80 42 C 80 50 78 58 72 65 C 68 70 60 76 50 85" 
        stroke="#2563EB" 
        strokeWidth="9" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Green Location Pin Hook (Left Contour) */}
      <path 
        d="M 50 15 C 32 15 20 28 20 46 C 20 62 36 74 50 85" 
        stroke="#16A34A" 
        strokeWidth="9" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Inner Blue Network/Pin Dot */}
      <circle 
        cx="43" 
        cy="40" 
        r="7.5" 
        fill="#2563EB" 
      />

      {/* Green Leaf Wrapping on Bottom-Right */}
      <path 
        d="M 50 85 C 65 78 78 68 80 53 C 80 43 70 41 62 45 C 55 49 48 60 50 85 Z" 
        fill="#16A34A"
      />
      {/* Green Leaf Stem vein */}
      <path 
        d="M 50 85 C 56 75 66 65 74 56" 
        stroke="#FFFFFF" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}

// 2. Horizontal Logo Component (Icon + Typography)
export function GramConnectHorizontal({ size = 32 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <GramConnectIcon size={size} />
      <span style={{ 
        fontFamily: "'Poppins', 'Inter', sans-serif", 
        fontSize: `${size * 0.75}px`, 
        fontWeight: 800, 
        letterSpacing: '-0.02em', 
        lineHeight: 1 
      }}>
        <span style={{ color: '#16A34A' }}>Gram</span>
        <span style={{ color: '#2563EB' }}>Connect</span>
      </span>
    </div>
  );
}

// 3. Square App Icon Component
export function GramConnectAppIcon({ size = 120 }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      background: '#FFFFFF',
      borderRadius: `${size * 0.22}px`, // iOS standard rounding
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(229, 231, 235, 0.5)'
    }}>
      <GramConnectIcon size={size * 0.55} />
    </div>
  );
}

// 4. Monochrome Icon & Text lockup Component
export function GramConnectMonochrome({ size = 32, dark = true }) {
  const color = dark ? '#0F172A' : '#FFFFFF';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        {/* Shield Shoulder */}
        <path 
          d="M 50 15 C 65 15 80 20 80 42 C 80 50 78 58 72 65 C 68 70 60 76 50 85" 
          stroke={color} 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Pin Hook */}
        <path 
          d="M 50 15 C 32 15 20 28 20 46 C 20 62 36 74 50 85" 
          stroke={color} 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Inner Dot */}
        <circle 
          cx="43" 
          cy="40" 
          r="7.5" 
          fill={color} 
        />
        {/* Leaf */}
        <path 
          d="M 50 85 C 65 78 78 68 80 53 C 80 43 70 41 62 45 C 55 49 48 60 50 85 Z" 
          fill={color}
        />
        {/* Leaf stem line (contrast cutout) */}
        <path 
          d="M 50 85 C 56 75 66 65 74 56" 
          stroke={dark ? '#FFFFFF' : '#0F172A'} 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
      </svg>
      <span style={{ 
        fontFamily: "'Poppins', 'Inter', sans-serif", 
        fontSize: `${size * 0.75}px`, 
        fontWeight: 800, 
        letterSpacing: '-0.02em', 
        lineHeight: 1,
        color: color
      }}>
        GramConnect
      </span>
    </div>
  );
}
