import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PrintButton } from "@/components/reports/PrintButton";
import { HalaqaSelect } from "@/components/students/HalaqaSelect";
import { CertificateSection } from "@/components/certificates/CertificateSection";
import { ExportHalaqaCertificatesButton } from "@/components/certificates/ExportHalaqaCertificatesButton";
import type { Prisma } from "@/generated/prisma/client";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ halaqaId?: string; studentId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  let halaqaWhere: Prisma.HalaqaWhereInput = {};
  if (user.role === "TEACHER") halaqaWhere = { teacherId: user.id };
  else if (user.role === "SUPERVISOR") halaqaWhere = { supervisorId: user.id };

  let halaqaId = params.halaqaId;
  if (user.role === "TEACHER") {
    const own = await db.halaqa.findUnique({ where: { teacherId: user.id }, select: { id: true } });
    halaqaId = own?.id;
  }

  const halaqatForSelect =
    user.role === "TEACHER"
      ? []
      : await db.halaqa.findMany({
          where: { ...halaqaWhere, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });

  const halaqa = halaqaId
    ? await db.halaqa.findFirst({
        where: { id: halaqaId, ...halaqaWhere },
        include: {
          students: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            include: { examGrades: { orderBy: { examDate: "desc" }, take: 1 } },
          },
        },
      })
    : null;

  const studentsWithCertificates = (halaqa?.students ?? [])
    .filter((s) => s.examGrades.length > 0)
    .map((s) => ({
      studentName: s.name,
      quota: s.examGrades[0].quota,
      grade: s.examGrades[0].grade,
      maxGrade: s.examGrades[0].maxGrade,
    }));

  const selectedStudent =
    params.studentId && halaqa
      ? await db.student.findFirst({
          where: { id: params.studentId, halaqaId: halaqa.id },
          include: {
            memorizationRecords: { orderBy: { date: "desc" }, take: 100 },
            examGrades: { orderBy: { examDate: "desc" } },
            halaqa: { select: { name: true, teacher: { select: { name: true } } } },
          },
        })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الأرشيف والشهادات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            سجل الحفظ ودرجات الاختبارات لكل طالبة، جاهز للطباعة عند الحاجة لشهادة
          </p>
        </div>
        {selectedStudent && <PrintButton />}
      </div>

      {user.role !== "TEACHER" && (
        <div className="print:hidden">
          <HalaqaSelect halaqat={halaqatForSelect} selectedId={halaqaId} basePath="/certificates" />
        </div>
      )}

      {!halaqa && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 print:hidden">
          {user.role === "TEACHER"
            ? "لا توجد حلقة مرتبطة بحسابك بعد"
            : "اختاري حلقة من القائمة أعلاه لعرض طالباتها"}
        </div>
      )}

      {halaqa && !selectedStudent && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm print:hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              طالبات {halaqa.name} ({halaqa.students.length})
            </h2>
            <ExportHalaqaCertificatesButton halaqaName={halaqa.name} students={studentsWithCertificates} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                  <th className="px-5 py-3 font-medium">الاسم</th>
                  <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                  <th className="px-5 py-3 font-medium">النصاب الحالي</th>
                  <th className="px-5 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {halaqa.students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                      لا توجد طالبات مضافات بعد
                    </td>
                  </tr>
                )}
                {halaqa.students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.memorizedPagesTotal}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.currentQuota ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/certificates?halaqaId=${halaqa.id}&studentId=${s.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        عرض الأرشيف
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="space-y-6">
          <Link
            href={`/certificates?halaqaId=${halaqa!.id}`}
            className="text-sm text-brand hover:underline print:hidden"
          >
            ← الرجوع لقائمة الطالبات
          </Link>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="text-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                سجل حفظ وتحصيل الطالبة
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                مقرأة تحفيظ القرآن الكريم
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
              <p>
                <span className="text-slate-400 dark:text-slate-500">الاسم: </span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{selectedStudent.name}</span>
              </p>
              <p>
                <span className="text-slate-400 dark:text-slate-500">الجنسية: </span>
                {selectedStudent.nationality}
              </p>
              <p>
                <span className="text-slate-400 dark:text-slate-500">الحلقة: </span>
                {selectedStudent.halaqa.name}
              </p>
              <p>
                <span className="text-slate-400 dark:text-slate-500">المعلمة: </span>
                {selectedStudent.halaqa.teacher?.name ?? "—"}
              </p>
              <p>
                <span className="text-slate-400 dark:text-slate-500">إجمالي الأوجه المحفوظة: </span>
                <span className="font-semibold text-brand">
                  {selectedStudent.memorizedPagesTotal}
                </span>
              </p>
              <p>
                <span className="text-slate-400 dark:text-slate-500">النصاب الحالي: </span>
                {selectedStudent.currentQuota ?? "—"}
              </p>
            </div>
          </div>

          {selectedStudent.examGrades.length > 0 && (
            <CertificateSection
              data={{
                studentName: selectedStudent.name,
                quota: selectedStudent.examGrades[0].quota,
                grade: selectedStudent.examGrades[0].grade,
                maxGrade: selectedStudent.examGrades[0].maxGrade,
              }}
            />
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">درجات الاختبارات</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-4 py-2 font-medium">النصاب</th>
                    <th className="px-4 py-2 font-medium">الدرجة</th>
                    <th className="px-4 py-2 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedStudent.examGrades.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-400 dark:text-slate-500">
                        لا توجد درجات اختبارات مسجّلة بعد
                      </td>
                    </tr>
                  )}
                  {selectedStudent.examGrades.map((g) => (
                    <tr key={g.id}>
                      <td className="px-4 py-2">{g.quota}</td>
                      <td className="px-4 py-2">
                        {g.grade} / {g.maxGrade}
                      </td>
                      <td className="px-4 py-2" dir="ltr">
                        {toDateInputValue(g.examDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">سجل التسميع اليومي</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-4 py-2 font-medium">التاريخ</th>
                    <th className="px-4 py-2 font-medium">الأوجه المحفوظة</th>
                    <th className="px-4 py-2 font-medium">النصاب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedStudent.memorizationRecords.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-400 dark:text-slate-500">
                        لا توجد سجلات تسميع بعد
                      </td>
                    </tr>
                  )}
                  {selectedStudent.memorizationRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2" dir="ltr">
                        {toDateInputValue(r.date)}
                      </td>
                      <td className="px-4 py-2">{r.pagesMemorized}</td>
                      <td className="px-4 py-2">{r.quota ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
