import { Link } from "react-router-dom";
import logoHanger from "@/assets/logo-hanger.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: { icon: "w-5 h-5", text: "text-base" },
    md: { icon: "w-6 h-6", text: "text-lg" },
    lg: { icon: "w-8 h-8", text: "text-xl" },
    xl: { icon: "w-12 h-12", text: "text-2xl" },
    "2xl": { icon: "w-16 h-16", text: "text-3xl" },
  };

  return (
    <Link 
      to="/" 
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      <img 
        src={logoHanger} 
        alt="FitVision Logo" 
        className={sizeClasses[size].icon}
      />
      {showText && (
        <span className={`font-display font-bold gradient-text ${sizeClasses[size].text}`}>
          FitVision
        </span>
      )}
    </Link>
  );
};

export default Logo;
