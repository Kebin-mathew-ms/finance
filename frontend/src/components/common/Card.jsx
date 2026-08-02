import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`glass-panel rounded-xl p-5 ${
        hoverable ? 'glass-panel-hover' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 mb-4 gap-2">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
