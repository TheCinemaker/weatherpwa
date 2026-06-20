import React from 'react';

export default function Logo({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="weatherSunGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFE885" />
          <stop offset="100%" stop-color="#FF9500" />
        </linearGradient>
      </defs>
      
      {/* Styled sun behind the cloud */}
      <circle cx="62" cy="38" r="16" fill="url(#weatherSunGrad)" />
      
      {/* Sun rays */}
      <path d="M62 14V8" stroke="url(#weatherSunGrad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M79 21l4-4" stroke="url(#weatherSunGrad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M86 38h6" stroke="url(#weatherSunGrad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M79 55l4 4" stroke="url(#weatherSunGrad)" strokeWidth="4" strokeLinecap="round" />
      
      {/* Minimalist cloud in foreground */}
      <path
        d="M32 68h36c7.2 0 13-5.8 13-13c0-6.1-4.2-11.2-10-12.6c.1-.8.2-1.6.2-2.4c0-9.9-8.1-18-18-18c-7.9 0-14.7 5.1-17.1 12.2C34.3 33.4 30 38.2 30 44c0 .7.1 1.4.2 2C24.4 47.4 20 52.7 20 59c0 5 4 9 12 9z"
        fill="currentColor"
      />
    </svg>
  );
}

