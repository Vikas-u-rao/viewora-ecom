import { ChevronDown } from "lucide-react";

export function FilterDropdown({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-gray-900 cursor-pointer transition-all hover:bg-gray-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none">
        {icon || <ChevronDown className="size-3.5" />}
      </div>
    </div>
  );
}
