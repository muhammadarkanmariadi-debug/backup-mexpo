"use client";

import React, { FC, useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

interface InputProps {
  type?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;

  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
hint?: string;
  label?: string;
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
  required?: boolean;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,

  className = "",
  label,
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  endIcon,
  startIcon,
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 CRITICAL: Check if it's a date/time input
  const isDateTimeInput = [
    "date",
    "time",
    "datetime-local",
    "month",
    "week",
  ].includes(type);

  // 🔥 BASE STYLE - Build classes dynamically
  let inputClasses = `
    h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs
    placeholder:text-gray-400
    bg-white 
    focus:outline-hidden focus:ring-3
    dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30
  `.trim();

  // 🔥 CRITICAL FIX: JANGAN tambahkan appearance-none untuk date/time
  // appearance-none akan menyembunyikan native date picker
  if (!isDateTimeInput) {
    inputClasses += " appearance-none";
  }

  // Add custom className
  if (className) {
    inputClasses += ` ${className}`;
  }

  // 🔥 STATE STYLE
  if (disabled) {
    inputClasses += `
      text-gray-500 border-gray-300 cursor-not-allowed
      dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700
    `.trim();
  } else if (error) {
    inputClasses += `
      text-error-800 border-error-500
      focus:ring-error-500/10
      dark:text-error-400 dark:border-error-500
    `.trim();
  } else if (success) {
    inputClasses += `
      text-success-500 border-success-400
      focus:ring-success-500/10 focus:border-success-300
      dark:text-success-400 dark:border-success-500
    `.trim();
  } else {
    inputClasses += `
      bg-white text-gray-800 border-gray-300
      focus:border-brand-300 focus:ring-brand-500/10
      dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800
    `.trim();
  }

  // ================= TEXTAREA =================
  if (type === "text-area") {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={name} className="font-medium text-sm text-gray-700 dark:text-gray-200 block mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <textarea
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          autoComplete={name}
          disabled={disabled}
          className={`${inputClasses} h-32 resize-none`}
          required={required}
        />

        {hint && (
          <p
            className={`mt-1.5 text-xs ${error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500"
              }`}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-2">
      {label && (
        <label htmlFor={name} className="font-medium text-sm text-gray-700 dark:text-gray-200 block mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {startIcon && (
          <span className="left-3 absolute text-gray-400">{startIcon}</span>
        )}

        <input
          required={required}
          type={type === "password" && showPassword ? "text" : type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={startIcon ? `${inputClasses} pl-10` : inputClasses}
        />

        {/* PASSWORD TOGGLE */}
        {type === "password" && (
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="right-4 z-10 absolute cursor-pointer"
          >
            {showPassword ? (
              <Eye className="size-5 text-gray-600" />
            ) : (
              <EyeClosed className="size-5 text-gray-600" />
            )}
          </span>
        )}

        {/* END ICON - JANGAN tampilkan untuk date/time karena akan overlap dengan picker icon */}
        {endIcon && type !== "password" && !isDateTimeInput && (
          <span className="right-4 absolute text-gray-500">{endIcon}</span>
        )}
      </div>

      {hint && (
        <p
          className={`mt-1.5 text-xs ${error
            ? "text-error-500"
            : success
              ? "text-success-500"
              : "text-gray-500"
            }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
