import React, { useState } from "react";
import axios from "axios";
import Modal from "../../../../Layouts/ModalLayout";
import { motion, AnimatePresence } from "framer-motion";

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isDisabled = !email.trim() || !password.trim();

    const handleLogin = async () => {
        if (!email || !password) return;

        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post("/login", { email, password });
            const data = response.data;

            if (data.access_token) {
                localStorage.setItem("auth_token", data.access_token);
            }

            // Success Transition
            setIsSuccess(true);

            // Redirect back to dashboard after animation
            setTimeout(() => {
                window.location.href = "/admin/dashboard";
            }, 1200);

        } catch (error: any) {
            console.error("Login error:", error);
            const message = error.response?.data?.message || "An error occurred. Please try again.";
            setError(message);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isDisabled && !isLoading) {
            handleLogin();
        }
    };

    return (
        <Modal>
            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.div
                        key="login-form"
                        initial={{ opacity: 1 }}
                        exit={{
                            y: -100,
                            opacity: 0,
                            scale: 0.9,
                            transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
                        }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-2xl font-black text-gray-400 hover:text-red-500 transition-colors"
                            disabled={isLoading}
                        >
                            ×
                        </button>

                        <div className="flex flex-col gap-2 mb-8">
                            <h2 className="text-3xl font-black text-gray-900 leading-tight">
                                Legal Office <br />
                                <span className="text-green-800">Portal Login</span>
                            </h2>
                            <p className="text-gray-500 font-medium">
                                Please login with your credentials
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs uppercase font-black text-gray-400 tracking-widest pl-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="admin@legal.edu.ph"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isLoading}
                                    className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-green-800 focus:ring-4 focus:ring-green-800/5 outline-none transition-all placeholder:text-gray-300 font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs uppercase font-black text-gray-400 tracking-widest pl-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={isLoading}
                                        className="w-full px-5 py-4 pr-12 rounded-2xl bg-white border-2 border-gray-100 focus:border-green-800 focus:ring-4 focus:ring-green-800/5 outline-none transition-all placeholder:text-gray-300 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-800 disabled:opacity-50 transition-colors"
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isDisabled || isLoading}
                                onClick={handleLogin}
                                className={`w-full py-4 mt-4 rounded-2xl font-black tracking-widest uppercase transition-all duration-300 shadow-xl border-b-4 ${isDisabled || isLoading
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "bg-green-800 text-white border-yellow-600 hover:bg-green-900 hover:-translate-y-1 active:translate-y-0"
                                    }`}
                            >
                                {isLoading ? "Authenticating..." : "Login to Dashboard"}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="text-4xl text-green-700"
                            >
                                ✓
                            </motion.span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Login Successful</h2>
                        <p className="text-gray-500 font-medium">Preparing your legal portal...</p>

                        <motion.div
                            className="mt-8 flex gap-1"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Modal>
    );
};


export default LoginModal;
