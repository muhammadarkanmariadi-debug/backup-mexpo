"use server";
import { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD } from "../../global"
import { getCookies } from "./cookies";

export const encodeBasicAuth = async (): Promise<string> => {

  const credentials = `${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`;
  return Buffer.from(credentials).toString("base64");
};

export const resolveAuthHeader = async (credential?: string): Promise<string> => {
  if (!credential) return "";

  if (credential === "Basic") return `Basic ${await encodeBasicAuth()}`;

  const token = await getCookies(credential);
  return `Bearer ${token}`;
};

