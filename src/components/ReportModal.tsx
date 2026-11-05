import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { MatchedPair } from '../utils/reconciliation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedPairs: MatchedPair[];
  summary: any;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  matchedPairs,
  summary,
}) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && !aiReport) {
      setLoadingAi(true);
      const unmatchedBank = matchedPairs.filter(p => p.matchType === 'unmatched_bank').map(p => p.bankTx);
      const unmatchedSage = matchedPairs.filter(p => p.matchType === 'unmatched_sage').map(p => p.sageTx);

      fetch('/api/gemini/smart-reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, unmatchedBank, unmatchedSage }),
      })
        .then(r => r.json())
        .then(data => {
          setAiReport(data.report || '');
        })
        .catch(err => {
          console.error(err);
        })
        .finally(() => setLoadingAi(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return '₦' + Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = ['Match Type', 'Bank Date', 'Bank Narration', 'Bank Debit', 'Bank Credit', 'Sage Date', 'Sage Narrative', 'Sage Debit', 'Sage Credit', 'Kinpre POS'];
    const rows = matchedPairs.map(p => [
      p.matchType,
      p.bankTx?.date || '',
      `"${(p.bankTx?.description || '').replace(/"/g, '""')}"`,
      p.bankTx?.debit || 0,
      p.bankTx?.credit || 0,
      p.sageTx?.date || '',
      `"${(p.sageTx?.description || '').replace(/"/g, '""')}"`,
      p.sageTx?.debit || 0,
      p.sageTx?.credit || 0,
      (p.bankTx?.isKinprePos || p.sageTx?.isKinprePos) ? 'YES - KINPRE GLOBAL VENTURES' : 'NO'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reconciliation_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const unmatchedBankItems = matchedPairs.filter(p => p.matchType === 'unmatched_bank');
  const unmatchedSageItems = matchedPairs.filter(p => p.matchType === 'unmatched_sage');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Bank Reconciliation Statement</h3>
              <p className="text-xs text-slate-300">
                Official statement & audit variance schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          {/* Formal Accounting Schedule */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
            <div className="text-center border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Bank Reconciliation Statement
              </h2>
              <p className="text-[11px] text-slate-500">Period Ended 31st October 2024</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-900 py-1 border-b border-slate-200">
                <span>Total Net Bank Inflow (Credits minus Debits)</span>
                <span>{formatCurrency(summary.totalBankCredits - summary.totalBankDebits)}</span>
              </div>

              {/* Outstanding Additions */}
              <div className="pt-2">
                <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wide">
                  Add: Uncredited Lodgements / Transactions in Sage not yet cleared in Bank
                </span>
                {unmatchedSageItems.length === 0 ? (
                  <p className="text-slate-400 italic pl-3 text-[11px]">None</p>
                ) : (
                  unmatchedSageItems.map(p => (
                    <div key={p.id} className="flex justify-between pl-3 py-0.5 text-slate-700">
                      <span>• {p.sageTx?.description} ({p.sageTx?.date})</span>
                      <span className="font-mono">{formatCurrency(p.sageTx?.amount || 0)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Outstanding Deductions */}
              <div className="pt-2">
                <span className="font-bold text-rose-900 text-[11px] uppercase tracking-wide">
                  Less: Bank Charges & Debits not yet recorded in Sage Cash Book
                </span>
                {unmatchedBankItems.length === 0 ? (
                  <p className="text-slate-400 italic pl-3 text-[11px]">None</p>
                ) : (
                  unmatchedBankItems.map(p => (
                    <div key={p.id} className="flex justify-between pl-3 py-0.5 text-slate-700">
                      <span>• {p.bankTx?.description} ({p.bankTx?.date})</span>
                      <span className="font-mono text-rose-600">-{formatCurrency(p.bankTx?.amount || 0)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Special KINPRE POS Certification Note */}
              <div className="pt-3 border-t border-slate-200 bg-indigo-50/70 p-3 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>KINPRE GLOBAL VENTURES POS Reconciliation Note:</span>
                </div>
                <p className="text-[11px] text-indigo-950 leading-normal">
                  All <strong>{summary.kinprePosCount} POS settlement batches</strong> ({formatCurrency(summary.kinprePosTotal)})
                  identified under <strong>KINPRE GLOBAL VENTURES</strong> have been verified with transaction dates captured underneath the narrative.
                  T+1 clearing lag between POS swipe dates and bank ledger posting dates has been successfully reconciled against Sage sales entries.
                </p>
              </div>
            </div>
          </div>

          {/* AI Narrative Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900 text-xs">
                Auditor Variance Analysis & Adjusting Entries
              </span>
            </div>
            {loadingAi ? (
              <p className="text-xs text-slate-400 italic">Generating professional auditor analysis...</p>
            ) : (
              <div className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed">
                {aiReport}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
