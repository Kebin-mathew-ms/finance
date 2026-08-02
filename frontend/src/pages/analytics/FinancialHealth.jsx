import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertCircle, Info, Heart } from 'lucide-react';
import apiClient from '../../api/client';
import HealthScoreCard from '../../components/common/HealthScoreCard';
import Card from '../../components/common/Card';

const FinancialHealth = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ score: 70, status: "GOOD" });
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    const fetchHealthData = async () => {
      setLoading(true);
      try {
        const [healthRes, recsRes] = await Promise.all([
          apiClient.get('/analytics/health-score'),
          apiClient.get('/ai/recommendations')
        ]);
        setData(healthRes.data);
        setRecs(recsRes.data || []);
      } catch (err) {
        console.error("Failed to load health parameters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealthData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Calculating savings stability coefficients and scores...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent-rose fill-current" /> Financial Health Score
        </h1>
        <p className="text-xs text-zinc-450 mt-1">Real-time health rating based on savings, budgets, debts, and stability metrics.</p>
      </div>

      {/* Main Score Widget */}
      <HealthScoreCard score={data.score} status={data.status} />

      {/* Formulas breakdown card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Score Formula Parameters">
          <div className="space-y-4 text-xs text-zinc-450 leading-relaxed">
            <p>Your Financial Health Score is computed daily across 4 critical pillars, totaling 100 points:</p>
            
            <div className="space-y-3 pt-2">
              <div className="border-b border-white/5 pb-2">
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>1. Savings Rate Score</span>
                  <span className="text-accent-emerald">30 Points Max</span>
                </div>
                <p className="text-[10px] text-zinc-550 mt-0.5">Evaluates cash surplus relative to total income. Scores highest at &gt;15% savings rates.</p>
              </div>

              <div className="border-b border-white/5 pb-2">
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>2. Budget Adherence</span>
                  <span className="text-accent-indigo">30 Points Max</span>
                </div>
                <p className="text-[10px] text-zinc-550 mt-0.5">Measures category overspending limits. Optimal utilization sits between 50-80% of caps.</p>
              </div>

              <div className="border-b border-white/5 pb-2">
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>3. Bill Due / Debt Score</span>
                  <span className="text-accent-rose">20 Points Max</span>
                </div>
                <p className="text-[10px] text-zinc-550 mt-0.5">Deducts 5 points for every overdue bill reminder or default transaction.</p>
              </div>

              <div>
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>4. Spending Stability Coefficients</span>
                  <span className="text-accent-cyan">20 Points Max</span>
                </div>
                <p className="text-[10px] text-zinc-550 mt-0.5">Calculates deviation variance of monthly expenses. Low standard deviation yields max points.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Dynamic Tips */}
        <Card title="Actionable Optimization Tips">
          <div className="space-y-3">
            {recs.length === 0 ? (
              <p className="text-xs text-zinc-500">Your finances look healthy! No optimization warnings registered.</p>
            ) : (
              recs.slice(0, 4).map(r => (
                <div key={r.recommendation_id} className="p-3 border border-zinc-800 bg-zinc-900/20 rounded-lg flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-accent-cyan shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">{r.title}</h5>
                    <p className="text-[10px] text-zinc-450 mt-0.5 leading-relaxed">{r.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancialHealth;
