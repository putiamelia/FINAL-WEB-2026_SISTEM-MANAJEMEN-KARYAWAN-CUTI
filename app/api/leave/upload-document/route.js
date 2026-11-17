import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Berkas tidak ditemukan.' }, { status: 400 });
    }

    // Validasi tipe berkas yang diizinkan (PDF, gambar, dokumen)
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'];
    const originalName = file.name || 'lampiran.pdf';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Format berkas tidak didukung. Harap unggah berkas PDF, JPG, PNG, atau DOC/DOCX.' },
        { status: 400 }
      );
    }

    // Maksimal 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran berkas terlalu besar. Maksimal 10 MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeBaseName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    const filename = `lampiran-${decoded.id}-${Date.now()}-${safeBaseName}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'dokumen');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/dokumen/${filename}`;

    return NextResponse.json({
      message: 'Berkas lampiran berhasil diunggah.',
      url: publicUrl,
      fileName: originalName,
      fileSize: file.size,
    });
  } catch (err) {
    console.error('Upload document error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
