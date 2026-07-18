import "dotenv/config";
import { db } from "../src/lib/db";
import {
  hashPassword,
  hashNationalId,
  encryptNationalId,
  lastFourOf,
} from "../src/lib/crypto";

async function seedAccount({
  nationalId,
  password,
  name,
  role,
  label,
}: {
  nationalId: string;
  password: string;
  name: string;
  role: "DEVELOPER" | "ADMIN";
  label: string;
}) {
  const existing = await db.user.findUnique({
    where: { nationalIdHash: hashNationalId(nationalId) },
  });

  if (existing) {
    console.log(`✅ حساب ${label} موجود مسبقًا، لا حاجة لإعادة الإنشاء.`);
    return;
  }

  const user = await db.user.create({
    data: {
      name,
      nationalIdHash: hashNationalId(nationalId),
      nationalIdEncrypted: encryptNationalId(nationalId),
      nationalIdLastFour: lastFourOf(nationalId),
      passwordHash: await hashPassword(password),
      role,
      status: "ACTIVE",
    },
  });

  console.log(`✅ تم إنشاء حساب ${label} بنجاح:`);
  console.log(`   الاسم: ${user.name}`);
  console.log(`   السجل المدني: ${nationalId}`);
  console.log(`   كلمة المرور: ${password}`);
  console.log("   ⚠️  غيّري كلمة المرور بعد أول تسجيل دخول.");
}

async function main() {
  await seedAccount({
    nationalId: process.env.SEED_ADMIN_NATIONAL_ID ?? "1000000000",
    password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
    name: process.env.SEED_ADMIN_NAME ?? "مديرة المقرأة",
    role: "ADMIN",
    label: "المديرة",
  });

  await seedAccount({
    nationalId: process.env.SEED_DEV_NATIONAL_ID ?? "9999999999",
    password: process.env.SEED_DEV_PASSWORD ?? "ChangeMeDev123!",
    name: process.env.SEED_DEV_NAME ?? "المطورة",
    role: "DEVELOPER",
    label: "المطورة",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
