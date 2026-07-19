"use client";

import { useEffect, useRef, useState } from "react";
import { gradePercent, gradeTierLabel } from "@/lib/certificateGrading";

type Box = { x: number; y: number; w: number; h: number };

// أبعاد قالب الشهادة الأصلي (بوحدة EMU من ملف PowerPoint المصدر)
const SLIDE_W = 10693400;
const SLIDE_H = 7556500;

// إحداثيات كل عنصر داخل القالب الأصلي، منقولة كما هي من القالب المعتمد
const BOXES = {
  wave: { x: -3929310, y: 3339014, w: 10692000, h: 2833380 },
  title: { x: 4300728, y: 756000, w: 3962656, h: 1561947 },
  intro: { x: 3060651, y: 2667705, w: 6254920, h: 538372 },
  name: { x: 3580693, y: 3238852, w: 5286837, h: 770522 },
  logoJamiyah: { x: 2433179, y: 172054, w: 1867550, h: 1733036 },
  logoAlaish: { x: 8912550, y: 540170, w: 1134781, h: 996803 },
  stamp: { x: 1505495, y: 5783266, w: 1591156, h: 1567605 },
  quota: { x: 2049752, y: 4202847, w: 3553381, h: 504098 },
  onCompletion: { x: 5603133, y: 4193322, w: 3021418, h: 538372 },
  tier: { x: 4064798, y: 4684069, w: 2634404, h: 504098 },
  percent: { x: 2049752, y: 4684069, w: 2015047, h: 504098 },
  gradeLabel: { x: 3515389, y: 4698554, w: 5779899, h: 538372 },
  dua: { x: 2361179, y: 5291067, w: 7543116, h: 1100347 },
  // تم تصغير عرض هذا المربع مقارنة بالأصل لأنه كان يتجاوز حدود الشريحة
  signature: { x: 5700000, y: 6573003, w: 4600000, h: 414370 },
} satisfies Record<string, Box>;

const BLACK = "#000000";
const GOLD = "#8B752D";
const FONT = "XB Shafigh";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toArabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export type CertificateData = {
  studentName: string;
  quota: string;
  grade: number;
  maxGrade: number;
};

