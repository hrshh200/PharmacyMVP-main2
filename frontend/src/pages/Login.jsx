import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import { baseURL } from "../main";

import {
  Mail,
  Lock,
  Pill,
  ShieldCheck,
  Clock3,
  PackageCheck,
  Sparkles,
  ArrowRight,
  UserRound,
  Store,
} from "lucide-react";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa";

const Login = () => {

  const [type, setType] = useState("password");
  const [userType, setUserType] = useState("patient");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

  };

  const submitHandler = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    let loginPayload = {
      ...formData,
      isDoctor: false,
      userType,
    };

    // Handle admin login
    if (formData.email === 'admin@admin.com' && formData.password === 'admin') {
      loginPayload.userType = 'admin';
    }

    const response = await axios.post(`${baseURL}/login`, loginPayload);

    toast.success("Login successful!");

    // Store REAL JWT from backend
    localStorage.setItem("medVisionToken", response.data.token);
    localStorage.setItem("medVisionUserType", loginPayload.userType);

    if (loginPayload.userType === 'admin') {
      navigate("/admindashboard");
    } else if (loginPayload.userType === 'store') {
      navigate("/storeDashboard");
    } else {
      navigate("/dashboard");
    }

  } catch (error) {
    toast.error(error?.response?.data?.message || "Login failed. Please try again.");
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <>
          <Navbar />

          <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#f4fbff_0%,#eef8f7_42%,#f8fafc_100%)] px-4 pb-12" style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2.5rem)' }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.08),transparent_34%)]" />
            <div className="absolute left-[-80px] top-28 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="absolute right-[-70px] top-20 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute bottom-[-110px] left-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="hidden lg:flex flex-col justify-between rounded-[2rem] border border-slate-200/70 bg-slate-900 px-10 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pharmacy Login Portal
                  </span>

                  <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-900/30">
                    <Pill className="h-10 w-10 text-slate-950" strokeWidth={2} />
                  </div>

                  <h1 className="mt-8 max-w-lg text-5xl font-black leading-tight">
                    Welcome back to a smarter pharmacy experience.
                  </h1>

                  <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                    Sign in to manage prescriptions, track orders, monitor deliveries, and keep your medicine workflow fast and dependable.
                  </p>
                </div>

                <div className="mt-10 grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <ShieldCheck className="h-6 w-6 text-emerald-300" />
                      <p className="mt-3 text-sm font-semibold">Verified access</p>
                      <p className="mt-1 text-xs leading-6 text-slate-400">Protected patient and store sessions.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <Clock3 className="h-6 w-6 text-cyan-300" />
                      <p className="mt-3 text-sm font-semibold">Quick refill flow</p>
                      <p className="mt-1 text-xs leading-6 text-slate-400">Return to ongoing orders without friction.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <PackageCheck className="h-6 w-6 text-sky-300" />
                      <p className="mt-3 text-sm font-semibold">Live order status</p>
                      <p className="mt-1 text-xs leading-6 text-slate-400">Check deliveries and medicine progress instantly.</p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">What you unlock</p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-200">
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <span>Prescription upload and verification</span>
                        <ArrowRight className="h-4 w-4 text-cyan-200" />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <span>Medicine cart, payment, and order history</span>
                        <ArrowRight className="h-4 w-4 text-cyan-200" />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <span>Store inventory workflow and delivery updates</span>
                        <ArrowRight className="h-4 w-4 text-cyan-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(14,116,144,0.14)] backdrop-blur-xl sm:p-8 lg:p-10">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                      Secure Sign In
                    </span>
                    <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
                      Access your pharmacy dashboard
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                      Choose your access type and continue with your medicine orders, prescriptions, or store operations.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current portal</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {userType === "store" ? "Store Operations" : "Patient Care"}
                    </p>
                  </div>
                </div>

                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setUserType("patient")}
                    className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                      userType === "patient"
                        ? "border-cyan-500 bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${userType === "patient" ? "bg-white/20" : "bg-cyan-100 text-cyan-700"}`}>
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Patient Login</p>
                        <p className={`mt-1 text-xs ${userType === "patient" ? "text-cyan-50" : "text-slate-500"}`}>
                          Manage prescriptions, orders, and deliveries.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("store")}
                    className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                      userType === "store"
                        ? "border-slate-900 bg-gradient-to-br from-slate-900 to-teal-800 text-white shadow-lg shadow-slate-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${userType === "store" ? "bg-white/15" : "bg-teal-100 text-teal-700"}`}>
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Store Login</p>
                        <p className={`mt-1 text-xs ${userType === "store" ? "text-teal-50" : "text-slate-500"}`}>
                          Handle inventory, orders, and pharmacy fulfillment.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <form onSubmit={submitHandler} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                      <Mail className="mr-3 h-5 w-5 text-cyan-600" />
                      <input
                        type="email"
                        placeholder={userType === "store" ? "Enter your store email" : "Enter your email"}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label className="block text-sm font-semibold text-slate-700">
                        Password
                      </label>
                      <span
                        onClick={() => navigate("/forgot-password")}
                        className="cursor-pointer text-sm font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                      >
                        Forgot Password?
                      </span>
                    </div>

                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                      <Lock className="mr-3 h-5 w-5 text-cyan-600" />
                      <input
                        type={type}
                        placeholder="Enter your password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      {type === "password" ? (
                        <FaRegEyeSlash
                          onClick={() => setType("text")}
                          className="cursor-pointer text-cyan-600"
                        />
                      ) : (
                        <FaRegEye
                          onClick={() => setType("password")}
                          className="cursor-pointer text-cyan-600"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="font-semibold text-slate-900">Prescriptions</p>
                      <p className="mt-1 text-xs leading-6">Upload and review medicine guidance.</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="font-semibold text-slate-900">Orders</p>
                      <p className="mt-1 text-xs leading-6">Track current deliveries and history.</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="font-semibold text-slate-900">Store Tools</p>
                      <p className="mt-1 text-xs leading-6">Access inventory and pharmacy operations.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 ${
                      userType === "store"
                        ? "bg-gradient-to-r from-slate-900 to-teal-700 shadow-lg shadow-slate-200 hover:from-slate-800 hover:to-teal-600"
                        : "bg-gradient-to-r from-cyan-600 to-sky-600 shadow-lg shadow-cyan-200 hover:from-cyan-700 hover:to-sky-700"
                    }`}
                  >
                    {userType === "store" ? "Login to Store Dashboard" : "Login to Patient Dashboard"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Or continue with
                  </span>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-lg text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50">
                    <FaGoogle />
                  </button>
                  <button className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-lg text-blue-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50">
                    <FaFacebook />
                  </button>
                  <button className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-lg text-sky-500 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50">
                    <FaTwitter />
                  </button>
                </div>

                <p className="mt-7 text-center text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <span
                    onClick={() => navigate("/signup")}
                    className="cursor-pointer font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                  >
                    Create one here
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Login;