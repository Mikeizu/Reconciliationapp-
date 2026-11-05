import React from 'react';
import { ArrowDownUp, CheckCircle2, AlertTriangle, Sparkles, SlidersHorizontal, ArrowDown, ArrowUp } from 'lucide-react';
import { DateOrderInfo, SortOrder } from '../utils/reconciliation';

interface OrderSyncBannerProps {
  bankOrderInfo: DateOrderInfo;
  sageOrderInfo: DateOrderInfo;
  currentSortOrder: SortOrder;
  onChangeSortOrder: (order: SortOrder) => void;
  dateToleranceDays: number;
  onChangeToleranceDays: (days: number) => void;
  viewMode: 'paired' | 'split';
  onChangeViewMode: (mode: 'paired' | 'split') => void;
}

export const OrderSyncBanner: React.FC<OrderSyncBannerProps> = ({
  bankOrderInfo,
  sageOrderInfo,
  currentSortOrder,
  onChangeSortOrder,
  dateToleranceDays,
  onChangeToleranceDays,
  viewMode,
  onChangeViewMode,
}) => {
  const isOrderMismatch =
    (bankOrderInfo.detectedOrder === 'descending' && sageOrderInfo.detectedOrder === 'ascending') ||
    (bankOrderInfo.detectedOrder === 'ascending' && sageOrderInfo.detectedOrder === 'descending');

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/50 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left explanation */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Smart Order Alignment Active
            </span>
            {isOrderMismatch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                Detected Bank Descending vs Sage Ascending
              </span>
            )}
          </div>

          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Statement Chronology Synchronized</span>
          </h2>

          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <span className="text-slate-400">Bank Statement:</span>
              <span className="font-medium text-slate-200 capitalize flex items-center gap-1">
                {bankOrderInfo.detectedOrder === 'descending' ? (
                  <>
                    <ArrowDown className="w-3 h-3 text-amber-400" /> Descending (Newest First)
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-3 h-3 text-emerald-400" /> Ascending (Oldest First)
                  </>
                )}
              </span>
            </div>

            <span className="text-slate-500 hidden sm:inline">➔</span>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <span className="text-slate-400">Sage GL Export:</span>
              <span className="font-medium text-slate-200 capitalize flex items-center gap-1">
                {sageOrderInfo.detectedOrder === 'ascending' ? (
                  <>
                    <ArrowUp className="w-3 h-3 text-emerald-400" /> Ascending (Oldest First)
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3 text-amber-400" /> Descending (Newest First)
                  </>
                )}
              </span>
            </div>

            <span className="text-xs text-indigo-300">
              {currentSortOrder !== 'raw'
                ? `⚡ Auto-aligned both files to ${currentSortOrder === 'ascending' ? 'Oldest ➔ Newest' : 'Newest ➔ Oldest'}`
                : '⚠️ Showing raw unaligned files (harder to compare)'}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80">
          {/* Sorting Choice */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <ArrowDownUp className="w-3 h-3 text-indigo-400" />
              Unified Sort Order
            </label>
            <div className="inline-flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => onChangeSortOrder('ascending')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentSortOrder === 'ascending'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort both statements chronologically (Oldest to Newest)"
              >
                Oldest First
              </button>
              <button
                type="button"
                onClick={() => onChangeSortOrder('descending')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentSortOrder === 'descending'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort both statements recent first (Newest to Oldest)"
              >
                Newest First
              </button>
              <button
                type="button"
                onClick={() => onChangeSortOrder('raw')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                  currentSortOrder === 'raw'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="View original unaligned order (Bank Descending, Sage Ascending)"
              >
                Raw Source
              </button>
            </div>
          </div>

          {/* Layout Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
              Comparison View
            </label>
            <div className="inline-flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => onChangeViewMode('paired')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'paired'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Horizontal 1:1 paired alignment where matches sit on the exact same row"
              >
                1:1 Paired Rows
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('split')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'split'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dual synchronized scrollable columns"
              >
                Dual Columns
              </button>
            </div>
          </div>

          {/* Date Clearing Lag Tolerance */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Clearing Lag</span>
              <span className="text-indigo-300 font-semibold">±{dateToleranceDays}d</span>
            </label>
            <select
              value={dateToleranceDays}
              onChange={(e) => onChangeToleranceDays(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="0">0 days (Same date only)</option>
              <option value="1">±1 day (Next-day settlement)</option>
              <option value="2">±2 days (Standard POS)</option>
              <option value="3">±3 days (Weekend clearing)</option>
              <option value="5">±5 days (Cheque clearing)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
