import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, BarChart2, CalendarRange, Columns } from 'lucide-react';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import CategoryChart from '../../components/common/CategoryChart';
import Card from '../../components/common/Card';

const SpendingPatterns = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const loadPatternsData = async () => {
      setLoading(true);
      try {
        const catRes = await apiClient.get('/analytics/categories');
        setCategories(catRes.data || []);

        // Fetch recent expenses to calculate spending patterns by day of the week
        const expRes = await apiClient.get('/expense?page=1&size=50');
        const items = expRes.data.items || [];
        
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const daySums = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
        
        items.forEach(item => {
          const d = new Date(item.expense_date);
          const dayIdx = d.getDay();
          daySums[dayIdx] += parseFloat(item.amount);
        });

        const weeklyMapped = days.map((day, idx) => ({
          day,
          amount: daySums[idx]
        }));
        setWeeklyData(weeklyMapped);

      } catch (err) {
        console.error("Failed to load spending patterns:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPatternsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Analyzing category distributions and transaction frequencies...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-accent-cyan" /> Spending Patterns
        </h1>
        <p className="text-xs text-zinc-450 mt-1">Review spending distributions by category and transaction frequencies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution chart */}
        <CategoryChart data={categories} title="Aggregate Category Distribution" />

        {/* Weekly Day of Week spending bar chart */}
        <Card title="Spending by Day of Week" subtitle="Identifies peak shopping days">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="day" 
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
                  formatter={(val) => [formatCurrency(val), "Spent"]}
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#f4f4f5',
                    fontSize: '11px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SpendingPatterns;
