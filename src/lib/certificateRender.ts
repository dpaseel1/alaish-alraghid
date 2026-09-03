import { gradePercent, gradeTierLabel } from "@/lib/certificateGrading";

export type ImageBox = { x: number; y: number; w: number; h: number };
export type TextBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  color: string;
  align: "center" | "right";
};

export type CertificateLayout = {
  images: {
    logoJamiyah: ImageBox;
    logoAlaish: ImageBox;
    stamp: ImageBox;
    title: ImageBox;
  };
  texts: {
    intro: TextBox;
    name: TextBox;
    quota: TextBox;
    onCompletion: TextBox;
    tier: TextBox;
    percent: TextBox;
    gradeLabel: TextBox;
    dua: TextBox;
    signature: TextBox;
  };
};

export type CertificateTemplateInput = {
  backgroundUrl: string | null;
  layout: CertificateLayout;
} | null;

const BLACK = "#000000";
const GOLD = "#8B752D";
const FONT = "XB Shafigh";

// القيم الافتراضية = تحويل مباشر لإحداثيات القالب الأصلي (EMU من PowerPoint) إلى بكسل
// على كانفاس ثابت 3508×2480 (CERTIFICATE_CANVAS_WIDTH × CERTIFICATE_CANVAS_HEIGHT)،
// بحيث تبقى الشهادة الافتراضية مطابقة تمامًا لما كانت عليه قبل دعم القوالب المخصصة.
export const DEFAULT_CERTIFICATE_LAYOUT: CertificateLayout = {
  images: {
    logoJamiyah: { x: 798.21, y: 56.44, w: 612.66, h: 568.53 },
    logoAlaish: { x: 2923.79, y: 177.2, w: 372.27, h: 327 },
    stamp: { x: 493.88, y: 1897.22, w: 521.98, h: 514.26 },
    title: { x: 1410.87, y: 248.01, w: 1299.96, h: 512.4 },
  },
  texts: {
    intro: { x: 1004.06, y: 875.15, w: 2051.94, h: 176.61, fontSize: 132.45, color: BLACK, align: "center" },
    name: { x: 1174.66, y: 1062.51, w: 1734.36, h: 252.77, fontSize: 189.11, color: GOLD, align: "center" },
    quota: { x: 672.43, y: 1378.76, w: 1165.7, h: 165.37, fontSize: 126.15, color: GOLD, align: "center" },
    onCompletion: { x: 1838.12, y: 1375.63, w: 991.18, h: 176.61, fontSize: 132.45, color: BLACK, align: "center" },
    tier: { x: 1333.47, y: 1536.62, w: 864.22, h: 165.37, fontSize: 126.15, color: GOLD, align: "center" },
    percent: { x: 672.43, y: 1536.62, w: 661.04, h: 165.37, fontSize: 126.15, color: GOLD, align: "center" },
    gradeLabel: { x: 1153.23, y: 1541.37, w: 1896.11, h: 176.61, fontSize: 132.45, color: BLACK, align: "center" },
    dua: { x: 774.59, y: 1735.75, w: 2474.54, h: 360.97, fontSize: 132.45, color: BLACK, align: "center" },
    signature: { x: 1869.9, y: 2156.29, w: 1509.04, h: 135.94, fontSize: 101.49, color: GOLD, align: "right" },
  },
};

// موضع الموجة الزخرفية على الحافة اليسرى — جزء من الخلفية الافتراضية فقط
// (القوالب المخصصة تستخدم صورة خلفية كاملة بدلًا منها، لذا ليست جزءًا من CertificateLayout القابل للتخصيص)
const WAVE_BOX = { x: -1289.02, y: 1095.37, w: 3507.54, h: 929.5 };

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toArabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}

export type CertificateData = {
  studentName: string;
  quota: string;
  grade: number;
  maxGrade: number;
};

