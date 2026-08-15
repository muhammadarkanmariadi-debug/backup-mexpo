import { httpGet, httpPost } from "@/shared/utils/http-client";

export const verifyEmail = async (token: string) =>
    await httpGet(`users/verification/${token}`);

/** Resend the account verification email (backend POST /users/resend-verification, Basic guard). */
export const resendVerificationEmail = async (email: string) =>
    await httpPost(
        "users/resend-verification",
        JSON.stringify({ email }),
        "Basic",
    );