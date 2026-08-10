import React from 'react'
import { motion } from 'framer-motion'

const CoreValue = ({coreValues}: {coreValues: any}) => {
  return (
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="mb-16"
>
    <h2 className="mb-2 font-public-sans font-bold text-center text-gray-900 text-xl sm:text-2xl md:text-3xl">
        Our Core <span className="text-secondary">Values</span>
    </h2>
    <p className="mx-auto mb-8 max-w-2xl font-jakarta text-center text-gray-600 text-sm sm:text-base">
        The principles that guide every decision we make
    </p>
    <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {coreValues.map((value : any, index : any) => (
            <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex flex-col items-center bg-white hover:bg-secondary shadow-sm hover:shadow-md p-6 border border-gray-200 hover:border-secondary rounded-2xl text-center transition-all duration-300"
            >
                <div className="flex justify-center items-center bg-secondary/10 group-hover:bg-white/15 mb-4 rounded-full w-12 h-12 transition-colors duration-300">
                    <value.icon className="w-6 h-6 text-secondary group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-white text-sm sm:text-base transition-colors duration-300">
                    {value.title}
                </h3>
                <p className="text-gray-500 group-hover:text-white/75 text-xs sm:text-sm leading-relaxed transition-colors duration-300">
                    {value.description}
                </p>
            </motion.div>
        ))}
    </div>
</motion.div>
  )
}

export default CoreValue