import React from 'react';
import Card from './Card';

const StatisticsCard = ({ title, value, icon: Icon, description, trendColor = "text-zinc-400" }) => {
  return (
    <Card hoverable className="border border-zinc-800 bg-zinc-950/40">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[10px] font-semibold text-zinc-550 uppercase tracking-widest truncate">
            {title}
          </p>
          <h3 className="text-2xl font-black text-zinc-100 tracking-tight truncate">
            {value}
          </h3>
          {description && (
            <p className={`text-[10px] font-semibold ${trendColor}`}>
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 shrink-0">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatisticsCard;
