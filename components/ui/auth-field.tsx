type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
};

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  required = true,
}: AuthFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
        minLength={minLength}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}
