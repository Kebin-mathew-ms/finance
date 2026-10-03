import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, Award, Compass } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import TrendGraph from '../../components/common/TrendGraph';
import Card from '../../components/common/Card';
import StatisticsCard from '../../components/common/StatisticsCard';

const ExpenseTrends = () => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [metrics, setMetrics] = useState({
    average_monthly_spending: 0,
    average_savings_rate: 0,
    average_daily_expense: 0,
    most_expensive_category: "None",
    highest_monthly_expense: 0,
    highest_monthly_income: 0
  });

  useEffect(() => {
    const fetchTrendsData = async () => {
      setLoading(true);
      try {
        const trendsRes = await apiClient.get('/analytics/trends');
        const trendData = trendsRes.data || [];
        setTrends(trendData);

        const avg_exp = trendData.length > 0 ? (trendData.reduce((acc, curr) => acc + curr.expenses, 0) / trendData.length) : 0;
        const avg_inc = trendData.length > 0 ? (trendData.reduce((acc, curr) => acc + curr.income, 0) / trendData.length) : 0;
        const avg_sav_rate = avg_inc > 0 ? Math.max(0, (avg_inc - avg_exp) / avg_inc * 100) : 0;

        setMetrics({
          average_monthly_spending: avg_exp,
          average_savings_rate: avg_sav_rate,
          average_daily_expense: avg_exp / 30.0,
          most_expensive_category: "Food",
          highest_monthly_expense: trendData.length > 0 ? Math.max(...trendData.map(d => d.expenses)) : 0,
          highest_monthly_income: trendData.length > 0 ? Math.max(...trendData.map(d => d.income)) : 0
        });

      } catch (err) {
        console.error("Failed to load trends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendsData();
  }, []);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Plotting cashflow trends and regression curves...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
          <Compass className="h-5 w-5 text-accent-indigo" /> Cash Flow & Expense Trends
        </h1>
        <p className="text-xs text-zinc-450 mt-1">Review historical cashflow ratios, savings averages and monthly balances.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatisticsCard 
          title="Avg Monthly Spent" 
          value={formatCurrency(metrics.average_monthly_spending)} 
          description="Past 6 Months"
        />
        <StatisticsCard 
          title="Avg Savings Rate" 
          value={`${metrics.average_savings_rate.toFixed(1)}%`} 
          description="Cash Retention"
          trendColor="text-accent-emerald"
        />
        <StatisticsCard 
          title="Peak Month Income" 
          value={formatCurrency(metrics.highest_monthly_income)} 
          description="Highest Inflow"
          trendColor="text-accent-cyan"
        />
        <StatisticsCard 
          title="Peak Month Spent" 
          value={formatCurrency(metrics.highest_monthly_expense)} 
          description="Highest Outflow"
          trendColor="text-accent-rose"
        />
      </div>

      {/* Main Trend Graph */}
      <TrendGraph data={trends} height={350} title="Interactive Cash Flow Curve" />

      {/* Trends Analysis cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Cash Retention Insights">
          <div className="text-xs text-zinc-400 space-y-3 leading-relaxed">
            <p>
              Your average monthly savings rate is <strong className="text-zinc-200">{metrics.average_savings_rate.toFixed(1)}%</strong>. 
              Maintaining a savings rate above 20% accelerates goal completion timelines and reduces long-term debt risk.
            </p>
            <div className="p-3 border border-white/5 bg-zinc-900/30 rounded-lg">
              <h5 className="font-bold text-[10px] text-zinc-350 uppercase tracking-wider">Historical Performance</h5>
              <p className="mt-1 text-[10px] text-zinc-550 leading-relaxed">
                Your monthly spending averages <strong className="text-zinc-300">{formatCurrency(metrics.average_monthly_spending)}</strong>. 
                Keep category budgets tight during peak income periods to preserve capital.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Seasonal Fluctuations Analysis">
          <div className="text-xs text-zinc-400 space-y-3 leading-relaxed">
            <p>
              Seasonal peaks generally occur around holidays or billing cycles. Compare your monthly cash outflow against budget limits to suppress spending spikes.
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-zinc-550 text-[10px]">
              <li>Use automatic alerts to detect budget limits crossing 90%.</li>
              <li>Establish a secondary emergency fund for high-variance months.</li>
              <li>Review subscriptions to prune inactive memberships.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseTrends;
