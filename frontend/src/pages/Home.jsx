import { useEffect, useState } from "react";
import axios from "axios";
import emergency from "../assets/emergency.png";
import info from "../assets/info.png";
import tracking from "../assets/tracking.png";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import TestimonialCard from "../components/Testimonials/TestimonialCard";
import { testimonials as staticTestimonials } from "../components/Testimonials/data";
import { baseURL } from '../main';
import {
  Shield,
  Clock,
  Truck,
  FileText,
  Search,
  ShoppingCart,
  PackageCheck,
  Sparkles,
  ArrowRight,
  HeartPulse,
  CheckCircle2,
  BadgePercent,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("medVisionToken");
  const [liveReviews, setLiveReviews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [expandedDiseaseTitle, setExpandedDiseaseTitle] = useState('HIV');

  useEffect(() => {
    axios.get(`${baseURL}/reviews?random=true&limit=8`)
      .then(res => { if (res.data.reviews?.length) setLiveReviews(res.data.reviews); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${baseURL}/marketing/campaigns/public?limit=6`)
      .then((res) => setPromotions(res.data?.campaigns || []))
      .catch(() => setPromotions([]));
  }, []);

  const displayReviews = liveReviews.length > 0
    ? liveReviews.slice(0, 8).map((r) => ({
      name: r.name,
      role: `${r.role || 'Patient'}${r.storeName ? ` • ${r.storeName}` : ''}`,
      comment: r.comment,
      rating: r.rating,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=0ea5e9&color=fff&size=64`,
    }))
    : staticTestimonials;

  const criticalDiseaseGuides = [
    {
      title: 'HIV',
      icon: Shield,
      accent: 'from-rose-50 via-white to-pink-50',
      iconClass: 'bg-rose-100 text-rose-700',
      causes: 'Human immunodeficiency virus spreads through infected blood, unprotected sexual contact, contaminated needles, or from parent to child during pregnancy, birth, or breastfeeding.',
      symptoms: ['Persistent fever', 'Weight loss', 'Night sweats', 'Swollen lymph nodes'],
      note: 'Early testing and antiretroviral treatment can significantly improve long-term outcomes.',
    },
    {
      title: 'Post-Transplant Complications',
      icon: HeartPulse,
      accent: 'from-violet-50 via-white to-indigo-50',
      iconClass: 'bg-violet-100 text-violet-700',
      causes: 'Complications can occur because of organ rejection, infection risk from immunosuppressant therapy, medication non-adherence, or graft dysfunction.',
      symptoms: ['Fever or chills', 'Reduced urine output', 'Unusual swelling', 'Pain near transplant site'],
      note: 'Transplant patients need urgent specialist review if new warning signs appear.',
    },
    {
      title: 'Tuberculosis',
      icon: FileText,
      accent: 'from-amber-50 via-white to-orange-50',
      iconClass: 'bg-amber-100 text-amber-700',
      causes: 'Tuberculosis is caused by Mycobacterium tuberculosis and usually spreads through airborne droplets from a person with active lung infection.',
      symptoms: ['Cough lasting weeks', 'Blood in sputum', 'Chest pain', 'Fatigue and fever'],
      note: 'Persistent respiratory symptoms need medical testing rather than self-medication.',
    },
    {
      title: 'Hepatitis B / C',
      icon: AlertCircle,
      accent: 'from-cyan-50 via-white to-sky-50',
      iconClass: 'bg-cyan-100 text-cyan-700',
      causes: 'These viral liver infections may spread through infected blood, unsafe injections, unsterile instruments, or from mother to child in some cases.',
      symptoms: ['Jaundice', 'Dark urine', 'Nausea', 'Abdominal pain'],
      note: 'Untreated viral hepatitis can lead to liver damage, so screening and follow-up matter.',
    },
    {
      title: 'Stroke',
      icon: Clock,
      accent: 'from-red-50 via-white to-orange-50',
      iconClass: 'bg-red-100 text-red-700',
      causes: 'Stroke usually happens when blood flow to part of the brain is blocked by a clot or when a blood vessel ruptures, often linked to hypertension, diabetes, smoking, or heart rhythm disorders.',
      symptoms: ['Face drooping', 'Arm weakness', 'Speech difficulty', 'Sudden confusion'],
      note: 'Stroke symptoms are time-critical and need emergency evaluation immediately.',
    },
    {
      title: 'Sepsis',
      icon: Shield,
      accent: 'from-amber-50 via-white to-yellow-50',
      iconClass: 'bg-amber-100 text-amber-700',
      causes: 'Sepsis is a life-threatening body response to infection and may follow pneumonia, urinary infections, abdominal infections, wounds, or bloodstream infections.',
      symptoms: ['Very high or low temperature', 'Rapid breathing', 'Fast heart rate', 'Confusion or drowsiness'],
      note: 'Sepsis can worsen rapidly, especially in elderly, immunocompromised, or post-surgical patients.',
    },
    {
      title: 'Cancer Warning Signs',
      icon: Search,
      accent: 'from-fuchsia-50 via-white to-rose-50',
      iconClass: 'bg-fuchsia-100 text-fuchsia-700',
      causes: 'Cancer risk may be influenced by tobacco use, alcohol, chronic infections, inherited mutations, radiation exposure, unhealthy diet, or long-term environmental exposures.',
      symptoms: ['Unexplained weight loss', 'Persistent lump or swelling', 'Long-lasting fatigue', 'Non-healing sores'],
      note: 'Not all persistent symptoms mean cancer, but delayed evaluation should be avoided.',
    },
    {
      title: 'Diabetes Complications',
      icon: HeartPulse,
      accent: 'from-emerald-50 via-white to-lime-50',
      iconClass: 'bg-emerald-100 text-emerald-700',
      causes: 'Complications may develop when blood sugar remains uncontrolled over time, affecting blood vessels, nerves, kidneys, eyes, and heart.',
      symptoms: ['Slow wound healing', 'Blurred vision', 'Numbness in feet', 'Excessive thirst or urination'],
      note: 'Regular blood sugar control and follow-up are important to reduce long-term damage.',
    },
  ];

  const handleOnlinePharmacy = () => navigate("/onlinepharmacy");
  const handleEmergencyPharmacy = () => navigate("/emergencyguidelines");
  const handlePrescriptionHelp = () => navigate("/dashboard", { state: { openSection: "prescriptions" } });
  const handleQuickRefill = () => {
    if (token) {
      navigate("/dashboard", { state: { openSection: "prescriptions" } });
      return;
    }
    navigate("/login");
  };

  useEffect(() => {
    const sectionId = location.state?.scrollToSection;
    if (!sectionId) return;

    const scrollToRequestedSection = () => {
      const headerOffsetValue = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--app-navbar-offset') || '88',
        10,
      );
      const element = document.getElementById(sectionId);

      if (!element) return;

      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffsetValue - 8;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      navigate('.', { replace: true, state: null });
    };

    const timeoutId = window.setTimeout(scrollToRequestedSection, 80);
    return () => window.clearTimeout(timeoutId);
  }, [location.state, navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" },
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
      observer.disconnect();
    };
  }, [promotions.length]);

  return (
    <div className="w-full overflow-hidden bg-[#f7fbff]">
      <section
        id="head"
        className="relative overflow-hidden px-4 sm:px-6 lg:px-16 pb-16 lg:pb-24"
        style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 1.5rem)' }}
      >
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(56,189,248,0.30),transparent_40%),radial-gradient(ellipse_at_85%_15%,rgba(34,197,94,0.20),transparent_35%),radial-gradient(ellipse_at_50%_90%,rgba(99,102,241,0.12),transparent_40%)]" />
        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -left-12 bottom-0 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute right-1/3 top-1/2 h-64 w-64 rounded-full bg-emerald-200/15 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 shadow-md shadow-cyan-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
              Smart Pharmacy Experience
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] text-slate-900 md:text-6xl">
              Medicines Delivered
              <span className="block bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400 bg-clip-text text-transparent pb-1">
                Faster. Safer. Smarter.
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              From prescription upload to doorstep delivery, MedVision blends trust, speed, and clarity into one seamless pharmacy journey.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleOnlinePharmacy}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-400/30"
              >
                <ShoppingCart className="h-5 w-5" />
                Start Shopping
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={handlePrescriptionHelp}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 px-7 py-3.5 text-sm font-bold text-violet-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <FileText className="h-5 w-5" />
                Prescription Help
              </button>
              <button
                onClick={handleEmergencyPharmacy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 px-7 py-3.5 text-sm font-bold text-cyan-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
              >
                <HeartPulse className="h-5 w-5" />
                Emergency Guidance
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-5">
              {[
                { val: '12K+', label: 'Orders Delivered', from: 'from-sky-500', to: 'to-cyan-500', bg: 'bg-sky-50', border: 'border-sky-100' },
                { val: '1.5L+', label: 'Medicines Listed', from: 'from-cyan-500', to: 'to-teal-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
                { val: '30 Min', label: 'Avg Dispatch', from: 'from-emerald-500', to: 'to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-4 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-200`}>
                  <p className={`text-2xl font-black bg-gradient-to-r ${s.from} ${s.to} bg-clip-text text-transparent`}>{s.val}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-in-right">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-2xl backdrop-blur-xl">
              <div className="pointer-events-none absolute -top-14 -right-12 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />

              <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-900 to-emerald-800 p-6 text-white shadow-xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  <Sparkles className="h-3 w-3" />
                  Pharmacy Store Highlights
                </p>
                <h3 className="mt-4 text-2xl font-black leading-tight">Everything You Need, Organized Better</h3>
                <p className="mt-2 text-sm leading-6 text-cyan-100">Explore medicine categories, discover essentials, and order confidently.</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { title: 'OTC & Wellness', sub: '18K+ products', dot: 'bg-sky-300' },
                    { title: 'Prescription', sub: 'Upload & verify', dot: 'bg-violet-300' },
                    { title: 'Family Care', sub: 'Daily essentials', dot: 'bg-emerald-300' },
                    { title: 'Devices', sub: 'Monitors & kits', dot: 'bg-amber-300' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/15">
                      <p className="flex items-center gap-2 text-cyan-100">
                        <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                        {item.title}
                      </p>
                      <p className="mt-1 font-bold text-white">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="inline-flex rounded-xl border border-cyan-100 bg-cyan-50 p-2">
                    <img src={tracking} alt="tracking" className="h-8 w-8 object-contain" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">Store Categories</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Browse by needs: fever, cold, diabetes, immunity.</p>
                </div>
                <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="inline-flex rounded-xl border border-emerald-100 bg-emerald-50 p-2">
                    <img src={info} alt="info" className="h-8 w-8 object-contain" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">Smart Refill</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Reorder your routine medicines in a click.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Trust strip marquee */}
      <div className="overflow-hidden border-y border-slate-100 bg-white py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {[
            '✅ 100% Genuine Medicines',
            '🚚 Fast Doorstep Delivery',
            '🔒 SSL Secured Payments',
            '📋 Easy Prescription Upload',
            '⏰ 24/7 Order Support',
            '💊 1.5 Lakh+ Medicines',
            '⭐ Trusted by 50K+ Patients',
            '🏥 Multiple Verified Stores',
            '✅ 100% Genuine Medicines',
            '🚚 Fast Doorstep Delivery',
            '🔒 SSL Secured Payments',
            '📋 Easy Prescription Upload',
            '⏰ 24/7 Order Support',
            '💊 1.5 Lakh+ Medicines',
          ].map((item, i) => (
            <span key={i} className="mx-6 text-xs font-semibold text-slate-600 tracking-wide">{item}</span>
          ))}
        </div>
      </div>

      <section className="reveal-on-scroll px-4 sm:px-6 lg:px-16 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Clock, label: '24/7 Order Support', sub: 'Always available', iconBg: 'bg-sky-100 text-sky-600', border: 'border-sky-100', delay: '0ms' },
            { icon: Shield, label: '100% Genuine Medicines', sub: 'Verified sources', iconBg: 'bg-cyan-100 text-cyan-600', border: 'border-cyan-100', delay: '80ms' },
            { icon: Truck, label: 'Fast Doorstep Delivery', sub: 'Avg 30-min dispatch', iconBg: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100', delay: '160ms' },
            { icon: FileText, label: 'Prescription Upload', sub: 'AI-assisted auto-fill', iconBg: 'bg-violet-100 text-violet-600', border: 'border-violet-100', delay: '240ms' },
          ].map((feature, i) => (
            <div
              key={i}
              className={`group rounded-2xl border ${feature.border} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg`}
              style={{ transitionDelay: feature.delay }}
            >
              <div className={`mb-4 inline-flex rounded-xl p-3 ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-800">{feature.label}</p>
              <p className="mt-1 text-xs text-slate-500">{feature.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="reveal-on-scroll px-4 sm:px-6 lg:px-16 pb-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-6 shadow-lg md:p-8">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                <PackageCheck className="h-3.5 w-3.5" />
                New On MedVision
              </p>
              <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Quick Refill</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Refill your regular medicines in under a minute. Upload your latest prescription, verify quantity, and place repeat orders without searching everything again.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleQuickRefill}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Quick Refill
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleOnlinePharmacy}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-6 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                >
                  Browse Alternatives
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Refill Flow</p>
              <div className="mt-4 space-y-3">
                {[
                  "Upload prescription or choose previous order",
                  "Confirm quantity, dosage, and delivery address",
                  "Get verification and fast doorstep dispatch",
                ].map((step, idx) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Best for chronic and monthly medicines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal-on-scroll px-4 sm:px-6 lg:px-16 pb-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-lg md:p-8">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <Truck className="h-3.5 w-3.5" />
                Lightning Fast
              </p>
              <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Same Day Delivery</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Order your medicines before 2 PM and receive them the same day. We guarantee fast, safe, and discreet doorstep delivery across your city with real-time tracking.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleOnlinePharmacy}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition"
                >
                  Order Now
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleOnlinePharmacy}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  View Stores
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-emerald-100">
                <div>
                  <p className="text-xl font-bold text-emerald-700">30 Min</p>
                  <p className="text-xs text-slate-600 mt-1">Avg Dispatch</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700">24/7</p>
                  <p className="text-xs text-slate-600 mt-1">Order Support</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700">₹0</p>
                  <p className="text-xs text-slate-600 mt-1">Delivery Fee</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">How It Works</p>
              <div className="mt-4 space-y-3">
                {[
                  "Browse and add medicines to your cart",
                  "Choose same-day delivery option at checkout",
                  "Track your order in real-time from our pharmacy",
                  "Receive medicines at your doorstep before evening",
                ].map((step, idx) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  Available in 50+ locations across the city
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal-on-scroll px-4 sm:px-6 lg:px-16 pb-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-slate-50 p-6 shadow-lg md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Critical Disease Guide
              </p>
              <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Understanding The Causes Of Critical Diseases</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Review common warning signs and basic causes for high-risk conditions such as HIV, transplant complications, tuberculosis, and viral hepatitis. This section is educational and should not replace medical diagnosis.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Seek immediate clinical care for persistent fever, breathing difficulty, sudden weakness, or unexplained rapid decline.
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {criticalDiseaseGuides.map((guide) => {
              const isExpanded = expandedDiseaseTitle === guide.title;

              return (
                <div key={guide.title} className={`overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br ${guide.accent} shadow-sm`}>
                  <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
                    <div className="flex items-center gap-4">
                      <div className={`inline-flex rounded-2xl p-3 ${guide.iconClass}`}>
                        <guide.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 md:text-2xl">{guide.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">High-risk condition overview, symptoms, and cause summary.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedDiseaseTitle((prev) => (prev === guide.title ? '' : guide.title))}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${guide.title}`}
                    >
                      {isExpanded ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200/80 bg-white/80 px-5 py-5 md:px-6">
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Cause Overview</p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">{guide.causes}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Common Symptoms</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                            {guide.symptoms.map((symptom) => (
                              <div key={symptom} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                {symptom}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                        <span className="font-bold">Clinical note:</span> {guide.note}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="reveal-on-scroll px-4 sm:px-6 lg:px-16 pb-14">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 via-white to-rose-50 p-6 shadow-lg md:p-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
                  <BadgePercent className="h-3.5 w-3.5" />
                  Live Offers
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Today&apos;s Promotions</h2>
                <p className="mt-2 text-sm text-slate-600 md:text-base">Offers, coupons, and bulk discounts created by our partner stores.</p>
              </div>
              <button
                onClick={handleOnlinePharmacy}
                className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-5 py-2.5 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
              >
                Redeem In Pharmacy
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promotions.map((campaign) => (
                <div key={campaign._id} className="rounded-2xl border border-fuchsia-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-700">
                      {campaign.campaignType}
                    </span>
                    {campaign.couponCode ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {campaign.couponCode}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{campaign.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{campaign.storeName}{campaign.storeCity ? ` • ${campaign.storeCity}` : ''}</p>
                  {campaign.description ? (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{campaign.description}</p>
                  ) : null}
                  <div className="mt-3 rounded-xl bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-fuchsia-800">
                    {campaign.discountType} {campaign.discountValue}
                    {campaign.discountType === 'Percentage' ? '%' : ''}
                    {campaign.minOrderAmount ? ` • Min Order ${campaign.minOrderAmount}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="about" className="reveal-on-scroll relative overflow-hidden px-4 sm:px-6 lg:px-16 pt-10 pb-20">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl">Designed For Daily Care</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
              Everything you need to search medicines, get prescription support, and manage urgent needs without switching platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                img: info,
                title: 'Search Medicines',
                desc: 'Find medicines by name, compare options, and add items to your cart in seconds.',
                onClick: handleOnlinePharmacy,
                iconEl: <Search className="h-8 w-8 text-sky-600" />,
                accent: 'from-sky-50 via-cyan-50 to-white',
                ring: 'ring-sky-200',
                badge: '🛒',
                cta: 'Open Pharmacy',
                ctaColor: 'text-sky-700',
              },
              {
                img: tracking,
                title: 'Prescription Help',
                desc: 'Upload prescriptions, review active meds, and get guided support from your dashboard.',
                onClick: handlePrescriptionHelp,
                iconEl: <FileText className="h-8 w-8 text-violet-600" />,
                accent: 'from-violet-50 via-fuchsia-50 to-white',
                ring: 'ring-violet-200',
                badge: '📋',
                cta: 'Open Prescription Help',
                ctaColor: 'text-violet-700',
              },
              {
                img: emergency,
                title: 'Emergency Guidance',
                desc: 'Access first-step medicine guidance and emergency support instructions quickly.',
                onClick: handleEmergencyPharmacy,
                iconEl: <Shield className="h-8 w-8 text-emerald-600" />,
                accent: 'from-emerald-50 via-teal-50 to-white',
                ring: 'ring-emerald-200',
                badge: '🚨',
                cta: 'Open Emergency Help',
                ctaColor: 'text-emerald-700',
              },
            ].map((service, index) => (
              <button
                type="button"
                key={index}
                onClick={service.onClick}
                className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 text-left shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl`} />
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.accent.replace('from-', 'from-').replace('via-', 'to-').split(' ')[0]} ${service.accent.split(' ')[1]} rounded-t-3xl`} />
                <div className="relative z-10">
                  <div className="mb-5 flex items-start justify-between">
                    <div className={`rounded-2xl ring-2 ${service.ring} bg-white p-2 shadow-sm`}>
                      <img src={service.img} alt={service.title} className="h-12 w-12 object-contain" />
                    </div>
                    <span className="text-2xl">{service.badge}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{service.desc}</p>
                  <div className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${service.ctaColor}`}>
                    {service.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 p-6 shadow-lg md:p-8">
            <div className="mb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">How It Works</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Three steps. One smooth flow.</h3>
            </div>
            <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Connector line - desktop only */}
              <div className="absolute hidden md:block top-7 left-[calc(16.66%-8px)] right-[calc(16.66%-8px)] h-0.5 bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-200" />
              {[
                { step: '01', label: 'Search & Add', desc: 'Find medicines by name, brand, or health condition', icon: Search, color: 'bg-cyan-500', light: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
                { step: '02', label: 'Confirm & Pay', desc: 'Choose delivery address, apply coupons, and pay securely', icon: ShoppingCart, color: 'bg-teal-500', light: 'bg-teal-50 border-teal-200 text-teal-700' },
                { step: '03', label: 'Track in Real Time', desc: 'Live order tracking from dispatch to doorstep', icon: Truck, color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              ].map((s) => (
                <div key={s.step} className="relative flex flex-col items-center text-center gap-3 p-5">
                  <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl ${s.color} shadow-lg shadow-${s.color}/30`}>
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 tracking-widest">{s.step}</p>
                  <h4 className="text-base font-black text-slate-900">{s.label}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="feedback"
        className="relative overflow-hidden px-4 sm:px-6 lg:px-16 py-20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-900" />
        <div className="absolute top-8 left-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-12 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Patient Voices</p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              First-time users become{" "}
              <span className="text-cyan-300">loyal in one order.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-cyan-100">
              Consistent delivery, genuine medicines, and transparent tracking create a pharmacy experience people trust.
            </p>
            {/* Stats row */}
            <div className="mt-8 flex justify-center gap-10">
              <div>
                <p className="text-3xl font-bold text-white">98%</p>
                <p className="text-sm text-cyan-200">Satisfaction</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-cyan-200">Support</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div>
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-sm text-cyan-200">Reviews</p>
              </div>
            </div>
          </div>

          {/* Testimonial cards grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayReviews.map((t, i) => (
              <div
                key={i}
                className="transition-transform duration-300 hover:-translate-y-1"
              >
                <TestimonialCard {...t} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-16 py-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-cyan-900 to-emerald-900 px-8 py-12 text-white shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-300 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ready To Begin?
              </p>
              <h3 className="mt-3 text-3xl font-black leading-snug md:text-4xl">Your medicines are<br />just a few clicks away.</h3>
              <p className="mt-2 text-sm text-cyan-200">Fast delivery · Genuine medicines · Trusted by 50K+ patients</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={handleOnlinePharmacy}
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
              >
                Go To Pharmacy
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={handlePrescriptionHelp}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
              >
                <FileText className="h-4 w-4" />
                Upload Prescription
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.85s cubic-bezier(.22,1,.36,1) both;
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.95s cubic-bezier(.22,1,.36,1) 0.15s both;
        }
        .animate-marquee {
          animation: marqueeScroll 28s linear infinite;
        }
        /* Scroll reveal */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1);
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        /* Stagger children of reveal sections */
        .reveal-on-scroll.is-visible > * > *:nth-child(1) { transition-delay: 0ms; }
        .reveal-on-scroll.is-visible > * > *:nth-child(2) { transition-delay: 80ms; }
        .reveal-on-scroll.is-visible > * > *:nth-child(3) { transition-delay: 160ms; }
        .reveal-on-scroll.is-visible > * > *:nth-child(4) { transition-delay: 240ms; }
      `}</style>
    </div>
  );
};

export default Home;
