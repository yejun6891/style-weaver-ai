import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: { icon: "w-5 h-5", text: "text-base" },
    md: { icon: "w-6 h-6", text: "text-lg" },
    lg: { icon: "w-8 h-8", text: "text-xl" },
  };

  return (
    <Link 
      to="/" 
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={sizeClasses[size].icon}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hangerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
          </linearGradient>
        </defs>
        {/* Hanger hook */}
        <path
          d="M12 2C10.5 2 9 3 9 4.5C9 5.5 9.5 6 10 6.5"
          stroke="url(#hangerGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Hanger body */}
        <path
          d="M12 7L4 14H20L12 7Z"
          stroke="url(#hangerGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Hanger bar */}
        <path
          d="M4 14H20"
          stroke="url(#hangerGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className={`font-display font-bold gradient-text ${sizeClasses[size].text}`}>
          FitVision
        </span>
      )}
    </Link>
  );
};

export default Logo;
