"use client";

import { useRouter } from "next/navigation";

export function HalaqaSelect({
  halaqat,
  selectedId,
}: {
  halaqat: { id: string; name: string }[];
  selectedId?: string;
}) {
  const router = useRouter();

  return (
    <select
      defaultValue={selectedId ?? ""}
      onChange={(e) => {
        const id = e.target.value;
        router.push(id ? `/students?halaqaId=${id}` : "/students");
      }}
      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
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
