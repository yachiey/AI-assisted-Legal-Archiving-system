import { motion } from "framer-motion";

const RightBanner = () => {
    return (
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center relative px-4 sm:px-6 lg:p-0">
            {/* Soft glow behind the video */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <div className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] xl:w-[750px] xl:h-[750px] bg-gradient-to-br from-green-200/40 via-yellow-100/30 to-green-300/20 rounded-full blur-[60px] sm:blur-[80px]" />
            </motion.div>

            {/* Main video container with animated border */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative w-full max-w-[92vw] sm:max-w-[500px] lg:max-w-[650px] xl:max-w-[800px] 2xl:max-w-[1000px] z-10"
            >
                {/* Gradient border ring */}
                <div className="absolute -inset-[2px] sm:-inset-[3px] rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-green-700 via-yellow-500 to-green-800 opacity-60" />

                {/* Inner container */}
                <div className="relative rounded-2xl sm:rounded-[1.9rem] lg:rounded-[2.4rem] overflow-hidden bg-white shadow-[0_15px_50px_rgba(27,94,32,0.15)] sm:shadow-[0_25px_80px_rgba(27,94,32,0.2)]">
                    <video
                        src="/Video/0214.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-auto object-cover aspect-video"
                    />

                    {/* Bottom gradient fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                    {/* Corner accent badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 1.8, type: "spring", stiffness: 200 }}
                        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg border border-green-100"
                    >
                        <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold text-green-900 tracking-wide">CMU LEGAL</span>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default RightBanner;
