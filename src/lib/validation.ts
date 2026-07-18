import { z } from "zod";

// السجل المدني/الإقامة: أرقام فقط، بين 9 و12 رقمًا (يغطي معظم الحالات)
export const nationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{9,12}$/, "السجل المدني يجب أن يتكون من أرقام فقط (9 إلى 12 رقمًا)");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف");

export const nameSchema = z
  .string()
  .trim()
  .min(3, "الاسم يجب ألا يقل عن 3 أحرف")
  .max(100, "الاسم طويل جدًا");

export const registerSchema = z
  .object({
    name: nameSchema,
    nationalId: nationalIdSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  nationalId: nationalIdSchema,
  password: z.string().min(1, "الرجاء إدخال كلمة المرور"),
});
