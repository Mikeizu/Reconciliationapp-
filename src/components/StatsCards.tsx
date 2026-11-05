import React from 'react';
import { Landmark, BookOpen, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

interface StatsCardsProps {
  summary: {
    totalBankCount: number;
    totalSageCount: number;
    matchedCount: number;
    unmatchedBankCount: number;
    unmatchedSageCount: number;
    totalBankCredits: number;
    totalBankDebits: number;
    totalSageCredits: number;
    totalSageDebits: number;
    netDifference: number;
    kinprePosCount: number;
    kinprePosTotal: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary }) => {
  const formatCurrency = (val: number) => {
    return '₦' + Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isFullyReconciled = summary.unmatchedBankCount === 0 && summary.unmatchedSageCount === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Bank Summary */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bank Statement
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">
          {summary.totalBankCount} <span className="text-xs font-normal text-slate-500">items</span>
        </div>
        <div className="mt-2 text-xs flex justify-between text-slate-600 border-t border-slate-100 pt-2">
          <span>Inflows: <strong className="text-emerald-600">+{formatCurrency(summary.totalBankCredits)}</strong></span>
          <span>Outflows: <strong className="text-rose-600">-{formatCurrency(summary.totalBankDebits)}</strong></span>
        </div>
      </div>

      {/* 2. Sage Summary */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sage GL Ledger
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">
          {summary.totalSageCount} <span className="text-xs font-normal text-slate-500">items</span>
        </div>
        <div className="mt-2 text-xs flex justify-between text-slate-600 border-t border-slate-100 pt-2">
          <span>Credits: <strong className="text-emerald-600">+{formatCurrency(summary.totalSageCredits)}</strong></span>
          <span>Debits: <strong className="text-rose-600">-{formatCurrency(summary.totalSageDebits)}</strong></span>
        </div>
      </div>

      {/* 3. Reconciliation Status */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Match Status
          </span>
          <div className={`p-1.5 rounded-lg ${isFullyReconciled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {isFullyReconciled ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900">{summary.matchedCount}</span>
          <span className="text-xs text-emerald-600 font-semibold">Matched Pairs</span>
        </div>
        <div className="mt-2 text-xs flex justify-between text-slate-600 border-t border-slate-100 pt-2">
          <span>Unmatched Bank: <strong className="text-amber-600">{summary.unmatchedBankCount}</strong></span>
          <span>Unmatched Sage: <strong className="text-amber-600">{summary.unmatchedSageCount}</strong></span>
        </div>
      </div>

      {/* 4. Special Kinpre POS Highlight Metric */}
      <div className="bg-indigo-50/70 rounded-xl p-4 border-2 border-indigo-400 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            KINPRE POS Settlements
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-300">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-black text-indigo-950">
          {formatCurrency(summary.kinprePosTotal)}
        </div>
        <div className="mt-2 text-xs flex justify-between text-indigo-800 border-t border-indigo-200/80 pt-2 font-medium">
          <span>Batches: <strong>{summary.kinprePosCount}</strong></span>
          <span className="text-indigo-900 font-semibold">Marked in Indigo</span>
        </div>
      </div>
    </div>
  );
};
