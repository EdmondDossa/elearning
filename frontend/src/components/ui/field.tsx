import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

function Label({ id, label }: { id: string; label: string }) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
  );
}

export function Field({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="space-y-1">
      <Label id={id} label={label} />
      <input id={id} className={controlClass} {...props} />
    </div>
  );
}

export function TextAreaField({
  label,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string;
}) {
  return (
    <div className="space-y-1">
      <Label id={id} label={label} />
      <textarea id={id} rows={4} className={controlClass} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <div className="space-y-1">
      <Label id={id} label={label} />
      <select id={id} className={controlClass} {...props}>
        {children}
      </select>
    </div>
  );
}
