import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from './Card';
import { formatCurrency } from '../../utils/formatters';

const CHART_COLORS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#3b82f6', // blue
  '#71717a'  // gray
];

const CategoryChart = ({ data = [], height = 300, title = "Spending by Category" }) => {
  const cleanData = data.filter(d => d.amount > 0);

  return (
    <Card title={title}>
      <div className="w-full" style={{ height: `${height}px` }}>
        {cleanData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
            No expenses to show for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={cleanData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
              >
                {cleanData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => [formatCurrency(val), "Spent"]}
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: '11px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                iconSize={8} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} 
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default CategoryChart;
