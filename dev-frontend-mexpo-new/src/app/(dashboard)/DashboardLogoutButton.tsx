"use client";

import { logoutAction } from "@/features/auth/auth";
import { LogOut } from "lucide-react";

export default function DashboardLogoutButton() {
  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/auth";
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Keluar
    </button>
  );
}
