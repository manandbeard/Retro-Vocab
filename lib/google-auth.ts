import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function getGoogleAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session) return null;

  try {
    const decoded = jwt.verify(session.value, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    const { data: tokens, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (error || !tokens) return null;

    const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || '';
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Number(tokens.expiry_date),
    });

    // Handle token refresh if needed
    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.access_token) {
        await supabase
          .from('user_tokens')
          .update({
            access_token: newTokens.access_token,
            expiry_date: newTokens.expiry_date,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', decoded.userId);
      }
    });

    return { auth: oauth2Client, userId: decoded.userId };
  } catch (error) {
    console.error('getGoogleAuth error:', error);
    return null;
  }
}
