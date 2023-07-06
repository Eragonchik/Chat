'use client'

import { Provider as ReduxProvider } from "react-redux";
import {store} from "../../store/store";
import { SessionProvider } from "next-auth/react";

interface Props { children : React.ReactNode}

export function Provider({ children, ...rest }: Props) {
  return <SessionProvider><ReduxProvider store={store()}>{children}</ReduxProvider></SessionProvider>;
}
