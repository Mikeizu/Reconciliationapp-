import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, CheckCircle2, User, Building, Calendar, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction, MatchedPair } from '../utils/reconciliation';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankTransactions: Transaction[];
  sageTransactions: Transaction[];
  matchedPairs: MatchedPair[];
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  bankTransactions,
  sageTransactions,
  matchedPairs,
}) => {
  const [personalName, setPersonalName] = useState('KINPRE GLOBAL VENTURES');
  const [accountNumber, setAccountNumber] = useState('0129482019');
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'xlsx'>('csv');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generic trigger download helper
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(`Downloaded "${filename}" successfully!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 1. Download Bank Statement (Descending)
  const downloadBankStatement = () => {
    const filename = `Bank_Statement_Descending_${personalName.replace(/\s+/g, '_')}.${downloadFormat}`;
    if (downloadFormat === 'xlsx') {
      const wsData = bankTransactions.map((tx) => ({
        Date: tx.rawDate || tx.date,
        Description: tx.description,
        Debit: tx.debit,
        Credit: tx.credit,
        Balance: tx.balance || 0,
        Reference: tx.reference || '',
        'POS Merchant': tx.isKinprePos ? 'KINPRE GLOBAL VENTURES' : 'N/A',
        'Swipe Date Underneath': tx.posTerminalDate || '',
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bank Statement');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), filename);
    } else {
      const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Reference', 'POS Merchant', 'Swipe Date Underneath'];
      const rows = bankTransactions.map((tx) => [
        tx.rawDate || tx.date,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.debit.toFixed(2),
        tx.credit.toFixed(2),
        (tx.balance || 0).toFixed(2),
        tx.reference || '',
        tx.isKinprePos ? 'KINPRE GLOBAL VENTURES' : '',
        tx.posTerminalDate || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
    }
  };

  // 2. Download Sage GL Export (Ascending)
  const downloadSageStatement = () => {
    const filename = `Sage_GL_Ascending_${personalName.replace(/\s+/g, '_')}.${downloadFormat}`;
    if (downloadFormat === 'xlsx') {
      const wsData = sageTransactions.map((tx) => ({
        Date: tx.rawDate || tx.date,
        Narrative: tx.description,
        Debit: tx.debit,
        Credit: tx.credit,
        Balance: tx.balance || 0,
        Reference: tx.reference || '',
        Details: tx.posDetails || '',
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sage Cash Book');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), filename);
    } else {
      const headers = ['Date', 'Narrative', 'Debit', 'Credit', 'Balance', 'Reference'];
      const rows = sageTransactions.map((tx) => [
        tx.rawDate || tx.date,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.debit.toFixed(2),
        tx.credit.toFixed(2),
        (tx.balance || 0).toFixed(2),
        tx.reference || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
    }
  };

  // 3. Download Full Reconciled Comparison Report
  const downloadReconciledReport = () => {
    const filename = `Reconciled_Audit_Report_${personalName.replace(/\s+/g, '_')}.${downloadFormat}`;
    if (downloadFormat === 'xlsx') {
      const wsData = matchedPairs.map((p) => ({
        'Match Status': p.matchType,
        'Bank Date': p.bankTx?.date || '',
        'Bank Narration': p.bankTx?.description || '',
        'Bank Debit': p.bankTx?.debit || 0,
        'Bank Credit': p.bankTx?.credit || 0,
        'Sage Date': p.sageTx?.date || '',
        'Sage Narrative': p.sageTx?.description || '',
        'Sage Debit': p.sageTx?.debit || 0,
        'Sage Credit': p.sageTx?.credit || 0,
        'Kinpre POS Flag': p.bankTx?.isKinprePos || p.sageTx?.isKinprePos ? 'YES' : 'NO',
        'Swipe Date Underneath': p.bankTx?.posTerminalDate || '',
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reconciliation');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), filename);
    } else {
      const headers = [
        'Match Status',
        'Bank Date',
        'Bank Narration',
        'Bank Debit',
        'Bank Credit',
        'Sage Date',
        'Sage Narrative',
        'Sage Debit',
        'Sage Credit',
        'Kinpre POS',
        'Swipe Date Underneath',
      ];
      const rows = matchedPairs.map((p) => [
        p.matchType,
        p.bankTx?.date || '',
        `"${(p.bankTx?.description || '').replace(/"/g, '""')}"`,
        p.bankTx?.debit || 0,
        p.bankTx?.credit || 0,
        p.sageTx?.date || '',
        `"${(p.sageTx?.description || '').replace(/"/g, '""')}"`,
        p.sageTx?.debit || 0,
        p.sageTx?.credit || 0,
        p.bankTx?.isKinprePos || p.sageTx?.isKinprePos ? 'YES - KINPRE GLOBAL VENTURES' : 'NO',
        p.bankTx?.posTerminalDate || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
    }
  };

  // 4. Download Custom Personal File
  const downloadPersonalCustomFile = () => {
    const filename = `Personal_Statement_${personalName.replace(/\s+/g, '_')}_Acc_${accountNumber}.${downloadFormat}`;
    const personalRows = [
      {
        Date: '31/10/2024',
        Description: 'ACCOUNT MAINTENANCE & SMS ALERTS',
        Debit: 1450.0,
        Credit: 0.0,
        Balance: 4892450.2,
        Reference: 'CHG9821092',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '29/10/2024',
        Description: `POS 948201 ${personalName}\n28-OCT-2024 18:22:14\nMERCHANT SETTLEMENT TERMINAL 204192`,
        Debit: 0.0,
        Credit: 385000.0,
        Balance: 4893900.2,
        Reference: 'POS-2910-KPV1',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '26/10/2024',
        Description: 'UTILITY POWER BILL PAYMENT',
        Debit: 45000.0,
        Credit: 0.0,
        Balance: 4508900.2,
        Reference: 'DD-884920',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '24/10/2024',
        Description: 'INWARD TRANSFER - INVOICE SETTLEMENT',
        Debit: 0.0,
        Credit: 1250000.0,
        Balance: 4553900.2,
        Reference: 'NIP-2410-0921',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '21/10/2024',
        Description: `POS 882019 ${personalName}\n20-OCT-2024 15:45:00\nWEEKEND SALES SETTLEMENT`,
        Debit: 0.0,
        Credit: 642500.0,
        Balance: 3303900.2,
        Reference: 'POS-2110-KPV2',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '15/10/2024',
        Description: `${personalName}\n14/10/2024 19:10:05\nPOS CARD COLLECTION`,
        Debit: 0.0,
        Credit: 215000.0,
        Balance: 3181400.2,
        Reference: 'POS-1510-KPV3',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '06/10/2024',
        Description: `POS 774102 ${personalName}\n05-OCT-2024 11:20:30\nSTORE BATCH SETTLEMENT`,
        Debit: 0.0,
        Credit: 495000.0,
        Balance: 3076400.2,
        Reference: 'POS-0610-KPV4',
        Account: accountNumber,
        Entity: personalName,
      },
      {
        Date: '01/10/2024',
        Description: 'OPENING BALANCE BROUGHT FORWARD',
        Debit: 0.0,
        Credit: 0.0,
        Balance: 2616400.2,
        Reference: 'BAL-B/F',
        Account: accountNumber,
        Entity: personalName,
      },
    ];

    if (downloadFormat === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(personalRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Personal Statement');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      triggerDownload(new Blob([wbout], { type: 'application/octet-stream' }), filename);
    } else {
      const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Reference', 'Account', 'Entity'];
      const rows = personalRows.map((r) => [
        r.Date,
        `"${r.Description.replace(/"/g, '""')}"`,
        r.Debit.toFixed(2),
        r.Credit.toFixed(2),
        r.Balance.toFixed(2),
        r.Reference,
        r.Account,
        `"${r.Entity}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Download Personal & Reconciliation Files</h3>
              <p className="text-xs text-indigo-200">
                Download ready-to-use Bank files, Sage GL files, and customized personal statements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast inside modal */}
        {downloadSuccess && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2.5 border-b border-emerald-200 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Format Selector */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Choose Download Format:</span>
          <div className="inline-flex rounded-lg bg-slate-200 p-0.5">
            <button
              onClick={() => setDownloadFormat('csv')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                downloadFormat === 'csv'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CSV (.csv)
            </button>
            <button
              onClick={() => setDownloadFormat('xlsx')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                downloadFormat === 'xlsx'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Body Options */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Section 1: Ready-to-use Core Statements */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ready-to-Use Reconciliation Files
            </h4>

            {/* Bank Statement Card */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-blue-900">
                    🏦 Bank Statement (Descending Order)
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                    Oct 31 ➔ Oct 01
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Includes multi-line narratives with <strong>KINPRE GLOBAL VENTURES</strong> and date underneath.
                </p>
              </div>
              <button
                onClick={downloadBankStatement}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            {/* Sage Statement Card */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-emerald-900">
                    📚 Sage GL Cash Book (Ascending Order)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                    Oct 01 ➔ Oct 31
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  General ledger transactions chronological format matching Sage 50/200/Intacct.
                </p>
              </div>
              <button
                onClick={downloadSageStatement}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            {/* Complete Reconciled Audit Pack */}
            <div className="p-3.5 rounded-xl border-2 border-indigo-300 bg-indigo-50/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-indigo-950">
                    📊 Reconciled Audit Statement Pack
                  </span>
                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.2 rounded-full font-bold">
                    Reconciled
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900">
                  Full 1:1 paired comparison with match statuses, variances, and Kinpre POS flags.
                </p>
              </div>
              <button
                onClick={downloadReconciledReport}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Section 2: Custom Personal File Generator */}
          <div className="pt-2 border-t border-slate-200">
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Generate Your Custom Personal File
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                Customize the merchant/business name and account number to generate a personal bank statement file formatted with the descending date pattern and POS records:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-indigo-600" />
                    Business / Personal Name
                  </label>
                  <input
                    type="text"
                    value={personalName}
                    onChange={(e) => setPersonalName(e.target.value)}
                    placeholder="e.g. KINPRE GLOBAL VENTURES"
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-600" />
                    Account Number / Reference
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 0129482019"
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={downloadPersonalCustomFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Custom Personal File ({downloadFormat.toUpperCase()})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