/** يرسم شهادة تقدير كاملة على أي عنصر canvas (مرئي أو خارج الشاشة)، قابل لإعادة الاستخدام لأي عدد من الطالبات */
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  data: CertificateData,
  template?: CertificateTemplateInput
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const layout = template?.layout ?? DEFAULT_CERTIFICATE_LAYOUT;
  const hasCustomBackground = !!template?.backgroundUrl;

  try {
    await Promise.all([
      document.fonts.load(`400 40px "${FONT}"`),
      document.fonts.load(`700 40px "${FONT}"`),
    ]);
  } catch {
    // نتابع حتى لو فشل التحميل المسبق، المتصفح سيستخدم خطًا بديلًا
  }

  const [background, wave, title, logoJamiyah, logoAlaish, stamp] = await Promise.all([
    hasCustomBackground ? loadImage(template!.backgroundUrl!) : Promise.resolve(null),
    hasCustomBackground ? Promise.resolve(null) : loadImage("/certificate/bg-wave.png"),
    loadImage("/certificate/title-shokr.png"),
    loadImage("/certificate/logo-jamiyah.png"),
    loadImage("/certificate/logo-alaish.png"),
    loadImage("/certificate/stamp.png"),
  ]);

  if (background) {
    ctx.drawImage(background, 0, 0, W, H);
  } else {
    // خلفية بيضاء + الموجة الزخرفية على الحافة اليسرى (مستديرة -90 درجة كما بالقالب الأصلي)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    if (wave) {
      const cx = WAVE_BOX.x + WAVE_BOX.w / 2;
      const cy = WAVE_BOX.y + WAVE_BOX.h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((-90 * Math.PI) / 180);
      ctx.drawImage(wave, -WAVE_BOX.w / 2, -WAVE_BOX.h / 2, WAVE_BOX.w, WAVE_BOX.h);
      ctx.restore();
    }
  }

  // الشعارات وعنوان "شكر وتقدير" — تُرسم إلا إن كان عرض/ارتفاع المربع صفرًا (إخفاء متعمَّد من القالب المخصص)
  const drawBoxImage = (img: HTMLImageElement, box: ImageBox) => {
    if (box.w <= 0 || box.h <= 0) return;
    ctx.drawImage(img, box.x, box.y, box.w, box.h);
  };
  drawBoxImage(title, layout.images.title);
  drawBoxImage(logoJamiyah, layout.images.logoJamiyah);
  drawBoxImage(logoAlaish, layout.images.logoAlaish);
  drawBoxImage(stamp, layout.images.stamp);

  // نص بحجم يتقلّص تلقائيًا حتى يلائم عرض المربع (يحاكي خاصية autofit في PowerPoint)
  const drawAutoFitText = (text: string, box: TextBox) => {
    let fontPx = box.fontSize;
    const minPx = Math.max(16, box.fontSize * 0.35);
    const maxWidth = box.w * 0.98;
    ctx.direction = "rtl";
    ctx.textBaseline = "alphabetic";
    while (fontPx > minPx) {
      ctx.font = `${fontPx}px "${FONT}"`;
      if (ctx.measureText(text).width <= maxWidth) break;
      fontPx -= 1;
    }
    ctx.font = `${fontPx}px "${FONT}"`;
    ctx.fillStyle = box.color;
    const y = box.y + box.h * 0.78;
    if (box.align === "center") {
      ctx.textAlign = "center";
      ctx.fillText(text, box.x + box.w / 2, y);
    } else {
      ctx.textAlign = "right";
      ctx.fillText(text, box.x + box.w, y);
    }
  };

  // نص متعدد الأسطر (يُستخدم لجملة الدعاء الطويلة)
  const drawWrappedText = (text: string, box: TextBox) => {
    const fontPx = box.fontSize;
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = box.color;
    ctx.font = `${fontPx}px "${FONT}"`;

    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const attempt = current ? `${current} ${word}` : word;
      if (ctx.measureText(attempt).width > box.w && current) {
        lines.push(current);
        current = word;
      } else {
        current = attempt;
      }
    }
    if (current) lines.push(current);

    const lineHeight = fontPx * 1.45;
    const totalHeight = lineHeight * lines.length;
    let y = box.y + box.h / 2 - totalHeight / 2 + fontPx * 0.85;
    for (const line of lines) {
      ctx.fillText(line, box.x + box.w / 2, y);
      y += lineHeight;
    }
  };

  const percent = gradePercent(data.grade, data.maxGrade);
  const tier = gradeTierLabel(percent);
  const percentText = `${toArabicDigits(percent)}٪`;

  drawAutoFitText("يسر مقرأة العيـش الرَّغِيـد أن تهنئ الطالبة: ", layout.texts.intro);
  drawAutoFitText(data.studentName, layout.texts.name);
  drawAutoFitText("على إتمامها حفظ", layout.texts.onCompletion);
  drawAutoFitText(data.quota, layout.texts.quota);
  drawAutoFitText("وحصولها علىٰ تقدير          بنسبة", layout.texts.gradeLabel);
  drawAutoFitText(tier, layout.texts.tier);
  drawAutoFitText(percentText, layout.texts.percent);
  drawWrappedText(
    "سائلين الله لها التوفيق والسّداد وأن ينفعها ويرفعها بهذا الكتاب العظيم ويرزقها سعادة الدارين",
    layout.texts.dua
  );
  drawAutoFitText("إدارة مقرأة العيـش الرَّغِيـد", layout.texts.signature);

  // إطار أسود خارجي
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(2, W * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
}

export const CERTIFICATE_CANVAS_WIDTH = 3508;
export const CERTIFICATE_CANVAS_HEIGHT = 2480;
