import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { DataProvider } from "./context/DataContext"
import ProtectedRoute from "./components/ProtectedRoute"
import HostelDashboard from "./pages/HostelDashboard"
import Allotments from "./pages/Allotments"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Trainees from "./pages/Trainees"
import Rooms from "./pages/Rooms"
import Amenities from "./pages/Amenities"
import Reports from "./pages/Reports"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HostelDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/allotments"
                element={
                  <ProtectedRoute>
                    <Allotments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trainees"
                element={
                  <ProtectedRoute>
                    <Trainees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <Rooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/amenities"
                element={
                  <ProtectedRoute>
                    <Amenities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Fallback routes */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
