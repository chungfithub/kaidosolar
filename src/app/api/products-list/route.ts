import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    select: { id: true, name: true, price: true, stock: true, category: true, brand: true },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(products);
}
