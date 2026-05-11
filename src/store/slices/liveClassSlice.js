import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL - adjust based on your backend
const API_URL = '/admin';

// Mock Data for Frontend Only Development
const mockClasses = [
  {
    id: '1',
    courseId: 'c1',
    courseName: 'React Masterclass',
    classTitle: 'React Hooks Deep Dive',
    instructor: 'John Doe',
    description: 'Learn everything about React Hooks.',
    startDate: '2026-05-10',
    startTime: '19:00',
    duration: '2 Hours',
    meetLink: 'https://meet.google.com/xyz',
    materials: [],
    status: 'Scheduled',
  },
  {
    id: '2',
    courseId: 'c2',
    courseName: 'Node.js for Beginners',
    classTitle: 'Express & MongoDB',
    instructor: 'Jane Smith',
    description: 'Setting up your first Express server with MongoDB.',
    startDate: '2026-05-08',
    startTime: '10:00',
    duration: '1.5 Hours',
    meetLink: 'https://meet.google.com/abc',
    materials: [],
    status: 'Completed',
  }
];

const mockAttendance = [
  { studentId: 's1', studentName: 'Alice Johnson', email: 'alice@example.com', joinedAt: '2026-05-08T10:05:00Z', attendanceStatus: 'Present' },
  { studentId: 's2', studentName: 'Bob Williams', email: 'bob@example.com', joinedAt: '2026-05-08T10:15:00Z', attendanceStatus: 'Late' },
];

export const fetchLiveClasses = createAsyncThunk('liveClasses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    // In a real app: const response = await axios.get(`${API_URL}/live-classes`);
    // return response.data;
    
    // Using mock data for frontend only demo
    return mockClasses;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to fetch live classes');
  }
});

export const createLiveClass = createAsyncThunk('liveClasses/create', async (classData, { rejectWithValue }) => {
  try {
    // In a real app: const response = await axios.post(`${API_URL}/create-live-class`, classData);
    // return response.data;
    
    // Mocking response
    return { id: Date.now().toString(), ...classData, status: 'Scheduled' };
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to create live class');
  }
});

export const updateLiveClass = createAsyncThunk('liveClasses/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    // In a real app: const response = await axios.put(`${API_URL}/update-live-class/${id}`, data);
    // return response.data;
    
    return { id, ...data };
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to update live class');
  }
});

export const deleteLiveClass = createAsyncThunk('liveClasses/delete', async (id, { rejectWithValue }) => {
  try {
    // In a real app: await axios.delete(`${API_URL}/delete-live-class/${id}`);
    
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to delete live class');
  }
});

export const fetchClassAttendance = createAsyncThunk('liveClasses/fetchAttendance', async (classId, { rejectWithValue }) => {
  try {
    // In a real app: const response = await axios.get(`${API_URL}/class-attendance/${classId}`);
    // return response.data;
    
    return mockAttendance;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to fetch attendance');
  }
});

const liveClassSlice = createSlice({
  name: 'liveClasses',
  initialState: {
    classes: [],
    attendance: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch classes
      .addCase(fetchLiveClasses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLiveClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchLiveClasses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Create class
      .addCase(createLiveClass.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes.push(action.payload);
      })
      .addCase(createLiveClass.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update class
      .addCase(updateLiveClass.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.classes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.classes[index] = { ...state.classes[index], ...action.payload };
        }
      })
      .addCase(updateLiveClass.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Delete class
      .addCase(deleteLiveClass.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = state.classes.filter(c => c.id !== action.payload);
      })
      .addCase(deleteLiveClass.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Fetch attendance
      .addCase(fetchClassAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClassAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload;
      })
      .addCase(fetchClassAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default liveClassSlice.reducer;
