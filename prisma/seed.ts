import "dotenv/config";
import { db } from "../src/lib/db";
import {
  hashPassword,
  hashNationalId,
  encryptNationalId,
  lastFourOf,
} from "../src/lib/crypto";

async function main() {
  const adminNationalId = process.env.SEED_ADMIN_NATIONAL_ID ?? "1000000000";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "مديرة المقرأة";

  const existing = await db.user.findUnique({
    where: { nationalIdHash: hashNationalId(adminNationalId) },
  });

  if (existing) {
    console.log("✅ حساب المديرة موجود مسبقًا، لا حاجة لإعادة الإنشاء.");
    return;
  }

  const admin = await db.user.create({
    data: {
      name: adminName,
      nationalIdHash: hashNationalId(adminNationalId),
      nationalIdEncrypted: encryptNationalId(adminNationalId),
      nationalIdLastFour: lastFourOf(adminNationalId),
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("✅ تم إنشاء حساب المديرة بنجاح:");
  console.log(`   الاسم: ${admin.name}`);
  console.log(`   السجل المدني: ${adminNationalId}`);
  console.log(`   كلمة المرور: ${adminPassword}`);
  console.log("   ⚠️  غيّري كلمة المرور بعد أول تسجيل دخول.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
