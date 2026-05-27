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
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#111511] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20"
        minLength={minLength}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}
