import { createSlice } from '@reduxjs/toolkit';

interface BackendStatusState {
  isUp: boolean;
  lastChecked: number | null;
}

const initialState: BackendStatusState = {
  isUp: true,
  lastChecked: null,
};

const backendStatusSlice = createSlice({
  name: 'backendStatus',
  initialState,
  reducers: {
    setBackendUp: (state) => {
      state.isUp = true;
      state.lastChecked = Date.now();
    },
    setBackendDown: (state) => {
      state.isUp = false;
      state.lastChecked = Date.now();
    },
  },
});

export const { setBackendUp, setBackendDown } = backendStatusSlice.actions;
export default backendStatusSlice.reducer;
