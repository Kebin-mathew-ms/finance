import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FileText, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';

const BUDGET_CATEGORIES = ["Food", "Transportation", "Shopping", "Bills", "Healthcare", "Entertainment", "Education", "Insurance", "Investment", "Miscellaneous"];

const EditBudget = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm();

  useEffect(() => {
    const fetchBudgetDetails = async () => {
      try {
        const res = await apiClient.get(`/budgets/${id}`);
        reset({
          title: res.data.title,
          category: res.data.category,
          amount_limit: parseFloat(res.data.amount_limit),
          month: res.data.month,
          year: res.data.year
        });
      } catch (err) {
        console.error("Failed to load budget details:", err);
        navigate('/budgets');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetDetails();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await apiClient.put(`/budgets/${id}`, {
        ...data,
        amount_limit: parseFloat(data.amount_limit),
        month: parseInt(data.month, 10),
        year: parseInt(data.year, 10)
      });
      navigate('/budgets');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.detail || 'Failed to update budget record.');
    }
  };

  if (loading) {
    return <PageLoader message="Loading budget metrics..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Navigation Title */}
      <div className="flex items-center space-x-3">
        <Link to="/budgets" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Edit Budget Envelope
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Modify monthly category thresholds</p>
        </div>
      </div>

      <Card hoverable>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {submitError && (
            <div className="text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/25 rounded-lg p-2.5">
              ⚠ {submitError}
            </div>
          )}

          <Input
            label="Budget Title"
            icon={FileText}
            placeholder="e.g. Monthly Grocery Expenses"
            error={errors.title?.message}
            {...register('title', { required: 'Budget title is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {BUDGET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input
              label="Budget Limit ($)"
              type="number"
              step="0.01"
              icon={DollarSign}
              placeholder="0.00"
              error={errors.amount_limit?.message}
              {...register('amount_limit', {
                required: 'Limit is required',
                min: { value: 0.01, message: 'Budget limit must be greater than zero' }
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Month</label>
              <select
                {...register('month', { required: 'Month is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {new Date(2020, idx).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Year</label>
              <select
                {...register('year', { required: 'Year is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {Array.from({ length: 5 }).map((_, idx) => {
                  const y = 2026 + idx;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/budgets">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditBudget;
