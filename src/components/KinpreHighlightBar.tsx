import React from 'react';
import { Tag, Sparkles, Calendar, Clock, CreditCard, ArrowRight } from 'lucide-react';

interface KinpreHighlightBarProps {
  count: number;
  totalAmount: number;
  isFilterActive: boolean;
  onToggleFilter: () => void;
  onOpenAiAnalysis: () => void;
}

export const KinpreHighlightBar: React.FC<KinpreHighlightBarProps> = ({
  count,
  totalAmount,
  isFilterActive,
  onToggleFilter,
  onOpenAiAnalysis,
}) => {
  if (count === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-indigo-100/60 to-purple-50 border-2 border-indigo-500/80 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-300">
            <CreditCard className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white tracking-wide">
                <Tag className="w-3 h-3" />
                POS DETECTED • KINPRE GLOBAL VENTURES
              </span>
              <span className="text-xs font-medium text-indigo-900 bg-indigo-200/70 px-2 py-0.5 rounded-md">
                Marked in Indigo
              </span>
            </div>

            <p className="text-xs text-indigo-950 mt-1 font-medium">
              Found <strong className="font-bold text-indigo-900">{count} POS settlement entries</strong> (Total: ₦
              {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) with transaction date captured underneath merchant narrative.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={onToggleFilter}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isFilterActive
                ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-400'
                : 'bg-white text-indigo-800 border border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <span>{isFilterActive ? '✓ Showing Kinpre Only' : 'Filter Kinpre POS'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-900">
              {count}
            </span>
          </button>

          <button
            onClick={onOpenAiAnalysis}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>AI POS Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
