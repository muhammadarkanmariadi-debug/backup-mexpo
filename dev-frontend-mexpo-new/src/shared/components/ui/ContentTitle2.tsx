"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

type ContentTitle2Props = {
  category?: string;
  title?: string;
  prevSlide?: () => void;
  nextSlide?: () => void;
  variant?: "primary" | "secondary" | "tertiary";
};

const variantStyles = {
  primary:
    "border border-secondary text-secondary hover:bg-secondary hover:text-white",
  secondary:
    "bg-secondary text-white hover:bg-secondary/85",
};

const ContentTitle2 = ({
  category,
  title,
  prevSlide,
  nextSlide,
  variant,
}: ContentTitle2Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex sm:flex-row flex-col justify-between items-start sm:items-end gap-4 sm:gap-0 mb-6 sm:mb-8"
    >
      {/* Text Block */}
      <div className="w-full sm:w-auto">
        {category && (
          <p className="mb-1 font-medium text-gray-500 text-sm sm:text-base uppercase tracking-wide">
            {category}
          </p>
        )}
        <h2 className="font-bold text-secondary text-2xl sm:text-3xl leading-tight">
          {title}
        </h2>
        <div className="bg-secondary mt-2.5 rounded-full w-12 h-[2px]" />
      </div>

      {/* Nav Buttons */}
      {(variant === "primary" || variant === "secondary") && (
        <div className="flex items-center gap-2 sm:pb-1">
          <button
            onClick={prevSlide}
            className={`flex justify-center items-center rounded-xl w-10 sm:w-11 h-10 sm:h-11 transition-all duration-300 ${variantStyles[variant]}`}
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className={`flex justify-center items-center rounded-xl w-10 sm:w-11 h-10 sm:h-11 transition-all duration-300 ${variantStyles[variant]}`}
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ContentTitle2;