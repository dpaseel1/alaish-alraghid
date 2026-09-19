/**
 * تصدير لوحة الإشراف والمتابعة كملف PDF بالعرض (Landscape)، بنفس أسلوب src/lib/exportPdf.ts
 * (رسم يدوي على <canvas> ثم jsPDF بدون html2canvas)، مع دعم تقسيم أعمدة الأيام على عدة صفحات
 * عند تجاوزها لعرض الصفحة، وتكرار الأعمدة المجمَّدة (#, الاسم, الحضور%) في كل صفحة تقسيم.
 * يجب استدعاؤها من مكوّن عميل فقط (تعتمد على document/window). لا تُنفّذ أي استعلام قاعدة بيانات
 * بنفسها - تستقبل بيانات التقرير الجاهزة (نفس شكل SupervisorDashboardData) كمُعامل.
 */
import type { HalaqaReport, StudentRow, SupervisorDashboardData } from "@/lib/supervisorDashboard";
import { dayLabelForIso, cellText } from "@/lib/supervisorDashboardFormat";
import { TRACK_TYPE_LABELS } from "@/lib/trackType";

const PAGE_W = 1754;
const PAGE_H = 1240;
const MARGIN = 50;
const FONT_STACK = "Tahoma, Arial, 'Segoe UI', sans-serif";
const HEADER_ROW_H = 46;
const BODY_ROW_H = 32;
const FROZEN_NUM_W = 38;
const FROZEN_NAME_W = 180;
const FROZEN_RATE_W = 72;
const TOTALS_COL_W = 100;
const MIN_DAY_COL_W = 76;

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(result + "…").width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + "…";
}

type Col = {
  width: number;
  headerLines: string[];
  get: (s: StudentRow, index: number) => string;
};

