import { axiosClient } from './axiosClient';

const unwrapPayload = (payload) => {
  if (!payload) return payload;
  if (payload.data !== undefined) return payload.data;
  return payload;
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObjectArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
};

export const normalizeAttendanceStatus = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'joined') return 'present';
  if (['present', 'late', 'absent', 'pending'].includes(normalized)) return normalized;
  return 'pending';
};

export const getAttendanceRowId = (row) => row?.attendanceId || row?.studentAttendanceId || row?.id || '';

export const normalizeAttendanceRecord = (record = {}) => ({
  ...record,
  attendanceId: record.attendanceId || record.studentAttendanceId || record.id || '',
  studentAttendanceId: record.studentAttendanceId || record.attendanceId || record.id || '',
  sessionId: record.sessionId || record.session?.id || '',
  courseId: record.courseId || record.course?.id || '',
  studentId: record.studentId || record.student?.id || record.student?._id || '',
  trainerId: record.trainerId || record.trainer?.id || record.trainer?._id || '',
  studentName: record.studentName || record.student?.fullName || record.student?.name || record.studentName || '',
  trainerName: record.trainerName || record.trainer?.fullName || record.trainer?.name || record.trainerName || '',
  courseName: record.courseName || record.course?.title || record.course?.name || record.courseName || '',
  sessionTitle: record.sessionTitle || record.session?.title || record.session?.classTitle || record.sessionTitle || '',
  date: record.date || record.occurrenceDate || record.startsAt || '',
  occurrenceDate: record.occurrenceDate || record.date || '',
  status: normalizeAttendanceStatus(record.status || record.attendanceStatus),
  firstJoinedAt: record.firstJoinedAt || record.joinedAt || '',
  lastJoinedAt: record.lastJoinedAt || record.leftAt || '',
  joinCount: Number(record.joinCount ?? 0),
  totalDurationSeconds: Number(record.totalDurationSeconds ?? 0),
  durationMinutes: Number(record.durationMinutes ?? Math.round(Number(record.totalDurationSeconds || 0) / 60)),
});

export const normalizeAttendanceSummary = (summary = {}) => ({
  ...summary,
  presentCount: Number(summary.presentCount ?? summary.totalPresent ?? 0),
  lateCount: Number(summary.lateCount ?? summary.totalLate ?? 0),
  absentCount: Number(summary.absentCount ?? summary.totalAbsent ?? 0),
  attendedCount: Number(summary.attendedCount ?? 0),
  totalStudents: Number(summary.totalStudents ?? 0),
  totalRecords: Number(summary.totalRecords ?? 0),
  totalSessions: Number(summary.totalSessions ?? 0),
  totalTrainers: Number(summary.totalTrainers ?? 0),
  attendancePercentage: Number(summary.attendancePercentage ?? 0),
});

export const normalizeCourseAttendanceRow = (course = {}) => ({
  ...course,
  courseId: course.courseId || course.id || '',
  courseTitle: course.courseTitle || course.title || course.courseName || 'Untitled Course',
  trainerId: course.trainerId || course.trainer?.id || '',
  trainerName: course.trainerName || course.trainer?.fullName || course.trainer?.name || '',
  sessionId: course.sessionId || course.session?.id || '',
  date: course.date || course.occurrenceDate || course.startsAt || '',
  presentCount: Number(course.presentCount ?? 0),
  lateCount: Number(course.lateCount ?? 0),
  absentCount: Number(course.absentCount ?? 0),
  attendedCount: Number(course.attendedCount ?? 0),
  totalStudents: Number(course.totalStudents ?? 0),
  totalSessions: Number(course.totalSessions ?? course.sessionCount ?? 0),
  attendancePercentage: Number(course.attendancePercentage ?? 0),
});

export const normalizeSessionOccurrence = (occurrence = {}) => ({
  ...occurrence,
  id: occurrence.id || occurrence.occurrenceId || `${occurrence.sessionId || ''}:${occurrence.occurrenceDate || occurrence.date || ''}`,
  sessionId: occurrence.sessionId || occurrence.id || '',
  courseId: occurrence.courseId || '',
  date: occurrence.date || occurrence.occurrenceDate || occurrence.startsAt || '',
  occurrenceDate: occurrence.occurrenceDate || occurrence.date || occurrence.startsAt || '',
  status: String(occurrence.status || 'scheduled').toLowerCase(),
  presentCount: Number(occurrence.presentCount ?? 0),
  lateCount: Number(occurrence.lateCount ?? 0),
  absentCount: Number(occurrence.absentCount ?? 0),
  attendedCount: Number(occurrence.attendedCount ?? 0),
  totalStudents: Number(occurrence.totalStudents ?? 0),
  attendancePercentage: Number(occurrence.attendancePercentage ?? 0),
});

