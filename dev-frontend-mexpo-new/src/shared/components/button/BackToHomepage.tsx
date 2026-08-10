"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const BackToHomepage = () => {
  const pathname = usePathname();
  const hideRoutes = "/events";
  if (pathname.startsWith(hideRoutes)) {
    return null;
  }


  
  return (
    <span className="bg-secondary xl:bg-transparent p-10 xl:p-5 rounded-none rounded-b-xl w-full">
      <Link
        href="/"
        className="flex items-center text-white xl:hover:text-gray-700 xl:text-gray-500 hover:text-gray-100 dark:hover:text-gray-300 dark:text-gray-400 text-sm sm:text-base md:text-lg transition-colors"
      >
        <ArrowLeft className="mr-1.5 sm:mr-2 w-5 sm:w-6 h-5 sm:h-6" />
        Back to homepage
      </Link>
    </span>
  );
};

export default BackToHomepage;
