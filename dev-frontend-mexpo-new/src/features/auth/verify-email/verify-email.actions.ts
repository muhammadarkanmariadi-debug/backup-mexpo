import { verifyEmail } from "../../../services/verify-email.service";

export interface AuthActionResult<T = any> {
    success: boolean;
    message: string;

}
export const verify = async (token: any): Promise<AuthActionResult> => {
    try {
        const result = await verifyEmail(token)

        if (!result.status) {
            return { success: false, message: result.message || "Gagal Verifikasi" };
        }
        return { success: true, message: result.message || "Verifikasi Sukses", };
    } catch {
        return { success: false, message: "Terjadi kesalahan server" };
    }
}