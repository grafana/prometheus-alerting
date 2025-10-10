import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

interface DataSourceState {
  selectedUID: string;
}

const initialState: DataSourceState = {
  selectedUID: '',
};

export const dataSourceSlice = createSlice({
  name: 'dataSource',
  initialState,
  reducers: {
    setDataSourceUID: (state, action: PayloadAction<string>) => {
      state.selectedUID = action.payload;
    },
  },
});

export const { setDataSourceUID } = dataSourceSlice.actions;

export const selectDataSourceUID = (state: RootState) => state.dataSource.selectedUID;

export default dataSourceSlice.reducer;
