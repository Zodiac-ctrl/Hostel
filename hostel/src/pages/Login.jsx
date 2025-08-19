"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext.js"
import { useTheme } from "../context/ThemeContext"
import { Form, Input, Button, Card, Typography, ConfigProvider } from "antd"
import { Link } from "react-router-dom"

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const { isDarkMode, themeConfig } = useTheme()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    const success = await login(values.username, values.password)
    setLoading(false)
    if (success) {
      navigate("/")
    }
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: isDarkMode ? "#0a0a0a" : "#f5f5f5",
        }}
      >
        <Card
          style={{
            width: 400,
            backgroundColor: isDarkMode ? "#141414" : "#ffffff",
            borderColor: isDarkMode ? "#444444" : "#d9d9d9",
          }}
        >
          <Title
            level={2}
            style={{
              textAlign: "center",
              marginBottom: 24,
              color: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.88)",
            }}
          >
            Hostel Management Login
          </Title>
          <Form name="login" onFinish={onFinish} layout="vertical">
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
                { 
                  pattern: /^[a-zA-Z0-9_]+$/, 
                  message: "Username can only contain letters, numbers, and underscores!" 
                },
                { min: 3, message: "Username must be at least 3 characters!" }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
                { min: 6, message: "Password must be at least 6 characters!" }
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Log in
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "#1890ff",
                  textDecoration: "none",
                }}
              >
                Register here
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default Login
