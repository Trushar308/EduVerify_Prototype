import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center px-6 py-3 border text-base font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm active:scale-[0.98]";

  const variantClasses = {
    primary: "text-white bg-indigo-500/50 hover:bg-indigo-500/80 border-indigo-500/50 hover:border-indigo-500 focus:ring-indigo-400 shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30",
    secondary: "text-slate-200 bg-white/10 hover:bg-white/20 border-white/20 focus:ring-white",
    danger: "text-white bg-red-500/50 hover:bg-red-500/80 border-red-500/50 focus:ring-red-400",
    ghost: "text-slate-300 hover:bg-white/10 border-transparent shadow-none"
  };

  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && loadingSpinner}
      <span>{children}</span>
    </button>
  );
};

export default Button;