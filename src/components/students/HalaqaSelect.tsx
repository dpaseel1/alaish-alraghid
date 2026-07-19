"use client";

import { useRouter } from "next/navigation";

export function HalaqaSelect({
  halaqat,
  selectedId,
  basePath = "/students",
}: {
  halaqat: { id: string; name: string }[];
  selectedId?: string;
  basePath?: string;
}) {
  const router = useRouter();

  return (
    <select
      defaultValue={selectedId ?? ""}
      onChange={(e) => {
        const id = e.target.value;
        router.push(id ? `${basePath}?halaqaId=${id}` : basePath);
      }}
      className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white dark:bg-slate-800"
    >
      <option value="">اختاري حلقة لعرض طالباتها</option>
      {halaqat.map((h) => (
        <option key={h.id} value={h.id}>
          {h.name}
        </option>
      ))}
    </select>
  );
}
