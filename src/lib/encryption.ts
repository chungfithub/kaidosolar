import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Sử dụng ENCRYPTION_KEY, hoặc rơi lại vào JWT_SECRET, hoặc một chuỗi mặc định tĩnh (chỉ cho dev)
const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default_secret_key_32_chars_long_!!";
  // Đảm bảo secret luôn có đúng 32 bytes (256 bits) cho AES-256
  return crypto.createHash("sha256").update(secret).digest();
};

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Mã hóa thất bại");
  }
}

export function decrypt(text: string): string {
  try {
    const parts = text.split(":");
    if (parts.length !== 2) throw new Error("Định dạng không hợp lệ");
    
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // Nếu giải mã lỗi, có thể trả về nguyên gốc để tránh sập app nếu key bị thay đổi
    return text;
  }
}
