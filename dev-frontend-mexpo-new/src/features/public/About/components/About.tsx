"use client";

import { motion } from "framer-motion";
import {
  QrCode,
  BarChart3,
  Users,
  Zap,
  ShieldCheck,
  Lightbulb,
  Shield,
  Bolt,
  Heart,
  ArrowRight,
  TrendingUp,
  CalendarCheck,
  UserCheck,
} from "lucide-react";


import ContentTitle1 from "@/shared/components/ui/ContentTitle1";
import Hero from "./content/Hero";
import { StatCard } from "./content/StatCard";
import { CoreFeature } from "./content/CoreFeature";
import CoreValue from "./content/CoreValue";
import CtaSection from "./content/CtaSection";


const stats = [
  {
    id: 1,
    value: 120,
    suffix: "+",
    title: "Events Managed",
    icon: CalendarCheck,
  },
  {
    id: 2,
    value: 3500,
    suffix: "+",
    title: "Active Users",
    icon: UserCheck,
  },
  {
    id: 3,
    value: 150,
    suffix: "+",
    title: "Daily Signups",
    icon: TrendingUp,
  },
];

const features = [
  {
    icon: <QrCode className="w-5 h-5" />,
    title: "QR Check-in",
    description:
      "Replacing paper lists and slow queues with instant QR check-ins for seamless entry.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Analytics",
    description:
      "Real-time analytics that actually mean something in the moment to optimize flow.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Participant Management",
    description:
      "Centralized database for all attendee information, preferences, and communication.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Setup Cepat",
    description:
      "Rapid deployment capabilities allowing you to launch events in minutes, not days.",
  },
];

const coreValues = [
  {
    icon: ShieldCheck,
    title: "Reliability",
    description: "Systems that stay up when the pressure is highest.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Constantly refining the logistics workflow.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Enterprise-grade protection for sensitive attendee data.",
  },
  {
    icon: Bolt,
    title: "Efficiency",
    description: "Minimizing clicks to maximize operational speed.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-8 max-w-6xl">

        <ContentTitle1
          title="About "
          spanText="MEXPO"
          description="We build professional-grade tools for organizers who demand precision, reliability, and sanity in high-pressure environments."
        />

        {/* ─── Our Story ─── */}
        <Hero />

        {/* ─── Platform Statistics ─── */}
        <StatCard stats={stats} />

        {/* ─── Core Features ─── */}
        <CoreFeature feature={features} />

        {/* ─── Core Values ─── */}
        <CoreValue coreValues={coreValues} />


        {/* ─── Trusted by Professionals (CTA) ─── */}
        <CtaSection />



      </div>
    </div>
  );
};

export default About;