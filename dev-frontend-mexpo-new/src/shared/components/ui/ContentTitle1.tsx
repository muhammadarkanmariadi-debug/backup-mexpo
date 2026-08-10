"use client";
import { motion } from "framer-motion";
import React from "react";

type ContentTitleProps = {
  title: string;
  spanText: string;
  description: string;
};

const ContentTitle1 = ({ title, spanText, description }: ContentTitleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center my-8 sm:my-12 md:my-16 lg:my-8 px-4 sm:px-6 md:px-8 text-center"
    >
      <h1 className="max-w-7xl font-public-sans font-extrabold text-black text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight sm:leading-tight md:leading-tight lg:leading-tight">
        {title} <span className="text-secondary">{spanText}</span>
      </h1>
      <p className="mt-3 sm:mt-4 max-w-3xl font-jakarta text-gray-600 text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export default ContentTitle1;