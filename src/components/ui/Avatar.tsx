/* eslint-disable @next/next/no-img-element */

/**
 * صورة الحساب: تعرض صورة المستخدمة إن وُجدت، وإلا حرفها الأول كبديل.
 * نستخدم <img> عادية بدل next/image لأن الصور مخزّنة كـ data URL في قاعدة البيانات.
 */
export function Avatar({
  name,
  avatarUrl,
  size = 36,
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand flex items-center justify-center font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.charAt(0)}
    </div>
  );
}
