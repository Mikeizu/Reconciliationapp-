import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { OrderSyncBanner } from './components/OrderSyncBanner';
import { KinpreHighlightBar } from './components/KinpreHighlightBar';
import { StatsCards } from './components/StatsCards';
import { ComparisonTable } from './components/ComparisonTable';
import { PosAiModal } from './components/PosAiModal';
import { UploadModal } from './components/UploadModal';
import { ReportModal } from './components/ReportModal';
import { DownloadModal } from './components/DownloadModal';
import { Download, Sparkles } from 'lucide-react';
import {
  SAMPLE_BANK_DATA_DESCENDING,
  SAMPLE_SAGE_DATA_ASCENDING,
} from './data/sampleData';
import {
  detectDateOrdering,
  reconcileStatements,
  sortTransactions,
  SortOrder,
  Transaction,
  MatchedPair,
} from './utils/reconciliation';

export default function App() {
  // Statement state (initialized with realistic sample data where Bank is Descending and Sage is Ascending)
  const [bankTransactions, setBankTransactions] = useState<Transaction[]>(
    SAMPLE_BANK_DATA_DESCENDING
  );
  const [sageTransactions, setSageTransactions] = useState<Transaction[]>(
    SAMPLE_SAGE_DATA_ASCENDING
  );

  // Synchronization and display controls
  const [sortOrder, setSortOrder] = useState<SortOrder>('ascending');
  const [viewMode, setViewMode] = useState<'paired' | 'split'>('paired');
  const [dateToleranceDays, setDateToleranceDays] = useState<number>(2);
  const [filterKinpreOnly, setFilterKinpreOnly] = useState<boolean>(false);

  // Modals state
  const [isAiPosOpen, setIsAiPosOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [selectedPair, setSelectedPair] = useState<MatchedPair | null>(null);

  // Detect source order of each file
  const bankOrderInfo = useMemo(() => detectDateOrdering(bankTransactions), [bankTransactions]);
  const sageOrderInfo = useMemo(() => detectDateOrdering(sageTransactions), [sageTransactions]);

  // Compute reconciliation matches and financial summary
  const { matchedPairs, summary } = useMemo(() => {
    return reconcileStatements(bankTransactions, sageTransactions, {
      dateToleranceDays,
      sortOrder,
    });
  }, [bankTransactions, sageTransactions, dateToleranceDays, sortOrder]);

  // Sorted versions for dual column view
  const displayBankTxs = useMemo(
    () => sortTransactions(bankTransactions, sortOrder),
    [bankTransactions, sortOrder]
  );
  const displaySageTxs = useMemo(
    () => sortTransactions(sageTransactions, sortOrder),
    [sageTransactions, sortOrder]
  );

  // Extract all Kinpre POS transactions from bank statement
  const kinprePosList = useMemo(() => {
    return bankTransactions.filter((tx) => tx.isKinprePos);
  }, [bankTransactions]);

  // Reset to realistic sample data
  const handleLoadDemo = () => {
    setBankTransactions(SAMPLE_BANK_DATA_DESCENDING);
    setSageTransactions(SAMPLE_SAGE_DATA_ASCENDING);
    setSortOrder('ascending');
    setFilterKinpreOnly(false);
  };

  // Import custom uploaded statements
  const handleImportStatements = (bankTxs: Transaction[], sageTxs: Transaction[]) => {
    if (bankTxs.length > 0) setBankTransactions(bankTxs);
    if (sageTxs.length > 0) setSageTransactions(sageTxs);
    setFilterKinpreOnly(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onLoadDemo={handleLoadDemo}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAiAudit={() => setIsAiPosOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        kinpreCount={summary.kinprePosCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Personal Download Callout */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 mb-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">Need personal files to download to your computer?</span>
              <p className="text-[11px] text-slate-500">
                Download the Bank Statement (Descending order), Sage GL (Ascending), or generate a custom personal file.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Personal Files</span>
          </button>
        </div>
        {/* Order Synchronization Banner (Addresses Descending vs Ascending Problem) */}
        <OrderSyncBanner
          bankOrderInfo={bankOrderInfo}
          sageOrderInfo={sageOrderInfo}
          currentSortOrder={sortOrder}
          onChangeSortOrder={setSortOrder}
          dateToleranceDays={dateToleranceDays}
          onChangeToleranceDays={setDateToleranceDays}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />

        {/* KINPRE GLOBAL VENTURES POS Recognition & Indigo Banner */}
        <KinpreHighlightBar
          count={summary.kinprePosCount}
          totalAmount={summary.kinprePosTotal}
          isFilterActive={filterKinpreOnly}
          onToggleFilter={() => setFilterKinpreOnly(!filterKinpreOnly)}
          onOpenAiAnalysis={() => setIsAiPosOpen(true)}
        />

        {/* Financial & Reconciliation Statistics */}
        <StatsCards summary={summary} />

        {/* Paired Side-by-Side Reconciliation Table */}
        <ComparisonTable
          matchedPairs={matchedPairs}
          bankTransactions={displayBankTxs}
          sageTransactions={displaySageTxs}
          viewMode={viewMode}
          sortOrder={sortOrder}
          filterKinpreOnly={filterKinpreOnly}
          onToggleFilterKinpre={() => setFilterKinpreOnly(!filterKinpreOnly)}
          onSelectPairForDetail={setSelectedPair}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReconcileEase • Bank Statement & Sage GL Auto-Synchronizer</span>
          <span className="text-slate-400">
            KINPRE GLOBAL VENTURES POS pattern detection with underlying swipe date extraction
          </span>
        </div>
      </footer>

      {/* Modals */}
      <PosAiModal
        isOpen={isAiPosOpen}
        onClose={() => setIsAiPosOpen(false)}
        posTransactions={kinprePosList}
        sageTransactions={sageTransactions.filter((s) => s.isKinprePos)}
        summary={summary}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImport={handleImportStatements}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        matchedPairs={matchedPairs}
        summary={summary}
      />

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        bankTransactions={bankTransactions}
        sageTransactions={sageTransactions}
        matchedPairs={matchedPairs}
      />
    </div>
  );
}
