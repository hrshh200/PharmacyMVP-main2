import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { baseURL } from '../main';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${baseURL}/forgot-password`, {
        email: formData.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      toast.success(response.data?.message || 'Password reset successful');
      navigate('/login');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-[linear-gradient(145deg,#f4fbff_0%,#eef8f7_42%,#f8fafc_100%)] px-4 pb-10"
        style={{ paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2.5rem)' }}
      >
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(14,116,144,0.14)] backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>

          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              <KeyRound className="h-3.5 w-3.5" />
              Reset Password
            </span>
            <h1 className="mt-4 text-3xl font-black text-slate-900">Forgot your password?</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Enter your account email and set a new password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                <Mail className="mr-3 h-5 w-5 text-cyan-600" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your account email"
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                <Lock className="mr-3 h-5 w-5 text-cyan-600" />
                <input
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                <Lock className="mr-3 h-5 w-5 text-cyan-600" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-4 text-sm font-semibold text-white transition-all hover:from-cyan-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
