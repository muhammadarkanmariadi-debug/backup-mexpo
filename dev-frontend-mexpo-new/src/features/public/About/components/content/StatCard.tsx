import CountUp from "react-countup";
import { motion } from "framer-motion";
import { StatItem } from "../../homepage.types";

export const StatCard = ({ stats }: { stats: StatItem[] }) => (
 <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="mb-2 font-public-sans font-bold text-center text-gray-900 text-xl sm:text-2xl md:text-3xl">
            Platform <span className="text-secondary">Statistics</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl font-jakarta text-center text-gray-600 text-sm sm:text-base">
            Numbers that reflect our growing community and impact
          </p>
          <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-3">
            {stats.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative flex flex-col justify-between bg-white hover:bg-secondary shadow-sm hover:shadow-xl p-6 border border-gray-100 hover:border-secondary rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Decorative accent */}
                <div className="top-0 left-0 absolute bg-secondary rounded-l-2xl w-1 h-full transition-colors duration-300" />

                <div className="pl-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-secondary/10 group-hover:bg-white/15 p-2 rounded-xl transition-colors duration-300">
                      <item.icon/>
                    </div>
                  </div>
                  <h3 className="font-bold tabular-nums text-secondary group-hover:text-white text-3xl sm:text-4xl leading-none transition-colors duration-300">
                    <span className="flex items-end gap-0.5">
                      <CountUp
                        start={0}
                        end={item.value}
                        duration={2.5}
                        separator=","
                        enableScrollSpy
                        scrollSpyOnce
                      />
                      <span className="mb-0.5 text-xl sm:text-2xl">{item.suffix}</span>
                    </span>
                  </h3>
                  <div className="bg-secondary/30 group-hover:bg-white/40 mt-3 mb-2 rounded-full w-8 h-[2px] transition-colors duration-300" />
                  <p className="text-gray-500 group-hover:text-white/80 text-sm leading-relaxed transition-colors duration-300">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
);