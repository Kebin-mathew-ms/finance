import React from 'react';

const Input = React.forwardRef(({
  label,
  name,
  type = 'text',
  error,
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          className={`block w-full bg-zinc-900 border ${
            error ? 'border-accent-rose focus:ring-accent-rose' : 'border-zinc-800 focus:ring-accent-indigo'
          } rounded-lg text-sm text-zinc-100 placeholder-zinc-500 ${
            Icon ? 'pl-10' : 'pl-3'
          } pr-3 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:border-transparent`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-accent-rose mt-1 flex items-center">
          <span className="mr-1">⚠</span> {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
