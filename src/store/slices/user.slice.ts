import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: 'user',
    initialState : {},
    reducers: {}
})

export const userActions = userSlice.actions;
export const userReducer = userSlice.reducer;