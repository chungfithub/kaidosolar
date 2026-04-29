import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-replace-in-production';
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(encodedKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload;
  } catch (error) {
    return null;
  }
}

// --- Customer Portal Auth (separate cookie, 30-day expiry) ---

export async function signCustomerToken(payload: any) {
  return new SignJWT({ ...payload, type: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encodedKey);
}

export async function verifyCustomerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    if ((payload as any).type !== 'customer') return null;
    return payload as { accountId: number; customerId: number | null; email: string; name: string; type: string };
  } catch {
    return null;
  }
}


