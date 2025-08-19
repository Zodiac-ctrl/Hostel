"use client"

import { createContext, useState, useContext, useMemo, useEffect } from "react"
import { theme } from "antd"

const { darkAlgorithm, defaultAlgorithm } = theme

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Update CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.setAttribute("data-theme", "dark")
    } else {
      root.removeAttribute("data-theme")
    }
  }, [isDarkMode])

  const themeConfig = useMemo(
    () => ({
      algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      token: {
        colorPrimary: "#1890ff",
        borderRadius: 4,
        colorBgLayout: isDarkMode ? "#0a0a0a" : "#f5f5f5",
        colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
        colorText: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        colorBorder: isDarkMode ? "#555555" : "#d9d9d9",
        colorBgElevated: isDarkMode ? "#1a1a1a" : "#ffffff",
      },
      components: {
        Layout: {
          headerBg: isDarkMode ? "#141414" : "#ffffff",
          siderBg: isDarkMode ? "#141414" : "#ffffff",
          triggerBg: isDarkMode ? "#1a1a1a" : "#f0f0f0",
          triggerColor: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        },
        Menu: {
          itemBg: "transparent",
          itemHoverBg: isDarkMode ? "#1f1f1f" : "#f5f5f5",
          itemSelectedBg: isDarkMode ? "#1a1a1a" : "#e6f7ff",
          itemSelectedColor: "#1890ff",
        },
        Card: {
          colorBgContainer: isDarkMode ? "#1a1a1a" : "#ffffff",
          colorBorder: isDarkMode ? "#444444" : "#f0f0f0",
          colorText: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        },
        Select: {
          colorBgContainer: isDarkMode ? "#1a1a1a" : "#ffffff",
          colorBorder: isDarkMode ? "#444444" : "#d9d9d9",
          colorText: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        },
        Typography: {
          colorText: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
          colorTextHeading: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        },
        Form: {
          labelColor: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        },
        Input: {
          colorBgContainer: isDarkMode ? "#1a1a1a" : "#ffffff",
          colorBorder: isDarkMode ? "#444444" : "#d9d9d9",
          colorText: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
        },
      },
    }),
    [isDarkMode],
  )

  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme, themeConfig }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
