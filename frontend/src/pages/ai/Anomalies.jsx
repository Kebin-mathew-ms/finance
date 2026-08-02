import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, Calendar, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';

const Anomalies = () => {
  const [loading, setLoading] = useState(true);
  const [anoms, setAnoms] = useState([]);

  useEffect(() => {
    const fetchAnomalies = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/ai/anomalies');
        setAnoms(res.data || []);
      } catch (err) {
        console.error("Failed to load anomalies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-accent-rose/15 text-accent-rose border-accent-rose/20';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Running isolation forest outlier scans...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-accent-rose" /> Outlier Anomaly Detection
        </h1>
        <p className="text-xs text-zinc-450 mt-1">Review transaction outliers flagged by statistical deviations or Isolation Forest models.</p>
      </div>

      <Card title={`Flagged Deviations (${anoms.length})`}>
        <div className="space-y-4">
          {anoms.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-550">
              No unusual transactions flagged by the Isolation Forest.
            </div>
          ) : (
            anoms.map(a => (
              <div key={a.anomaly_id} className="p-4 border border-zinc-850 bg-zinc-900/10 rounded-xl flex items-start gap-4 hover:bg-zinc-850/10 transition">
                <div className={`p-2 rounded-lg ${
                  a.severity === 'HIGH' ? 'bg-accent-rose/10 text-accent-rose' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-black text-zinc-200 uppercase tracking-widest">{a.anomaly_type.replace('_', ' ')}</h4>
                      <p className="text-[10px] text-zinc-550 mt-0.5">Detected on {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border tracking-wider ${getSeverityBadge(a.severity)}`}>
                      {a.severity} Severity
                    </span>
                  </div>

                  <p className="text-xs text-zinc-450 leading-relaxed">
                    {a.description}
                  </p>

                  {a.expense_details && (
                    <div className="pt-2 flex items-center gap-4 text-[10px] text-zinc-550 border-t border-white/5">
                      <span>Transaction: <strong className="text-zinc-400">{a.expense_details.title}</strong></span>
                      <span>Amount: <strong className="text-accent-rose">{formatCurrency(a.expense_details.amount)}</strong></span>
                      <span>Date: <strong className="text-zinc-400">{formatDate(a.expense_details.expense_date)}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Anomalies;
