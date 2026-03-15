import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  let intendedRole = 'student';
  if (state) {
    try {
      const parsedState = JSON.parse(state);
      intendedRole = parsedState.role || 'student';
    } catch (e) {}
  }

  if (error) {
    console.error('Google OAuth Error Parameter:', error);
    return NextResponse.json({ error: `Google OAuth Error: ${error}` }, { status: 400 });
  }

  if (!code) {
    console.error('No code provided in Google OAuth callback. Full URL:', request.url);
    return NextResponse.json({ 
      error: 'No code provided',
      debug: {
        url: request.url,
        searchParams: Object.fromEntries(searchParams.entries())
      }
    }, { status: 400 });
  }

  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || `${protocol}://${host}`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.id || !userInfo.email) {
      throw new Error('Failed to get user info');
    }

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
    }

    // Upsert user
    const { data: existingUser } = await supabase
      .from('users')
      .select('role')
      .eq('google_id', userInfo.id)
      .single();

    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        google_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || 'Unknown',
        role: existingUser?.role || intendedRole,
      }, { onConflict: 'google_id' })
      .select()
      .single();

    if (userError || !user) {
      throw userError || new Error('User upsert failed');
    }

    // Store tokens
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date || null,
      }, { onConflict: 'user_id' });

    if (tokenError) {
      throw tokenError;
    }

    // Create session JWT
    const sessionToken = jwt.sign(
      { userId: user.id, googleId: user.google_id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const cookie = serialize('session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    const html = `
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
              window.close();
            } else {
              window.location.href = '${user.role === 'teacher' ? '/teacher' : '/student'}';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': cookie,
      },
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed', 
      message: error.message,
      details: error.response?.data || error.stack
    }, { status: 500 });
  }
}
