"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { Form, Input, Button, Card, Typography, ConfigProvider, message } from "antd"
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"

const { Title, Text } = Typography

const Register = () => {
  const [loading, setLoading] = useState(false)
  const { isDarkMode, themeConfig } = useTheme()
  const navigate = useNavigate()
  const [existingUsers] = useState(["admin", "user1", "manager"]) // Mock existing users

  const onFinish = async (values) => {
    setLoading(true)

    // Check if user already exists
    if (existingUsers.includes(values.username.toLowerCase())) {
      message.error("User already exists! Redirecting to login page...")
      setTimeout(() => {
        navigate("/login")
      }, 2000)
      setLoading(false)
      return
    }

    // Simulate API call for registration
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add user to existing users (in real app, this would be API call)
      existingUsers.push(values.username.toLowerCase())

      message.success("Registration successful! Please login with your credentials.")
      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } catch (error) {
      message.error("Registration failed. Please try again.")
    } finally {
      setLoading(false)
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
            width: 450,
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
            Create Account
          </Title>

          <Form name="register" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[
                { required: true, message: "Please input your full name!" },
                { 
                  pattern: /^[a-zA-Z\s.]+$/, 
                  message: "Only letters, spaces, and dots are allowed!" 
                },
                { min: 2, message: "Name must be at least 2 characters!" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
                { 
                  pattern: /^[a-zA-Z0-9_]+$/, 
                  message: "Username can only contain letters, numbers, and underscores!" 
                },
                { min: 3, message: "Username must be at least 3 characters!" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Choose a username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
                { min: 6, message: "Password must be at least 6 characters!" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Create a password" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error("Passwords do not match!"))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 45, fontSize: "16px" }}>
                Create Account
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Text style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#1890ff",
                    textDecoration: "none",
                  }}
                >
                  Sign in here
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default Register
