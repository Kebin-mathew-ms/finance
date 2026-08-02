import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Calendar, Award, AlertCircle, Percent, Compass } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const GoalProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    const fetchGoalDetails = async () => {
      try {
        const res = await apiClient.get(`/goals/${id}`);
        setGoal(res.data);
      } catch (err) {
        console.error("Failed to load goal metrics:", err);
        navigate('/goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoalDetails();
  }, [id, navigate]);

  if (loading) {
    return <PageLoader message="Inspecting target milestones..." />;
  }

  const target = parseFloat(goal.target_amount);
  const saved = parseFloat(goal.saved_amount);
  const remaining = Math.max(0, target - saved);
  const progressPercent = Math.min(100, (saved / target) * 100);

  // Time remaining calculation
  const targetDate = new Date(goal.target_date);
  const today = new Date();
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isCompleted = goal.status === "COMPLETED";
  const isExpired = goal.status === "EXPIRED";

  const chartData = [
    {
      name: 'Status',
      Saved: saved,
      Target: target,
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title bar */}
      <div className="flex items-center space-x-3">
        <Link to="/goals" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Goal Progress: {goal.goal_name}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Goal Type: {goal.goal_type}</p>
        </div>
      </div>

      {/* Completion Alerts */}
      {isCompleted && (
        <div className="border border-accent-emerald/20 bg-accent-emerald/10 rounded-xl p-4 flex items-start space-x-3 text-zinc-200">
          <Award className="h-5 w-5 text-accent-emerald shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-accent-emerald">Goal Accomplished!</h4>
            <p className="text-xs text-zinc-300 mt-1">
              Fantastic job! You achieved your savings target of <span className="font-bold text-white">{formatCurrency(target)}</span> on or before your target completion date. Keep it up!
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="border border-accent-rose/20 bg-accent-rose/10 rounded-xl p-4 flex items-start space-x-3 text-zinc-200">
          <AlertCircle className="h-5 w-5 text-accent-rose shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-accent-rose">Goal Expired</h4>
            <p className="text-xs text-zinc-300 mt-1">
              This goal reached its target date ({formatDate(goal.target_date)}) without achieving the full target allocation. You can adjust the date or targets in edit settings to revive it.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Target Amount</span>
          <p className="text-2xl font-bold text-zinc-200 mt-2">{formatCurrency(target)}</p>
        </Card>
        
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Currently Saved</span>
          <p className="text-2xl font-bold text-accent-cyan mt-2">{formatCurrency(saved)}</p>
        </Card>

        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Remaining Needed</span>
          <p className="text-2xl font-bold text-zinc-200 mt-2">{formatCurrency(remaining)}</p>
        </Card>

        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Days Remaining</span>
          <p className={`text-2xl font-bold mt-2 ${diffDays < 0 ? 'text-accent-rose' : 'text-zinc-200'}`}>
            {diffDays < 0 ? 'Expired' : diffDays}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Milestones */}
        <Card title="Milestones Timeline" className="md:col-span-2">
          <div className="space-y-6 relative border-l-2 border-zinc-800 pl-5 ml-2 py-2">
            <div className="relative">
              <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-accent-indigo border border-background block"></span>
              <div className="text-xs text-zinc-500 font-semibold">{formatDate(goal.start_date)}</div>
              <h5 className="text-sm font-bold text-zinc-200 mt-1">Goal Established</h5>
              <p className="text-xs text-zinc-400 mt-0.5">Started mapping allocation strategy with initial deposit of {formatCurrency(goal.saved_amount)}.</p>
            </div>
            
            <div className="relative">
              <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-accent-cyan border border-background block"></span>
              <div className="text-xs text-zinc-500 font-semibold">Active Tracker</div>
              <h5 className="text-sm font-bold text-zinc-200 mt-1">Allocated Progress</h5>
              <p className="text-xs text-zinc-400 mt-0.5">Allocated {formatCurrency(saved)} out of total goal targets.</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-zinc-700 border border-background block"></span>
              <div className="text-xs text-zinc-500 font-semibold">{formatDate(goal.target_date)}</div>
              <h5 className="text-sm font-bold text-zinc-200 mt-1">Target Completion Date</h5>
              <p className="text-xs text-zinc-400 mt-0.5">Goal is scheduled to end. Target allocation parameters should be fully satisfied.</p>
            </div>
          </div>
        </Card>

        {/* Right Side: Charts Gauge */}
        <Card title="Saved vs Target">
          <div className="h-56 w-full flex flex-col justify-center items-center">
            {/* Visual Progress gauge */}
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-zinc-800 border-t-accent-cyan animate-pulse">
              <div className="flex flex-col items-center">
                <Percent className="h-5 w-5 text-accent-cyan" />
                <span className="text-lg font-extrabold text-zinc-100 mt-1">{progressPercent.toFixed(0)}%</span>
              </div>
            </div>
            <div className="text-xs text-zinc-400 mt-6 text-center font-medium">
              You are <span className="text-accent-cyan font-bold">{progressPercent.toFixed(0)}%</span> of the way towards reaching your target amount.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GoalProgress;
