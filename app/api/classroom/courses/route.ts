import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const googleAuth = await getGoogleAuth();
  if (!googleAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const classroom = google.classroom({ version: 'v1', auth: googleAuth.auth });

  try {
    const response = await classroom.courses.list({
      courseStates: ['ACTIVE'],
    });

    return NextResponse.json({ courses: response.data.courses || [] });
  } catch (error) {
    console.error('Classroom courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
