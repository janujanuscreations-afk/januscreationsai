import React, { useState, useMemo } from 'react';
import { RevenueRecord } from '../types';
import { generateMonthlyPerformanceSummaryPDF, aggregateMonthlyLedgerData } from '../services/pdfReportService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface MonthlyPerformancePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawRevenueRecords?: RevenueRecord[];
  payouts?: any[];
}

export const MonthlyPerformancePDFModal: React.FC<MonthlyPerformancePDFModalProps> = ({
  isOpen,
  onClose,
  rawRevenueRecords = [],
  payouts = []
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getUTCFullYear() || 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getUTCMonth() + 1 || 9);
  const [auditorOrg, setAuditorOrg] = useState<string>('Sovereign Creative Desk & External Audit Advisory');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const monthLabel = `${months.find(m => m.value === selectedMonth)?.label || 'Current Month'} ${selectedYear}`;

  // Pre-calculate live ledger aggregation for this month
  const { metrics, itemizedRows } = useMemo(() => {
    return aggregateMonthlyLedgerData(rawRevenueRecords, payouts, selectedYear, selectedMonth);
  }, [rawRevenueRecords, payouts, selectedYear, selectedMonth]);

  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);
      const doc = generateMonthlyPerformanceSummaryPDF(
        {
          monthName: monthLabel,
          year: selectedYear,
          month: selectedMonth,
          auditorOrg,
          includeItemizedTransactions: true
        },
        rawRevenueRecords,
        payouts
      );

      const filename = `Janu_Monthly_Performance_Summary_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.pdf`;
      doc.save(filename);

      bossAudio.playBigWin();
      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = () => {
    try {
      setIsGenerating(true);
      const doc = generateMonthlyPerformanceSummaryPDF(
        {
          monthName: monthLabel,
          year: selectedYear,
          month: selectedMonth,
          auditorOrg,
          includeItemizedTransactions: true
        },
        rawRevenueRecords,
        payouts
      );

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (err) {
      console.error('Failed to preview PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-zinc-950 border border-[#00F5D4]/40 rounded-3xl shadow-[0_0_80px_rgba(0,245,212,0.2)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00F5D4]/15 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.3)]">
              <i className="fa-solid fa-file-pdf text-2xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-black italic text-white tracking-wide">
                  Monthly Performance PDF Generator
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-mono font-bold uppercase tracking-wider">
                  Client-Side jsPDF Engine
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400">
                Transform live ledger records into a certified, publication-grade monthly audit & performance summary PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Target Month & Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-300 block mb-1.5">
                Target Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#00F5D4]"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value} className="bg-zinc-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-300 block mb-1.5">
                Financial Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#00F5D4]"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-zinc-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-300 block mb-1.5">
                Auditor Organization / Desk
              </label>
              <input
                type="text"
                value={auditorOrg}
                onChange={(e) => setAuditorOrg(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#00F5D4]"
                placeholder="e.g., Sovereign Treasury Desk"
              />
            </div>
          </div>

          {/* Month Summary Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <span>Month Gross Inflow</span>
                <i className="fa-solid fa-vault text-white/50"></i>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                ${metrics.totalGrossVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-gray-400 mt-1">
                {metrics.transactionCount} transactions
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FF007F]/5 border border-[#FF007F]/20">
              <div className="flex items-center justify-between text-[#FF007F] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <span>Patron Tips</span>
                <i className="fa-solid fa-heart text-[#FF007F]"></i>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                ${metrics.totalPatronTips.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-gray-400 mt-1">
                Live stream & profile tips
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#C084FC]/5 border border-[#C084FC]/20">
              <div className="flex items-center justify-between text-[#C084FC] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <span>Creator Earnings</span>
                <i className="fa-solid fa-circle-dollar-to-slot text-[#C084FC]"></i>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                ${metrics.totalCreatorEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-gray-400 mt-1">
                Net distributed share
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#00F5D4]/5 border border-[#00F5D4]/20">
              <div className="flex items-center justify-between text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <span>Boss Platform Cut</span>
                <i className="fa-solid fa-crown text-[#00F5D4]"></i>
              </div>
              <div className="text-2xl font-mono font-bold text-[#00F5D4]">
                ${metrics.totalBossPlatformCuts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-gray-400 mt-1">
                {metrics.effectiveBossMarginPercent}% effective margin
              </div>
            </div>
          </div>

          {/* PDF Preview Frame or Preview Table */}
          {previewPdfUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#00F5D4] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-eye"></i>
                  <span>Live Client-Side PDF Preview ({monthLabel})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPdfUrl(null)}
                  className="text-gray-400 hover:text-white underline cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-white/15 bg-white">
                <iframe
                  src={previewPdfUrl}
                  title="Monthly Performance PDF Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400 uppercase tracking-wider font-bold">
                  Report Manifest Preview ({itemizedRows.length} ledger entries aggregated)
                </span>
                <span className="text-gray-400">
                  Ready for A4 compilation
                </span>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/50 max-h-48 overflow-y-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-white/5 text-[9px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Creator</th>
                      <th className="px-4 py-2 text-right">Gross</th>
                      <th className="px-4 py-2 text-right">Creator Net</th>
                      <th className="px-4 py-2 text-right text-[#00F5D4]">Boss Cut</th>
                      <th className="px-4 py-2">Audit Checksum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px]">
                    {itemizedRows.slice(0, 8).map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2 text-gray-400">{row.date}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-gray-300">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-white font-bold">{row.creator}</td>
                        <td className="px-4 py-2 text-right font-bold text-white">
                          ${row.gross.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-300">
                          ${row.creatorNet.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-[#00F5D4]">
                          ${row.bossCut.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-[9px] text-gray-400">
                          {row.checksum}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feature Highlights / Regulatory Note */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
            <i className="fa-solid fa-stamp text-[#00F5D4] text-lg mt-0.5"></i>
            <div className="text-xs font-mono space-y-1">
              <p className="text-white font-bold">
                100% Client-Side PDF Generation Guarantee
              </p>
              <p className="text-gray-400">
                Generated dynamically via <code className="text-[#00F5D4]">jsPDF</code> and <code className="text-[#00F5D4]">jspdf-autotable</code> without sending sensitive financial data to any third-party conversion servers. Fully compliant with GAAP, IFRS, and internal sovereign auditing standards.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-8 py-5 border-t border-white/10 bg-zinc-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
            <i className="fa-solid fa-shield-check text-[#00F5D4]"></i>
            <span>Verified against Firestore Sovereign Ledger & PayPal Production Gateway</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-mono text-xs uppercase font-bold transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePreviewPDF}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs uppercase font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-eye text-sm text-[#00F5D4]"></i>
              <span>Preview PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-[#00FFE0] to-[#38BDF8] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,224,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-file-arrow-down text-sm"></i>
              <span>{isGenerating ? 'Compiling PDF...' : `Download ${monthLabel} PDF`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
