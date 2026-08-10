import React from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
const Hero = () => {
    return (
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-2 mb-16">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center"
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-secondary/10 p-2 rounded-xl">
                        <Heart className="w-5 h-5 text-secondary" />
                    </div>
                    <h2 className="font-public-sans font-bold text-gray-900 text-xl sm:text-2xl">
                        Our Story
                    </h2>
                </div>
                <p className="mb-4 font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
                    MEXPO was born out of frustration. After years of managing
                    complex corporate conferences, our founders realized that the
                    existing tools were fragmented, unreliable, and visually chaotic.
                </p>
                <p className="font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
                    We set out to create a unified system—one that prioritizes data
                    density over decorative fluff, and operational efficiency over
                    everything else. The result is a platform engineered for the
                    realities of live events: spotty Wi-Fi, last-minute changes, and
                    the absolute necessity of a seamless attendee experience.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center items-center bg-gradient-to-br from-secondary/5 to-secondary/15 shadow-sm p-8 sm:p-10 border border-gray-200 rounded-3xl min-h-[220px]"
            >
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-secondary/10 p-3 rounded-full">
                            <Heart className="w-8 h-8 text-secondary" />
                        </div>
                    </div>
                    <p className="font-public-sans font-bold text-gray-800 text-lg sm:text-xl md:text-2xl italic leading-relaxed">
                        &ldquo;We built the tool we desperately needed.&rdquo;
                    </p>
                    <p className="mt-3 font-jakarta text-gray-500 text-sm">
                        — The MEXPO Founders
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default Hero