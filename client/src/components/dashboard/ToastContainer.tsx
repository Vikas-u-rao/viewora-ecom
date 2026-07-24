import { X, CheckCircle, ShieldAlert, Globe } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white text-gray-700 text-sm font-sans transition-all duration-300 ${
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : t.type === "error"
                ? "border-red-200 bg-red-50/90 text-red-950"
                : "border-blue-200 bg-blue-50/90 text-blue-950"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
          ) : t.type === "error" ? (
            <ShieldAlert className="size-4.5 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Globe className="size-4.5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <p className="flex-1">{t.message}</p>
          <button
            onClick={() => onRemove(t.id)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
