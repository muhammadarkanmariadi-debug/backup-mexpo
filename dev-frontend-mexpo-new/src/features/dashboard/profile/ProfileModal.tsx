"use client";

import { useState } from "react";
import { KeyRound, Mail, UserRound, type LucideIcon } from "lucide-react";

import { Modal } from "@/shared/components/ui/Modal";
import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import ChangeEmailForm from "./ChangeEmailForm";

type Section = "profil" | "password" | "email";

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "profil", label: "Profil", icon: UserRound },
  { id: "password", label: "Kata Sandi", icon: KeyRound },
  { id: "email", label: "Email", icon: Mail },
];

/**
 * Profile popup — replaces the /profile page. Opens from the Navbar user menu
 * and holds three panels: edit profile / change password / change email.
 */
export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [section, setSection] = useState<Section>("profil");

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        setSection("profil");
        onClose();
      }}
      title="Profil Saya"
      maxWidth="max-w-lg"
    >
      <div className="mb-5 flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Menu profil">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              section === id
                ? "bg-white text-secondary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {section === "profil" && <ProfileForm />}
      {section === "password" && <ChangePasswordForm />}
      {section === "email" && <ChangeEmailForm />}
    </Modal>
  );
}