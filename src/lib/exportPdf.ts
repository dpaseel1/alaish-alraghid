/**
 * تحويل صفوف بيانات (نفس بنية أوراق Excel) إلى ملف PDF وتنزيله مباشرة من المتصفح.
 * يُرسم كل شيء يدويًا على عنصر <canvas> (خط عربي عادي يدعمه المتصفح، بدون أي مكتبة
 * وسيطة لتصوير DOM)، ثم تُحوَّل كل صفحة إلى صورة تُضاف لملف PDF عبر jsPDF مباشرة.
 * هذا نفس أسلوب توليد شهادات الطالبات في src/lib/certificateRender.ts (مُجرَّب وموثوق)،
 * بدل الاعتماد على jsPDF.html()/html2canvas التي قد لا تُحمَّل بشكل موثوق داخل الحزمة.
 * يجب استدعاؤها من مكوّن عميل فقط (تعتمد على document/window).
 */

const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN = 60;
const HEADER_ROW_H = 46;
const BODY_ROW_H = 38;
const FONT_STACK = "Tahoma, Arial, 'Segoe UI', sans-serif";

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(result + "…").width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + "…";
}

export async function downloadRowsAsPdf({
  title,
  fileName,
  sheets,
}: {
  title: string;
  fileName: string;
  sheets: { name: string; rows: Record<string, unknown>[] }[];
}) {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [PAGE_W, PAGE_H],
    compress: true,
  });

  let canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  let y = MARGIN;
  let pageCount = 0;

  function startPage() {
    if (pageCount > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
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

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_H - MARGIN) {
      flushPage();
      startPage();
    }
  }

  startPage();

  ctx.fillStyle = "#0f172a";
  ctx.font = `700 32px ${FONT_STACK}`;
  ctx.textAlign = "right";
  ctx.fillText(title, PAGE_W - MARGIN, y + 16);
  y += 56;

  for (const sheet of sheets) {
    ensureSpace(HEADER_ROW_H + BODY_ROW_H);

    ctx.fillStyle = "#0f172a";
    ctx.font = `700 22px ${FONT_STACK}`;
    ctx.textAlign = "right";
    ctx.fillText(sheet.name, PAGE_W - MARGIN, y + 12);
    y += 38;

    const rows = sheet.rows.length ? sheet.rows : [{ "تنبيه": "لا توجد بيانات ضمن هذا النطاق" }];
    const headers = Object.keys(rows[0]);
    const tableW = PAGE_W - MARGIN * 2;
    const colW = tableW / headers.length;
    // ترتيب الأعمدة من اليمين لليسار (نفس اتجاه dir="rtl")
    const colLeft = (i: number) => PAGE_W - MARGIN - colW * (i + 1);

    function drawHeaderRow() {
      ctx.font = `700 18px ${FONT_STACK}`;
      headers.forEach((h, i) => {
        const left = colLeft(i);
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(left, y, colW, HEADER_ROW_H);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, y, colW, HEADER_ROW_H);
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        const label = truncateToWidth(ctx, h, colW - 12);
        ctx.fillText(label, left + colW / 2, y + HEADER_ROW_H / 2 + 1);
      });
      y += HEADER_ROW_H;
    }

    drawHeaderRow();

    ctx.font = `400 16px ${FONT_STACK}`;
    rows.forEach((row) => {
      if (y + BODY_ROW_H > PAGE_H - MARGIN) {
        flushPage();
        startPage();
        drawHeaderRow();
        ctx.font = `400 16px ${FONT_STACK}`;
      }
      headers.forEach((h, i) => {
        const left = colLeft(i);
        const value = row[h];
        const text = value === null || value === undefined || value === "" ? "—" : String(value);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, y, colW, BODY_ROW_H);
        ctx.fillStyle = "#334155";
        ctx.textAlign = "center";
        const label = truncateToWidth(ctx, text, colW - 12);
        ctx.fillText(label, left + colW / 2, y + BODY_ROW_H / 2 + 1);
      });
      y += BODY_ROW_H;
    });
    y += 24;
  }

  flushPage();
  pdf.save(`${fileName}.pdf`);
}