export const normalizeTrainerAttendance = (trainer = {}) => {
  if (!trainer || typeof trainer !== 'object') return null;
  return {
    ...trainer,
    trainerId: trainer.trainerId || trainer.id || '',
    trainerName: trainer.trainerName || trainer.fullName || trainer.name || 'Trainer',
    status: normalizeAttendanceStatus(trainer.status),
    durationMinutes: Number(trainer.durationMinutes ?? Math.round(Number(trainer.totalDurationSeconds || 0) / 60)),
    totalDurationSeconds: Number(trainer.totalDurationSeconds ?? 0),
    sessionId: trainer.sessionId || trainer.latestSessionId || '',
    sessionTitle: trainer.sessionTitle || trainer.latestSessionTitle || '',
    date: trainer.date || (trainer.startsAt ? trainer.startsAt.slice(0, 10) : ''),
  };
};

export const normalizeAttendanceOverview = (payload) => {
  const data = unwrapPayload(payload) || {};
  return {
    ...data,
    summary: normalizeAttendanceSummary(data.summary || data),
    courses: groupCourseAttendanceRows(asArray(data.courses).map(normalizeCourseAttendanceRow)),
    sessions: asArray(data.sessions).map(normalizeSessionOccurrence),
    students: asArray(data.students).map(normalizeAttendanceRecord),
    records: asArray(data.records || data.attendance || data.items).map(normalizeAttendanceRecord),
    trainerAttendance: asObjectArray(data.trainerAttendance).map(normalizeTrainerAttendance).filter(Boolean),
  };
};

const getCourseGroupKey = (course) => {
  if (course.courseId) return `id:${course.courseId}`;
  return `title:${String(course.courseTitle || '').trim().toLowerCase()}`;
};

export const groupCourseAttendanceRows = (rows = []) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const normalized = normalizeCourseAttendanceRow(row);
    const key = getCourseGroupKey(normalized);
    const existing = grouped.get(key);
    const occurrenceKey = [
      normalized.sessionId || normalized.id || '',
      normalized.date || normalized.occurrenceDate || '',
    ].join(':');

    if (!existing) {
      grouped.set(key, {
        ...normalized,
        occurrenceKeys: occurrenceKey ? new Set([occurrenceKey]) : new Set(),
        totalSessions: normalized.totalSessions || (occurrenceKey ? 1 : 0),
      });
      return;
    }

    if (occurrenceKey) existing.occurrenceKeys.add(occurrenceKey);
    existing.presentCount += normalized.presentCount;
    existing.lateCount += normalized.lateCount;
    existing.absentCount += normalized.absentCount;
    existing.attendedCount += normalized.attendedCount;
    existing.totalStudents = Math.max(existing.totalStudents, normalized.totalStudents);
    existing.totalSessions = Math.max(existing.totalSessions, normalized.totalSessions || existing.occurrenceKeys.size);
    if (!existing.trainerName && normalized.trainerName) existing.trainerName = normalized.trainerName;
    if (!existing.trainerId && normalized.trainerId) existing.trainerId = normalized.trainerId;
  });

  return Array.from(grouped.values()).map(({ occurrenceKeys, ...course }) => {
    const attendedCount = course.attendedCount || course.presentCount + course.lateCount;
    const totalMarked = course.presentCount + course.lateCount + course.absentCount;
    return {
      ...course,
      attendedCount,
      totalSessions: course.totalSessions || occurrenceKeys.size,
      attendancePercentage: totalMarked > 0 ? Math.round((attendedCount / totalMarked) * 100) : course.attendancePercentage,
    };
  });
};

export const normalizeAttendanceRecords = (payload) => {
  const data = unwrapPayload(payload);
  const records = Array.isArray(data) ? data : data?.records || data?.attendance || data?.items || data?.students || [];
  return asArray(records).map(normalizeAttendanceRecord);
};

export const normalizeCourseAttendanceSummary = (payload) => {
  const data = unwrapPayload(payload);
  const occurrences = Array.isArray(data) ? data : data?.occurrences || data?.sessions || [];
  const summary = Array.isArray(data) ? {} : data?.summary || data || {};
  return {
    ...(Array.isArray(data) ? {} : data),
    courseId: data?.courseId || '',
    courseTitle: data?.courseTitle || data?.courseName || 'Course Attendance',
    summary: normalizeAttendanceSummary(summary),
    occurrences: asArray(occurrences).map(normalizeSessionOccurrence),
  };
};

export const normalizeSessionOccurrences = (payload) => {
  const data = unwrapPayload(payload);
  const occurrences = Array.isArray(data) ? data : data?.occurrences || data?.sessions || data?.items || [];
  return asArray(occurrences).map(normalizeSessionOccurrence);
};

export const normalizeSessionAttendance = (payload) => {
  const data = unwrapPayload(payload);
  const students = Array.isArray(data) ? data : data?.students || data?.records || data?.attendance || [];
  return {
    ...(Array.isArray(data) ? {} : data),
    summary: normalizeAttendanceSummary(Array.isArray(data) ? {} : data?.summary || data || {}),
    students: asArray(students).map(normalizeAttendanceRecord),
    trainerAttendance: normalizeTrainerAttendance(Array.isArray(data) ? null : data?.trainerAttendance),
  };
};

