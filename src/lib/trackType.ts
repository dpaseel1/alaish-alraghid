import type { TrackType } from "@/generated/prisma/client";

export const TRACK_TYPES: TrackType[] = ["HIFZ", "MURAJAA", "TILAWAH", "TAFSIR"];

export const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  HIFZ: "حفظ",
  MURAJAA: "مراجعة",
  TILAWAH: "تلاوة",
  TAFSIR: "تفسير",
};

/** التسمية الكاملة لـ"الأوجه" حسب نوع المسار - تحل محل "الأوجه المحفوظة" في صفحة تفاصيل المسار */
export const TRACK_TYPE_PAGES_LABELS: Record<TrackType, string> = {
  HIFZ: "الأوجه المحفوظة",
  MURAJAA: "أوجه المراجعة",
  TILAWAH: "الأوجه المتلوّة",
  TAFSIR: "الأوجه المفسّرة",
};

/** الصيغة المفردة المختصرة بعد رقم مباشرة على بطاقة المسار بالرئيسية، مثل "36 وجه محفوظ" */
export const TRACK_TYPE_PAGE_UNIT_LABELS: Record<TrackType, string> = {
  HIFZ: "وجه محفوظ",
  MURAJAA: "وجه مراجعة",
  TILAWAH: "وجه متلوّ",
  TAFSIR: "وجه مفسَّر",
};

/** تسمية بطاقة المجموع الكلي حسب نوع المسار بالصفحة الرئيسية للإدارة */
export const TRACK_TYPE_TOTAL_LABELS: Record<TrackType, string> = {
  HIFZ: "مجموع عدد أوجه الحفظ",
  MURAJAA: "مجموع عدد أوجه المراجعة",
  TILAWAH: "مجموع عدد أوجه التلاوة",
  TAFSIR: "مجموع عدد أوجه التفسير",
};
