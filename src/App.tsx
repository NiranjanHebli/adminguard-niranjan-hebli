/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AdmissionForm } from "./components/AdmissionForm";
import { AuditLog } from "./components/AuditLog";
import {
  GraduationCap,
  ClipboardList,
  ShieldCheck,
  History,
  UserPlus,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "audit">("form");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        className={`min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900 dark:selection:bg-emerald-900/30 dark:selection:text-emerald-100 ${
          theme === "dark"
            ? "bg-[#020617] text-white"
            : "bg-white text-[#1a1a1a]"
        }`}
      >
        {/* Header */}
        <header className={`border-b sticky top-0 z-50 ${
          theme === "dark" ? "border-white/10" : "border-slate-100"
        }`}>
          <div
            className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${
              theme === "dark"
                ? "bg-[#0f0f23]/95 backdrop-blur-md"
                : "bg-white/95 backdrop-blur-md"
            }`}
          >
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    theme === "dark"
                      ? "bg-emerald-500"
                      : "bg-emerald-600"
                  }`}
                >
                  <GraduationCap
                    className={`w-5 h-5 ${
                      theme === "dark"
                        ? "text-emerald-100"
                        : "text-white"
                    }`}
                  />
                </div>
                <span
                  className={`font-semibold text-base sm:text-lg tracking-tight ${
                    theme === "dark"
                      ? "text-blue-100"
                      : "text-gray-900"
                  }`}
                >
                  Admit Guard
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav
                className={`hidden md:flex items-center gap-1 p-1 rounded-xl ${
                  theme === "dark"
                    ? "bg-slate-900/50 border border-slate-700/50"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <button
                  onClick={() => setActiveTab("form")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === "form"
                      ? "bg-white text-emerald-600 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-emerald-400 dark:shadow-slate-900/50 dark:border-slate-600"
                      : theme === "dark"
                      ? "text-blue-300 hover:text-blue-100"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Admission
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === "audit"
                      ? "bg-white text-emerald-600 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-emerald-400 dark:shadow-slate-900/50 dark:border-slate-600"
                      : theme === "dark"
                      ? "text-blue-300 hover:text-blue-100"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <History className="w-4 h-4" />
                  Audit Log
                </button>
              </nav>

              {/* Mobile Navigation Dropdown */}
              {mobileMenuOpen && (
                <div
                  className={`md:hidden absolute top-full left-0 right-0 p-4 rounded-xl shadow-lg border ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveTab("form");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-full text-left ${
                      activeTab === "form"
                        ? "bg-white text-emerald-600 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-emerald-400"
                        : theme === "dark"
                        ? "text-blue-300 hover:text-blue-100"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Admission
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("audit");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-full text-left mt-2 ${
                      activeTab === "audit"
                        ? "bg-white text-emerald-600 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-emerald-400"
                        : theme === "dark"
                        ? "text-blue-300 hover:text-blue-100"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <History className="w-4 h-4" />
                    Audit Log
                  </button>
                </div>
              )}

              {/* Theme & Mobile Toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    theme === "dark"
                      ? "border-slate-600 hover:border-emerald-500 bg-slate-800/30 text-blue-200"
                      : "border border-slate-200 hover:border-emerald-500 hover:bg-slate-50"
                  }`}
                >
                  {theme === "dark" ? (
                    <Sun className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </button>

                <button
                  onClick={toggleMobileMenu}
                  className={`p-1.5 rounded-lg transition-all md:hidden ${
                    theme === "dark"
                      ? "text-blue-300 hover:bg-slate-800/50"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <AnimatePresence mode="wait">
            {activeTab === "form" ? (
              <motion.div
                key="form-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 items-start"
              >
                <div className="space-y-6 sm:space-y-8 w-full">
                  <div className="space-y-2">
                    <h1
                      className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight ${
                        theme === "dark" ? "text-blue-100" : "text-gray-900"
                      }`}
                    >
                      Candidate Admission
                    </h1>
                    <p
                      className={`text-base sm:text-lg ${
                        theme === "dark"
                          ? "text-blue-400"
                          : "text-slate-500"
                      }`}
                    >
                      Please complete the enrollment process by providing
                      accurate academic and personal details.
                    </p>
                  </div>

                  {!isSubmitted ? (
                    <AdmissionForm
                      onComplete={() => setIsSubmitted(true)}
                    />
                  ) : (
                    <div
                      className={`rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center space-y-6 w-full ${
                        theme === "dark"
                          ? "bg-slate-900/50 border border-slate-700/50"
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h2
                          className={`text-xl sm:text-2xl font-semibold ${
                            theme === "dark"
                              ? "text-blue-100"
                              : ""
                          }`}
                        >
                          Application Received
                        </h2>
                        <p
                          className={`text-sm sm:text-base max-w-md mx-auto ${
                            theme === "dark"
                              ? "text-blue-400"
                              : "text-slate-500"
                          }`}
                        >
                          Thank you for applying. Your details have been
                          securely logged.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50"
                      >
                        Submit Another Application
                      </button>
                    </div>
                  )}
                </div>

                <aside className="hidden lg:block space-y-6 sticky top-28 max-w-xs">
                  <div
                    className={`rounded-2xl p-6 space-y-4 ${
                      theme === "dark"
                        ? "bg-slate-900/50 border border-slate-700/50"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <h3
                      className={`font-semibold flex items-center gap-2 ${
                        theme === "dark" ? "text-blue-100" : ""
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 text-emerald-600" />
                      Enrollment Steps
                    </h3>
                    <ul className="space-y-4 text-sm">
                      {[1, 2, 3].map((step, i) => (
                        <li key={step} className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center shrink-0">
                            {step}
                          </span>
                          <span
                            className={
                              theme === "dark"
                                ? "text-blue-400"
                                : "text-slate-600"
                            }
                          >
                            {i === 0 && "Fill out personal and academic information"}
                            {i === 1 && "Eligibility check via automated rule engine"}
                            {i === 2 && "Document verification and offer letter"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </motion.div>
            ) : (
              <motion.div
                key="audit-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AuditLog />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer
          className={`max-w-6xl mx-auto px-4 py-12 border-t ${
            theme === "dark" ? "border-slate-800" : "border-slate-100"
          } text-center`}
        >
          <p className="text-xs sm:text-sm text-slate-400">
            © 2026 Admit Guard Systems. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
