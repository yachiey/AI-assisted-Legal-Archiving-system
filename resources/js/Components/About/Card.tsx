import { motion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi";

// eslint-disable-next-line react/prop-types
const Card = ({ title, des, icon }) => {
    return (
        <motion.div
            whileHover={{
                y: -10,
                scale: 1.02,
                boxShadow: "0 25px 60px -15px rgba(21, 128, 61, 0.15)"
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-8 py-12 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] transition-all duration-300 group"
        >
            <div className="flex flex-col h-full justify-between gap-8">
                <div className="flex items-start">
                    <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-green-50 text-green-800 text-4xl group-hover:bg-yellow-500 group-hover:text-green-950 transition-all duration-500 shadow-sm">
                        {icon}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                        {title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        {des}
                    </p>
                </div>

                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "35%" }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        className="h-full bg-yellow-500 rounded-full"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default Card;
