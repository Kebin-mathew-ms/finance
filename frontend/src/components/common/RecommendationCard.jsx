import React from 'react';
import { ArrowUpRight, HelpCircle, BellRing, Sparkles, TrendingDown, Target } from 'lucide-react';
import Card from './Card';

const RecommendationCard = ({ recommendation }) => {
  if (!recommendation) return null;

  const { title, description, priority, created_at } = recommendation;

  const getPriorityStyle = (prio) => {
    switch (prio) {
      case 'HIGH':
        return {
          border: 'border-accent-rose/25 bg-accent-rose/5',
          tag: 'bg-accent-rose/15 text-accent-rose border-accent-rose/20',
          indicator: 'bg-accent-rose'
        };
      case 'MEDIUM':
        return {
          border: 'border-amber-500/25 bg-amber-500/5',
          tag: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
          indicator: 'bg-amber-500'
        };
      default:
        return {
          border: 'border-zinc-800 bg-zinc-900/40',
          tag: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          indicator: 'bg-accent-indigo'
        };
    }
  };

  const style = getPriorityStyle(priority);

  return (
    <div className={`p-4 border rounded-xl flex items-start gap-3.5 transition hover:bg-zinc-850/20 ${style.border}`}>
      {/* Visual pulse indicator */}
      <div className="relative flex h-2 w-2 shrink-0 mt-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.indicator}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.indicator}`}></span>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center gap-2">
          <h4 className="text-xs font-black text-zinc-150 leading-tight">{title}</h4>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border shrink-0 tracking-wider ${style.tag}`}>
            {priority}
          </span>
        </div>
        
        <p className="text-xs text-zinc-450 leading-relaxed pt-0.5">
          {description}
        </p>

        {created_at && (
          <div className="text-[9px] text-zinc-600 pt-1 font-mono">
            Generated {new Date(created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