export const normalizePersonAttendance = (payload) => {
  const data = unwrapPayload(payload);
  const records = Array.isArray(data) ? data : data?.records || data?.occurrences || data?.sessions || data?.attendance || [];
  return {
    ...(Array.isArray(data) ? {} : data),
    summary: normalizeAttendanceSummary(Array.isArray(data) ? {} : data?.summary || data || {}),
    records: asArray(records).map((record) => ({
      ...normalizeAttendanceRecord(record),
      presentCount: Number(record.presentCount ?? 0),
      lateCount: Number(record.lateCount ?? 0),
      absentCount: Number(record.absentCount ?? 0),
      attendedCount: Number(record.attendedCount ?? 0),
      attendancePercentage: Number(record.attendancePercentage ?? 0),
    })),
  };
};

export const normalizeResponse = (response) => {
  if (!response) return response;
  const rawData = unwrapPayload(response.data) || {};
  
  const isArrayData = Array.isArray(rawData);
  const dataObj = isArrayData ? {} : rawData;

  const summary = normalizeAttendanceSummary(dataObj.summary || dataObj);
  const records = asArray(dataObj.records || (isArrayData ? rawData : null) || dataObj.items || dataObj.attendance || dataObj.students).map(normalizeAttendanceRecord);
  const courses = groupCourseAttendanceRows(asArray(dataObj.courses || dataObj.items).map(normalizeCourseAttendanceRow));
  const occurrences = asArray(dataObj.occurrences || (isArrayData ? rawData : null) || dataObj.sessions || dataObj.items).map(normalizeSessionOccurrence);
  const students = asArray(dataObj.students || dataObj.records || (isArrayData ? rawData : null)).map(normalizeAttendanceRecord);
  const trainerAttendance = dataObj.trainerAttendance ? asObjectArray(dataObj.trainerAttendance).map(normalizeTrainerAttendance).filter(Boolean) : null;

  const normalizedData = {
    ...dataObj,
    summary,
    records,
    courses,
    occurrences,
    students,
    trainerAttendance
  };

  return {
    ...response,
    data: normalizedData,
    ...normalizedData
  };
};

export const getAllAttendanceRecords = async (date) => {
  const response = await axiosClient.get('/api/admin/attendance', { params: { date } });
  return normalizeResponse(response);
};

export const getAllCourseAttendanceOverview = async (date) => {
  const response = await axiosClient.get('/api/admin/attendance/courses', { params: { date } });
  return normalizeResponse(response);
};

export const getGroupedCourseAttendance = async () => {
  const response = await axiosClient.get('/api/admin/attendance/courses/grouped');
  return response.data;
};

export const getGroupedCourseAttendanceDetail = async (courseKey) => {
  const response = await axiosClient.get(`/api/admin/attendance/courses/${encodeURIComponent(courseKey)}/grouped`);
  return response.data;
};

export const getGroupedCourseDayAttendance = async (courseKey, dateString) => {
  const response = await axiosClient.get(
    `/api/admin/attendance/courses/${encodeURIComponent(courseKey)}/dates/${encodeURIComponent(dateString)}`
  );
  return response.data;
};

export const getGroupedStudentAttendance = async (studentId) => {
  const response = await axiosClient.get(`/api/admin/attendance/students/${encodeURIComponent(studentId)}/grouped`);
  return response.data;
};

export const getGroupedTrainerAttendance = async (trainerId) => {
  const response = await axiosClient.get(`/api/admin/attendance/trainers/${encodeURIComponent(trainerId)}/grouped`);
  return response.data;
};

export const getCourseAttendanceSummary = async (courseId) => {
  const response = await axiosClient.get(`/api/admin/courses/${courseId}/attendance-summary`);
  return normalizeResponse(response);
};

export const getSessionAttendance = async (sessionId) => {
  const response = await axiosClient.get(`/api/admin/sessions/${sessionId}/attendance`);
  return normalizeResponse(response);
};

export const fetchSessionDays = async (sessionId) => {
  const response = await axiosClient.get(`/api/admin/sessions/${sessionId}/occurrences`);
  return normalizeResponse(response);
};

export const fetchDayAttendance = async (sessionId, dateString) => {
  const response = await axiosClient.get(`/api/admin/sessions/${sessionId}/attendance/${dateString}`);
  return normalizeResponse(response);
};

export const overrideStudentAttendance = async (attendanceId, status) => {
  const response = await axiosClient.patch(`/api/admin/attendance/${attendanceId}`, { status });
  return normalizeResponse(response);
};

export const getAttendanceOverview = async (date) => {
  const response = await axiosClient.get('/api/admin/attendance/overview', { params: { date } });
  return normalizeResponse(response);
};

export const getTrainerAttendance = async (trainerId) => {
  const response = await axiosClient.get(`/api/admin/trainers/${trainerId}/attendance`);
  return normalizeResponse(response);
};

export const getStudentAttendance = async (studentId) => {
  const response = await axiosClient.get(`/api/admin/students/${studentId}/attendance`);
  return normalizeResponse(response);
};
