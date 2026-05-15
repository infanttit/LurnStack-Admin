import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  listLiveClassesApi,
  getLiveClassAttendanceApi,
  createLiveClassApi,
  updateLiveClassApi,
  deleteLiveClassApi,
} from '../../api/liveClasses';
import { getApiErrorMessage } from '../../api/axiosClient';

const unwrapApiList = (json) => {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.classes)) return json.classes;
  if (Array.isArray(json?.items)) return json.items;
  return [];
};

const unwrapApiObject = (json) => {
  if (!json) return null;
  if (json?.data && typeof json.data === 'object') return json.data;
  return json;
};

export const fetchLiveClasses = createAsyncThunk('liveClasses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const json = await listLiveClassesApi();
    return unwrapApiList(json);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch live classes. If this is 401, set the correct Bearer token for the endpoint (student vs admin).'));
  }
});

export const createLiveClass = createAsyncThunk('liveClasses/create', async (classData, { rejectWithValue }) => {
  try {
    const json = await createLiveClassApi(classData);
    if (json?.success === false) return rejectWithValue(json?.message || 'Failed to create live class');
    return unwrapApiObject(json);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to create live class'));
  }
});

export const updateLiveClass = createAsyncThunk('liveClasses/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const json = await updateLiveClassApi(id, data);
    if (json?.success === false) return rejectWithValue(json?.message || 'Failed to update live class');
    return unwrapApiObject(json);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to update live class'));
  }
});

export const deleteLiveClass = createAsyncThunk('liveClasses/delete', async (id, { rejectWithValue }) => {
  try {
    const json = await deleteLiveClassApi(id);
    if (!json?.success) return rejectWithValue(json?.message || 'Failed to delete live class');
    return id;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to delete live class'));
  }
});

export const fetchClassAttendance = createAsyncThunk('liveClasses/fetchAttendance', async (classId, { rejectWithValue }) => {
  try {
    const json = await getLiveClassAttendanceApi(classId);
    return unwrapApiList(json);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch attendance'));
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
        const index = state.classes.findIndex(c => String(c.id) === String(action.payload.id));
        if (index !== -1) {
          state.classes[index] = { ...state.classes[index], ...action.payload };
        }
      })
      .addCase(updateLiveClass.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Delete class
      .addCase(deleteLiveClass.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteLiveClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = state.classes.filter(c => String(c.id) !== String(action.payload));
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
