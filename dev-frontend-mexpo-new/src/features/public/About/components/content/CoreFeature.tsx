import { motion } from "framer-motion";
export const CoreFeature = ({
  feature,
}: {
  feature: any;
}) => (
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="mb-2 font-public-sans font-bold text-center text-gray-900 text-xl sm:text-2xl md:text-3xl">
            Core <span className="text-secondary">Features</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl font-jakarta text-center text-gray-600 text-sm sm:text-base">
            Everything you need to run professional events seamlessly
          </p>
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
            {feature.map((f : any, index :any) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex gap-4 bg-white hover:bg-secondary shadow-sm hover:shadow-xl p-5 border border-gray-100 hover:border-secondary rounded-2xl transition-all duration-300"
              >
                <div className="flex flex-shrink-0 justify-center items-center bg-secondary/8 group-hover:bg-white/15 rounded-xl w-10 h-10 text-secondary group-hover:text-white transition-all duration-300">
                  {f.icon}
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900 group-hover:text-white text-sm sm:text-base transition-colors duration-300">
                    {f.title}
                  </h4>
                  <p className="text-gray-500 group-hover:text-white/75 text-xs sm:text-sm leading-relaxed transition-colors duration-300">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
);
