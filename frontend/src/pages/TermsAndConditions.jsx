import { useEffect } from "react";
import { FileText, ShoppingBag, CreditCard, AlertTriangle, Scale, RefreshCw, Mail, Phone, Ban, CheckCircle } from "lucide-react";

const sections = [
  {
    icon: CheckCircle,
    title: "Acceptance of Terms",
    color: "blue",
    items: [
      {
        heading: "Agreement to Terms",
        text: "By accessing or using PharmacyMVP's platform, you confirm that you are at least 18 years of age and agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of our services.",
      },
      {
        heading: "Account Responsibility",
        text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorised use.",
      },
    ],
  },
  {
    icon: ShoppingBag,
    title: "Orders & Delivery",
    color: "emerald",
    items: [
      {
        heading: "Prescription Medicines",
        text: "Prescription-only medicines can only be dispensed upon submission of a valid prescription from a registered medical practitioner. We reserve the right to reject any order where the prescription is invalid or illegible.",
      },
      {
        heading: "Order Confirmation",
        text: "An order is confirmed only after successful payment and verification. We reserve the right to cancel any order due to stock unavailability, pricing errors, or failed verification.",
      },
      {
        heading: "Delivery Timelines",
        text: "Delivery timelines are estimates and may vary based on your location, product availability, and external factors. We are not liable for delays caused by third-party logistics partners or force majeure events.",
      },
      {
        heading: "Delivery Address",
        text: "Customers must ensure the delivery address provided is accurate. PharmacyMVP is not responsible for non-delivery due to incorrect or incomplete address information.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments & Refunds",
    color: "purple",
    items: [
      {
        heading: "Accepted Payment Methods",
        text: "We accept major credit/debit cards, UPI, net banking, and select digital wallets. All transactions are processed through PCI-DSS compliant gateways.",
      },
      {
        heading: "Pricing",
        text: "All prices are listed in Indian Rupees (INR) inclusive of applicable taxes. Prices are subject to change without prior notice; however, orders placed at the displayed price will be honoured.",
      },
      {
        heading: "Refund Policy",
        text: "Refunds are processed within 5–7 business days for eligible returns. Medicines that have been opened, temperature-sensitive products, and prescription medicines are generally non-refundable unless defective or incorrectly dispatched.",
      },
      {
        heading: "Cancellation",
        text: "Orders can be cancelled before dispatch. Once dispatched, cancellations are not accepted. Applicable refunds for cancelled orders will follow our refund policy.",
      },
    ],
  },
  {
    icon: Ban,
    title: "Prohibited Activities",
    color: "red",
    items: [
      {
        heading: "Fraudulent Use",
        text: "Using counterfeit, altered, or forged prescriptions to obtain medicines is strictly prohibited and may result in account suspension and legal action.",
      },
      {
        heading: "Resale",
        text: "Medicines purchased on our platform are for personal use only. Resale or redistribution of any products is not permitted.",
      },
      {
        heading: "Misuse of Platform",
        text: "You may not attempt to hack, scrape, reverse-engineer, or otherwise misuse our platform, APIs, or data systems.",
      },
    ],
  },
  {
    icon: AlertTriangle,
    title: "Limitation of Liability",
    color: "orange",
    items: [
      {
        heading: "Medical Advice Disclaimer",
        text: "PharmacyMVP does not provide medical advice. Content on our platform is for informational purposes only. Always consult a licensed healthcare professional before starting, stopping, or changing any medication.",
      },
      {
        heading: "Indirect Damages",
        text: "To the maximum extent permitted by law, PharmacyMVP shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of our services.",
      },
      {
        heading: "Service Availability",
        text: "We do not guarantee uninterrupted access to our platform. Scheduled or emergency maintenance may temporarily limit availability.",
      },
    ],
  },
  {
    icon: Scale,
    title: "Governing Law & Disputes",
    color: "cyan",
    items: [
      {
        heading: "Applicable Law",
        text: "These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.",
      },
      {
        heading: "Dispute Resolution",
        text: "We encourage resolution of disputes through our customer support team. If unresolved, disputes shall be settled by binding arbitration under the Arbitration and Conciliation Act, 1996.",
      },
    ],
  },
  {
    icon: RefreshCw,
    title: "Changes to Terms",
    color: "pink",
    items: [
      {
        heading: "Updates",
        text: "We reserve the right to update these Terms & Conditions at any time. Changes will be posted on this page with an updated effective date.",
      },
      {
        heading: "Continued Use",
        text: "Your continued use of our platform after changes are posted constitutes acceptance of the revised Terms. We recommend reviewing this page periodically.",
      },
    ],
  },
];

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "bg-blue-100 text-blue-600", badge: "bg-blue-600", dot: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-600", dot: "bg-emerald-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "bg-purple-100 text-purple-600", badge: "bg-purple-600", dot: "bg-purple-500" },
  red: { bg: "bg-red-50", border: "border-red-200", icon: "bg-red-100 text-red-600", badge: "bg-red-600", dot: "bg-red-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", icon: "bg-orange-100 text-orange-600", badge: "bg-orange-600", dot: "bg-orange-500" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "bg-cyan-100 text-cyan-600", badge: "bg-cyan-600", dot: "bg-cyan-500" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", icon: "bg-pink-100 text-pink-600", badge: "bg-pink-600", dot: "bg-pink-500" },
};

export default function TermsAndConditions() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-[var(--app-navbar-offset,88px)]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-blue-700 text-white py-10 px-6 rounded-b-[2rem] shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl"></div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur mb-3">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using PharmacyMVP&apos;s services. They govern your use of our platform and outline both your rights and responsibilities.
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
          These Terms & Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and{" "}
          <strong className="text-gray-900">PharmacyMVP</strong>. They govern your access to and use of our online pharmacy platform, including browsing, ordering medicines, uploading prescriptions, and any related services. Please read them in full before proceeding.
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

      {/* Contact / Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-slate-800 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Need Clarification?</h2>
          <p className="text-white/80 mb-6 text-sm leading-relaxed">
            If you have any questions about these Terms & Conditions, our legal team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:legal@pharmacymvp.com"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 transition rounded-xl px-5 py-3 text-sm font-medium"
            >
              <Mail className="w-5 h-5" />
              legal@pharmacymvp.com
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
