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

export async function GET(request: Request) {
  const teacher = await getTeacher(request);
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const teacher = await getTeacher(request);
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { vocabulary_word, definition, question_type, passage, example, part_of_speech, assignToClasses } = body;

  const { data: card, error: cardError } = await supabase
    .from('cards')
    .insert({
      vocabulary_word,
      definition,
      question_type,
      passage,
      example,
      part_of_speech,
      teacher_id: teacher.id
    })
    .select()
    .single();

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

  // Handle assignments if provided
  if (assignToClasses && Array.isArray(assignToClasses)) {
    const assignments = assignToClasses.map(classId => ({
      class_id: classId,
      card_id: card.id
    }));
    await supabase.from('class_cards').insert(assignments);
  }

  return NextResponse.json(card);
}
