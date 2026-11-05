import { FileSpreadsheet, Sparkles, Upload, RotateCcw, FileText, Download } from 'lucide-react';

interface NavbarProps {
  onLoadDemo: () => void;
  onOpenUpload: () => void;
  onOpenAiAudit: () => void;
  onOpenReport: () => void;
  onOpenDownload: () => void;
  kinpreCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadDemo,
  onOpenUpload,
  onOpenAiAudit,
  onOpenReport,
  onOpenDownload,
  kinpreCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">ReconcileEase</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Bank vs Sage GL
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Auto date-order alignment & AI POS pattern recognition
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Reset to realistic demo dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>

            <button
              onClick={onOpenDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-xs"
              title="Download personal files, bank statement, or Sage ledger"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Files</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Files</span>
            </button>

            <button
              onClick={onOpenAiAudit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI POS & Audit</span>
              {kinpreCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-800/80 rounded-full text-[10px]">
                  {kinpreCount} Kinpre
                </span>
              )}
            </button>

            <button
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Reconcile Report</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
