import { httpGet } from "@/shared/utils/http-client";

export const verifyEmail = async (token: string) =>
    await httpGet(`users/verification/${token}`);