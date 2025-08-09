import React from "react";
import { BrowserRouter } from "react-router-dom";

export function FutureBrowserRouter({ children }) {
  return (
    <BrowserRouter>
      <React.Fragment
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {children}
      </React.Fragment>
    </BrowserRouter>
  );
}
