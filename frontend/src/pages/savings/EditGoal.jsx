import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Target, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';

const GOAL_TYPES = ["Emergency fund", "Vehicle purchase", "Education", "Vacation", "Home purchase", "Retirement", "Investment", "Other"];

const EditGoal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  const startDateVal = watch('start_date');

  useEffect(() => {
    const fetchGoalDetails = async () => {
      try {
        const res = await apiClient.get(`/goals/${id}`);
        const data = res.data;
        
        // Format dates for input (YYYY-MM-DD)
        if (data.start_date) {
          data.start_date = new Date(data.start_date).toISOString().split('T')[0];
        }
        if (data.target_date) {
          data.target_date = new Date(data.target_date).toISOString().split('T')[0];
        }

        reset({
          goal_name: data.goal_name,
          goal_type: data.goal_type,
          target_amount: parseFloat(data.target_amount),
          saved_amount: parseFloat(data.saved_amount),
          start_date: data.start_date,
          target_date: data.target_date,
          status: data.status
        });
      } catch (err) {
        console.error("Failed to load savings goal details:", err);
        navigate('/goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoalDetails();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await apiClient.put(`/goals/${id}`, {
        ...data,
        target_amount: parseFloat(data.target_amount),
        saved_amount: parseFloat(data.saved_amount)
      });
      navigate('/goals');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.detail || 'Failed to update savings goal.');
    }
  };

  if (loading) {
    return <PageLoader message="Loading savings goal parameters..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Title block */}
      <div className="flex items-center space-x-3">
        <Link to="/goals" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Edit Savings Goal
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Modify target values and goal specifications</p>
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
            label="Goal Target Name"
            icon={Target}
            placeholder="e.g. Summer Spain Vacation"
            error={errors.goal_name?.message}
            {...register('goal_name', { required: 'Goal name is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Goal Type</label>
              <select
                {...register('goal_type', { required: 'Goal type is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                {GOAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <Input
              label="Target Goal Amount ($)"
              type="number"
              step="0.01"
              icon={DollarSign}
              placeholder="0.00"
              error={errors.target_amount?.message}
              {...register('target_amount', {
                required: 'Target amount is required',
                min: { value: 0.01, message: 'Target must be greater than zero' }
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Saved Amount ($)"
              type="number"
              step="0.01"
              icon={DollarSign}
              placeholder="0.00"
              error={errors.saved_amount?.message}
              {...register('saved_amount', {
                required: 'Saved amount is required',
                min: { value: 0.00, message: 'Saved amount cannot be negative' }
              })}
            />
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="block w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-indigo"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              icon={Calendar}
              error={errors.start_date?.message}
              {...register('start_date', { required: 'Start date is required' })}
            />

            <Input
              label="Target Completion Date"
              type="date"
              icon={Calendar}
              error={errors.target_date?.message}
              {...register('target_date', {
                required: 'Target completion date is required',
                validate: {
                  future: (v) => new Date(v) > new Date() || 'Target date must be in the future',
                  afterStart: (v) => new Date(v) > new Date(startDateVal) || 'Target date must be after start date'
                }
              })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/goals">
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

export default EditGoal;
