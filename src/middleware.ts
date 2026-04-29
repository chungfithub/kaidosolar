import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, verifyCustomerToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (skip /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // Protect /tai-khoan routes
  if (pathname.startsWith('/tai-khoan')) {
    const token = request.cookies.get('customer_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/dang-nhap?redirect=' + encodeURIComponent(pathname), request.url));
    }
    const payload = await verifyCustomerToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/dang-nhap', request.url));
      response.cookies.delete('customer_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/tai-khoan/:path*'],
};

