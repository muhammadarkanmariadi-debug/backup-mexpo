'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle, Search } from 'lucide-react'
import ContentTitle1 from '@/shared/components/ui/ContentTitle1'
import PageShell from '@/shared/components/ui/PageShell'
import { faqData } from '../faq.data'




const categories = ['Semua', 'Umum', 'Event', 'Penyewa', 'Lokakarya', 'Pembayaran']

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Semua')

    const filteredFAQs = faqData.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory === 'Semua' || faq.category === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen">
            <PageShell className="py-8">


                <ContentTitle1
                    title="Pertanyaan yang "
                    spanText='Sering Diajukan'
                    description="Temukan jawaban untuk pertanyaan yang sering diajukan tentang MEXPO"

                />

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-8"
                >
                    <Search className="top-1/2 left-4 absolute w-5 h-5 text-gray-400 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari pertanyaan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white shadow-sm py-4 pr-4 pl-12 border border-gray-200 focus:border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full text-gray-900"
                    />
                </motion.div>

                {/* Category Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 mb-8"
                >
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category
                                ? 'bg-brand-500 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </motion.div>

                {/* FAQ List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="flex justify-between items-center hover:bg-gray-50 px-6 py-5 w-full text-left transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="bg-brand-100 px-3 py-1 rounded-full font-medium text-brand-600 text-xs">
                                            {faq.category}
                                        </span>
                                        <span className="font-semibold text-gray-900">{faq.question}</span>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pt-4 pb-5 border-gray-100 border-t text-gray-600 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white py-12 border border-gray-200 rounded-2xl text-center">
                            <HelpCircle className="mx-auto mb-4 w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada pertanyaan yang cocok dengan pencarian Anda</p>
                        </div>
                    )}
                </motion.div>

            </PageShell>
        </div>
    )
}
