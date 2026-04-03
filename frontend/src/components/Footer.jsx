import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Heart, ShieldCheck, Pill, Activity } from "lucide-react";

function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => !!localStorage.getItem("medVisionToken")
    );

    useEffect(() => {
        const check = () => setIsLoggedIn(!!localStorage.getItem("medVisionToken"));
        check();
        window.addEventListener("storage", check);
        return () => window.removeEventListener("storage", check);
    }, []);

    function emailHandler(e) {
        setEmail(e.target.value);
    }

    function submitEmailHandler() {
        if (email) {
            setSubscribed(true);
            setEmail("");
            setTimeout(() => setSubscribed(false), 3500);
        }
    }

    function scrollSmooth() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <footer className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white overflow-hidden relative">

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-sky-500/6 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[320px] h-[320px] bg-emerald-400/8 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[220px] bg-teal-400/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400"></div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 relative z-10">

                {/* Brand header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white via-teal-100 to-sky-200 bg-clip-text text-transparent">
                            MedVision
                        </span>
                    </div>
                    <p className="text-white/50 text-sm max-w-md leading-relaxed">
                        Your trusted digital health companion — connecting patients and pharmacies for smarter, faster healthcare.
                    </p>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">

                    {/* Our Services */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-teal-300 mb-4">Our Services</h3>
                        <ul className="flex flex-col gap-3">
                            {[
                                { label: "Online Pharmacy", to: "/onlinePharmacy", icon: <Pill className="w-4 h-4" /> },
                                { label: "Emergency Care", to: "/emergencyguidelines", icon: <Activity className="w-4 h-4" /> },
                            ].map(({ label, to, icon }) => (
                                <li key={label}>
                                    <Link
                                        to={to}
                                        onClick={label === "Emergency Care" ? undefined : (to.includes("#") ? undefined : scrollSmooth)}
                                        className="flex items-center gap-2.5 text-sm text-white/60 hover:text-teal-200 transition-all duration-200 group"
                                    >
                                        <span className="text-white/30 group-hover:text-teal-300 transition-colors duration-200">{icon}</span>
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-teal-300 mb-4">Legal</h3>
                        <ul className="flex flex-col gap-3">
                            {[
                                { label: "Privacy Policy", to: "/privacy-policy" },
                                { label: "Terms & Conditions", to: "/terms-and-conditions" },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    <Link
                                        to={to}
                                        onClick={scrollSmooth}
                                        className="flex items-center gap-2.5 text-sm text-white/60 hover:text-teal-200 transition-all duration-200 group"
                                    >
                                        <ShieldCheck className="w-4 h-4 text-white/30 group-hover:text-teal-300 transition-colors duration-200" />
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-teal-300 mb-4">Account</h3>
                        <ul className="flex flex-col gap-3">
                            {[
                                !isLoggedIn && { label: "Login", to: "/login" },
                                !isLoggedIn && { label: "Create Account", to: "/signup" },
                                { label: "Patient Dashboard", to: "/dashboard" },
                            ].filter(Boolean).map(({ label, to }) => (
                                <li key={label}>
                                    <Link
                                        to={to}
                                        onClick={scrollSmooth}
                                        className="text-sm text-white/60 hover:text-teal-200 transition-all duration-200 hover:translate-x-1 inline-block"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-teal-300 mb-4">Stay Updated</h3>
                        <p className="text-white/50 text-sm mb-4 leading-relaxed">
                            Get the latest health tips and platform updates delivered to your inbox.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-teal-400/60 transition-colors duration-300">
                                <Mail className="w-4 h-4 ml-3 text-white/40 shrink-0" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={emailHandler}
                                    placeholder="your@email.com"
                                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                                />
                                <button
                                    onClick={submitEmailHandler}
                                    className="bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 px-3 py-2.5 text-white transition-all duration-300 shrink-0"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            {subscribed && (
                                <div className="bg-emerald-500/15 border border-emerald-400/40 rounded-lg px-3 py-2 text-emerald-300 text-xs flex items-center gap-2">
                                    <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                                    Thanks! You're subscribed.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <p className="text-xs text-white/40">
                        © {new Date().getFullYear()} <span className="font-semibold text-white/60">MedVision</span> Private Limited. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}

export default Footer;
