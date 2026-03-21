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
import * as XLSX from 'xlsx';

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
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetError, setSheetError] = useState('');
  const [sheetInfo, setSheetInfo] = useState('');
  const [isSheetImporting, setIsSheetImporting] = useState(false);
  const [excelError, setExcelError] = useState('');

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

  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      'ID',
      'Timestamp',
      'Candidate Name',
      'Email',
      'Exception Count',
      'Sent For Manager Review',
      'Full Name',
      'Phone',
      'DOB',
      'Aadhaar',
      'Qualification',
      'Graduation Year',
      'Score Type',
      'Score',
      'Screening Score',
      'Interview Status',
      'Offer Letter Sent'
    ];

    const escape = (value: any) => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = logs.map((log) => {
      const v = log.values || {};
      return [
        log.id,
        log.timestamp,
        log.candidateName,
        log.email,
        log.exceptionCount,
        log.isFlagged ? 'Yes' : 'No',
        v.fullName,
        v.phone,
        v.dob,
        v.aadhaar,
        v.qualification,
        v.graduationYear,
        v.scoreType,
        v.score,
        v.screeningScore,
        v.interviewStatus,
        v.offerLetterSent ? 'Yes' : 'No'
      ]
        .map(escape)
        .join(',');
    });

    const csvContent = [headers.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getGoogleSheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const getSheetGid = (url: string) => {
    try {
      const parsed = new URL(url);
      const gidFromQuery = parsed.searchParams.get('gid');
      if (gidFromQuery) return gidFromQuery;
      if (parsed.hash.startsWith('#gid=')) return parsed.hash.replace('#gid=', '');
      return '0';
    } catch {
      return '0';
    }
  };

  const importSheetRowsToAuditLog = async () => {
    setSheetError('');
    setSheetInfo('');
    const trimmedUrl = sheetUrl.trim();
    const sheetId = getGoogleSheetId(trimmedUrl);

    setIsSheetImporting(true);
    try {
      if (!sheetId) throw new Error('Enter a valid Google Sheet URL.');

      const response = await fetch(`/api/google-export?url=${encodeURIComponent(trimmedUrl)}`);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Could not read this Google Sheet. Check sharing access and sheet tab (gid).');
      }

      const csvText = await response.text();
      if (/^\s*<(?:!doctype|html|head|body)\b/i.test(csvText)) {
        throw new Error('Google returned HTML instead of CSV. Ensure the sheet is shared as Anyone with the link can view.');
      }

      const parseCsv = (text: string): string[][] => {
        const rows: string[][] = [];
        let row: string[] = [];
        let cell = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];
          const next = text[i + 1];

          if (char === '"') {
            if (inQuotes && next === '"') {
              cell += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }

          if (char === ',' && !inQuotes) {
            row.push(cell);
            cell = '';
            continue;
          }

          if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
            continue;
          }

          cell += char;
        }

        row.push(cell);
        rows.push(row);
        return rows
          .map((r) => r.map((c) => c.trim()))
          .filter((r) => r.some((c) => c.length > 0));
      };

      const rows = parseCsv(csvText);
      if (rows.length < 2) throw new Error('No data rows found in Google Sheet.');

      const normalize = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const headers = rows[0].map((h) => String(h ?? '').trim());
      const headerIndex = headers.reduce<Record<string, number>>((acc, h, i) => {
        acc[normalize(h)] = i;
        return acc;
      }, {});
      const getCell = (row: string[], ...keys: string[]) => {
        for (const key of keys) {
          const idx = headerIndex[normalize(key)];
          if (idx !== undefined) return String(row[idx] ?? '').trim();
        }
        return '';
      };

      const importedLogs: AuditEntry[] = rows
        .slice(1)
        .filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0))
        .map((row) => {
          const fullName = getCell(row, 'Full Name', 'Candidate Name', 'Name');
          const email = getCell(row, 'Email', 'Email Address');
          const offerLetter = getCell(row, 'Offer Letter Sent');
          const managerReview = getCell(row, 'Sent For Manager Review', 'Manager Review');
          const exceptionCountRaw = getCell(row, 'Exception Count');
          const parsedExceptionCount = Number(exceptionCountRaw);
          const exceptionCount = Number.isNaN(parsedExceptionCount) ? 0 : parsedExceptionCount;

          return {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            candidateName: fullName || email || 'Imported Candidate',
            email: email || 'N/A',
            values: {
              fullName,
              email,
              phone: getCell(row, 'Phone'),
              dob: getCell(row, 'DOB', 'Date of Birth'),
              aadhaar: getCell(row, 'Aadhaar'),
              qualification: getCell(row, 'Qualification', 'Highest Qualification'),
              graduationYear: getCell(row, 'Graduation Year'),
              scoreType: getCell(row, 'Score Type'),
              score: getCell(row, 'Score'),
              screeningScore: getCell(row, 'Screening Score'),
              interviewStatus: getCell(row, 'Interview Status'),
              offerLetterSent: ['yes', 'true', '1'].includes(offerLetter.toLowerCase())
            },
            exceptionCount,
            exceptions: [],
            isFlagged: ['yes', 'true', '1'].includes(managerReview.toLowerCase())
          };
        });

      if (importedLogs.length === 0) throw new Error('No valid rows found in Google Sheet.');

      const updatedLogs = [...importedLogs, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('admission_audit_log', JSON.stringify(updatedLogs));
      setSheetInfo(`Imported ${importedLogs.length} rows into Audit Log.`);
    } catch (error: any) {
      setSheetError(error?.message || 'Unable to import rows from Google Sheet.');
    } finally {
      setIsSheetImporting(false);
    }
  };

  const exportRowsAsCsv = (rows: string[][], filenamePrefix: string) => {
    if (rows.length === 0) throw new Error('No rows found to export.');
    const maxCols = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');
      return padded;
    });

    const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csvContent = normalizedRows
      .map((row) => row.map(escape).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExcelUploadExport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setExcelError('');
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('No worksheet found in this Excel file.');

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
        header: 1,
        blankrows: false
      });

      const normalizedRows = rows
        .map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell))))
        .filter((row) => row.some((cell) => cell.trim().length > 0));

      exportRowsAsCsv(normalizedRows, 'excel_rows_export');
    } catch (error: any) {
      setExcelError(error?.message || 'Unable to parse this Excel file.');
    } finally {
      event.target.value = '';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalSubmissions = logs.length;
  const flaggedCount = logs.filter((log) => log.isFlagged).length;
  const submissionsWithExceptions = logs.filter((log) => log.exceptionCount > 0).length;
  const exceptionRate = totalSubmissions === 0 ? 0 : Math.round((submissionsWithExceptions / totalSubmissions) * 100);

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
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Log
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Submissions</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{totalSubmissions}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Exception Rate</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{exceptionRate}%</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {submissionsWithExceptions} of {totalSubmissions || 0} with exceptions
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Flagged Entries</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{flaggedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Import Rows from Google Sheet
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={importSheetRowsToAuditLog}
            disabled={isSheetImporting}
            className="px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSheetImporting ? 'Importing...' : 'Import Sheet Rows'}
          </button>
        </div>
        {sheetError && (
          <p className="text-xs text-red-600">{sheetError}</p>
        )}
        {sheetInfo && (
          <p className="text-xs text-emerald-700">{sheetInfo}</p>
        )}
        <p className="text-xs text-gray-400">
          Google Sheets only. Rows are added directly to Audit Log (no CSV download).
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Export CSV from Excel File
        </p>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUploadExport}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>
        {excelError && (
          <p className="text-xs text-red-600">{excelError}</p>
        )}
        <p className="text-xs text-gray-400">
          Upload `.xlsx` or `.xls`. The first worksheet is converted and downloaded as CSV.
        </p>
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
                    <tr className={`bg-gray-50/50 transition-colors ${log.isFlagged ? 'bg-amber-50/30' : ''}`}>
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
                            Clear
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
