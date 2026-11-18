import { NextResponse } from 'next/server';

const TOKEN_NAME = 'bns_auth_token';
const JWT_SECRET = process.env.JWT_SECRET || 'bns_bank_nusantara_jwt_secret_key_2026';

/**
 * Verifikasi tanda tangan digital JWT secara native di server (Edge Runtime).
 * Menggunakan Web Crypto API bawaan standar W3C tanpa dependensi modul Node.js.
 * CATATAN PENTING: DILARANG memanggil koneksi database PostgreSQL / pg di dalam middleware.
 */
async function verifyTokenEdge(token, secret) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const base64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const signature = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signature[i] = binary.charCodeAt(i);
    }

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!isValid) return null;

    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Cek apakah token sudah kedaluwarsa
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Next.js Middleware:
 * Berjalan di sisi server sebelum halaman dirender.
 * Membaca session token dari HTTP Cookie (bukan localStorage).
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Baca cookie autentikasi di server
  const token = request.cookies.get(TOKEN_NAME)?.value;
  const user = await verifyTokenEdge(token, JWT_SECRET);

  const isAuthPage = pathname === '/' || pathname === '/register';
  const isProtectedPage =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/hrd') ||
    pathname.startsWith('/ketua') ||
    pathname.startsWith('/karyawan');

  // 1. Proteksi Halaman Private: jika belum login, tolak dan redirect ke login
  if (isProtectedPage && !user) {
    const loginUrl = new URL('/', request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(TOKEN_NAME);
    }
    return response;
  }

  // 2. Jika user sudah login dan mengakses halaman masuk/daftar, arahkan ke dashboard
  if (isAuthPage && user) {
    let target = '/karyawan/dashboard';
    if (user.role === 'Admin') target = '/admin/dashboard';
    else if (user.role === 'HRD') target = '/hrd/dashboard';
    else if (user.role === 'Ketua Divisi') target = '/ketua/dashboard';

    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Role-Based Access Control (RBAC): batasi akses antar divisi/peran
  if (user) {
    // Menu /admin khusus Admin
    if (pathname.startsWith('/admin') && user.role !== 'Admin') {
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }

    // Menu /hrd khusus HRD & Admin
    if (pathname.startsWith('/hrd') && user.role !== 'HRD' && user.role !== 'Admin') {
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }

    // Menu /ketua khusus Ketua Divisi & Admin
    if (pathname.startsWith('/ketua') && user.role !== 'Ketua Divisi' && user.role !== 'Admin') {
      return NextResponse.redirect(new URL(getRoleDashboard(user.role), request.url));
    }
  }

  return NextResponse.next();
}

function getRoleDashboard(role) {
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'HRD') return '/hrd/dashboard';
  if (role === 'Ketua Divisi') return '/ketua/dashboard';
  return '/karyawan/dashboard';
}

export const config = {
  matcher: [
    '/',
    '/register',
    '/admin/:path*',
    '/hrd/:path*',
    '/ketua/:path*',
    '/karyawan/:path*',
  ],
};
