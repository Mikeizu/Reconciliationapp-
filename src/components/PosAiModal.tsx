import React, { useState, useEffect } from 'react';
import { Sparkles, X, CreditCard, Calendar, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Transaction } from '../utils/reconciliation';

interface PosAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  posTransactions: Transaction[];
  sageTransactions: Transaction[];
  summary: any;
}

export const PosAiModal: React.FC<PosAiModalProps> = ({
  isOpen,
  onClose,
  posTransactions,
  sageTransactions,
  summary,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [source, setSource] = useState<string>('');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posTransactions,
          sageTransactions,
          summary,
        }),
      });
      const data = await res.json();
      setAnalysisText(data.analysis || 'Analysis complete.');
      setSource(data.source || 'gemini');
    } catch (err) {
      console.error(err);
      setAnalysisText('Unable to run AI analysis at this moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && posTransactions.length > 0 && !analysisText) {
      fetchAnalysis();
    }
  }, [isOpen, posTransactions]);

  if (!isOpen) return null;

  const totalPosValue = posTransactions.reduce((acc, t) => acc + (t.credit || t.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-indigo-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  AI POS Analysis: KINPRE GLOBAL VENTURES
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Indigo Flagged
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Detailed audit of transaction dates underneath vs bank clearing dates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Stats Pill */}
        <div className="bg-indigo-50/80 px-6 py-3 border-b border-indigo-100 flex flex-wrap items-center justify-between text-xs text-indigo-950 font-medium">
          <div className="flex items-center gap-4">
            <span>
              Recognized Entries: <strong>{posTransactions.length} Batches</strong>
            </span>
            <span>
              Total Volume: <strong>₦{totalPosValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-analyze
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="font-medium text-sm text-slate-700">Analyzing KINPRE GLOBAL VENTURES POS settlements...</p>
              <p className="text-xs text-slate-400">Verifying swipe dates against Sage entries and checking for clearing variances.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Transactions Breakdown Cards */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Detected POS Transactions (Marked in Indigo)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {posTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border-2 border-indigo-300 bg-indigo-50/60 text-[11px] space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-indigo-950">KINPRE GLOBAL VENTURES</span>
                        <span className="font-bold text-emerald-700">
                          +₦{(tx.credit || tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-indigo-800 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>
                          Swipe Date Underneath: <strong>{tx.posTerminalDate || 'Found in narrative'}</strong>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bank Posting: {tx.date} | Ref: {tx.reference || 'POS'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Narrative Output */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    {source.includes('gemini') ? 'Gemini 3.8 Flash Audit Report' : 'Controller Rule-Engine Findings'}
                  </span>
                </div>
                <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-normal space-y-2">
                  {analysisText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
