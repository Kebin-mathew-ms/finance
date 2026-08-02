import React, { useState } from 'react';
import { Search, Calendar, DollarSign, Tag, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import Card from './Card';
import Input from './Input';
import Button from './Button';

const SearchBar = ({ onSearch, loading = false }) => {
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [category, setCategory] = useState('');
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      keyword,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      minimum_amount: minAmount ? parseFloat(minAmount) : undefined,
      maximum_amount: maxAmount ? parseFloat(maxAmount) : undefined,
      category: category || undefined
    });
  };

  const handleReset = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setCategory('');
    onSearch({});
  };

  return (
    <Card hoverable>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Search input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search keyword (e.g. Swiggy, salary, vacation...)"
              icon={Search}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="bg-zinc-950/20 border-zinc-800"
            />
          </div>
          <Button type="submit" loading={loading} className="shrink-0 px-6">
            Search
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-zinc-400 hover:text-zinc-200 transition font-semibold"
          >
            {showAdvanced ? (
              <>Hide Filters <ChevronUp className="h-4 w-4 ml-1" /></>
            ) : (
              <>Advanced Filters <ChevronDown className="h-4 w-4 ml-1" /></>
            )}
          </button>
          
          {showAdvanced && (
            <button
              type="button"
              onClick={handleReset}
              className="text-accent-rose hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/5 animate-fade-in">
            {/* 1. Date Range Filters */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="From"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
                />
                <input
                  type="date"
                  placeholder="To"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
                />
              </div>
            </div>

            {/* 2. Amount Boundaries */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Amount Bounds ($)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  step="0.01"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
                />
                <input
                  type="number"
                  placeholder="Max"
                  step="0.01"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
                />
              </div>
            </div>

            {/* 3. Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Category keyword</label>
              <input
                type="text"
                placeholder="e.g. Food, Bills, Salary..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
              />
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};

export default SearchBar;
