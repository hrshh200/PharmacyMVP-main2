import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, Phone, Clock, MapPin, Heart, Thermometer, Stethoscope, Pill } from 'lucide-react'
import CheckoutFooter from '../components/CheckoutFooter'

export default function EmergencyCare() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const id = location.hash.replace('#', '')
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  const emergencyPrecautions = [
    { icon: Heart, title: 'Check breathing first', description: 'Look for chest movement. If not breathing, start CPR if trained.' },
    { icon: Thermometer, title: 'Control heavy bleeding', description: 'Use firm direct pressure with clean cloth and keep pressure steady.' },
    { icon: Stethoscope, title: 'Keep the body stable', description: 'Avoid moving neck or spine injuries unless immediate danger exists.' },
    { icon: Pill, title: 'No food or medicine', description: 'Do not give anything by mouth until a clinician advises it.' },
  ]

  const warningSigns = [
    { title: 'Chest Pain', description: 'Pressure, squeezing, or spreading pain to arm/jaw can be critical.' },
    { title: 'Breathing Distress', description: 'Fast, shallow, noisy, or stopped breathing needs urgent response.' },
    { title: 'Uncontrolled Bleeding', description: 'Continuous bleeding may lead to shock very quickly.' },
    { title: 'Sudden Unresponsiveness', description: 'Collapse, fainting, or confusion can signal severe conditions.' },
  ]

  const quickSteps = [
    'Call emergency services immediately.',
    'Share exact location with landmark and floor details.',
    'Follow dispatcher instructions without delay.',
    'Prepare patient details: age, symptoms, known allergies.',
  ]

  return (
    <div
      className="min-h-screen px-4 pb-14 sm:px-6 lg:px-8"
      style={{
        paddingTop: 'calc(var(--app-navbar-offset, 88px) + 2.5rem)',
        background: 'linear-gradient(180deg, #fff7ed 0%, #fff1f2 30%, #f8fafc 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-700 via-red-600 to-orange-500 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-orange-200/20 blur-2xl" />

          <div className="relative z-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-100">Rapid Response Guide</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Emergency Care</h1>
              <p className="mt-3 max-w-2xl text-sm text-rose-50 sm:text-base">
                A quick-action reference for urgent situations while waiting for professional help.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href="tel:108"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
              >
                <Phone className="h-4 w-4" />
                Call Emergency
              </a>
              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                24 x 7 Support
              </div>
            </div>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          <section id="emergency-guidelines" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {emergencyPrecautions.map((precaution, index) => (
              <article
                key={index}
                className="group rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-rose-50 p-3 text-rose-600">
                  <precaution.icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{precaution.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{precaution.description}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900">Immediate Action Steps</h2>
              <p className="mt-2 text-sm text-slate-600">Follow these in order to reduce risk before emergency teams arrive.</p>
              <ul className="mt-5 space-y-3">
                {quickSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900">Critical Warning Signs</h2>
              <div className="mt-5 space-y-3">
                {warningSigns.map((mark) => (
                  <div key={mark.title} className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3">
                    <h3 className="flex items-center gap-2 text-base font-bold text-rose-700">
                      <AlertTriangle className="h-4 w-4" />
                      {mark.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{mark.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Emergency Line</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <Phone className="h-5 w-5 text-red-600" />
                  108
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Availability</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <Clock className="h-5 w-5 text-blue-600" />
                  24 Hours
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Closest Care Center</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  City General
                </p>
              </div>
            </div>
          </section>

        </main>

      </div>
      <div className="mt-10">
        <CheckoutFooter />
      </div>
    </div>
  )
}