
import ContentTitle1 from "@/shared/components/ui/ContentTitle1";
import { icon } from "@fortawesome/fontawesome-svg-core";
import {
  Calendar,
  CheckCircle,
  House,
  QrCode,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import React from "react";

const RegistrationFlow = () => {
  const RegistrationFlow = [
    {
      id: 1,
      title: "Register & Login",
      icon: <UserPlus className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-white" />,
      description:
        "Create your account or log in to access the registration portal and manage your event details",
    },
    {
      id: 2,
      icon: <QrCode className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-white" />,
      title: "Get QR Code",
      description:
        "Receive a personal QR Code that will be used for check-in, booth visits, and seminar access.",
    },
    {
      id: 3,
      icon: <House className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-white" />,
      title: "Attend & Participate",
      description:
        "Use the QR Code to check in, visit tenants, join seminars, and receive digital certificates.",
    },
  ];

  return (
    <section className="py-8 sm:py-10 md:py-14 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-400">
        <ContentTitle1
          spanText="Flow"
          title="Event Registration "
          description="Follow the steps below to complete your registration and participate in the event."
        />
        <div className="flex lg:flex-row flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          {RegistrationFlow.map((flow) => (
            <div
              key={flow.id}
              className="flex lg:flex-row flex-col items-center lg:gap-2"
            >
              <div className="p-4 sm:p-6 md:p-8 rounded-xl text-center transition">
                <div className="flex justify-center items-center bg-secondary mx-auto mb-3 sm:mb-4 md:mb-6 rounded-xl sm:rounded-2xl w-16 sm:w-20 md:w-25 h-16 sm:h-20 md:h-25">
                  {flow.icon}
                </div>

                <h3 className="mb-2 sm:mb-3 font-bold text-gray-900 text-base sm:text-lg md:text-xl">
                  {flow.title}
                </h3>
                <p className="mx-auto max-w-[16rem] sm:max-w-[18rem] text-gray-600 text-xs sm:text-sm">{flow.description}</p>
              </div>

              {flow.id != 3 && (
                <Image
                  src={"/images/shape/pattern5.png"}
                  alt="pattern"
                  width={200}
                  height={100}
                  className="my-4 sm:my-6 md:my-8 lg:my-20 w-16 sm:w-20 md:w-24 lg:w-auto rotate-90 lg:rotate-0"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegistrationFlow;
