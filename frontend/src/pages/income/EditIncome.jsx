import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FileText, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';

const INCOME_CATEGORIES = ["Salary", "Business", "Freelancing", "Investment", "Rental income", "Other income"];

const EditIncome = () => {
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
    const fetchIncomeDetails = async () => {
      try {
        const res = await apiClient.get(`/income/${id}`);
        const data = res.data;
        
        // Format date string for the calendar input (YYYY-MM-DD)
        if (data.income_date) {
          data.income_date = new Date(data.income_date).toISOString().split('T')[0];
        }
        
        reset({
          title: data.title,
          category: data.category,
          amount: parseFloat(data.amount),
          income_date: data.income_date,
          description: data.description || ''
        });
      } catch (err) {
        console.error("Failed to load income details:", err);
        navigate('/income');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeDetails();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await apiClient.put(`/income/${id}`, {
        ...data,
        amount: parseFloat(data.amount)
      });
      navigate('/income');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.detail || 'Failed to update income record.');
    }
  };

  if (loading) {
    return <PageLoader message="Retrieving record data..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Upper header navigation */}
      <div className="flex items-center space-x-3">
        <Link to="/income" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Edit Earnings Stream
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Modify details for selected transaction record</p>
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
            label="Transaction Title"
            icon={FileText}
            placeholder="e.g. Acme Corp Consultant Retainer"
            error={errors.title?.message}
            {...register('title', { required: 'Transaction title is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {INCOME_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-accent-rose mt-1">⚠ {errors.category.message}</p>
              )}
            </div>

            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              icon={DollarSign}
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than zero' }
              })}
            />
          </div>

          <Input
            label="Income Date"
            type="date"
            icon={Calendar}
            error={errors.income_date?.message}
            {...register('income_date', { required: 'Date is required' })}
          />

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Provide context details..."
              rows={3}
              {...register('description', { maxLength: { value: 255, message: 'Maximum 255 characters' } })}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 px-3 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
            />
            {errors.description && (
              <p className="text-xs text-accent-rose mt-1">⚠ {errors.description.message}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/income">
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

export default EditIncome;
