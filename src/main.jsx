import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { I18nProvider } from "@/i18n/kora-i18n.jsx"
import App from "./App.jsx"
import { AuthProvider } from "@/lib/AuthContext.jsx"
import { ThemeProvider } from "@/lib/ThemeContext.jsx"
import FormDraftPersistence from "@/components/FormDraftPersistence.jsx"
import { queryClient } from "@/lib/queryClient.js"
import "./index.css"

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <FormDraftPersistence />
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
