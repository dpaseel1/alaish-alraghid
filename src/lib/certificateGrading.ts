/** يحوّل النسبة المئوية إلى تقدير نصّي حسب السلّم المعتمد */
export function gradeTierLabel(percent: number): string {
  if (percent >= 90) return "ممتاز";
  if (percent >= 80) return "جيد جدًا";
  if (percent >= 70) return "جيد";
  if (percent >= 60) return "مقبول";
  return "ضعيف";
}

/** يحسب النسبة المئوية للدرجة مقرّبة لأقرب عدد صحيح */
export function gradePercent(grade: number, maxGrade: number): number {
  if (!maxGrade) return 0;
  return Math.round((grade / maxGrade) * 100);
}
