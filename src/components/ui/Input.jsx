import React from 'react';

const Input = ({
    type = 'text',
    value,
    onChange,
    placeholder = '',
    label,
    icon: Icon,
    required = false,
    className = '',
    min,
    step,
    disabled = false,
}) => {
    return (
        <div className={className}>
            {label && (
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                    />
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    step={step}
                    disabled={disabled}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm font-medium transition-all placeholder:text-slate-400 disabled:opacity-50`}
                />
            </div>
        </div>
    );
};

export default Input;
