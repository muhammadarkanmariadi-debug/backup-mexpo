import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "secondary" | "ghost"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  href?: string; // Link href
  type?: "button" | "submit" | "reset"; // Button type
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  href,
  type = "button",
}) => {
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  const variantClasses = {
    primary:
      "bg-secondary text-white font-public-sans shadow-theme-xs hover:bg-secondary/80 disabled:bg-brand-300",
    secondary:
      "bg-white font-public-sans text-black hover:b disabled:bg-primary/80 disabled:text-gray-400",
    ghost:
      "bg-transparent font-public-sans text-black hover:bg-gray-100 disabled:bg-transparent disabled:text-gray-400",
  };

  return (
    <>
      {href ? (
        <a
          href={href}
          className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} ${
            sizeClasses[size]
          } ${variantClasses[variant]} ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {children}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </a>
      ) : (
        <button
          type={type}
          className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} ${
            sizeClasses[size]
          } ${variantClasses[variant]} ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
          onClick={onClick}
          disabled={disabled}
        >
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {children}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </button>
      )}
    </>
  );
};

export default Button;
