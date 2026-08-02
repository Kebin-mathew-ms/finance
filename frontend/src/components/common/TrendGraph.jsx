import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from './Card';

const TrendGraph = ({ data = [], height = 300, title = "Cash Flow Trends" }) => {
  return (
    <Card title={title}>
      <div className="w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="period" 
              stroke="#52525b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#09090b', 
                borderColor: '#27272a',
                borderRadius: '8px',
                color: '#f4f4f5',
                fontSize: '11px'
              }}
            />
            <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
            <Area 
              type="monotone" 
              dataKey="income" 
              name="Income" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIncome)" 
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              name="Expenses" 
              stroke="#f43f5e" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorExpenses)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TrendGraph;
