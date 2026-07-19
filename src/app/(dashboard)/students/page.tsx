import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday } from "@/lib/timezone";
import { updateStudentAction, deleteStudentAction } from "@/app/actions/students";
import { AddStudentForm } from "@/components/students/AddStudentForm";
import { StudentRow } from "@/components/students/StudentRow";
import { DailyDataForm } from "@/components/students/DailyDataForm";
import { ExamGradesCard } from "@/components/students/ExamGradesCard";
import { HalaqaSelect } from "@/components/students/HalaqaSelect";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ halaqaId?: string }>;
}) {
  const user = await requireUser();
  const { halaqaId } = await searchParams;

  if (user.role === "TEACHER") {
    const halaqa = await db.halaqa.findUnique({
      where: { teacherId: user.id },
      include: {
        students: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: { examGrades: { orderBy: { examDate: "desc" }, take: 1 } },
        },
      },
    });

    if (!halaqa) {
      return (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-700 dark:text-amber-400">
          لا توجد حلقة مرتبطة بحسابك بعد. تواصلي مع المشرفة أو المديرة.
        </div>
      );
    }

    const today = riyadhToday();

    const attendanceLog = await db.attendanceLog.findUnique({
      where: { halaqaId_date: { halaqaId: halaqa.id, date: today } },
      include: { studentAttendance: true },
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">طالبات {halaqa.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            سجّلي حضور وأوجه الحفظ اليومية لطالباتك
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">بيانات اليوم</h2>
          <DailyDataForm
            students={halaqa.students}
            todayEntries={
              attendanceLog?.studentAttendance.map((a) => ({
                studentId: a.studentId,
                present: a.present,
              })) ?? []
            }
            alreadySubmitted={attendanceLog?.dataSubmitted ?? false}
          />
        </div>

        <ExamGradesCard
          students={halaqa.students.map((s) => ({
            id: s.id,
            name: s.name,
            latestGrade: s.examGrades[0]
              ? {
                  quota: s.examGrades[0].quota,
                  grade: s.examGrades[0].grade,
                  maxGrade: s.examGrades[0].maxGrade,
                }
              : null,
          }))}
        />

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إضافة طالبة جديدة</h2>
          <AddStudentForm halaqaId={halaqa.id} />
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              كل الطالبات ({halaqa.students.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                  <th className="px-5 py-3 font-medium">الاسم</th>
                  <th className="px-5 py-3 font-medium">الجنسية</th>
                  <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                  <th className="px-5 py-3 font-medium">النصاب الحالي</th>
                  <th className="px-5 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {halaqa.students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                      لا توجد طالبات مضافات بعد
                    </td>
                  </tr>
                )}
                {halaqa.students.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    canManage
                    canRevealNationalId={false}
                    updateAction={updateStudentAction.bind(null, s.id)}
                    deleteAction={deleteStudentAction.bind(null, s.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN / SUPERVISOR
  const halaqat = await db.halaqa.findMany({
    where: {
      isActive: true,
      ...(user.role === "SUPERVISOR" ? { supervisorId: user.id } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const selectedHalaqa = halaqaId
    ? await db.halaqa.findFirst({
        where: {
          id: halaqaId,
          ...(user.role === "SUPERVISOR" ? { supervisorId: user.id } : {}),
        },
        include: { students: { where: { isActive: true }, orderBy: { name: "asc" } } },
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الطالبات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            اختاري حلقة لعرض وإدارة طالباتها
          </p>
        </div>
        <HalaqaSelect halaqat={halaqat} selectedId={halaqaId} />
      </div>

      {!selectedHalaqa && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-400 dark:text-slate-500">
          اختاري حلقة من القائمة أعلاه لعرض طالباتها
        </div>
      )}

      {selectedHalaqa && (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
              إضافة طالبة إلى {selectedHalaqa.name}
            </h2>
            <AddStudentForm halaqaId={selectedHalaqa.id} />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                طالبات {selectedHalaqa.name} ({selectedHalaqa.students.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-5 py-3 font-medium">الاسم</th>
                    <th className="px-5 py-3 font-medium">الجنسية</th>
                    <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                    <th className="px-5 py-3 font-medium">النصاب الحالي</th>
                    <th className="px-5 py-3 font-medium">رقم الهوية/الإقامة</th>
                    <th className="px-5 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedHalaqa.students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                        لا توجد طالبات مضافات بعد
                      </td>
                    </tr>
                  )}
                  {selectedHalaqa.students.map((s) => (
                    <StudentRow
                      key={s.id}
                      student={s}
                      canManage
                      canRevealNationalId
                      updateAction={updateStudentAction.bind(null, s.id)}
                      deleteAction={deleteStudentAction.bind(null, s.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