export async function downloadSupervisorDashboardPdf(data: SupervisorDashboardData) {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [PAGE_W, PAGE_H], compress: true });

  let canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  let y = MARGIN;
  let pageCount = 0;

  function startPage() {
    if (pageCount > 0) pdf.addPage([PAGE_W, PAGE_H], "landscape");
    pageCount += 1;
    canvas = document.createElement("canvas");
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.direction = "rtl";
    ctx.textBaseline = "middle";
    y = MARGIN;
  }

  function flushPage() {
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W, PAGE_H);
  }

  function drawHeaderRow(cols: Col[], lefts: number[]) {
    ctx.font = `700 14px ${FONT_STACK}`;
    cols.forEach((c, i) => {
      const left = lefts[i];
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(left, y, c.width, HEADER_ROW_H);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.strokeRect(left, y, c.width, HEADER_ROW_H);
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      const lineH = HEADER_ROW_H / c.headerLines.length;
      c.headerLines.forEach((line, li) => {
        const label = truncateToWidth(ctx, line, c.width - 8);
        ctx.fillText(label, left + c.width / 2, y + lineH * li + lineH / 2 + 1);
      });
    });
    y += HEADER_ROW_H;
  }

  function drawTable(h: HalaqaReport, chunkDates: string[], showTotals: boolean, dayColW: number) {
    const cols: Col[] = [
      { width: FROZEN_NUM_W, headerLines: ["#"], get: (_s, i) => String(i + 1) },
      { width: FROZEN_NAME_W, headerLines: ["الاسم"], get: (s) => s.name },
      { width: FROZEN_RATE_W, headerLines: ["الحضور%"], get: (s) => `${s.attendance.rate}%` },
    ];
    chunkDates.forEach((dateIso) => {
      cols.push({
        width: dayColW,
        headerLines: [dayLabelForIso(dateIso), dateIso],
        get: (s) => {
          const cell = s.cells.find((c) => c.dateIso === dateIso);
          return cell ? cellText(cell) : "—";
        },
      });
    });
    if (showTotals) {
      cols.push({ width: TOTALS_COL_W, headerLines: ["إجمالي", "الحفظ"], get: (s) => String(s.totals.memorized) });
      cols.push({ width: TOTALS_COL_W, headerLines: ["مراجعة", "يومية"], get: (s) => String(s.totals.dailyReviewed) });
      cols.push({ width: TOTALS_COL_W, headerLines: ["إجمالي", "السرد"], get: (s) => String(s.totals.sard) });
      cols.push({ width: TOTALS_COL_W, headerLines: ["مراجعة", "كلية"], get: (s) => String(s.totals.reviewTotal) });
    }

    let cursor = PAGE_W - MARGIN;
    const lefts = cols.map((c) => {
      cursor -= c.width;
      return cursor;
    });

    drawHeaderRow(cols, lefts);

    if (h.students.length === 0) {
      ctx.font = `400 15px ${FONT_STACK}`;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "right";
      ctx.fillText("لا توجد طالبات مسجّلات في هذه الحلقة", PAGE_W - MARGIN, y + 20);
      y += 40;
      return;
    }

    ctx.font = `400 13px ${FONT_STACK}`;
    h.students.forEach((s, idx) => {
      if (y + BODY_ROW_H > PAGE_H - MARGIN) {
        flushPage();
        startPage();
        ctx.font = `700 18px ${FONT_STACK}`;
        ctx.textAlign = "right";
        ctx.fillText(`${h.name} — تابع`, PAGE_W - MARGIN, y + 12);
        y += 34;
        drawHeaderRow(cols, lefts);
        ctx.font = `400 13px ${FONT_STACK}`;
      }
      cols.forEach((c, i) => {
        const left = lefts[i];
        const text = c.get(s, idx);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, y, c.width, BODY_ROW_H);
        ctx.fillStyle = "#334155";
        ctx.textAlign = "center";
        const label = truncateToWidth(ctx, text, c.width - 8);
        ctx.fillText(label, left + c.width / 2, y + BODY_ROW_H / 2 + 1);
      });
      y += BODY_ROW_H;
    });
    y += 20;
  }

  function renderHalaqaSection(h: HalaqaReport) {
    flushPage();
    startPage();

    ctx.fillStyle = "#0f172a";
    ctx.font = `700 26px ${FONT_STACK}`;
    ctx.textAlign = "right";
    ctx.fillText(h.name, PAGE_W - MARGIN, y + 14);
    y += 36;

    ctx.font = `400 16px ${FONT_STACK}`;
    ctx.fillStyle = "#475569";
    const trackLabel = h.trackType ? `${h.trackName ?? "بلا مسار"} (${TRACK_TYPE_LABELS[h.trackType]})` : h.trackName ?? "بلا مسار";
    ctx.fillText(
      `${trackLabel} — المعلمة: ${h.teacherName ?? "غير محددة"} — أيام الانعقاد: ${h.daysLabel} — يوم السرد: ${h.narrationDayLabel}`,
      PAGE_W - MARGIN,
      y + 10
    );
    y += 28;

    const t = h.teacherAttendance;
    ctx.fillText(
      `التزام المعلمة: ${t.rate}% — حضور ${t.present} | غياب بعذر ${t.excused} | غياب بدون عذر ${t.unexcused} | إجازة ${t.leave}`,
      PAGE_W - MARGIN,
      y + 10
    );
    y += 34;

    const availableW = PAGE_W - MARGIN * 2 - FROZEN_NUM_W - FROZEN_NAME_W - FROZEN_RATE_W;
    const totalsCount = 4;
    const totalsW = totalsCount * TOTALS_COL_W;
    const dayColsAreaW = Math.max(availableW - totalsW, MIN_DAY_COL_W);
    const maxDayCols = Math.max(3, Math.floor(dayColsAreaW / MIN_DAY_COL_W));
    const dayColW = dayColsAreaW / maxDayCols;

    const chunks: string[][] = [];
    for (let i = 0; i < h.meetingDates.length; i += maxDayCols) {
      chunks.push(h.meetingDates.slice(i, i + maxDayCols));
    }
    if (chunks.length === 0) chunks.push([]);

    chunks.forEach((chunkDates, idx) => {
      if (idx > 0) {
        flushPage();
        startPage();
        ctx.fillStyle = "#0f172a";
        ctx.font = `700 22px ${FONT_STACK}`;
        ctx.textAlign = "right";
        ctx.fillText(`${h.name} — تابع الأعمدة`, PAGE_W - MARGIN, y + 12);
        y += 34;
      }
      if (chunkDates.length > 0) {
        ctx.font = `400 14px ${FONT_STACK}`;
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.fillText(
          `الأعمدة المعروضة في هذه الصفحة: من ${chunkDates[0]} إلى ${chunkDates[chunkDates.length - 1]}`,
          PAGE_W - MARGIN,
          y + 8
        );
        y += 26;
      }
      drawTable(h, chunkDates, idx === chunks.length - 1, dayColW);
    });
  }

  startPage();

  ctx.fillStyle = "#0f172a";
  ctx.font = `700 34px ${FONT_STACK}`;
  ctx.textAlign = "right";
  ctx.fillText("لوحة الإشراف والمتابعة الشاملة", PAGE_W - MARGIN, y + 16);
  y += 48;

  ctx.font = `400 18px ${FONT_STACK}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(`من ${data.from} إلى ${data.to}`, PAGE_W - MARGIN, y + 10);
  y += 46;

  const s = data.summary;
  ctx.font = `400 18px ${FONT_STACK}`;
  ctx.fillStyle = "#334155";
  ctx.fillText(
    `عدد الطالبات: ${s.totalStudents}   |   عدد المعلمات: ${s.totalTeachers}   |   إجمالي أوجه الحفظ: ${s.totalMemorized}   |   إجمالي المراجعة الكلية: ${s.totalReview}   |   إجمالي السرد المستقل: ${s.totalSardIndependent}`,
    PAGE_W - MARGIN,
    y + 10
  );
  y += 40;

  if (data.halaqat.length === 0) {
    ctx.font = `400 18px ${FONT_STACK}`;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("لا توجد حلقات مطابقة لخيارات التصفية الحالية", PAGE_W - MARGIN, y + 20);
  }

  for (const h of data.halaqat) {
    renderHalaqaSection(h);
  }

  flushPage();
  pdf.save(`لوحة_الإشراف_${data.from}_${data.to}.pdf`);
}
