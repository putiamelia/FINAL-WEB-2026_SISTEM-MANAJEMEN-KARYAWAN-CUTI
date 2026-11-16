import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    const targetUserId = formData.get('user_id') ? parseInt(formData.get('user_id'), 10) : decoded.id;

    // Hanya admin yang boleh upload untuk user lain
    if (targetUserId !== decoded.id && decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Hanya Admin yang dapat mengubah foto pengguna lain' }, { status: 403 });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Berkas foto tidak ditemukan' }, { status: 400 });
    }

    // Validasi tipe berkas
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Format berkas harus JPG, PNG, atau WebP' }, { status: 400 });
    }

    // Maksimal 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran foto maksimal 5 MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const filename = `avatar-${targetUserId}-${Date.now()}.${cleanExt}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    // Update database jika koneksi aktif
    try {
      await query(`UPDATE users SET foto_profil = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        publicUrl,
        targetUserId,
      ]);
    } catch (dbErr) {
      console.warn('Database update skipped or failed:', dbErr.message);
    }

    return NextResponse.json({
      message: 'Foto profil berhasil diunggah.',
      url: publicUrl,
    });
  } catch (err) {
    console.error('Upload avatar error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
