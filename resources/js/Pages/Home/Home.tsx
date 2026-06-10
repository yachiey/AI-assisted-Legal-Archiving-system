import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { motion } from "framer-motion";
import Navbar from "../../Components/Public Navbar";
import Banner from "../../Components/HeroSection/Hero/Banner";
import About from "../../Components/About/About";
import News from "../../Components/News";
import Contact from "../../Components/Contact/Contact";
import FooterBottom from "../../Components/Footer/FooterBottom";
import LoginModal from "../../Components/Modal/Login";
import ScrollReveal from "../../Components/Common/ScrollReveal";



export default function Home() {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check for existing session on component mount
    useEffect(() => {
        const checkExistingSession = () => {
            const currentUser = sessionStorage.getItem("currentUser");

            if (currentUser) {
                try {
                    const user = JSON.parse(currentUser);
                    console.log("Existing session found:", user);

                    // Redirect to appropriate dashboard based on user role
                    if (user.role === "Admin") {
                        router.visit("/admin/dashboard");
                    } else {
                        router.visit("/tenant/dashboard");
                    }
                    return; // Don't show loading if redirecting
                } catch (error) {
                    console.error("Error parsing stored user session:", error);
                    // Clear invalid session data
                    sessionStorage.removeItem("currentUser");
                }
            }

            // Show loading screen for new users
            const timeout = setTimeout(() => {
                setLoading(false);
            }, 1000); // Reduced loading time for better UX

            return () => clearTimeout(timeout);
        };

        checkExistingSession();
    }, []);

    // Function to handle login click with session check
    const handleLoginClick = () => {
        const currentUser = sessionStorage.getItem("currentUser");

        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                console.log("User already logged in, redirecting...");

                // Redirect to appropriate dashboard
                if (user.role === "Admin") {
                    router.visit("/admin/dashboard");
                } else {
                    router.visit("/tenant/dashboard");
                }
            } catch (error) {
                console.error("Error parsing stored user session:", error);
                // Clear invalid session and show login modal
                sessionStorage.removeItem("currentUser");
                setShowLogin(true);
            }
        } else {
            // No existing session, show login modal
            setShowLogin(true);
        }
    };

    // if (loading) return <Loading />;

    return (
        <>
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            <div className="min-h-screen flex flex-col relative bg-gray-50/50">
                {/* Modern subtle background pattern */}
                <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#00491e 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

                <Navbar
                    onLoginClick={handleLoginClick}
                    onRegisterClick={() => setShowRegister(true)}
                />
                <main className="flex-1 w-full">
                    <ScrollReveal delay={0.1}>
                        <Banner onLoginClick={handleLoginClick} />
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <About />
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <News />
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <Contact />
                    </ScrollReveal>
                </main>
                <FooterBottom />
            </div>
        </>
    );
}

