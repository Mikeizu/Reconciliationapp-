import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  CreditCard,
  Calendar,
  ExternalLink,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { MatchedPair, Transaction, SortOrder } from '../utils/reconciliation';

interface ComparisonTableProps {
  matchedPairs: MatchedPair[];
  bankTransactions: Transaction[];
  sageTransactions: Transaction[];
  viewMode: 'paired' | 'split';
  sortOrder: SortOrder;
  filterKinpreOnly: boolean;
  onToggleFilterKinpre: () => void;
  onSelectPairForDetail: (pair: MatchedPair) => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  matchedPairs,
  bankTransactions,
  sageTransactions,
  viewMode,
  sortOrder,
  filterKinpreOnly,
  onToggleFilterKinpre,
  onSelectPairForDetail,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Format currency
  const formatAmt = (val?: number) => {
    if (val === undefined || val === 0) return '-';
    return '₦' + Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filter pairs
  const filteredPairs = matchedPairs.filter((pair) => {
    // Kinpre POS filter
    if (filterKinpreOnly) {
      const isKinpre = pair.bankTx?.isKinprePos || pair.sageTx?.isKinprePos;
      if (!isKinpre) return false;
    }

    // Match status filter
    if (filterType === 'matched') {
      if (pair.matchType !== 'exact' && pair.matchType !== 'fuzzy_date' && pair.matchType !== 'manual') return false;
    } else if (filterType === 'unmatched') {
      if (pair.matchType !== 'unmatched_bank' && pair.matchType !== 'unmatched_sage') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bDesc = pair.bankTx?.description.toLowerCase() || '';
      const bRef = pair.bankTx?.reference?.toLowerCase() || '';
      const sDesc = pair.sageTx?.description.toLowerCase() || '';
      const sRef = pair.sageTx?.reference?.toLowerCase() || '';
      const amtMatch =
        (pair.bankTx?.amount && pair.bankTx.amount.toString().includes(q)) ||
        (pair.sageTx?.amount && pair.sageTx.amount.toString().includes(q));

      if (!bDesc.includes(q) && !bRef.includes(q) && !sDesc.includes(q) && !sRef.includes(q) && !amtMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
        {/* Left: Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            All Items ({matchedPairs.length})
          </button>

          <button
            onClick={() => setFilterType('matched')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'matched'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched (
            {matchedPairs.filter((p) => p.matchType === 'exact' || p.matchType === 'fuzzy_date' || p.matchType === 'manual').length}
            )
          </button>

          <button
            onClick={() => setFilterType('unmatched')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'unmatched'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Discrepancies (
            {matchedPairs.filter((p) => p.matchType === 'unmatched_bank' || p.matchType === 'unmatched_sage').length}
            )
          </button>

          {/* Kinpre POS Special Pill */}
          <button
            onClick={onToggleFilterKinpre}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterKinpreOnly
                ? 'bg-indigo-700 text-white ring-2 ring-indigo-400 shadow-sm'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100'
            }`}
            title="Isolate all POS transactions for KINPRE GLOBAL VENTURES (marked in indigo)"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>KINPRE POS Only</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-extrabold">
              {matchedPairs.filter((p) => p.bankTx?.isKinprePos || p.sageTx?.isKinprePos).length}
            </span>
          </button>
        </div>

        {/* Right: Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search narration, ref, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main View: Paired 1:1 Comparison */}
      {viewMode === 'paired' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Double Header */}
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                <th colSpan={4} className="py-2.5 px-4 bg-blue-50/80 text-blue-900 border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px]">🏦 Bank Statement</span>
                    <span className="text-[10px] text-blue-700 font-medium">
                      Order: {sortOrder === 'descending' ? 'Newest First' : 'Oldest First'}
                    </span>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center bg-slate-100 text-slate-700 w-28 border-r border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  Match
                </th>
                <th colSpan={4} className="py-2.5 px-4 bg-emerald-50/80 text-emerald-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px]">📚 Sage GL Cash Book</span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Order: {sortOrder === 'descending' ? 'Newest First' : 'Oldest First'}
                    </span>
                  </div>
                </th>
              </tr>

              {/* Column Titles */}
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                {/* Bank columns */}
                <th className="py-2 px-3 w-24">Date</th>
                <th className="py-2 px-3 min-w-[200px]">Bank Narration</th>
                <th className="py-2 px-3 w-24 text-right">Debit (-)</th>
                <th className="py-2 px-3 w-28 text-right border-r border-slate-200">Credit (+)</th>

                {/* Match indicator */}
                <th className="py-2 px-2 text-center border-r border-slate-200">Status</th>

                {/* Sage columns */}
                <th className="py-2 px-3 w-24">Date</th>
                <th className="py-2 px-3 min-w-[200px]">Sage Narrative</th>
                <th className="py-2 px-3 w-24 text-right">Debit (-)</th>
                <th className="py-2 px-3 w-28 text-right">Credit (+)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transactions match the selected filter or search query.
                  </td>
                </tr>
              ) : (
                filteredPairs.map((pair) => {
                  const isKinpre = pair.bankTx?.isKinprePos || pair.sageTx?.isKinprePos;

                  // Row background styling: Indigo for KINPRE GLOBAL VENTURES!
                  let rowBgClass = 'hover:bg-slate-50/80 transition-colors';
                  if (isKinpre) {
                    rowBgClass =
                      'bg-indigo-50/70 hover:bg-indigo-100/60 border-l-4 border-l-indigo-600 text-indigo-950';
                  } else if (pair.matchType === 'unmatched_bank') {
                    rowBgClass = 'bg-amber-50/30 hover:bg-amber-50/60';
                  } else if (pair.matchType === 'unmatched_sage') {
                    rowBgClass = 'bg-amber-50/30 hover:bg-amber-50/60';
                  }

                  return (
                    <tr key={pair.id} className={rowBgClass}>
                      {/* === BANK COLUMNS === */}
                      {pair.bankTx ? (
                        <>
                          {/* Date */}
                          <td className="py-3 px-3 align-top font-medium text-slate-800 whitespace-nowrap">
                            {pair.bankTx.date}
                          </td>

                          {/* Narration */}
                          <td className="py-3 px-3 align-top">
                            <div className="space-y-1">
                              {/* If Kinpre POS, show glowing Indigo badge */}
                              {pair.bankTx.isKinprePos && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                                  <CreditCard className="w-3 h-3" />
                                  <span>KINPRE GLOBAL VENTURES</span>
                                </div>
                              )}

                              <p className="font-medium text-slate-900 leading-snug">
                                {pair.bankTx.description.split('\n')[0]}
                              </p>

                              {/* Multi-line narrative / date underneath */}
                              {pair.bankTx.posTerminalDate && (
                                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-200">
                                  <Calendar className="w-3 h-3 text-indigo-600" />
                                  <span>
                                    Swipe Date Underneath: <strong>{pair.bankTx.posTerminalDate}</strong>
                                    {pair.bankTx.posTerminalTime && ` (${pair.bankTx.posTerminalTime})`}
                                  </span>
                                </div>
                              )}

                              {/* Subline detail */}
                              {pair.bankTx.description.split('\n').length > 1 && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {pair.bankTx.description.split('\n').slice(1).join(' • ')}
                                </div>
                              )}

                              {pair.bankTx.reference && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Ref: {pair.bankTx.reference}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Debit */}
                          <td className="py-3 px-3 align-top text-right text-rose-600 font-semibold whitespace-nowrap">
                            {pair.bankTx.debit > 0 ? `-${formatAmt(pair.bankTx.debit)}` : '-'}
                          </td>

                          {/* Credit */}
                          <td className="py-3 px-3 align-top text-right text-emerald-600 font-semibold border-r border-slate-200 whitespace-nowrap">
                            {pair.bankTx.credit > 0 ? `+${formatAmt(pair.bankTx.credit)}` : '-'}
                          </td>
                        </>
                      ) : (
                        /* Empty Bank cell when Sage is unmatched */
                        <td colSpan={4} className="py-3 px-4 align-middle text-center bg-slate-50/50 border-r border-slate-200 text-slate-400 italic">
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                            Missing in Bank Statement
                          </span>
                        </td>
                      )}

                      {/* === MATCH STATUS CONNECTOR === */}
                      <td className="py-3 px-2 align-middle text-center border-r border-slate-200 whitespace-nowrap">
                        {pair.matchType === 'exact' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Exact
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">100% Match</span>
                          </div>
                        ) : pair.matchType === 'fuzzy_date' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              Lag Matched
                            </span>
                            <span className="text-[9px] text-indigo-700 mt-0.5 font-medium">
                              T+1 Clearing Lag
                            </span>
                          </div>
                        ) : pair.matchType === 'unmatched_bank' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Bank Only
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Needs Sage Post</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Sage Only
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Unpresented</span>
                          </div>
                        )}
                      </td>

                      {/* === SAGE COLUMNS === */}
                      {pair.sageTx ? (
                        <>
                          {/* Date */}
                          <td className="py-3 px-3 align-top font-medium text-slate-800 whitespace-nowrap">
                            {pair.sageTx.date}
                          </td>

                          {/* Narrative */}
                          <td className="py-3 px-3 align-top">
                            <div className="space-y-1">
                              {pair.sageTx.isKinprePos && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                                  <CreditCard className="w-3 h-3" />
                                  <span>KINPRE POS</span>
                                </div>
                              )}

                              <p className="font-medium text-slate-900 leading-snug">
                                {pair.sageTx.description}
                              </p>

                              {pair.sageTx.posDetails && (
                                <div className="text-[10px] text-indigo-700">
                                  {pair.sageTx.posDetails}
                                </div>
                              )}

                              {pair.sageTx.reference && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Ref: {pair.sageTx.reference}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Debit */}
                          <td className="py-3 px-3 align-top text-right text-rose-600 font-semibold whitespace-nowrap">
                            {pair.sageTx.debit > 0 ? `-${formatAmt(pair.sageTx.debit)}` : '-'}
                          </td>

                          {/* Credit */}
                          <td className="py-3 px-3 align-top text-right text-emerald-600 font-semibold whitespace-nowrap">
                            {pair.sageTx.credit > 0 ? `+${formatAmt(pair.sageTx.credit)}` : '-'}
                          </td>
                        </>
                      ) : (
                        /* Empty Sage cell when Bank is unmatched */
                        <td colSpan={4} className="py-3 px-4 align-middle text-center bg-slate-50/50 text-slate-400 italic">
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                            Missing in Sage Ledger
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Split Dual Column View */
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left: Bank Statement List */}
          <div className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-blue-900">🏦 Bank Statement</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  {bankTransactions.length} items
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Sorted: {sortOrder === 'descending' ? 'Newest First' : 'Oldest First'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {bankTransactions.map((tx) => {
                const isKinpre = tx.isKinprePos;
                return (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isKinpre
                        ? 'bg-indigo-50/80 border-indigo-400 border-l-4 border-l-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {isKinpre && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                            <CreditCard className="w-3 h-3" />
                            KINPRE GLOBAL VENTURES
                          </span>
                        )}
                        <p className="font-semibold text-slate-900">{tx.description.split('\n')[0]}</p>
                        {tx.posTerminalDate && (
                          <div className="text-[11px] font-medium text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                            📅 Date Underneath: {tx.posTerminalDate} {tx.posTerminalTime}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">Date: {tx.date} | Ref: {tx.reference || 'N/A'}</span>
                      </div>
                      <div className="text-right shrink-0">
                        {tx.credit > 0 ? (
                          <div className="font-bold text-emerald-600">+{formatAmt(tx.credit)}</div>
                        ) : (
                          <div className="font-bold text-rose-600">-{formatAmt(tx.debit)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Sage Statement List */}
          <div className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-emerald-900">📚 Sage GL Cash Book</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {sageTransactions.length} items
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Sorted: {sortOrder === 'descending' ? 'Newest First' : 'Oldest First'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {sageTransactions.map((tx) => {
                const isKinpre = tx.isKinprePos;
                return (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isKinpre
                        ? 'bg-indigo-50/80 border-indigo-400 border-l-4 border-l-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {isKinpre && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                            <CreditCard className="w-3 h-3" />
                            KINPRE POS
                          </span>
                        )}
                        <p className="font-semibold text-slate-900">{tx.description}</p>
                        <span className="text-[10px] text-slate-500 font-mono">Date: {tx.date} | Ref: {tx.reference || 'N/A'}</span>
                      </div>
                      <div className="text-right shrink-0">
                        {tx.credit > 0 ? (
                          <div className="font-bold text-emerald-600">+{formatAmt(tx.credit)}</div>
                        ) : (
                          <div className="font-bold text-rose-600">-{formatAmt(tx.debit)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
