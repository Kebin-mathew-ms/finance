import React from 'react';

export const PageLoader = ({ message = 'Syncing account...' }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Double Ring Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-800 border-t-accent-indigo animate-spin"></div>
          <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-accent-cyan animate-spin-reverse"></div>
        </div>
        <p className="text-sm font-medium text-zinc-300 tracking-wide">{message}</p>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="glass-panel rounded-xl p-5 w-full animate-pulse flex flex-col space-y-3">
      <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
      <div className="h-8 bg-zinc-800 rounded w-1/2"></div>
      <div className="h-3 bg-zinc-800 rounded w-full"></div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="w-full flex flex-col space-y-3">
      <div className="h-8 bg-zinc-800/50 rounded w-full animate-pulse"></div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-10 bg-zinc-800/30 rounded w-full animate-pulse"></div>
      ))}
    </div>
  );
};
