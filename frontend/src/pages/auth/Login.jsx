import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setSubmitError('');
    const res = await login(data.email, data.password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setSubmitError(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-zinc-100">Welcome Back</h2>
        <p className="text-xs text-zinc-400">Enter your credentials to access your wealth portal</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/25 rounded-lg p-2.5 flex items-start space-x-1">
            <span>⚠</span>
            <span className="font-semibold">{submitError}</span>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="your.email@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            }
          })}
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters long',
            }
          })}
        />

        <div className="flex justify-end">
          <Link 
            to="/forgot-password" 
            className="text-xs text-accent-cyan hover:text-cyan-400 font-semibold transition"
          >
            Forgot Password?
          </Link>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          loading={isSubmitting} 
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-400 border-t border-white/5 pt-4">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="text-accent-indigo hover:text-indigo-400 font-semibold transition"
        >
          Create account
        </Link>
      </div>
    </div>
  );
};

export default Login;
