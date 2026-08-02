import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirm_password: '',
    }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setSubmitError('');
    setSuccessMsg('');
    
    const res = await registerUser(data);
    if (res.success) {
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setSubmitError(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-zinc-100">Create Account</h2>
        <p className="text-xs text-zinc-400">Join Finance to start managing your wealth</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/25 rounded-lg p-2.5 flex items-start space-x-1">
            <span>⚠</span>
            <span>{submitError}</span>
          </div>
        )}
        {successMsg && (
          <div className="text-xs text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/25 rounded-lg p-2.5 flex items-start space-x-1">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            icon={User}
            placeholder="John"
            error={errors.first_name?.message}
            {...register('first_name', { required: 'Required' })}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.last_name?.message}
            {...register('last_name', { required: 'Required' })}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="john.doe@example.com"
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
          label="Phone Number"
          type="tel"
          icon={Phone}
          placeholder="123-456-7890"
          error={errors.phone_number?.message}
          {...register('phone_number')}
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
              message: 'Must be at least 8 characters long',
            },
            validate: {
              uppercase: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
              lowercase: (v) => /[a-z]/.test(v) || 'Must contain a lowercase letter',
              number: (v) => /\d/.test(v) || 'Must contain a number',
              special: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Must contain a special character',
            }
          })}
        />

        <Input
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.confirm_password?.message}
          {...register('confirm_password', {
            required: 'Please confirm your password',
            validate: (v) => v === passwordVal || 'Passwords do not match',
          })}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="w-full mt-2"
        >
          Sign Up
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-400 border-t border-white/5 pt-4">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-accent-indigo hover:text-indigo-400 font-semibold transition"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
