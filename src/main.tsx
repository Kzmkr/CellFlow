import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import App from "./App"
import "./index.css"

// Handle PWA install prompt
let installPrompt: Event | null = null
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault()
  installPrompt = e
})

// Make install prompt available globally
;(window as any).installPrompt = () => {
  if (installPrompt) {
    ;(installPrompt as any).prompt()
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
