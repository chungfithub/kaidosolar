"use server";

import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Các key cài đặt nhạy cảm cần mã hóa
const ENCRYPTED_KEYS = ["GEMINI_API_KEY"];

export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) return null;

    if (ENCRYPTED_KEYS.includes(key)) {
      return decrypt(setting.value);
    }

    return setting.value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

export async function saveSetting(key: string, value: string) {
  try {
    let finalValue = value;
    if (ENCRYPTED_KEYS.includes(key)) {
      finalValue = encrypt(value);
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: finalValue },
      create: { key, value: finalValue }
    });

    revalidatePath("/admin/settings");
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error saving setting ${key}:`, error);
    return { success: false, error: error.message };
  }
}
