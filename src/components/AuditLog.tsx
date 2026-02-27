import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  User, 
  CheckCircle2,
  FileText,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';

export interface AuditEntry {
  id: string;
  timestamp: string;
  candidateName: string;
  email: string;
  values: any;
  exceptionCount: number;
  exceptions: Array<{ field: string; rationale: string }>;
  isFlagged: boolean;
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const storedLogs = localStorage.getItem('admission_audit_log');
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('admission_audit_log');
    setLogs([]);
    setShowClearConfirm(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Audit Trail</h2>
            <p className="text-sm text-gray-500">History of all candidate admissions and exceptions.</p>
          </div>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Log
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <p className="text-gray-500">No submission logs found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-black/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Candidate</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Submitted At</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Exceptions</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={`hover:bg-gray-50/50 transition-colors ${log.isFlagged ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate max-w-[150px]">{log.candidateName}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{log.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${log.exceptionCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                          {log.exceptionCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {log.isFlagged ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-200 whitespace-nowrap">
                            <ShieldAlert className="w-3 h-3" />
                            Sent for manager review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-200 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                        >
                          {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedId === log.id && (
                        <tr>
                          <td colSpan={5} className="px-6 py-0 border-none">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  {/* Field Values */}
                                  <div className="md:col-span-2 space-y-6 min-w-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {[
                                        {
                                          title: 'Personal Details',
                                          fields: [
                                            { key: 'fullName', label: 'Full Name' },
                                            { key: 'email', label: 'Email' },
                                            { key: 'phone', label: 'Phone' },
                                            { key: 'dob', label: 'Date of Birth' },
                                            { key: 'aadhaar', label: 'Aadhaar' }
                                          ]
                                        },
                                        {
                                          title: 'Academic Details',
                                          fields: [
                                            { key: 'qualification', label: 'Qualification' },
                                            { key: 'graduationYear', label: 'Graduation Year' },
                                            { key: 'scoreType', label: 'Score Type' },
                                            { key: 'score', label: 'Score' }
                                          ]
                                        },
                                        {
                                          title: 'Interview Details',
                                          fields: [
                                            { key: 'screeningScore', label: 'Screening Score' },
                                            { key: 'interviewStatus', label: 'Interview Status' },
                                            { key: 'offerLetterSent', label: 'Offer Letter Sent' }
                                          ]
                                        }
                                      ].map((group) => (
                                        <div key={group.title} className="space-y-3">
                                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            {group.title}
                                          </h4>
                                          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                            {group.fields.map((field) => (
                                              <div key={field.key} className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-gray-400 uppercase font-medium">{field.label}</span>
                                                <span className="font-medium text-xs text-gray-700 break-words">
                                                  {field.key === 'offerLetterSent' 
                                                    ? (log.values[field.key] ? 'Yes' : 'No') 
                                                    : String(log.values[field.key] || 'N/A')}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Exceptions */}
                                  <div className="space-y-3 min-w-0">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                      <AlertCircle className="w-3 h-3" />
                                      Active Exceptions ({log.exceptionCount})
                                    </h4>
                                    {log.exceptions.length > 0 ? (
                                      <div className="grid gap-3">
                                        {log.exceptions.map((ex, i) => (
                                          <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1 relative overflow-hidden">
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            <p className="text-xs font-bold text-amber-900 capitalize break-words pr-4">{ex.field.replace(/([A-Z])/g, ' $1')}</p>
                                            <p className="text-xs text-amber-700 italic break-words">"{ex.rationale}"</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-gray-50 rounded-2xl p-4 text-center">
                                        <p className="text-xs text-gray-400">No exceptions used for this candidate.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Clear Audit Log?</h3>
                <p className="text-gray-500 text-sm">This action cannot be undone. All submission history will be permanently deleted.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearLogs}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
