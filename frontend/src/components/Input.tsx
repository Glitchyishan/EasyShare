import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
          error && 'border-danger focus:ring-danger/20 focus:border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger ml-1">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
