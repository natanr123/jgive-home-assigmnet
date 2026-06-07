import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom"; // v7: DOM-wired provider lives here
import { router } from "./router";
import "./styles/base.css";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
