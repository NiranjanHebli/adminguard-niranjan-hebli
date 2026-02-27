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
  max
}: FormFieldProps) {
  const [field, meta] = useField(name);
  const isError = meta.touched && meta.error;

  const inputClasses = cn(
    "w-full px-4 py-2.5 bg-gray-50 border rounded-xl transition-all duration-200 outline-none text-sm",
    isError 
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
      : "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
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
      
      {isError ? (
        <p className="text-[10px] font-medium text-red-500 uppercase tracking-tight">
          {meta.error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-gray-400 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
}
