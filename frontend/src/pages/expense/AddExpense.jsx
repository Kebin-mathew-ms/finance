import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, DollarSign, Calendar, ArrowLeft, Upload, FileImage } from 'lucide-react';
import apiClient from '../../api/client';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const EXPENSE_CATEGORIES = ["Food", "Bills", "Transportation", "Entertainment", "Healthcare", "Shopping", "Education", "Insurance", "Other"];

const AddExpense = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  
  // File upload state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptName, setReceiptName] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      category: 'Food',
      amount: '',
      expense_date: todayStr,
      description: ''
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptName(file.name);
    }
  };

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('category', data.category);
      formData.append('amount', parseFloat(data.amount));
      formData.append('expense_date', data.expense_date);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      await apiClient.post('/expense', formData);
      navigate('/expense');
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.detail || 'Failed to record expense record.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Upper header navigation */}
      <div className="flex items-center space-x-3">
        <Link to="/expense" className="text-zinc-400 hover:text-zinc-200 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
            Log Expense Outflow
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Record a new outgoing financial expenditure</p>
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
            placeholder="e.g. Weekly Groceries"
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
                {EXPENSE_CATEGORIES.map(cat => (
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
            label="Expense Date"
            type="date"
            icon={Calendar}
            error={errors.expense_date?.message}
            {...register('expense_date', { required: 'Date is required' })}
          />

          {/* Receipt File Upload */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Upload Receipt Image (Optional)
            </span>
            <div className="border border-dashed border-zinc-800 rounded-lg bg-zinc-900/40 p-5 flex flex-col items-center justify-center transition hover:border-zinc-700/50">
              <Upload className="h-6 w-6 text-zinc-500 mb-2" />
              <label className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-800 text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 cursor-pointer transition">
                Choose File
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
              <p className="text-[10px] text-zinc-500 mt-2">Accepted formats: JPG, PNG, WEBP (Max 5MB)</p>
              {receiptName && (
                <div className="mt-3 flex items-center text-xs text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-3 py-1.5 rounded-md">
                  <FileImage className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="truncate max-w-[200px]">{receiptName}</span>
                </div>
              )}
            </div>
          </div>

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
            <Link to="/expense">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={isSubmitting}>
              Add Expense
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddExpense;
