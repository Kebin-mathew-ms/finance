import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Clock, 
  Sparkles, 
  Award,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import StatisticsCard from '../../components/common/StatisticsCard';
import HealthScoreCard from '../../components/common/HealthScoreCard';
import TrendGraph from '../../components/common/TrendGraph';
import CategoryChart from '../../components/common/CategoryChart';
import Card from '../../components/common/Card';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashStats, setDashStats] = useState({
    total_income: 0,
    total_expenses: 0,
    monthly_savings: 0,
    budget_utilization: 0,
    goal_completion_rate: 0,
    active_reminders: 0,
    predicted_monthly_expenditure: 0,
    financial_health_score: 0
  });

  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recs, setRecs] = useState([]);
  const [anoms, setAnoms] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [dashRes, trendsRes, catRes, recsRes, anomsRes] = await Promise.all([
          apiClient.get('/analytics/dashboard'),
          apiClient.get('/analytics/trends'),
          apiClient.get('/analytics/categories'),
          apiClient.get('/ai/recommendations'),
          apiClient.get('/ai/anomalies')
        ]);

        setDashStats(dashRes.data);
        setTrends(trendsRes.data || []);
        setCategories(catRes.data || []);
        setRecs(recsRes.data || []);
        setAnoms(anomsRes.data || []);
      } catch (err) {
        console.error("Failed to load analytics dashboard payload:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs text-zinc-400 animate-pulse">
        Generating financial health parameters and loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100">
            Welcome Back
          </h1>
          <p className="text-xs text-zinc-450 mt-1">Here is your real-time financial health and AI expenditure analysis.</p>
        </div>
      </div>

      {/* 1. Health Score Section */}
      <HealthScoreCard score={dashStats.financial_health_score} status={dashStats.financial_health_score === 0 ? 'NOT_RATED' : (dashStats.financial_health_score <= 25 ? 'CRITICAL' : (dashStats.financial_health_score <= 50 ? 'POOR' : (dashStats.financial_health_score <= 75 ? 'GOOD' : 'EXCELLENT')))} />

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatisticsCard 
          title="Total Income" 
          value={formatCurrency(dashStats.total_income)} 
          icon={TrendingUp} 
          description="Current Month"
          trendColor="text-accent-emerald"
        />
        <StatisticsCard 
          title="Total Expenses" 
          value={formatCurrency(dashStats.total_expenses)} 
          icon={TrendingDown} 
          description="Current Month"
          trendColor="text-accent-rose"
        />
        <StatisticsCard 
          title="Net Savings" 
          value={formatCurrency(dashStats.monthly_savings)} 
          icon={Wallet} 
          description="Cash Surplus"
          trendColor="text-accent-cyan"
        />
        <StatisticsCard 
          title="Predicted Expenses" 
          value={formatCurrency(dashStats.predicted_monthly_expenditure)} 
          icon={Sparkles} 
          description="Next Month Forecast"
          trendColor="text-accent-indigo"
        />
      </div>

      {/* 3. secondary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatisticsCard 
          title="Budget Spent" 
          value={`${dashStats.budget_utilization}%`} 
          icon={Wallet} 
          description="Utilization Rate"
        />
        <StatisticsCard 
          title="Goals Progress" 
          value={`${dashStats.goal_completion_rate}%`} 
          icon={Target} 
          description="Average Completion"
        />
        <StatisticsCard 
          title="Due Bills" 
          value={dashStats.active_reminders} 
          icon={Clock} 
          description="Active Reminders"
        />
        <StatisticsCard 
          title="Outliers Flagged" 
          value={anoms.length} 
          icon={ShieldAlert} 
          description="Pending Anomalies"
          trendColor={anoms.length > 0 ? "text-accent-rose" : "text-zinc-500"}
        />
      </div>

      {/* 4. Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendGraph data={trends} title="Cash Flow Trends (Past 6 Months)" />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart data={categories} title="Category Distributions" />
        </div>
      </div>

      {/* 5. Alerts & Insights Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <Card title="Top Suggestions" subtitle="AI optimization alerts">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {recs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No optimization suggestions available.</p>
            ) : (
              recs.slice(0, 3).map(r => (
                <div key={r.recommendation_id} className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-lg flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${r.priority === 'HIGH' ? 'bg-accent-rose' : 'bg-amber-500'}`}></div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">{r.title}</h5>
                    <p className="text-[10px] text-zinc-450 mt-0.5 leading-relaxed">{r.description}</p>
                  </div>
                </div>
              ))
            )}
            <div className="pt-2 flex justify-end">
              <Link to="/ai/recommendations" className="text-[10px] font-bold text-accent-indigo hover:underline flex items-center">
                All Recommendations <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Outlier Anomalies */}
        <Card title="Anomalous Transactions" subtitle="Flagged outliers">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {anoms.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No unusual outliers detected.</p>
            ) : (
              anoms.slice(0, 3).map(a => (
                <div key={a.anomaly_id} className="p-3 border border-accent-rose/10 bg-accent-rose/5 rounded-lg flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-accent-rose shrink-0 mt-0.5" />
                  <div>
                    <div className="flex justify-between items-center gap-2">
                      <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{a.anomaly_type}</h5>
                      <span className="text-[8px] px-1.5 py-0.5 font-bold rounded bg-accent-rose/15 text-accent-rose">{a.severity}</span>
                    </div>
                    <p className="text-[10px] text-zinc-450 mt-1 leading-relaxed">{a.description}</p>
                  </div>
                </div>
              ))
            )}
            <div className="pt-2 flex justify-end">
              <Link to="/ai/anomalies" className="text-[10px] font-bold text-accent-indigo hover:underline flex items-center">
                Review Outliers <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
