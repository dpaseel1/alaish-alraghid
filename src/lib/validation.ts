import { z } from "zod";

// رقم الهوية الوطنية أو الإقامة: أرقام فقط، بين 9 و12 رقمًا (يغطي معظم الحالات)
export const nationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{9,12}$/, "رقم الهوية/الإقامة يجب أن يتكون من أرقام فقط (9 إلى 12 رقمًا)");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف");

// الاسم الرباعي (تسمية فقط، بدون تحقق صارم من عدد الكلمات)
export const nameSchema = z
  .string()
  .trim()
  .min(3, "الاسم يجب ألا يقل عن 3 أحرف")
  .max(100, "الاسم طويل جدًا");

// بيانات الملف الشخصي الإضافية (خاصة بالمعلمة/المشرفة، مطلوبة عند الإضافة/التعديل)
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `الرجاء إدخال ${label}`)
    .max(max, `${label} طويل جدًا`);

export const ageSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(5, "العمر غير صحيح").max(100, "العمر غير صحيح").optional()
);

export const requiredAgeSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number({ message: "الرجاء إدخال العمر" }).int().min(5, "العمر غير صحيح").max(100, "العمر غير صحيح")
);

export const experienceSchema = requiredText(500, "الخبرة");

// نسخة اختيارية على مستوى Zod (تُستخدم في نموذج المطورة لأنه يُنشئ/يعدّل كل الصفات
// بما فيها المديرة/المطورة اللي ما تحتاج هذه الحقول)، لكن يتم فرضها كإلزامية فعليًا
// للمعلمة والمشرفة عبر validateRequiredProfileFieldsForRole أدناه
export const teacherProfileFields = {
  nationality: optionalText(50),
  age: ageSchema,
  educationLevel: optionalText(100),
  residence: optionalText(150),
  memorizedAmount: optionalText(150),
  experience: optionalText(500),
};

type ProfileFieldsInput = {
  nationality?: string;
  age?: number;
  educationLevel?: string;
  residence?: string;
  memorizedAmount?: string;
  experience?: string;
};

/**
 * تتحقق من أن بيانات الملف الشخصي الإضافية (الجنسية، العمر، المؤهل، الإقامة،
 * مقدار الحفظ، الخبرة) مُدخلة إلزاميًا عند إنشاء/تعديل حساب معلمة أو مشرفة.
 * ترجع رسالة الخطأ الأولى أو null إذا كانت البيانات مكتملة (أو الصفة لا تتطلبها).
 */
export function validateRequiredProfileFieldsForRole(
  role: string,
  fields: ProfileFieldsInput
): string | null {
  if (role !== "TEACHER" && role !== "SUPERVISOR") return null;
  if (!fields.nationality) return "الرجاء إدخال الجنسية";
  if (fields.age === undefined || fields.age === null) return "الرجاء إدخال العمر";
  if (!fields.educationLevel) return "الرجاء إدخال المؤهل الدراسي";
  if (!fields.residence) return "الرجاء إدخال مقر الإقامة";
  if (!fields.memorizedAmount) return "الرجاء إدخال مقدار الحفظ";
  if (!fields.experience) return "الرجاء إدخال الخبرة";
  return null;
}

// الحقول الإضافية المطلوبة للمعلمة والمشرفة عند الإضافة/التعديل
export const requiredProfileFields = {
  nationality: requiredText(50, "الجنسية"),
  age: requiredAgeSchema,
  educationLevel: requiredText(100, "المؤهل الدراسي"),
  residence: requiredText(150, "مقر الإقامة"),
  memorizedAmount: requiredText(150, "مقدار الحفظ"),
  experience: experienceSchema,
};

// الحقول الإضافية المطلوبة للطالبة (نفس حقول المعلمة بدون الخبرة، مع رقم الهوية)
export const requiredStudentProfileFields = {
  nationalId: nationalIdSchema,
  age: requiredAgeSchema,
  educationLevel: requiredText(100, "المؤهل الدراسي"),
  residence: requiredText(150, "مقر الإقامة"),
  memorizedAmount: requiredText(150, "مقدار الحفظ"),
};

export const registerSchema = z
  .object({
    name: nameSchema,
    nationalId: nationalIdSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z.string().trim().optional().or(z.literal("")),
    ...requiredProfileFields,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  nationalId: nationalIdSchema,
  password: z.string().min(1, "الرجاء إدخال كلمة المرور"),
});
