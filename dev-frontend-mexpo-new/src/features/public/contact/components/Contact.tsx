

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'


import ContentTitle1 from '@/shared/components/ui/ContentTitle1'
import Input from '@/shared/components/form/Input'
import { contactInfo } from '../contact.data'
import { submitContactAction } from '../contact.action'
import { toast } from 'sonner'



export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Real submit via server action (FIX-20): validates and opens the
        // visitor's mail client pre-filled with the message. No fake success.
        const result = await submitContactAction(formData)
        if (result.success && result.mailto) {
            window.location.href = result.mailto
            toast.success(result.message)
            setFormData({ name: '', email: '', subject: '', message: '' })
        } else {
            toast.error(result.message)
        }
        setIsSubmitting(false)
    }


    return (
        <div className="min-h-screen">
            <div className="mx-auto px-4 py-8 max-w-6xl">



                <ContentTitle1
                    title="Hubungi "
                    spanText='Kami'
                    description="Punya pertanyaan atau butuh bantuan? Tim kami siap membantu Anda"
                />

                <div className="gap-8 grid lg:grid-cols-2">

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white shadow-sm p-8 border border-gray-200 rounded-3xl"
                    >
                        <h2 className="mb-6 font-bold text-gray-900 text-2xl">
                            Kirim Pesan
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block mb-2 font-medium text-gray-700 text-sm">
                                    Nama Lengkap
                                </label>
                                <Input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full text-gray-900"
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-medium text-gray-700 text-sm">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full text-gray-900"
                                    placeholder="Masukkan email"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-medium text-gray-700 text-sm">
                                    Subjek
                                </label>
                                <Input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full text-gray-900"
                                    placeholder="Tentang apa pesan Anda?"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-medium text-gray-700 text-sm">
                                    Pesan
                                </label>
                                <Input
                                    type="text-area"
                                    required

                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full text-gray-900 resize-none"
                                    placeholder="Tulis pesan Anda di sini..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex justify-center items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 py-4 rounded-xl w-full font-semibold text-white transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Kirim Pesan
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Contact Cards */}
                        <div className="space-y-14">
                            {contactInfo.map((info, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="bg-white shadow-sm hover:shadow-md p-6 border border-gray-200 rounded-2xl transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="bg-brand-100 p-3 rounded-xl">
                                            <info.icon className="w-6 h-6 text-brand-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{info.title}</h3>
                                            <p className="font-medium text-brand-500">{info.value}</p>
                                            <p className="text-gray-500 text-sm">{info.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>




                    </motion.div>
                </div>
                <div className="p-4">
                    <h1 className="mb-4 font-bold text-2xl"></h1>


                    <div>
                  
                        <div className="shadow-sm border border-border-light rounded-lg h-[200px] overflow-hidden">
                            <iframe
                                title="Kantor Mexpo"
                                src="https://www.google.com/maps?q=SMK%20Telkom%20Malang%20Jl.%20Danau%20Ranau%20Sawojajar&output=embed"
                                className="grayscale-[20%] border-0 w-full h-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
