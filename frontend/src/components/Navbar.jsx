import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { baseURL } from '../main';
import axios from 'axios';
import { Menu, X, LogOut, LayoutDashboard, LogIn, UserPlus, Pill, ShieldCheck, ShoppingBag, FileText, Sparkles, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('medVisionToken');
    const userType = localStorage.getItem('medVisionUserType');
    const navbarRef = useRef(null);
    const { darkMode, toggleDarkMode } = useTheme();
    const { language, changeLanguage, SUPPORTED_LANGUAGES } = useLanguage();
    const langMenuRef = useRef(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminData, setAdminData] = useState(null);
    const [storeHeaderName, setStoreHeaderName] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);


    const scrollToElement = (id) => {
        const element = document.getElementById(id);
        const headerOffset = 70;

        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    // Close language menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const navigateToHomeSection = (sectionId) => {
        if (location.pathname === '/') {
            scrollToElement(sectionId);
            return;
        }

        navigate('/', {
            state: {
                scrollToSection: sectionId,
                requestedAt: Date.now(),
            },
        });
    };

    const fetchDataFromApi = async () => {
        try {
            const response = await axios.get(`${baseURL}/fetchdata`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            localStorage.setItem('userData', JSON.stringify(response.data.userData));
            const fetchedStoreName = String(response.data?.userData?.storeName || '').trim();
            if (fetchedStoreName) {
                setStoreHeaderName(fetchedStoreName);
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
        }
    };

    const fetchadminDataFromApi = async () => {
        try {
            const response = await axios.get(`${baseURL}/adminfetchdata`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAdminData(response.data.adminData);
            localStorage.setItem('adminData', JSON.stringify(response.data.adminData));
        } catch (error) {
            console.error("Error fetching admin data:", error.message);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (token) {
            fetchDataFromApi();
            fetchadminDataFromApi();
        }

        if (localStorage.getItem('userData') || localStorage.getItem('adminData')) {
            setIsLoggedIn(true);
        }
    }, [token]);

    useEffect(() => {
        const updateNavbarOffset = () => {
            const height = navbarRef.current?.offsetHeight || 88;
            document.documentElement.style.setProperty('--app-navbar-offset', `${height}px`);
        };

        updateNavbarOffset();

        let resizeObserver;
        if (navbarRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => updateNavbarOffset());
            resizeObserver.observe(navbarRef.current);
        }

        window.addEventListener('resize', updateNavbarOffset);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateNavbarOffset);
        };
    }, [menuOpen, isLoggedIn, adminData, userType]);

    useEffect(() => {
    const token = localStorage.getItem('medVisionToken');
    const cachedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const cachedStoreName = String(cachedUser?.storeName || '').trim();
    if (cachedStoreName) {
        setStoreHeaderName(cachedStoreName);
    }

    if (token) {
        setIsLoggedIn(true);
        fetchDataFromApi();
        fetchadminDataFromApi();
    } else {
        setIsLoggedIn(false);
    }
}, [location.pathname]); 

    const handleLogout = () => {
        localStorage.removeItem('medVisionToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('adminData');
        setIsLoggedIn(false);
        setMenuOpen(false);
        navigate('/');
    };

    const options = { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' };
    const formattedDate = currentTime.toLocaleDateString(undefined, options);
    const formattedTime = currentTime.toLocaleTimeString();
    const isStoreHeaderMode = userType === 'store' && location.pathname === '/storeDashboard';

    const navigateToDashboard = () => {
        if (adminData) {
            navigate('/admindashboard');
            return;
        }

        if (userType === 'store') {
            navigate('/storeDashboard');
            return;
        }

        navigate('/dashboard');
    };

    return (
        <>
            <div ref={navbarRef} className="fixed top-0 w-full z-50">

                {isStoreHeaderMode ? (
                    <div className="backdrop-blur-xl bg-slate-950/95 shadow-lg border-b border-teal-900/60">
                        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-10 py-3 max-w-[1400px] mx-auto gap-4">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => navigate('/storeDashboard')}
                                    className="relative p-2 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 rounded-2xl shadow-lg shadow-teal-950/40 cursor-pointer"
                                >
                                    <Pill className="w-5 h-5 text-white" />
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-slate-950"></span>
                                </div>
                                <div>
                                    <p className="text-lg sm:text-xl font-bold text-white leading-none">Store Dashboard</p>
                                    <p className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-teal-200 font-semibold mt-1">
                                        {storeHeaderName || 'Pharmacy Store'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="rounded-2xl border border-teal-900/70 bg-slate-900 px-3 py-2 sm:px-4">
                                    <p className="text-[10px] uppercase tracking-[0.16em] text-teal-200 font-semibold">Current Time</p>
                                    <p className="text-[11px] text-slate-300">{formattedDate}</p>
                                    <p className="text-sm sm:text-base font-bold text-teal-300">{formattedTime}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setShowLogoutModal(true);
                                    }}
                                    className="px-3 py-2 sm:px-4 rounded-xl border border-teal-400/70 text-teal-200 text-sm font-semibold transition-all duration-300 hover:bg-teal-500 hover:text-white hover:border-teal-500 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                <>

                <div className="border-b border-slate-200 bg-white text-slate-700">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-1.5 text-[10px] sm:text-[11px]">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                            <span className="font-semibold tracking-[0.18em] uppercase">Pharmacy First Care</span>
                        </div>

                        <div className="hidden lg:flex items-center gap-4 text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                Genuine medicines
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
                                Fast doorstep delivery
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-violet-500" />
                                Prescription support
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-white via-slate-50 to-cyan-50/40 shadow-[0_12px_30px_rgba(2,132,199,0.08)] border-b border-cyan-100/80 backdrop-blur-xl">

                <div className="flex justify-between items-center px-4 sm:px-6 lg:px-10 py-3 max-w-[1400px] mx-auto gap-4">

                    {/* Logo */}
                    <div
                        onClick={() => {
                            navigate('/');
                            setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <div className="relative p-2 bg-gradient-to-br from-cyan-600 via-sky-600 to-emerald-500 rounded-2xl shadow-lg shadow-cyan-200/70">
                            <Pill className="w-5 h-5 text-white" />
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-white"></span>
                        </div>
                        <div>
                            <p className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-sky-700 via-cyan-600 to-emerald-500 bg-clip-text text-transparent leading-none">
                                MedVision
                            </p>
                            <p className="hidden sm:block text-[11px] uppercase tracking-[0.24em] text-slate-500 font-semibold mt-1">
                                Online Pharmacy
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center gap-8 text-gray-700 font-medium">

                        <button
                            onClick={() => navigateToHomeSection('head')}
                            className="relative group px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300"
                        >
                            Home
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 group-hover:w-full transition-all duration-300"></span>
                        </button>

                        <button
                            onClick={() => navigateToHomeSection('about')}
                            className="relative group px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300"
                        >
                            Pharmacy Services
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 group-hover:w-full transition-all duration-300"></span>
                        </button>

                        <button
                            onClick={() => navigate('/onlinepharmacy')}
                            className="relative group px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300"
                        >
                            Pharmacy Store
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 group-hover:w-full transition-all duration-300"></span>
                        </button>

                        <button
                            onClick={() => navigateToHomeSection('feedback')}
                            className="relative group px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300"
                        >
                            Reviews
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 group-hover:w-full transition-all duration-300"></span>
                        </button>
                    </div>

                    {/* Desktop Right Section */}
                    <div className="hidden xl:flex items-center gap-6">

                        {!isLoggedIn ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-white/90 px-2.5 py-2 shadow-sm">

                                <Link to="/login"
                                    className="inline-flex h-11 min-w-[128px] items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-5 text-sm font-semibold text-blue-600
                                transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-md active:scale-95">
                                    <LogIn className="w-4 h-4" />
                                    Login
                                </Link>

                                <Link to="/signup"
                                    className="inline-flex h-11 min-w-[128px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 px-5 text-sm font-semibold text-white
                                shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-105 active:scale-95">
                                    <UserPlus className="w-4 h-4" />
                                    Sign Up
                                </Link>

                            </div>
                        ) : (
                            <div className="flex items-center gap-4">

                                <button
                                    onClick={navigateToDashboard}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold
                                shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95
                                flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </button>

                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setShowLogoutModal(true);
                                    }}

                                    className="px-5 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold
  transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-lg active:scale-95
  flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>

                            </div>
                        )}

                        {/* Header Controls */}
                        <div className="ml-4 pl-4 border-l border-blue-200 flex items-center gap-3">

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                            >
                                {darkMode
                                    ? <Sun className="w-4 h-4 text-amber-500" />
                                    : <Moon className="w-4 h-4 text-slate-600" />
                                }
                            </button>
                        </div>

                    </div>

                    {/* Hamburger Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="xl:hidden p-2.5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-cyan-100 hover:bg-blue-100 transition-colors duration-300 active:scale-95"
                    >
                        {menuOpen ? (
                            <X className="w-6 h-6 text-blue-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-blue-600" />
                        )}
                    </button>

                </div>
                </div>

                {/* Mobile + Tablet Menu */}
                {menuOpen && (
                    <div className="xl:hidden bg-white border-t border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col px-4 py-6 space-y-4">

                            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-700 font-semibold">Pharmacy Quick Access</p>
                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <button
                                        onClick={() => { navigate('/onlinepharmacy'); setMenuOpen(false); }}
                                        className="rounded-xl bg-white border border-cyan-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-cyan-50 transition"
                                    >
                                        Pharmacy Store
                                    </button>
                                    <button
                                        onClick={() => { navigate('/dashboard', { state: { openSection: 'prescriptions' } }); setMenuOpen(false); }}
                                        className="rounded-xl bg-white border border-cyan-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-cyan-50 transition"
                                    >
                                        Prescription Help
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <div className="space-y-3 pb-6 border-b border-blue-100">
                                <button
                                    onClick={() => { navigateToHomeSection('head'); setMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                                >
                                    Home
                                </button>

                                <button
                                    onClick={() => { navigateToHomeSection('about'); setMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                                >
                                    Pharmacy Services
                                </button>

                                <button
                                    onClick={() => { navigate('/onlinepharmacy'); setMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                                >
                                    Pharmacy Store
                                </button>

                                <button
                                    onClick={() => { navigateToHomeSection('feedback'); setMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                                >
                                    Reviews
                                </button>
                            </div>

                            {/* Auth Buttons */}
                            {!isLoggedIn ? (
                                <div className="flex flex-col gap-3">

                                    <Link to="/login"
                                        onClick={() => setMenuOpen(false)}
                                        className="h-11 px-4 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold
                                    transition-all duration-300 hover:bg-blue-600 hover:text-white
                                    flex items-center justify-center gap-2">
                                        <LogIn className="w-4 h-4" />
                                        Login
                                    </Link>

                                    <Link to="/signup"
                                        onClick={() => setMenuOpen(false)}
                                        className="h-11 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 text-white font-semibold
                                    shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-105
                                    flex items-center justify-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        Sign Up
                                    </Link>

                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">

                                    <button
                                        onClick={() => {
                                            navigateToDashboard();
                                            setMenuOpen(false);
                                        }}
                                        className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold
                                    shadow-md transition-all duration-300 hover:shadow-lg
                                    flex items-center justify-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            setShowLogoutModal(true);
                                        }}

                                        className="px-4 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold
                                    transition-all duration-300 hover:bg-blue-600 hover:text-white
                                    flex items-center justify-center gap-2">
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>

                                </div>
                            )}

                            {/* Mobile: Dark Mode / Language */}
                            <div className="mt-2 flex flex-wrap items-center gap-3 pt-4 border-t border-blue-100">
                                <button
                                    onClick={toggleDarkMode}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                                </button>

                                <div className="flex-1">
                                    <select
                                        value={language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    >
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                        </div>
                    </div>
                )}
                </>
                )}
            </div>
            {showLogoutModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-fadeIn">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-5 text-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-white/20 p-2.5">
                                        <LogOut className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Confirm Logout</h2>
                                        <p className="mt-0.5 text-xs text-cyan-100">Secure session confirmation</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutModal(false)}
                                    className="rounded-full bg-white/20 p-1.5 text-white/90 hover:bg-white/30"
                                    aria-label="Close logout popup"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to logout? You will need to sign in again to access your account.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Stay Logged In
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutModal(false);
                                        handleLogout();
                                    }}
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition shadow-md"
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
