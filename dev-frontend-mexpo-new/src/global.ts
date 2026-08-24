
export const BASE_DOMAIN =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_BASE_URL_DEVELOPMENT || "http://localhost:3500")
    : (process.env.NEXT_PUBLIC_BASE_URL_PRODUCTION || "https://mexpo-api.smktelkom-mlg.sch.id");
// export const BASE_DOMAIN =
//   process.env.NEXT_PUBLIC_BASE_URL_PRODUCTION ||
//   "http://localhost:3000";
export const BASE_API_URL = `${BASE_DOMAIN}`;

export const BASIC_AUTH_USERNAME =
  process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME || "";
export const BASIC_AUTH_PASSWORD =
  process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD || "";

export const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || "";

export const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
  process.env.MIDTRANS_CLIENT_KEY ||
  "SB-Mid-client-IiW5j-bppphCXvWE";
export const MIDTRANS_IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
  process.env.MIDTRANS_IS_PRODUCTION === "true";

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
