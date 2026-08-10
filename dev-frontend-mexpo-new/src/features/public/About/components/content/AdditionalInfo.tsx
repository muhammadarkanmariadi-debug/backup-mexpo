
import ContentTitle1 from "@/shared/components/ui/ContentTitle1";
import { MapIcon, Phone, TagIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

const AdditionalInfo = () => {
  const AdditionalInfo = [
    {
      id: 1,
      title: "Customer Support",
      description:
        "Aliquam erat volutpat. Integer malesuada turpis id fringilla suscipit. Maecenas ultrices.",
      icon: <Phone className="w-5 h-5 sm:w-6 sm:h-6 font-semibold text-white" />,
    },
    {
      id: 2,
      title: "Best Price Guarantted",
      description:
        "Aliquam erat volutpat. Integer malesuada turpis id fringilla suscipit. Maecenas ultrices.",
      icon: <TagIcon className="w-5 h-5 sm:w-6 sm:h-6 font-semibold text-white" />,
    },
    {
      id: 3,
      title: "Many Locations",
      description:
        "Aliquam erat volutpat. Integer malesuada turpis id fringilla suscipit. Maecenas ultrices.",
      icon: <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 font-semibold text-white" />,
    },
  ];
  return (
    <section className="bg-white py-10 sm:py-14 md:py-16 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <ContentTitle1
          title="Exhibition"
          spanText="Registration System"
          description="A centralized platform for managing exhibition access, booth visits, seminars, and workshops using a single QR code.  "
        />
        <div className="items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 grid grid-cols-1 md:grid-cols-2">
          <div className="bg-secondary rounded-2xl w-full max-w-full aspect-square sm:aspect-auto sm:h-72 md:h-80 lg:h-[32rem] xl:h-[32rem]">
            <Image
              src={"/images/carousel/carousel-01.png"}
              alt="pattern"
              width={600}
              height={200}
              className="rounded-2xl w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {AdditionalInfo.map((info) => (
              <div key={info.id} className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex flex-shrink-0 justify-center items-center bg-secondary p-3 sm:p-4 rounded-lg">
                  {info.icon}
                </div>
                <div>
                  <h3 className="mb-1 sm:mb-2 font-jakarta font-bold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl">
                    {info.title}
                  </h3>
                  <p className="font-jakarta text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdditionalInfo;
