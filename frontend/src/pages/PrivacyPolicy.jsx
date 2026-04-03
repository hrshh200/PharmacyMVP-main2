import { useEffect } from "react";
import { Shield, Lock, Eye, Database, Bell, RefreshCw, Mail, Phone } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "Information We Collect",
    color: "blue",
    items: [
      {
        heading: "Personal Information",
        text: "When you register or place an order, we collect your name, email address, phone number, delivery address, and payment details to fulfil your requests.",
      },
      {
        heading: "Usage Data",
        text: "We automatically collect information about how you interact with our platform, including pages visited, search queries, browser type, device information, and IP address.",
      },
      {
        heading: "Health & Prescription Data",
        text: "When you upload prescriptions or use our health tools, we collect and process health-related information strictly to provide the requested services.",
      },
    ],
  },
  {
    icon: Database,
    title: "How We Use Your Information",
    color: "emerald",
    items: [
      { heading: "Order Fulfilment", text: "Process and deliver your medicine orders, send order confirmations and delivery updates." },
      { heading: "Platform Improvement", text: "Analyse usage patterns to improve our services, fix bugs, and develop new features." },
      { heading: "Customer Support", text: "Respond to your queries, complaints, and provide personalised assistance." },
      { heading: "Legal Compliance", text: "Meet regulatory requirements related to pharmaceutical sales and patient data protection." },
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    color: "purple",
    items: [
      { heading: "Encryption", text: "All data transmitted between your device and our servers is encrypted using industry-standard TLS/SSL protocols." },
      { heading: "Secure Storage", text: "Sensitive information such as passwords and payment data is stored using strong hashing and encryption algorithms." },
      { heading: "Access Controls", text: "Only authorised personnel can access personal data, strictly on a need-to-know basis." },
    ],
  },
  {
    icon: Shield,
    title: "Sharing of Information",
    color: "orange",
    items: [
      { heading: "Third-Party Partners", text: "We share data with delivery partners, payment processors, and verified pharmacy networks only to the extent needed to fulfil your order." },
      { heading: "No Sale of Data", text: "We never sell your personal information to advertisers, data brokers, or any third party for commercial purposes." },
      { heading: "Legal Requirements", text: "We may disclose your data when required by law, court order, or to protect the rights and safety of our users." },
    ],
  },
  {
    icon: Bell,
    title: "Your Rights",
    color: "cyan",
    items: [
      { heading: "Access & Portability", text: "You have the right to request a copy of your personal data that we hold." },
      { heading: "Correction", text: "You may update or correct inaccurate personal information through your account settings at any time." },
      { heading: "Deletion", text: "You can request deletion of your account and personal data, subject to our legal retention obligations." },
      { heading: "Opt-Out", text: "You may opt out of marketing communications at any time via the unsubscribe link in our emails." },
    ],
  },
  {
    icon: RefreshCw,
    title: "Policy Updates",
    color: "pink",
    items: [
      { heading: "Notification of Changes", text: "We will notify registered users via email when significant changes are made to this Privacy Policy." },
      { heading: "Continued Use", text: "Continued use of our platform after changes are published constitutes your acceptance of the updated policy." },
    ],
  },
];

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "bg-blue-100 text-blue-600", badge: "bg-blue-600", dot: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-600", dot: "bg-emerald-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "bg-purple-100 text-purple-600", badge: "bg-purple-600", dot: "bg-purple-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", icon: "bg-orange-100 text-orange-600", badge: "bg-orange-600", dot: "bg-orange-500" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "bg-cyan-100 text-cyan-600", badge: "bg-cyan-600", dot: "bg-cyan-500" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", icon: "bg-pink-100 text-pink-600", badge: "bg-pink-600", dot: "bg-pink-500" },
};

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-[var(--app-navbar-offset,88px)]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-500 text-white py-10 px-6 rounded-b-[2rem] shadow-lg shadow-blue-900/20">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl"></div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Your privacy matters to us. This policy explains how PharmacyMVP collects, uses, and protects your personal information.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-xs font-medium">
            <RefreshCw className="w-3 h-3" />
            Last updated: March 28, 2026
          </div>
        </div>
      </div>

      {/* Intro Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-gray-600 leading-relaxed text-base">
          Welcome to <strong className="text-gray-900">PharmacyMVP</strong>. We are committed to protecting your personal data and respecting your privacy. This Privacy Policy describes what data we collect, why we collect it, how it is used, and what rights you have regarding your information. By using our platform, you agree to the practices described herein.
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {sections.map((section, idx) => {
          const c = colorMap[section.color];
          const Icon = section.icon;
          return (
            <div key={idx} className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden shadow-sm`}>
              {/* Section Header */}
              <div className="flex items-center gap-4 px-8 py-5 border-b border-gray-200 bg-white/60">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon} flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className={`text-xs font-semibold text-white ${c.badge} px-3 py-0.5 rounded-full`}>
                    Section {idx + 1}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{section.title}</h2>
                </div>
              </div>

              {/* Items */}
              <div className="px-8 py-6 space-y-5">
                {section.items.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`mt-2 w-2.5 h-2.5 rounded-full ${c.dot} flex-shrink-0`} />
                    <div>
                      <p className="font-semibold text-gray-800 text-base">{item.heading}</p>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Questions or Concerns?</h2>
          <p className="text-white/80 mb-6 text-sm leading-relaxed">
            If you have any questions about this Privacy Policy or how your data is handled, please reach out to our Data Protection team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:privacy@pharmacymvp.com"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 transition rounded-xl px-5 py-3 text-sm font-medium"
            >
              <Mail className="w-5 h-5" />
              privacy@pharmacymvp.com
            </a>
            <a
              href="tel:+911800000000"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 transition rounded-xl px-5 py-3 text-sm font-medium"
            >
              <Phone className="w-5 h-5" />
              1800-000-0000 (Toll Free)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
