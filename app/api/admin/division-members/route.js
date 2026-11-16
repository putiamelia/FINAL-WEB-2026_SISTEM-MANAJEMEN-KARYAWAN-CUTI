import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, divisi_id } = body;

    if (!user_id || !divisi_id) {
      return NextResponse.json({ error: 'User ID dan Divisi ID wajib diisi' }, { status: 400 });
    }

    await query(`UPDATE users SET divisi_id = $1 WHERE id = $2`, [divisi_id, user_id]);
    return NextResponse.json({ message: 'Anggota berhasil ditambahkan ke divisi.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses khusus Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const user_id = parseInt(searchParams.get('user_id'), 10);

    if (!user_id) return NextResponse.json({ error: 'User ID tidak valid' }, { status: 400 });

    await query(`UPDATE users SET divisi_id = NULL WHERE id = $1`, [user_id]);
    return NextResponse.json({ message: 'Anggota berhasil dikeluarkan dari divisi (akun tidak dihapus).' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
