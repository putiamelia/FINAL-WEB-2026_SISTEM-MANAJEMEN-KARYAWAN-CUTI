import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ notifications: [], unreadCount: 0 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ notifications: [], unreadCount: 0 });

    const res = await query(
      `SELECT id, judul, pesan, is_read, tipe, tautan, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [decoded.id]
    );

    const unread = res.rows.filter(r => !r.is_read).length;

    return NextResponse.json({
      notifications: res.rows,
      unreadCount: unread,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [decoded.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
