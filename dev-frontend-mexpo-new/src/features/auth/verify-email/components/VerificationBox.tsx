"use client";
import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, Frown, Mail } from "lucide-react";
import { toast } from "sonner";
import Button from "@/shared/components/button/Button";
import Input from "@/shared/components/form/Input";
import { useSearchParams } from "next/navigation";
import { verify } from "../verify-email.actions";
import { resendVerificationEmail } from "../../../../services/verify-email.service";

const VerificationBox = () => {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const [isVerified, setisVerified] = useState(false)
    const [email, setEmail] = useState("")
    const [resending, setResending] = useState(false)

    const handleVerify = useCallback(async () => {
        try {
            const response = await verify(token || "")
            if (response.success) {
                setisVerified(true)
                toast.success(response.message)
            }
        } catch {
            toast.error(`Terjadi Kesalahan Server`)
        }
    }, [token])

    const handleverifyEmail = async () => {
        if (!email.trim()) {
            toast.error("Masukkan email terlebih dahulu.");
            return;
        }
        setResending(true);
        try {
            const res = await resendVerificationEmail(email.trim());
            if (res.status) {
                toast.success("Email verifikasi terkirim", {
                    description: "Periksa kotak masuk email Anda.",
                    duration: 5000,
                });
            } else {
                toast.error("Gagal mengirim email verifikasi", {
                    description: res.message || "Silakan coba lagi nanti.",
                    duration: 5000,
                });
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time verification on mount
        handleVerify()
    }, [handleVerify])


    return token ? isVerified ? (<div className='flex flex-col gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:px-8 xl:w-120'>
        <div className='flex flex-col justify-center items-center mt-12 sm:mt-16 md:mt-20 text-center'>
            <CheckCircle className='mx-auto mb-3 sm:mb-4 w-20 sm:w-24 md:w-28 lg:w-30 h-20 sm:h-24 md:h-28 lg:h-30 text-secondary' />
            <h1 className='font-extrabold text-secondary text-xl sm:text-2xl md:text-3xl xl:text-4xl'>
                Email Berhasil Diverifikasi!
            </h1>
            <p className='mt-3 sm:mt-4 max-w-md sm:max-w-lg md:max-w-xl font-medium text-gray-600 text-xs sm:text-sm md:text-base xl:text-lg'>
                Kami telah mengirim tautan verifikasi ke email Anda. Periksa
                tautan tersebut untuk mengaktifkan akun Anda.
            </p>
        </div>
        <div className='flex flex-col gap-3 sm:gap-4 mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl'>
            <h1 className='p-2 sm:p-2 border border-secondary rounded-xl sm:rounded-2xl text-secondary text-base sm:text-lg text-center'>
                Selamat Datang di <span className='font-extrabold'>MEXPO</span>
            </h1>
            <Button variant='primary' href='/auth' className='font-semibold'>
                Masuk
            </Button>
        </div>
    </div>) : (<div className='flex flex-col gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:px-8 xl:w-120'>
        <div className='flex flex-col justify-center items-center mt-12 sm:mt-16 md:mt-20 text-center'>
            <Frown className='mx-auto mb-3 sm:mb-4 w-20 sm:w-24 md:w-28 lg:w-30 h-20 sm:h-24 md:h-28 lg:h-30 text-secondary' />
            <h1 className='font-extrabold text-secondary text-xl sm:text-2xl md:text-3xl xl:text-4xl'>
                Verifikasi Email Gagal!
            </h1>
            <p className='mt-3 sm:mt-4 max-w-md sm:max-w-lg md:max-w-xl font-medium text-gray-600 text-xs sm:text-sm md:text-base xl:text-lg'>
                Maaf, kami tidak dapat memverifikasi alamat email Anda.
            </p>
        </div>
        <div className='flex flex-col gap-3 sm:gap-4 mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl'>
            <Button variant='primary' href='/auth' className='font-semibold'>
                Buat akun lain
            </Button>
        </div>
    </div>) : (<div className="flex flex-col gap-4 mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-lg">
        <div className="xl:text-left text-center">
            <div className="xl:flex text-secondary">
                <Mail className="hidden xl:block mr-2 w-8 lg:w-10 h-8 lg:h-10" />
                <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl xl:text-4xl" >
                    Periksa Email Anda
                </h1>
            </div >
            <p className="mt-3 sm:mt-4 font-medium text-gray-600 text-xs sm:text-sm md:text-base xl:text-lg">
                Kami telah mengirim tautan verifikasi ke email Anda. Periksa tautan
                tersebut untuk mengaktifkan akun Anda.
            </p>
        </div >

        <div className="flex justify-center items-center">
            <Mail className="xl:hidden w-16 sm:w-20 md:w-24 lg:w-28 h-16 sm:h-20 md:h-24 lg:h-28 text-secondary" />
        </div>

        <div className="flex flex-col gap-2 xl:text-left text-center">
            <h4 className="font-semibold text-base sm:text-lg md:text-xl">
                Tidak menerima email?
            </h4>
            <p className="text-gray-600 text-sm sm:text-base">
                Periksa folder spam atau masukkan email Anda lalu klik tombol di
                bawah untuk mengirim ulang email verifikasi.
            </p>
            <Input
                type="email"
                id="resend-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resending}
            />
            <Button
                variant="primary"
                onClick={handleverifyEmail}
                className="font-semibold"
            >
                {resending ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
            </Button>
        </div>
    </div >)
};

export default VerificationBox;
