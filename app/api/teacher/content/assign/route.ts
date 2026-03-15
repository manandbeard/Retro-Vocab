import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

async function getTeacher(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const sessionToken = cookieHeader?.split('; ').find(row => row.startsWith('session='))?.split('=')[1];
  if (!sessionToken) return null;
  try {
    const decoded: any = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret');
    const { data: user } = await supabase.from('users').select('*').eq('id', decoded.userId).single();
    return user?.role === 'teacher' ? user : null;
  } catch (e) { return null; }
}

export async function POST(request: Request) {
  const teacher = await getTeacher(request);
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId, classIds } = await request.json();
  if (!cardId || !classIds || !Array.isArray(classIds)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // 1. Delete existing assignments for these classes to avoid duplicates/conflicts if needed
  // Or just use upsert logic. Since it's a join table with UNIQUE constraint, we can just insert.
  
  const assignments = classIds.map(classId => ({
    class_id: classId,
    card_id: cardId
  }));

  const { error } = await supabase
    .from('class_cards')
    .upsert(assignments, { onConflict: 'class_id, card_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
