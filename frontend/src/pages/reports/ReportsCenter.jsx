import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Sparkles, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const ReportsCenter = () => {
  const [period, setPeriod] = useState('monthly'); // monthly, yearly
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/reports/${period}?format=json`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await apiClient.get(`/reports/${period}?format=pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${period}_financial_report.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // cleanup
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to compile and download PDF statement.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Compiling transaction ledgers and compiling statement...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent-indigo" /> Financial Statements & Reports
          </h1>
          <p className="text-xs text-zinc-450 mt-1">Generate comprehensive monthly or annual balance sheets containing AI predictions.</p>
        </div>
        
        {/* Period Selector Tabs */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 max-w-xs">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition duration-150 ${
              period === 'monthly'
                ? 'bg-zinc-950 text-zinc-200 shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition duration-150 ${
              period === 'yearly'
                ? 'bg-zinc-950 text-zinc-200 shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Summary counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Health score</span>
              <span className="text-xl font-black text-zinc-250">{data.financial_health_score}/100</span>
            </div>
            <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total income</span>
              <span className="text-xl font-black text-accent-emerald">+{formatCurrency(data.income_total)}</span>
            </div>
            <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total expenses</span>
              <span className="text-xl font-black text-accent-rose">-{formatCurrency(data.expense_total)}</span>
            </div>
            <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Net savings</span>
              <span className="text-xl font-black text-accent-cyan">+{formatCurrency(data.savings_total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category breakdown table */}
            <Card title="Category Spending Breakdown" className="md:col-span-2">
              <div className="space-y-2">
                {data.categories.length === 0 ? (
                  <p className="text-xs text-zinc-550 py-4 text-center">No categories expenses registered.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 font-bold">
                        <th className="py-2">Category</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.categories.map((c, idx) => (
                        <tr key={idx} className="border-b border-white/5 text-zinc-300">
                          <td className="py-2.5 font-semibold">{c.category}</td>
                          <td className="py-2.5 text-right font-bold">{formatCurrency(c.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            {/* Quick Actions Panel */}
            <Card title="Print Statements" className="md:col-span-1 h-fit">
              <div className="space-y-4">
                <p className="text-xs text-zinc-450 leading-relaxed">
                  Export standard PDF invoices compiled with AI recommendations and budget grids.
                </p>
                <Button 
                  onClick={handleDownloadPDF} 
                  loading={pdfLoading}
                  className="w-full text-xs"
                >
                  <Download className="h-4 w-4 mr-1 text-accent-cyan" /> Download PDF Report
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsCenter;
