import type { StudentAttendanceStatus } from "@/generated/prisma/client";

// ملف مشترك (بدون "use server") لأن ملفات use server يُسمح لها فقط بتصدير دوال async،
// وهذا القاموس يُستخدم في أماكن غير-server-action أيضًا (صفحات وقوالب تصدير)
export const STUDENT_ATTENDANCE_STATUSES: StudentAttendanceStatus[] = [
  "PRESENT",
  "ABSENT_EXCUSED",
  "ABSENT_UNEXCUSED",
];

export const STUDENT_ATTENDANCE_LABELS: Record<StudentAttendanceStatus, string> = {
  PRESENT: "حاضرة",
  ABSENT_EXCUSED: "غياب بعذر",
  ABSENT_UNEXCUSED: "غياب بدون عذر",
};