export function CertificateCanvas({ data }: { data: CertificateData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const scale = W / SLIDE_W;
      const pxPerPt = W / (SLIDE_W / 914400) / 72;

      const px = (box: Box) => ({
        x: box.x * scale,
        y: box.y * scale,
        w: box.w * scale,
        h: box.h * scale,
      });

      try {
        await Promise.all([
          document.fonts.load(`400 40px "${FONT}"`),
          document.fonts.load(`700 40px "${FONT}"`),
        ]);
      } catch {
        // نتابع حتى لو فشل التحميل المسبق، المتصفح سيستخدم خطًا بديلًا
      }

      const [wave, title, logoJamiyah, logoAlaish, stamp] = await Promise.all([
        loadImage("/certificate/bg-wave.png"),
        loadImage("/certificate/title-shokr.png"),
        loadImage("/certificate/logo-jamiyah.png"),
        loadImage("/certificate/logo-alaish.png"),
        loadImage("/certificate/stamp.png"),
      ]);

      if (cancelled) return;

      // خلفية بيضاء
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // الموجة الزخرفية على الحافة اليسرى (مستديرة -90 درجة كما بالقالب الأصلي)
      {
        const b = BOXES.wave;
        const cx = (b.x + b.w / 2) * scale;
        const cy = (b.y + b.h / 2) * scale;
        const w = b.w * scale;
        const h = b.h * scale;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((-90 * Math.PI) / 180);
        ctx.drawImage(wave, -w / 2, -h / 2, w, h);
        ctx.restore();
      }

      // الشعارات وعنوان "شكر وتقدير"
      const drawBoxImage = (img: HTMLImageElement, box: Box) => {
        const b = px(box);
        ctx.drawImage(img, b.x, b.y, b.w, b.h);
      };
      drawBoxImage(title, BOXES.title);
      drawBoxImage(logoJamiyah, BOXES.logoJamiyah);
      drawBoxImage(logoAlaish, BOXES.logoAlaish);
      drawBoxImage(stamp, BOXES.stamp);

      // نص بحجم يتقلّص تلقائيًا حتى يلائم عرض المربع (يحاكي خاصية autofit في PowerPoint)
      const drawAutoFitText = (
        text: string,
        box: Box,
        basePt: number,
        color: string,
        align: "center" | "right" = "center"
      ) => {
        const b = px(box);
        let fontPx = basePt * pxPerPt;
        const minPx = 14 * pxPerPt;
        const maxWidth = b.w * 0.98;
        ctx.direction = "rtl";
        ctx.textBaseline = "alphabetic";
        while (fontPx > minPx) {
          ctx.font = `${fontPx}px "${FONT}"`;
          if (ctx.measureText(text).width <= maxWidth) break;
          fontPx -= 1;
        }
        ctx.font = `${fontPx}px "${FONT}"`;
        ctx.fillStyle = color;
        const y = b.y + b.h * 0.78;
        if (align === "center") {
          ctx.textAlign = "center";
          ctx.fillText(text, b.x + b.w / 2, y);
        } else {
          ctx.textAlign = "right";
          ctx.fillText(text, b.x + b.w, y);
        }
      };

      // نص متعدد الأسطر (يُستخدم لجملة الدعاء الطويلة)
      const drawWrappedText = (text: string, box: Box, basePt: number, color: string) => {
        const b = px(box);
        const fontPx = basePt * pxPerPt;
        ctx.direction = "rtl";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = color;
        ctx.font = `${fontPx}px "${FONT}"`;

        const words = text.trim().split(/\s+/);
        const lines: string[] = [];
        let current = "";
        for (const word of words) {
          const attempt = current ? `${current} ${word}` : word;
          if (ctx.measureText(attempt).width > b.w && current) {
            lines.push(current);
            current = word;
          } else {
            current = attempt;
          }
        }
        if (current) lines.push(current);

        const lineHeight = fontPx * 1.45;
        const totalHeight = lineHeight * lines.length;
        let y = b.y + b.h / 2 - totalHeight / 2 + fontPx * 0.85;
        for (const line of lines) {
          ctx.fillText(line, b.x + b.w / 2, y);
          y += lineHeight;
        }
      };

      const percent = gradePercent(data.grade, data.maxGrade);
      const tier = gradeTierLabel(percent);
      const percentText = `${toArabicDigits(percent)}٪`;

      drawAutoFitText("يسر مقرأة العيـش الرَّغِيـد أن تهنئ الطالبة: ", BOXES.intro, 31.79, BLACK);
      drawAutoFitText(data.studentName, BOXES.name, 45.39, GOLD);
      drawAutoFitText("على إتمامها حفظ", BOXES.onCompletion, 31.79, BLACK);
      drawAutoFitText(data.quota, BOXES.quota, 30.28, GOLD);
      drawAutoFitText("وحصولها علىٰ تقدير          بنسبة", BOXES.gradeLabel, 31.79, BLACK);
      drawAutoFitText(tier, BOXES.tier, 30.28, GOLD);
      drawAutoFitText(percentText, BOXES.percent, 30.28, GOLD);
      drawWrappedText(
        "سائلين الله لها التوفيق والسّداد وأن ينفعها ويرفعها بهذا الكتاب العظيم ويرزقها سعادة الدارين",
        BOXES.dua,
        31.79,
        BLACK
      );
      drawAutoFitText("إدارة مقرأة العيـش الرَّغِيـد", BOXES.signature, 24.36, GOLD, "right");

      // إطار أسود خارجي
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(2, W * 0.006);
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);

      if (!cancelled) setReady(true);
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [data]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `شهادة-${data.studentName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const openForPrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>شهادة ${data.studentName}</title></head><body style="margin:0"><img src="${dataUrl}" style="width:100%" /></body></html>`
    );
    win.document.close();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white">
        <canvas ref={canvasRef} width={3508} height={2480} className="w-full h-auto block" />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={download}
          disabled={!ready}
          className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-50"
        >
          تنزيل الشهادة (صورة)
        </button>
        <button
          type="button"
          onClick={openForPrint}
          disabled={!ready}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          فتح للطباعة
        </button>
      </div>
    </div>
  );
}
