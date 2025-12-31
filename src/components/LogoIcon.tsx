interface LogoIconProps {
  className?: string;
}

const LogoIcon = ({ className = "w-8 h-8" }: LogoIconProps) => {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="hangerGradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5B2EFF"/>
          <stop offset="100%" stopColor="#FF4FA3"/>
        </linearGradient>
      </defs>
      {/* Hook */}
      <path
        d="M100 20
           C100 8, 120 8, 120 22
           C120 36, 92 34, 92 54"
        stroke="url(#hangerGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Hanger body */}
      <path
        d="M30 90
           L100 50
           L170 90
           L30 90"
        stroke="url(#hangerGradient)"
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default LogoIcon;
