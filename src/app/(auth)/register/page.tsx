import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "إنشاء حساب معلمة" };

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
        إنشاء حساب معلمة جديد
      </h2>
      <RegisterForm />
    </div>
  );
}
