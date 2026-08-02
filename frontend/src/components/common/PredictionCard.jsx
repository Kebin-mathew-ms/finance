import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
import Card from './Card';
import { formatCurrency } from '../../utils/formatters';

const PredictionCard = ({ prediction }) => {
  if (!prediction) return null;

  const { category, predicted_amount, confidence_score, model_used, prediction_date } = prediction;
  const targetMonth = new Date(prediction_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getConfidenceLevel = (score) => {
    if (score >= 80) return { label: "High Confidence", color: "text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20" };
    if (score >= 60) return { label: "Medium Confidence", color: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20" };
    return { label: "Low Confidence", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  };

  const conf = getConfidenceLevel(confidence_score);

  return (
    <Card hoverable className="relative overflow-hidden border border-zinc-800 bg-zinc-950/40">
      <div className="absolute top-0 right-0 p-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
        Forecast
      </div>

      <div className="space-y-4">
        {/* Category & Title */}
        <div>
          <h4 className="text-sm font-black text-zinc-100">{category}</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Estimated spending for {targetMonth}</p>
        </div>

        {/* Prediction value */}
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-black text-accent-cyan tracking-tight">
            {formatCurrency(predicted_amount)}
          </span>
          <span className="text-xs text-zinc-550">est.</span>
        </div>

        {/* Confidence rating and Progress */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-semibold">
            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${conf.color}`}>
              {conf.label}
            </span>
            <span className="text-zinc-400">{confidence_score}%</span>
          </div>
          
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                confidence_score >= 80 ? 'bg-accent-emerald' : (confidence_score >= 60 ? 'bg-accent-cyan' : 'bg-amber-500')
              }`} 
              style={{ width: `${confidence_score}%` }}
            ></div>
          </div>
        </div>

        {/* Model info tags */}
        <div className="flex items-center justify-between text-[9px] text-zinc-650 pt-1 font-mono uppercase tracking-wider">
          <span>Engine: {model_used}</span>
          <Sparkles className="h-3 w-3 text-accent-cyan" />
        </div>
      </div>
    </Card>
  );
};

export default PredictionCard;
