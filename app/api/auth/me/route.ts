import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const sessionToken = cookieHeader?.split('; ').find(row => row.startsWith('session='))?.split('=')[1];

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
