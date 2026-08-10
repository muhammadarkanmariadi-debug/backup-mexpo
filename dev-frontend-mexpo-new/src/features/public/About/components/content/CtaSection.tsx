import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
const CtaSection = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-secondary/5 to-secondary/15 shadow-sm px-6 sm:px-10 py-12 border border-gray-200 rounded-3xl text-center"
        >
            <h2 className="mb-3 font-public-sans font-bold text-gray-900 text-xl sm:text-2xl md:text-3xl">
                Trusted by <span className="text-secondary">Professionals</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
                Join a network of over{" "}
                <strong className="text-secondary">3,500+ active managers</strong>{" "}
                who rely on MEXPO to deliver flawless events.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <button className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 shadow-md px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:shadow-lg">
                    Join the Community
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button className="hover:bg-secondary/5 px-6 py-3 border border-secondary rounded-xl font-semibold text-secondary text-sm transition-all duration-300">
                    Contact Team
                </button>
            </div>
        </motion.div>
    )
}

export default CtaSection