import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          className={`block w-full px-4 py-3 border border-slate-500/50 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-400/80 focus:border-indigo-400/80 sm:text-sm bg-slate-900/20 text-slate-100 transition-all duration-200 backdrop-blur-sm ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;