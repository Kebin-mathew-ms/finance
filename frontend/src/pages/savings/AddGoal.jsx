import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Target, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import apiClient from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const GOAL_TYPES = ["Emergency fund", "Vehicle purchase", "Education", "Vacation", "Home purchase", "Retirement", "Investment", "Other"];

const AddGoal = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Default target date to +30 days
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureStr = futureDate.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      goal_name: '',
      goal_type: 'Vacation',
      target_amount: '',
      saved_amount: '0.00',
      start_date: todayStr,
      target_date: futureStr
    }
  });

  const startDateVal = watch('start_date');

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await apiClient.post('/goals', {
        ...data,
        target_amount: parseFloat(data.target_amount),
        saved_amount: parseFloat(data.saved_amount)
      });
      navigate('/goals');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.detail || 'Failed to establish savings goal.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Title block */}
      <div className="flex items-center space-x-3">
        <Link to="/goals" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Create Savings Target
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Set long-term savings parameters and due dates</p>
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
              label="Initial Saved Amount ($)"
              type="number"
              step="0.01"
              icon={DollarSign}
              placeholder="0.00"
              error={errors.saved_amount?.message}
              {...register('saved_amount', {
                required: 'Initial savings is required',
                min: { value: 0.00, message: 'Initial savings cannot be negative' }
              })}
            />
            
            <div className="hidden sm:block"></div>
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
              Establish Goal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddGoal;
