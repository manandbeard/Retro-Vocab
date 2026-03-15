import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const googleAuth = await getGoogleAuth();
  if (!googleAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, courseWorkId, score, studentGoogleId } = await request.json();

  if (!courseId || !courseWorkId || score === undefined || !studentGoogleId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const classroom = google.classroom({ version: 'v1', auth: googleAuth.auth });

  try {
    // 1. Find the student's submission for this coursework
    const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
      courseId,
      courseWorkId,
      userId: studentGoogleId,
    });

    const submissions = submissionsResponse.data.studentSubmissions;
    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'No submission found for this student' }, { status: 404 });
    }

    const submissionId = submissions[0].id!;

    // 2. Patch the submission with the grade
    await classroom.courses.courseWork.studentSubmissions.patch({
      courseId,
      courseWorkId,
      id: submissionId,
      updateMask: 'assignedGrade,draftGrade',
      requestBody: {
        assignedGrade: score,
        draftGrade: score,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Grade passback error:', error);
    return NextResponse.json({ error: 'Failed to pass back grade' }, { status: 500 });
  }
}
