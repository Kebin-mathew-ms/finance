import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, Key } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code verification, 3: Reset success
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register: regEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors }
  } = useForm();

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    watch,
    formState: { errors: passErrors }
  } = useForm();

  const newPasswordVal = watch('new_password');

  const onEmailSubmit = async (data) => {
    setLoading(true);
    setError('');
    // Simulate API call delay
    setTimeout(() => {
      setEmail(data.email);
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(randomCode);
      setLoading(false);
      setStep(2);
      console.log(`[SIMULATED PASSWORD RESET CODE FOR ${data.email}]: ${randomCode}`);
    }, 1200);
  };

  const onPassSubmit = async (data) => {
    if (data.code !== simulatedCode) {
      setError('Invalid verification code.');
      return;
    }
    setLoading(true);
    setError('');
    
    // Simulate password change API call delay
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-zinc-100">Reset Password</h2>
        <p className="text-xs text-zinc-400">
          {step === 1 && 'Enter your email to receive a recovery code'}
          {step === 2 && 'Enter the verification code and set a new password'}
          {step === 3 && 'Your account security has been updated'}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="your.email@example.com"
            error={emailErrors.email?.message}
            {...regEmail('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              }
            })}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Send Recovery Code
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePassSubmit(onPassSubmit)} className="space-y-4">
          {error && (
            <div className="text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/25 rounded-lg p-2.5">
              ⚠ {error}
            </div>
          )}
          
          {/* Simulation Help Banner */}
          <div className="text-[11px] text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg p-3">
            <strong>Demo Code Note:</strong> Since mailer services are not initialized, we logged code <span className="font-mono bg-zinc-950 px-1.5 py-0.5 rounded text-white border border-white/10">{simulatedCode}</span> for testing.
          </div>

          <Input
            label="Verification Code"
            icon={ShieldCheck}
            placeholder="6-digit code"
            error={passErrors.code?.message}
            {...regPass('code', { required: 'Verification code is required' })}
          />

          <Input
            label="New Password"
            type="password"
            icon={Key}
            placeholder="••••••••"
            error={passErrors.new_password?.message}
            {...regPass('new_password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Must be at least 8 characters long',
              }
            })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            icon={Key}
            placeholder="••••••••"
            error={passErrors.confirm_password?.message}
            {...regPass('confirm_password', {
              required: 'Please confirm password',
              validate: (v) => v === newPasswordVal || 'Passwords do not match',
            })}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Reset Password
          </Button>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-5 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center mx-auto text-accent-emerald text-xl">
            ✓
          </div>
          <p className="text-sm text-zinc-300">
            Password reset successfully. You can now use your new credentials.
          </p>
          <Link to="/login" className="block">
            <Button className="w-full">Return to Sign In</Button>
          </Link>
        </div>
      )}

      {step !== 3 && (
        <div className="text-center text-xs text-zinc-400 border-t border-white/5 pt-4">
          Remember credentials?{' '}
          <Link
            to="/login"
            className="text-accent-indigo hover:text-indigo-400 font-semibold transition"
          >
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
