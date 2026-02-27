import { useField } from 'formik';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  options?: string[];
  className?: string;
  helperText?: string;
  min?: number;
  max?: number;
  status?: 'error' | 'warning' | 'success' | 'default';
  customError?: string;
}

export function FormField({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  options, 
  className,
  helperText,
  min,
  max,
  status: forcedStatus,
  customError
}: FormFieldProps) {
  const [field, meta] = useField(name);
  const isError = meta.touched && meta.error;
  
  const status = forcedStatus || (isError ? 'error' : meta.touched && !meta.error ? 'success' : 'default');

  const inputClasses = cn(
    "w-full px-4 py-2.5 border rounded-xl transition-all duration-200 outline-none text-sm",
    status === 'error' && "bg-red-50/30 border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10",
    status === 'warning' && "bg-amber-50/30 border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10",
    status === 'success' && "bg-emerald-50/30 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
    status === 'default' && "bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
    className
  );

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>

      {type === 'select' ? (
        <select {...field} id={name} className={inputClasses}>
          <option value="" disabled>{placeholder || 'Select an option'}</option>
          {options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea 
          {...field} 
          id={name} 
          placeholder={placeholder} 
          className={cn(inputClasses, "min-h-[100px] resize-none")}
        />
      ) : (
        <input 
          {...field} 
          id={name} 
          type={type} 
          placeholder={placeholder} 
          className={inputClasses}
          min={min}
          max={max}
        />
      )}
      
      {customError || isError ? (
        <p className={cn(
          "text-[10px] font-medium uppercase tracking-tight",
          status === 'error' ? "text-red-500" : "text-amber-600"
        )}>
          {customError || meta.error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-gray-400 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
}
