import { DownloadIcon } from "@/components/icons";

export function ExportButton({
  href,
  label,
  emphasize = false,
}: {
  href: string;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        emphasize
          ? "inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition print:hidden"
          : "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition print:hidden"
      }
    >
      <DownloadIcon className="h-4 w-4" />
      {label}
    </a>
  );
}
