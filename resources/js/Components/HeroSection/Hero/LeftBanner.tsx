import { motion } from "framer-motion";
import { useTypewriter, Cursor } from "react-simple-typewriter";

interface NavbarProps {
    onLoginClick: () => void;
}
const LeftBanner: React.FC<NavbarProps> = ({ onLoginClick }) => {

    const [text] = useTypewriter({
        words: [
            "Central Mindanao University",
            "University Legal Counsel.",
            "Management System.",
        ],
        loop: true,
        typeSpeed: 20,
        deleteSpeed: 10,
        delaySpeed: 2000,
    });
    return (
        <motion.div
            className="w-full lg:w-1/2 flex flex-col gap-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
        >
            {/* Bento-style Premium Container */}
            <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_32px_70px_rgba(27,94,32,0.1)] transition-all duration-700 relative overflow-hidden group">
                {/* Subtle highlight effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="flex flex-col gap-8 relative z-10">
                    <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                        Legal <span className="text-green-800">Archiving</span> <br />
                       
                    </h1>

                    <div className="h-12">
                        <h2 className="text-2xl lg:text-3xl font-bold text-green-900 flex items-center gap-2">
                            <span className="w-2 h-10 bg-yellow-500 rounded-full inline-block"></span>
                            <span>{text}</span>
                            <Cursor
                                cursorBlinking={true}
                                cursorStyle="_"
                                cursorColor="#ca8a04" // yellow-600
                            />
                        </h2>
                    </div>

                    <p className="text-lg lg:text-xl text-gray-700 leading-relaxed max-w-xl font-medium">
                        Enterprise-grade legal document management with AI-powered retrieval,
                        designed for precision and speed in university legal offices.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 mt-12 relative z-10">
                    <button
                        onClick={onLoginClick}
                        className="bg-green-800 text-white px-12 py-5 rounded-2xl font-bold hover:bg-green-900 border-b-4 border-yellow-600 shadow-xl shadow-green-900/20 transform hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-center gap-4 group text-lg"
                    >
                        GET STARTED
                        <span className="group-hover:translate-x-2 transition-transform text-2xl text-yellow-400">→</span>
                    </button>

                    <div className="flex items-center gap-4 px-6 text-sm font-semibold text-gray-500">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        Trusted by CMU Legal Office
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default LeftBanner;
