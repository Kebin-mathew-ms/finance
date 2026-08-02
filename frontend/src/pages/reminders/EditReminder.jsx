import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FileText, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';

const REMINDER_TYPES = ["Electricity bill", "Water bill", "Internet bill", "Rent payment", "Credit card payment", "Loan payment", "Subscription payment", "Insurance payment", "Other"];
const REPEAT_INTERVALS = [
  { value: "NONE", label: "One-time (None)" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" }
];

const EditReminder = () => {
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
    const fetchReminderDetails = async () => {
      try {
        const res = await apiClient.get(`/reminders/${id}`);
        const data = res.data;
        
        // Format date string for the calendar input (YYYY-MM-DD)
        if (data.due_date) {
          data.due_date = new Date(data.due_date).toISOString().split('T')[0];
        }

        reset({
          title: data.title,
          description: data.description || '',
          reminder_type: data.reminder_type,
          amount: parseFloat(data.amount),
          due_date: data.due_date,
          repeat_interval: data.repeat_interval,
          is_completed: data.is_completed
        });
      } catch (err) {
        console.error("Failed to load reminder details:", err);
        navigate('/reminders');
      } finally {
        setLoading(false);
      }
    };

    fetchReminderDetails();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await apiClient.put(`/reminders/${id}`, {
        ...data,
        amount: parseFloat(data.amount)
      });
      navigate('/reminders');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.detail || 'Failed to update reminder record.');
    }
  };

  if (loading) {
    return <PageLoader message="Loading reminder specifications..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Title block */}
      <div className="flex items-center space-x-3">
        <Link to="/reminders" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Edit Reminder Schedule
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Modify payment targets and intervals</p>
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
            label="Bill Name / Title"
            icon={FileText}
            placeholder="e.g. Electric Utility Statement"
            error={errors.title?.message}
            {...register('title', { required: 'Bill title is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reminder Type</label>
              <select
                {...register('reminder_type', { required: 'Reminder type is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {REMINDER_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <Input
              label="Amount Due ($)"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payment Due Date"
              type="date"
              icon={Calendar}
              error={errors.due_date?.message}
              {...register('due_date', {
                required: 'Due date is required',
                validate: (v) => new Date(v) >= new Date(new Date().setHours(0,0,0,0)) || 'Due date cannot be in the past'
              })}
            />

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Repeat Cycle (Frequency)</label>
              <select
                {...register('repeat_interval', { required: 'Repeat cycle is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {REPEAT_INTERVALS.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Payment Status</label>
              <select
                {...register('is_completed', { required: 'Status is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                <option value="false">Active / Unpaid</option>
                <option value="true">Paid / Completed</option>
              </select>
            </div>
            
            <div className="hidden sm:block"></div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Add memo context..."
              rows={3}
              {...register('description', { maxLength: { value: 255, message: 'Maximum 255 characters' } })}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 px-3 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
            />
            {errors.description && (
              <p className="text-xs text-accent-rose mt-1">⚠ {errors.description.message}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/reminders">
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

export default EditReminder;
