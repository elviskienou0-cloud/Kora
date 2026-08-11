import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster as SonnerToaster } from "sonner"
import { ThemeProvider } from "next-themes"
import App from "./App.jsx"
import { AuthProvider } from "./lib/AuthContext.jsx"
import { queryClient } from "./lib/query-client.js"
import "./index.css"
import "./App.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <SonnerToaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
