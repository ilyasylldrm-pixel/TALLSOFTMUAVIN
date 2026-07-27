import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showText = true,
  size = "md",
  variant = "default",
}) => {
  const iconSizes = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const textColor = variant === "light" ? "text-white" : "text-[#8252F6]";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon Symbol */}
      <svg
        viewBox="0 0 100 100"
        className={`${iconSizes[size]} aspect-square shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top 3 Bars in Vibrant Violet */}
        <rect x="0" y="5" width="100" height="15" rx="2" fill={variant === "light" ? "#ffffff" : "#8252F6"} />
        <rect x="0" y="27" width="100" height="15" rx="2" fill={variant === "light" ? "#ffffff" : "#8252F6"} />
        <rect x="0" y="49" width="100" height="15" rx="2" fill={variant === "light" ? "#ffffff" : "#8252F6"} />
        {/* Indented 4th Bar in Vibrant Violet */}
        <rect x="42" y="71" width="58" height="15" rx="2" fill={variant === "light" ? "#e0e0e0" : "#8252F6"} />
        {/* Indented 5th Bar in Vibrant Orange */}
        <rect x="42" y="93" width="58" height="15" rx="2" fill="#EF7D2C" />
      </svg>

      {/* Brand Text MUAV!N */}
      {showText && (
        <div className="flex items-center tracking-tight leading-none font-sans select-none">
          <span className={`${textColor} ${textSizes[size]} font-semibold tracking-tight`}>MUAV</span>
          <span className={`text-[#EF7D2C] ${textSizes[size]} font-semibold mx-[0.5px]`}>!</span>
          <span className={`${textColor} ${textSizes[size]} font-semibold tracking-tight`}>N</span>
        </div>
      )}
    </div>
  );
};
