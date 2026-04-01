import React, { useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AlertCircle, CalendarDays, CheckCircle, FileText, Pill, Stethoscope, Upload, UserRound, X } from 'lucide-react';
import { baseURL } from '../main';

const PrescriptionDialog = ({ isOpen, onClose, onUploaded, prescriptionRequestId = null }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const prescriptionChecklist = [
    { icon: Stethoscope, title: 'Doctor Details' },
    { icon: CalendarDays, title: 'Date of Prescription' },
    { icon: UserRound, title: 'Patient Details' },
    { icon: Pill, title: 'Medicine Details' },
    { text: '10 MB', title: 'Maximum File Size' },
  ];

  if (!isOpen) return null;

  const handleFileChange = (file) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid image or PDF file.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    const token = localStorage.getItem('medVisionToken');
    if (!token) {
      toast.error('Please log in to upload a prescription.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('prescription', selectedFile);

      const isReupload = Boolean(prescriptionRequestId);
      const endpoint = isReupload
        ? `${baseURL}/prescriptions/${prescriptionRequestId}/reupload`
        : `${baseURL}/prescriptions/upload`;

      await axios({
        method: isReupload ? 'patch' : 'post',
        url: endpoint,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(isReupload
        ? 'Prescription re-uploaded successfully. Awaiting fresh review.'
        : 'Prescription uploaded successfully. Awaiting store review.');
      setSelectedFile(null);
      if (typeof onUploaded === 'function') {
        onUploaded();
      }
      onClose();
    } catch (error) {
      console.error('Prescription upload failed:', error.message);
      toast.error(error?.response?.data?.message || 'Failed to upload prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.42)]">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />

        <div className="relative bg-gradient-to-r from-cyan-700 via-sky-700 to-emerald-600 px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-white font-semibold text-base">Prescription Upload</h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100">Pharmacy Verification</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
            disabled={loading}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative px-5 py-4 sm:px-6 sm:py-5">
          <div className="grid gap-4 md:grid-cols-[1.05fr_1fr]">
            <section>
              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                Prescription checklist
              </p>
              <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  {prescriptionChecklist.map((item) => (
                    <div key={item.title} className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2 text-left">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 border border-cyan-200/80 flex items-center justify-center shrink-0">
                        {item.text ? (
                          <span className="text-sm font-bold text-cyan-900">{item.text}</span>
                        ) : (
                          <item.icon className="h-5 w-5 text-cyan-700" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{item.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                <p className="text-sm font-bold text-slate-900">Sample Prescription</p>
                <div className="mt-2 rounded-xl border border-cyan-100 bg-white p-3 text-xs text-slate-700">
                  <p><span className="font-semibold">Dr:</span> Anjali Mehta (MBBS)</p>
                  <p><span className="font-semibold">Patient:</span> John Doe</p>
                  <p><span className="font-semibold">Date:</span> 31 Mar 2026</p>
                  <p className="mt-1"><span className="font-semibold">Rx:</span> Amoxicillin 500mg - 1 tab, 2 times/day, 5 days</p>
                  <p className="mt-1 text-cyan-700 font-medium">Signature & clinic stamp should be visible.</p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">Upload file</p>
              <div
                className={`mt-3 border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-50'
                    : selectedFile
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-300 hover:border-cyan-300 hover:bg-cyan-50/40'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileChange(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-9 h-9 text-emerald-500" />
                    <p className="text-sm font-medium text-emerald-700 break-all">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-600">Tap to change file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-9 h-9 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Click or drag and drop</p>
                    <p className="text-xs text-gray-400">JPG, PNG or PDF accepted</p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-start gap-3 rounded-xl border border-cyan-100 bg-white/90 p-3">
                <div className="h-7 w-7 rounded-full border border-cyan-400 text-cyan-600 bg-cyan-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs sm:text-sm italic text-slate-700 leading-relaxed">
                  Our pharmacists will quickly review your prescription to keep your order safe and compliant with healthcare guidelines.
                </p>
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedFile}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedFile && !loading
                      ? 'bg-gradient-to-r from-cyan-600 to-emerald-500 text-white hover:from-cyan-500 hover:to-emerald-400 shadow-md shadow-cyan-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Uploading...' : 'Confirm & Submit'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDialog;
