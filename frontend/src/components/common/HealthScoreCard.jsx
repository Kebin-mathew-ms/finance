import React from 'react';
import { Award, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import Card from './Card';

const HealthScoreCard = ({ score = 70, status = "GOOD" }) => {
  const getStatusConfig = (val, state) => {
    if (state === "CRITICAL" || val <= 25) {
      return {
        color: "text-accent-rose border-accent-rose/20 bg-accent-rose/5",
        barColor: "bg-accent-rose",
        icon: ShieldAlert,
        description: "Your financial health is critical. Severe overspending or overdue obligations require immediate attention."
      };
    } else if (state === "POOR" || val <= 50) {
      return {
        color: "text-amber-500 border-amber-500/20 bg-amber-500/5",
        barColor: "bg-amber-500",
        icon: AlertTriangle,
        description: "Your score is below average. Consider setting stricter budget limits and building cash savings."
      };
    } else if (state === "GOOD" || val <= 75) {
      return {
        color: "text-accent-cyan border-accent-cyan/20 bg-accent-cyan/5",
        barColor: "bg-accent-cyan",
        icon: Award,
        description: "Good financial health. You maintain decent savings habits and adhere to set budgets."
      };
    } else {
      return {
        color: "text-accent-emerald border-accent-emerald/20 bg-accent-emerald/5",
        barColor: "bg-accent-emerald",
        icon: CheckCircle,
        description: "Excellent rating! High savings surplus and solid budget stability."
      };
    }
  };

  const config = getStatusConfig(score, status);
  const StatusIcon = config.icon;

  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
        {/* Dial Score Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#27272a"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={score <= 25 ? '#f43f5e' : (score <= 50 ? '#f59e0b' : (score <= 75 ? '#06b6d4' : '#10b981'))}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * score) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-zinc-100">{score}</span>
            <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-wider">Score</span>
          </div>
        </div>

        {/* Status Metrics Details */}
        <div className="flex-1 space-y-2.5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h4 className="text-sm font-bold text-zinc-300">Financial Health Rating</h4>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border inline-flex items-center mx-auto sm:mx-0 w-fit ${config.color}`}>
              <StatusIcon className="h-3 w-3 mr-1 shrink-0" /> {status}
            </span>
          </div>
          
          <p className="text-xs text-zinc-450 leading-relaxed max-w-sm">
            {config.description}
          </p>

          {/* Simple progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
              <span>Risk Level</span>
              <span>{score}% safe</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className={`h-full ${config.barColor} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HealthScoreCard;
