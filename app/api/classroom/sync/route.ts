import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google-auth';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const googleAuth = await getGoogleAuth();
  if (!googleAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
  }

  const classroom = google.classroom({ version: 'v1', auth: googleAuth.auth });

  try {
    // 1. Get Course Info
    const { data: course } = await classroom.courses.get({ id: courseId });
    
    // 2. Upsert Class
    const { data: dbClass, error: classError } = await supabase
      .from('classes')
      .upsert({
        google_course_id: course.id,
        class_name: course.name || 'Unnamed Course',
        teacher_id: googleAuth.userId,
      }, { onConflict: 'google_course_id' })
      .select()
      .single();

    if (classError || !dbClass) throw classError || new Error('Class sync failed');

    // 3. Get Students
    const { data: studentsResponse } = await classroom.courses.students.list({ courseId });
    const students = studentsResponse.students || [];

    for (const student of students) {
      const profile = student.profile;
      if (!profile?.id) continue;

      // Upsert Student User
      const { data: dbStudent, error: studentError } = await supabase
        .from('users')
        .upsert({
          google_id: profile.id,
          email: profile.emailAddress,
          name: profile.name?.fullName || 'Unknown Student',
          role: 'student',
        }, { onConflict: 'google_id' })
        .select()
        .single();

      if (studentError || !dbStudent) continue;

      // Upsert Enrollment
      await supabase
        .from('enrollments')
        .upsert({
          student_id: dbStudent.id,
          class_id: dbClass.id,
        }, { onConflict: 'student_id, class_id' });
    }

    return NextResponse.json({ success: true, classId: dbClass.id });
  } catch (error) {
    console.error('Sync roster error:', error);
    return NextResponse.json({ error: 'Failed to sync roster' }, { status: 500 });
  }
}
