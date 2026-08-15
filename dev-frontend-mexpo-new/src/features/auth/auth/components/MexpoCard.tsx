"use client";
import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const MexpoCard = ({}) => {
  const pathname = usePathname();
  const hideRoutes = "/profile";
  if (pathname.startsWith(hideRoutes)) {
    return null;
  }
  return (
    <div className="hidden xl:flex flex-col bg-secondary px-6 sm:px-8 rounded-xl w-150 text-white">
      <Image
        src="/images/shape/pattern1.png"
        alt="Pola"
        width={300}
        height={400}
        className="w-full"
      />

      <div className="my-10 w-80">
        <h1 className="font-public-sans font-extrabold text-3xl sm:text-7xl">
          MEXPO
        </h1>
        <p className="font-public-sans text-lg sm:text-xl">
          Kelola event, pameran, atau expo Anda bersama MEXPO.
        </p>
      </div>
    </div>
  );
};

export default MexpoCard;
