import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  role: null,
  name: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.name = action.payload.name;
      state.role = action.payload.role;
    },
    logout(state) {
      state.name = '';
      state.role = null;
    }
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
