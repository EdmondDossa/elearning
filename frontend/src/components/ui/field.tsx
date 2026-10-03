import { InputHTMLAttributes } from "react";

export function Field({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm
          focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        {...props}
      />
    </div>
  );
}
