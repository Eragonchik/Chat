import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { userApi } from "./api/api";
import { userReducer } from "./slices/user.slice";

export const store = () =>
  configureStore({
    reducer: {
      [userApi.reducerPath]: userApi.reducer,
      user: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(userApi.middleware),
  });

export type AppStore = ReturnType<typeof store>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
