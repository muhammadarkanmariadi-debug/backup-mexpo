// src/services/cookies.ts
"use server";

import { cookies } from "next/headers";

export const getCookies = async (key: string): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value ?? "";
};

export const setCookies = async (key: string, value: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const deleteCookies = async (key: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(key);
};