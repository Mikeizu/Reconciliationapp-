import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseStatementText, detectDateOrdering, Transaction } from '../utils/reconciliation';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bankTxs: Transaction[], sageTxs: Transaction[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onImport }) => {
  const [bankText, setBankText] = useState('');
  const [sageText, setSageText] = useState('');
  const [bankFileParsed, setBankFileParsed] = useState<Transaction[]>([]);
  const [sageFileParsed, setSageFileParsed] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('file');

  if (!isOpen) return null;

  // Handle Excel or CSV file upload for Bank
  const handleBankFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const csv = XLSX.utils.sheet_to_csv(ws);
        const parsed = parseStatementText(csv, 'bank');
        setBankFileParsed(parsed);
      } catch (err) {
        console.error('Failed to parse bank file', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Excel or CSV file upload for Sage
  const handleSageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const csv = XLSX.utils.sheet_to_csv(ws);
        const parsed = parseStatementText(csv, 'sage');
        setSageFileParsed(parsed);
      } catch (err) {
        console.error('Failed to parse sage file', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Live parsed check
  const currentBankTxs =
    bankFileParsed.length > 0 ? bankFileParsed : parseStatementText(bankText, 'bank');
  const currentSageTxs =
    sageFileParsed.length > 0 ? sageFileParsed : parseStatementText(sageText, 'sage');

  const bankOrder = detectDateOrdering(currentBankTxs);
  const sageOrder = detectDateOrdering(currentSageTxs);

  const handleApply = () => {
    if (currentBankTxs.length === 0 && currentSageTxs.length === 0) return;
    onImport(currentBankTxs, currentSageTxs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Import Bank & Sage Statements</h3>
              <p className="text-xs text-slate-300">
                Upload Excel (.xlsx, .xls), CSV, or paste spreadsheet rows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            File Upload (Excel / CSV)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Copy & Paste Data
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Statement Box */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-blue-900">
                  🏦 1. Bank Statement
                </span>
                {currentBankTxs.length > 0 && (
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {currentBankTxs.length} items
                  </span>
                )}
              </div>

              {activeTab === 'file' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Select Bank File (.xlsx, .xls, .csv)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBankFileUpload}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard bank exports (e.g. Descending date order)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Paste Bank Statement Rows:
                  </label>
                  <textarea
                    rows={6}
                    value={bankText}
                    onChange={(e) => setBankText(e.target.value)}
                    placeholder="Date, Description, Debit, Credit, Balance&#10;31/10/2024, Bank Charges, 1450, 0, 4892450&#10;29/10/2024, POS KINPRE GLOBAL VENTURES\n28-OCT-2024, 0, 385000, 4893900"
                    className="w-full font-mono text-[11px] p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Detected Order for Bank */}
              {currentBankTxs.length > 0 && (
                <div className="text-[11px] bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between">
                  <span className="text-slate-600">Detected Date Order:</span>
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    {bankOrder.detectedOrder === 'descending' ? (
                      <>
                        <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> Descending (Newest First)
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> Ascending (Oldest First)
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Sage GL Statement Box */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                  📚 2. Sage GL Cash Book
                </span>
                {currentSageTxs.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {currentSageTxs.length} items
                  </span>
                )}
              </div>

              {activeTab === 'file' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Select Sage File (.xlsx, .xls, .csv)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleSageFileUpload}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sage 50/200/Intacct exports (e.g. Ascending date order)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Paste Sage Statement Rows:
                  </label>
                  <textarea
                    rows={6}
                    value={sageText}
                    onChange={(e) => setSageText(e.target.value)}
                    placeholder="Date, Narrative, Debit, Credit, Balance&#10;01/10/2024, Opening Balance, 0, 0, 2616400&#10;05/10/2024, Kinpre POS Sales, 0, 495000, 3076400"
                    className="w-full font-mono text-[11px] p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Detected Order for Sage */}
              {currentSageTxs.length > 0 && (
                <div className="text-[11px] bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span className="text-slate-600">Detected Date Order:</span>
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    {sageOrder.detectedOrder === 'ascending' ? (
                      <>
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> Ascending (Oldest First)
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> Descending (Newest First)
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Guarantee Notice */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <strong className="font-bold">Auto-Alignment Engine Ready:</strong> Even if your Bank file is
              descending (Oct 31 ➔ Oct 01) and your Sage file is ascending (Oct 01 ➔ Oct 31), ReconcileEase will
              automatically synchronize both files chronologically so each transaction aligns side-by-side!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={currentBankTxs.length === 0 && currentSageTxs.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm shadow-indigo-200"
          >
            Import & Synchronize Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
