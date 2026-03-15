import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('Google Auth URL API called');
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'student';

  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || `${protocol}://${host}`;

  console.log('Base URL:', baseUrl);
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth environment variables');
    return NextResponse.json({ error: 'Missing Google OAuth environment variables' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`
  );

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.coursework.me',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: JSON.stringify({ role }),
  });

  return NextResponse.redirect(url);
}
