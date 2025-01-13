import { createSlice, PayloadAction } from '@reduxjs/toolkit';
//https://medium.com/@moulaymohamed856/add-dark-mode-to-your-react-redux-toolkit-tailwindcss-project-like-a-pro-f9e7704151a6
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { toggleTheme, toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;