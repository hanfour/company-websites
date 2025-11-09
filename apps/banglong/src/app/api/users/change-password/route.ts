import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStorage } from '@/lib/storage';
import bcrypt from 'bcrypt';

const storage = getStorage();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }

  const { oldPassword, newPassword } = await req.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: '缺少參數' }, { status: 400 });
  }

  const user = await storage.user.findUnique(session.user.id);

  if (!user) {
    return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    return NextResponse.json({ error: '舊密碼錯誤' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await storage.user.update(user.id, {
    password: hashedPassword,
    hasChangedPassword: true,
  });

  return NextResponse.json({ message: '密碼已更新' });
}
