import { Link } from "react-router-dom";
import LogoIcon from "./LogoIcon";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: { icon: "w-8 h-6", text: "text-base" },
    md: { icon: "w-10 h-7", text: "text-lg" },
    lg: { icon: "w-12 h-9", text: "text-xl" },
    xl: { icon: "w-16 h-12", text: "text-2xl" },
    "2xl": { icon: "w-24 h-18", text: "text-3xl" },
  };

  return (
    <Link 
      to="/" 
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      <LogoIcon className={sizeClasses[size].icon} />
      {showText && (
        <span className={`font-display font-bold gradient-text ${sizeClasses[size].text}`}>
          FitVision
        </span>
      )}
    </Link>
  );
};

export default Logo;
