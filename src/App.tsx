/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AdmissionForm } from './components/AdmissionForm';
import { AuditLog } from './components/AuditLog';
import { GraduationCap, ClipboardList, ShieldCheck, History, UserPlus, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'audit'>('form');

  useEffect(() => {
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div
        className={`min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900 ${
          theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-[#f5f5f5] text-[#1a1a1a]'
        }`}
      >
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">EduEnroll</span>
          </div>
          
          <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'form' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Admission
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'audit' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4" />
              Audit Log
            </button>
          </nav>

          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Light mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dark mode</span>
                </>
              )}
            </button>
            <span className="hidden sm:inline text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md">
              v2.1.0
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-[1fr_320px] gap-12 items-start"
            >
              {/* Main Content */}
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-4xl font-light tracking-tight text-gray-900">Candidate Admission</h1>
                  <p className="text-gray-500 text-lg">Please complete the enrollment process by providing accurate academic and personal details.</p>
                </div>

                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <AdmissionForm onComplete={() => setIsSubmitted(true)} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl p-12 shadow-sm border border-black/5 text-center space-y-6"
                    >
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold">Application Received</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Thank you for applying. Your details have been securely logged in our audit trail. Our team will review your eligibility and get back to you shortly.
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        <button 
                          onClick={() => setIsSubmitted(false)}
                          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                          Submit Another Application
                        </button>
                        <button 
                          onClick={() => {
                            setIsSubmitted(false);
                            setActiveTab('audit');
                          }}
                          className="text-emerald-600 font-medium hover:underline"
                        >
                          View Audit Log
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar Info */}
              <aside className="space-y-6 sticky top-28">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    Enrollment Steps
                  </h3>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span className="text-gray-600">Fill out personal and academic information</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span className="text-gray-600">Eligibility check via automated rule engine</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center shrink-0">3</span>
                      <span className="text-gray-600">Document verification and offer letter</span>
                    </li>
                  </ul>
                </div>

                {/* <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <strong>Note:</strong> All submissions are logged to a secure PostgreSQL audit trail for compliance and tracking purposes.
                  </p>
                </div> */}
              </aside>
            </motion.div>
          ) : (
            <motion.div
              key="audit-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AuditLog />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5 text-center">
        <p className="text-sm text-gray-400">© 2026 EduEnroll Systems. All rights reserved.</p>
      </footer>
      </div>
    </div>
  );
}
 
