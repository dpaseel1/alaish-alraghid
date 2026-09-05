-- تصحيح بيانات: إعادة احتساب "عدد أوجه المراجعة" لكل طالبة من مصدرها الصحيح (WeeklyRecitation)
-- بدل القيمة القديمة الموروثة من نظام السرد اليومي السابق (قبل هجرة 20260904090000_weekly_recitation)،
-- والتي كانت تضيف كامل محفوظ الطالبة التراكمي في كل يوم تُسجَّل فيه "سردت" فتضخّمت بشكل غير صحيح.
UPDATE "Student" s
SET "reviewedPagesTotal" = COALESCE((
  SELECT SUM(wr."pagesRecorded")
  FROM "WeeklyRecitation" wr
  WHERE wr."studentId" = s.id AND wr."recited" = true
), 0);
