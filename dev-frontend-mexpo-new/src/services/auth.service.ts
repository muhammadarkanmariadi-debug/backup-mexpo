import { httpLogin, httpPost } from "@/shared/utils/http-client";
import { LoginFormData, RegisterFormData } from "../features/auth/auth/auth.schema";

export const login = async (payload: LoginFormData) =>
    await httpLogin("auth", JSON.stringify(payload), "Basic");

export const register = async (payload: RegisterFormData) =>
    await httpPost("users", JSON.stringify(payload), "Basic");
