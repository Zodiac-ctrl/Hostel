"use client"

import React from "react"
import ReactDOM from "react-dom/client"
import { ConfigProvider } from "antd"
import { ThemeProvider, useTheme } from "./context/ThemeContext"
import { AuthProvider } from "./context/AuthContext"
import App from "./App"
import "antd/dist/reset.css"
import "./index.css"

const ThemedApp = () => {
  const { themeConfig } = useTheme()

  return (
    <ConfigProvider theme={themeConfig}>
      <App />
    </ConfigProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
