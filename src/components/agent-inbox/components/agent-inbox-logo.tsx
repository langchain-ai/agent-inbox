export const agentInboxSvg = (
  <svg
    width="200"
    height="40"
    viewBox="0 0 200 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cute Robot Character */}
    <g>
      {/* Robot Body */}
      <rect x="5" y="15" width="28" height="20" rx="8" fill="#FFB6D9" />

      {/* Robot Head */}
      <rect x="10" y="8" width="18" height="16" rx="6" fill="#FFD1E3" />

      {/* Robot Eyes */}
      <circle cx="15" cy="15" r="2.5" fill="#FF85B3" />
      <circle cx="23" cy="15" r="2.5" fill="#FF85B3" />
      <circle cx="15" cy="15" r="1" fill="#FFFFFF" />
      <circle cx="23" cy="15" r="1" fill="#FFFFFF" />

      {/* Cute Smile */}
      <path d="M 14 19 Q 19 21 24 19" stroke="#FF85B3" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Antenna */}
      <line x1="19" y1="8" x2="19" y2="5" stroke="#FFB6D9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="4" r="2" fill="#A8E6CF" />

      {/* Heart on body */}
      <path d="M 19 22 L 21 20 Q 22 19 22.5 20 Q 23 21 22 22 L 19 25 L 16 22 Q 15 21 15.5 20 Q 16 19 17 20 Z" fill="#FFFFFF" opacity="0.7" />

      {/* Robot Arms */}
      <rect x="2" y="20" width="4" height="10" rx="2" fill="#FFD1E3" />
      <rect x="32" y="20" width="4" height="10" rx="2" fill="#FFD1E3" />

      {/* Blush */}
      <circle cx="12" cy="18" r="1.5" fill="#FF85B3" opacity="0.3" />
      <circle cx="26" cy="18" r="1.5" fill="#FF85B3" opacity="0.3" />
    </g>

    {/* Cute Text */}
    <text x="42" y="22" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="700" fill="#FFB6D9">
      Agent Inbox
    </text>
    <text x="42" y="32" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500" fill="#A8E6CF">
      by Cute AI
    </text>

    {/* Decorative Stars */}
    <path d="M 165 10 L 166 12 L 168 12 L 166.5 13.5 L 167 15.5 L 165 14 L 163 15.5 L 163.5 13.5 L 162 12 L 164 12 Z" fill="#FFD1E3" />
    <path d="M 180 25 L 181 27 L 183 27 L 181.5 28.5 L 182 30.5 L 180 29 L 178 30.5 L 178.5 28.5 L 177 27 L 179 27 Z" fill="#A8E6CF" />
    <path d="M 195 15 L 196 17 L 198 17 L 196.5 18.5 L 197 20.5 L 195 19 L 193 20.5 L 193.5 18.5 L 192 17 L 194 17 Z" fill="#FFB6D9" />
  </svg>
);
