import { NextResponse } from 'next/server';
import { TOKEN_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Berhasil keluar.' });
  response.cookies.delete(TOKEN_NAME);
  return response;
}
