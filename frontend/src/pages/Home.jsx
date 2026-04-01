import React, { useEffect } from "react";
import emergency from "../assets/emergency.png";
import info from "../assets/info.png";
import tracking from "../assets/tracking.png";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import FeedbackCarousal from "../components/FeedbackCarousal";
import {
  Shield,
  Clock,
  Truck,
  Pill,
  FileText,
  Search,
  ShoppingCart,
  PackageCheck,
  Sparkles,
  ArrowRight,
  HeartPulse,
  CheckCircle2,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("medVisionToken");

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
  }, []);

  return (
    <div className="w-full overflow-hidden bg-[#f7fbff]">
      <section
        id="head"
        className="relative overflow-hidden px-4 sm:px-6 lg:px-16 pb-16 lg:pb-24"
        style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 1.5rem)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_78%_18%,rgba(34,197,94,0.16),transparent_30%),radial-gradient(circle_at_55%_82%,rgba(14,165,233,0.16),transparent_30%)]" />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Pharmacy Experience
            </span>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-900 md:text-6xl">
              Medicines Delivered
              <span className="block bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-500 bg-clip-text text-transparent">
                Faster. Safer. Smarter.
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              From prescription upload to doorstep delivery, MedVision blends trust, speed, and clarity into one seamless pharmacy journey.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleOnlinePharmacy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <ShoppingCart className="h-5 w-5" />
                Start Shopping
              </button>
              <button
                onClick={handlePrescriptionHelp}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-7 py-3.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <FileText className="h-5 w-5" />
                Prescription Help
              </button>
              <button
                onClick={handleEmergencyPharmacy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-white px-7 py-3.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
              >
                <HeartPulse className="h-5 w-5" />
                Emergency Guidance
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-5">
              <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-sky-700">12K+</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Orders Delivered</p>
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-cyan-700">1.5L+</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Medicines Listed</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-emerald-700">30 Min</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Avg Dispatch</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-in-right">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-2xl backdrop-blur-xl">
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-700 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Pharmacy Store Highlights</p>
                <h3 className="mt-3 text-2xl font-bold">Everything You Need, Organized Better</h3>
                <p className="mt-2 text-sm text-cyan-100">Explore medicine categories, discover essentials, and order confidently.</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 px-3 py-3 text-sm">
                    <p className="text-cyan-100">OTC & Wellness</p>
                    <p className="font-semibold">18K+ products</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-3 text-sm">
                    <p className="text-cyan-100">Prescription</p>
                    <p className="font-semibold">Upload & verify</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-3 text-sm">
                    <p className="text-cyan-100">Family Care</p>
                    <p className="font-semibold">Daily essentials</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-3 text-sm">
                    <p className="text-cyan-100">Devices</p>
                    <p className="font-semibold">Monitors & kits</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <img src={tracking} alt="tracking" className="h-10 w-10 object-contain" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">Store Categories</p>
                  <p className="text-xs text-slate-500">Browse by needs: fever, cold, diabetes, immunity.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <img src={info} alt="info" className="h-10 w-10 object-contain" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">Smart Refill</p>
                  <p className="text-xs text-slate-500">Reorder your routine medicines in a click.</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Most Ordered Today</p>
                <p className="mt-1 text-sm text-emerald-800">Paracetamol, Vitamin D3, Cough Syrup, ORS Packs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal-on-scroll px-4 sm:px-6 lg:px-16 pb-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Clock, label: "24/7 Order Support", tone: "text-sky-700 bg-sky-100 border-sky-200" },
            { icon: Shield, label: "100% Genuine Medicines", tone: "text-cyan-700 bg-cyan-100 border-cyan-200" },
            { icon: Truck, label: "Fast Doorstep Delivery", tone: "text-emerald-700 bg-emerald-100 border-emerald-200" },
            { icon: FileText, label: "Quick Prescription Upload", tone: "text-violet-700 bg-violet-100 border-violet-200" },
          ].map((feature, i) => (
            <div key={i} className="lift-on-hover rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className={`mb-3 inline-flex rounded-xl border p-2.5 ${feature.tone}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{feature.label}</p>
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

      <section id="about" className="reveal-on-scroll relative overflow-hidden px-4 sm:px-6 lg:px-16 py-20">
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
                title: "Search Medicines",
                desc: "Find medicines by name, compare options, and add items to your cart in seconds.",
                onClick: handleOnlinePharmacy,
                icon: <Search className="h-8 w-8 text-sky-600" />,
                accent: "from-sky-50 to-cyan-50",
                cta: "Open Pharmacy",
              },
              {
                img: tracking,
                title: "Prescription Help",
                desc: "Upload prescriptions, review active meds, and get guided support from your dashboard.",
                onClick: handlePrescriptionHelp,
                icon: <FileText className="h-8 w-8 text-violet-600" />,
                accent: "from-violet-50 to-fuchsia-50",
                cta: "Open Prescription Help",
              },
              {
                img: emergency,
                title: "Emergency Guidance",
                desc: "Access first-step medicine guidance and emergency support instructions quickly.",
                onClick: handleEmergencyPharmacy,
                icon: <Shield className="h-8 w-8 text-emerald-600" />,
                accent: "from-emerald-50 to-teal-50",
                cta: "Open Emergency Help",
              },
            ].map((service, index) => (
              <button
                type="button"
                key={index}
                onClick={service.onClick}
                className="lift-on-hover group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 text-left shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <img src={service.img} alt={service.title} className="h-14 w-14 object-contain" />
                    <span className="opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      {service.icon}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{service.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {service.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <div className="grid gap-5 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">How It Works</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Three steps. One smooth flow.</h3>
              </div>
              {[
                "Search and add medicines",
                "Confirm shipping and payment",
                "Track order in real time",
              ].map((step, idx) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-cyan-700">Step {idx + 1}</p>
                  <p className="mt-2 text-sm text-slate-700">{step}</p>
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

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Patient Voices</p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              First-time users become loyal in one order.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-cyan-100">
              Consistent delivery, genuine medicines, and transparent tracking create a pharmacy experience people trust.
            </p>
            <div className="mt-8 flex gap-8">
              <div>
                <p className="text-3xl font-bold text-white">98%</p>
                <p className="text-sm text-cyan-100">Satisfaction</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-cyan-100">Support</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-sm text-cyan-100">Reviews</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <FeedbackCarousal />
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-16 py-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-r from-cyan-600 to-emerald-500 px-8 py-10 text-white shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Ready To Begin?</p>
              <h3 className="mt-2 text-3xl font-black">Your medicines are just a few clicks away.</h3>
            </div>
            <button
              onClick={handleOnlinePharmacy}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
            >
              Go To Pharmacy
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }

        .animate-fade-in-right {
          animation: fadeInRight 0.9s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Home;
