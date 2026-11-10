"use client";
import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, Frown, Mail, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Button from "@/shared/components/button/Button";
import Input from "@/shared/components/form/Input";
import { useSearchParams } from "next/navigation";
import { verify } from "../verify-email.actions";
import { resendVerificationEmail, checkAccountStatus } from "../../../../services/verify-email.service";
import { useAuthStore } from "@/stores/auth.store";

const VerificationBox = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const paramEmail = searchParams.get('email');
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(!!token);
    const [isVerified, setIsVerified] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [email, setEmail] = useState(() => paramEmail || user?.email || "");
    const [resending, setResending] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [statusResult, setStatusResult] = useState<{
        checked: boolean;
        is_verified?: boolean;
        message?: string;
    } | null>(null);

    const handleVerify = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage("");
        try {
            const response = await verify(token);
            if (response.success) {
                setIsVerified(true);
                toast.success(response.message || "Email berhasil diverifikasi!");
            } else {
                setIsVerified(false);
                setErrorMessage(response.message || "Tautan verifikasi tidak valid atau sudah kedaluwarsa.");
                toast.error(response.message || "Gagal verifikasi email");
            }
        } catch {
            setIsVerified(false);
            setErrorMessage("Terjadi kesalahan server saat memverifikasi akun.");
            toast.error("Terjadi Kesalahan Server");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleCheckStatus = async () => {
        const targetEmail = email.trim();
        if (!targetEmail) {
            toast.error("Masukkan email terlebih dahulu untuk mengecek status akun.");
            return;
        }

        setCheckingStatus(true);
        try {
            const res = await checkAccountStatus(targetEmail);
            const data = (res?.data ?? {}) as {
                is_verified?: boolean;
                registered?: boolean;
                message?: string;
            };

            const isSuccess = Boolean(res.status);
            const isVerified = Boolean(data.is_verified);
            const isRegistered = Boolean(data.registered ?? isVerified);
            const message = data.message || res.message || "";

            if (isSuccess && isRegistered) {
                setStatusResult({
                    checked: true,
                    is_verified: isVerified,
                    message: message,
                });

                if (isVerified) {
                    setIsVerified(true);
                    toast.success(message || "Akun Anda sudah aktif dan terverifikasi!");
                } else {
                    toast.error(message || "Akun belum aktif. Silakan lakukan verifikasi email terlebih dahulu.");
                }
            } else if (isSuccess && !isRegistered) {
                setStatusResult({
                    checked: true,
                    is_verified: false,
                    message: message || "Email belum terdaftar di sistem.",
                });
                toast.error(message || "Email belum terdaftar.");
            } else {
                toast.error(res.message || "Gagal memeriksa status akun.");
            }
        } catch (error) {
            toast.error((error as Error)?.message ?? "Gagal memeriksa status akun.");
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleVerifyEmail = async () => {
        const targetEmail = email.trim();
        if (!targetEmail) {
            toast.error("Masukkan email terlebih dahulu.");
            return;
        }
        setResending(true);
        try {
            const res = await resendVerificationEmail(targetEmail);
            if (res.status) {
                toast.success("Email verifikasi terkirim", {
                    description: "Periksa kotak masuk atau folder spam email Anda.",
                    duration: 5000,
                });
            } else {
                const msgLower = (res.message || "").toLowerCase();
                const isAlreadyVerified =
                    msgLower.includes("already verified") ||
                    msgLower.includes("sudah aktif") ||
                    msgLower.includes("sudah terverifikasi") ||
                    msgLower.includes("sudah diverifikasi");

                if (isAlreadyVerified) {
                    setIsVerified(true);
                    setStatusResult({
                        checked: true,
                        is_verified: true,
                        message: "Akun Anda sudah aktif dan terverifikasi.",
                    });
                    toast.success("Akun Anda sudah aktif dan terverifikasi!");
                } else {
                    toast.error("Gagal mengirim email verifikasi", {
                        description: res.message || "Silakan coba lagi nanti.",
                        duration: 5000,
                    });
                }
            }
        } catch (error) {
            toast.error("Terjadi kesalahan", {
                description: (error as Error)?.message ?? "Kesalahan tidak diketahui",
                duration: 5000,
            });
        } finally {
            setResending(false);
        }
    };

    useEffect(() => {
        if (token) {
            handleVerify();
        }
    }, [token, handleVerify]);

    // 1. Loading State saat proses verifikasi token
    if (loading) {
        return (
            <div className="flex flex-col gap-6 sm:gap-8 items-center justify-center px-4 py-16 text-center max-w-lg mx-auto">
                <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
                    <Loader2 className="w-10 h-10 text-secondary animate-pulse absolute" />
                </div>
                <div className="space-y-3">
                    <h1 className="font-extrabold text-secondary text-2xl sm:text-3xl md:text-4xl">
                        Memverifikasi Akun...
                    </h1>
                    <p className="max-w-md font-medium text-gray-600 text-sm sm:text-base">
                        Sedang memeriksa status pendaftaran dan memvalidasi token verifikasi akun Anda. Mohon tunggu sebentar...
                    </p>
                </div>
            </div>
        );
    }

    // 2. Jika berhasil diverifikasi
    if (isVerified) {
        return (
            <div className="flex flex-col gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:px-8 xl:w-120 mx-auto">
                <div className="flex flex-col justify-center items-center mt-12 sm:mt-16 md:mt-20 text-center">
                    <CheckCircle className="mx-auto mb-3 sm:mb-4 w-20 sm:w-24 md:w-28 lg:w-30 h-20 sm:h-24 md:h-28 lg:h-30 text-emerald-500" />
                    <h1 className="font-extrabold text-secondary text-xl sm:text-2xl md:text-3xl xl:text-4xl">
                        Email Berhasil Diverifikasi!
                    </h1>
                    <p className="mt-3 sm:mt-4 max-w-md sm:max-w-lg md:max-w-xl font-medium text-gray-600 text-xs sm:text-sm md:text-base xl:text-lg">
                        Selamat! Akun Anda telah aktif dan siap digunakan. Silakan masuk untuk mulai mengeksplorasi MEXPO.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl">
                    <div className="p-3 border border-secondary/30 bg-secondary/5 rounded-xl text-secondary text-sm text-center">
                        Selamat Datang di <span className="font-extrabold">MEXPO</span>
                    </div>
                    <Button variant="primary" href="/auth" className="font-semibold flex items-center justify-center gap-2">
                        Masuk ke Akun <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    }

    // 3. Jika token ada tapi verifikasi gagal
    if (token && !isVerified) {
        return (
            <div className="flex flex-col gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:px-8 xl:w-120 mx-auto">
                <div className="flex flex-col justify-center items-center mt-12 sm:mt-16 md:mt-20 text-center">
                    <Frown className="mx-auto mb-3 sm:mb-4 w-20 sm:w-24 md:w-28 lg:w-30 h-20 sm:h-24 md:h-28 lg:h-30 text-rose-500" />
                    <h1 className="font-extrabold text-rose-600 text-xl sm:text-2xl md:text-3xl xl:text-4xl">
                        Verifikasi Akun Gagal
                    </h1>
                    <p className="mt-3 sm:mt-4 max-w-md sm:max-w-lg md:max-w-xl font-medium text-gray-600 text-xs sm:text-sm md:text-base">
                        {errorMessage || "Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan masukkan email Anda untuk mengirim tautan baru."}
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl">
                    <Input
                        type="email"
                        id="resend-email-failed"
                        placeholder="Masukkan email Anda"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={resending || checkingStatus}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleCheckStatus}
                            disabled={checkingStatus || resending}
                            className="font-semibold flex items-center justify-center gap-1.5"
                        >
                            {checkingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {checkingStatus ? "Memeriksa..." : "Cek Status"}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleVerifyEmail}
                            disabled={resending || checkingStatus}
                            className="font-semibold"
                        >
                            {resending ? "Mengirim..." : "Kirim Ulang"}
                        </Button>
                    </div>
                    <Button variant="outline" href="/auth" className="font-semibold mt-1">
                        Kembali ke Halaman Masuk
                    </Button>
                </div>
            </div>
        );
    }

    // 4. Tanpa token (Halaman 'Periksa Email Anda' setelah registrasi)
    return (
        <div className="flex flex-col gap-6 mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-lg">
            <div className="xl:text-left text-center">
                <div className="xl:flex text-secondary items-center">
                    <Mail className="hidden xl:block mr-2 w-8 lg:w-10 h-8 lg:h-10 shrink-0" />
                    <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl xl:text-4xl">
                        Periksa Email Anda
                    </h1>
                </div>
                <p className="mt-3 sm:mt-4 font-medium text-gray-600 text-xs sm:text-sm md:text-base">
                    Kami telah mengirim tautan verifikasi ke email Anda. Silakan buka tautan tersebut untuk mengaktifkan akun Anda sebelum masuk.
                </p>
            </div>

            <div className="flex justify-center items-center py-2">
                <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Mail className="w-10 h-10 text-secondary" />
                </div>
            </div>

            {statusResult && (
                <div className={`p-4 rounded-xl border text-sm ${statusResult.is_verified ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                    <p className="font-semibold">{statusResult.is_verified ? "Akun Anda Sudah Aktif & Terverifikasi!" : "Akun Belum Aktif"}</p>
                    <p className="mt-1 text-xs">{statusResult.message || (statusResult.is_verified ? "Silakan masuk ke akun Anda." : "Silakan cek kotak masuk email Anda atau kirim ulang tautan verifikasi.")}</p>
                    {statusResult.is_verified && (
                        <div className="mt-3">
                            <Button variant="primary" size="sm" href="/auth">Masuk Sekarang</Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-3 xl:text-left text-center bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100">
                <h4 className="font-semibold text-base sm:text-lg">
                    Cek Status atau Kirim Ulang
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                    Periksa folder spam atau masukkan email Anda di bawah untuk mengecek status pendaftaran akun atau mengirim ulang tautan verifikasi.
                </p>
                <Input
                    type="email"
                    id="resend-email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={resending || checkingStatus}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <Button
                        variant="secondary"
                        onClick={handleCheckStatus}
                        disabled={checkingStatus || resending}
                        className="font-semibold flex items-center justify-center gap-1.5"
                    >
                        {checkingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {checkingStatus ? "Memeriksa Status..." : "Cek Status Akun"}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleVerifyEmail}
                        disabled={resending || checkingStatus}
                        className="font-semibold"
                    >
                        {resending ? "Mengirim..." : "Kirim Ulang Email"}
                    </Button>
                </div>
            </div>

            <div className="text-center pt-2">
                <Button variant="ghost" href="/auth" className="text-xs text-gray-500 hover:text-gray-700">
                    ← Kembali ke Halaman Masuk
                </Button>
            </div>
        </div>
    );
};

export default VerificationBox;
