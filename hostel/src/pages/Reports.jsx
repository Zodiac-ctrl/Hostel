"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { Layout, Menu, Card, Typography, ConfigProvider, Row, Col, Dropdown, Select, Statistic, DatePicker } from "antd"
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons"
import ThemeToggle from "../components/ThemeToggle"
import { useData } from "../context/DataContext"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const { RangePicker } = DatePicker;
const { Header, Sider, Content } = Layout
const { Title } = Typography
const { Option } = Select

const Reports = () => {
  const { logout, user } = useContext(AuthContext)
  const { isDarkMode, themeConfig } = useTheme()
  const { linenInventory, blanketInventory, getOccupancyStats, getAllTrainees } = useData()
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState("JANUARY")
  const [occupancyDateRange, setOccupancyDateRange] = useState(null);

  const occupancyStats = getOccupancyStats()

  // Calculate pillow cover and bedsheet statistics from trainee amenities
  const calculateLinenStats = () => {
    const allTrainees = getAllTrainees()
    
    let totalPillowCovers = 150 // Base inventory
    let availablePillowCovers = 60
    let inUsePillowCovers = 0
    let usedPillowCovers = 50

    let totalBedsheets = 150 // Base inventory  
    let availableBedsheets = 60
    let inUseBedsheets = 0
    let usedBedsheets = 50

    // Count amenities from active trainees
    allTrainees.forEach(trainee => {
      if (trainee.status === 'staying' && trainee.amenities) {
        if (trainee.amenities.pillowCover || trainee.amenities['Pillow Cover']) {
          inUsePillowCovers++
          availablePillowCovers = Math.max(0, availablePillowCovers - 1)
        }
        if (trainee.amenities.bedsheet || trainee.amenities['Bedsheet']) {
          inUseBedsheets++
          availableBedsheets = Math.max(0, availableBedsheets - 1)
        }
      }
    })

    return {
      pillowCover: {
        total: totalPillowCovers,
        available: availablePillowCovers,
        inUse: inUsePillowCovers,
        used: usedPillowCovers
      },
      bedsheet: {
        total: totalBedsheets,
        available: availableBedsheets,
        inUse: inUseBedsheets,
        used: usedBedsheets
      }
    }
  }

  const linenStats = calculateLinenStats()

  const occupancyData = [
    { name: "Occupied", value: occupancyStats.occupancyPercentage, color: "#ff4d4f" },
    { name: "Vacant", value: occupancyStats.vacancyPercentage, color: "#52c41a" },
  ]

  const userMenu = (
    <Menu theme={isDarkMode ? "dark" : "light"} style={{ background: isDarkMode ? "#1f1f1f" : "#ffffff" }}>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={logout}
        style={{ color: isDarkMode ? "#fff" : "#000" }}
      >
        Logout
      </Menu.Item>
    </Menu>
  )

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <Sider
          width={250}
          style={{
            background: isDarkMode ? "#1f1f1f" : "#ffffff",
            boxShadow: "2px 0 8px 0 rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
            }}
          >
            <Title
              level={3}
              style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
            >
              HOSTEL
            </Title>
            <Title
              level={3}
              style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
            >
              MANAGEMENT
            </Title>
          </div>

          <Menu
            theme={isDarkMode ? "dark" : "light"}
            mode="inline"
            selectedKeys={["6"]}
            style={{
              borderRight: 0,
              padding: "16px 0",
              background: isDarkMode ? "#1f1f1f" : "#ffffff",
            }}
          >
            <Menu.Item key="1" icon={<DashboardOutlined />} onClick={() => navigate("/")}>
              Dashboard
            </Menu.Item>
            <Menu.Item key="2" icon={<HomeOutlined />} onClick={() => navigate("/rooms")}>
              Rooms
            </Menu.Item>
            <Menu.Item key="3" icon={<UserOutlined />} onClick={() => navigate("/trainees")}>
              Trainees
            </Menu.Item>
            <Menu.Item key="4" icon={<TeamOutlined />} onClick={() => navigate("/allotments")}>
              Allotments
            </Menu.Item>
            <Menu.Item key="5" icon={<ToolOutlined />} onClick={() => navigate("/amenities")}>
              Amenities
            </Menu.Item>
            <Menu.Item key="6" icon={<FileTextOutlined />} onClick={() => navigate("/reports")}>
              Reports
            </Menu.Item>
          </Menu>
        </Sider>

        <Layout>
          {/* Header */}
          <Header
            style={{
              background: isDarkMode ? "#1f1f1f" : "#ffffff",
              padding: "0 24px",
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
            }}
          >
            <Title
              level={4}
              style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
            >
              Reports
            </Title>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ThemeToggle />
              <Dropdown overlay={userMenu} placement="bottomRight">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <UserSwitchOutlined
                    style={{
                      marginRight: 8,
                      color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
                    }}
                  />
                  <span style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                    {user?.username || "Admin"}
                  </span>
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Main Content */}
          <Content
            style={{
              margin: "24px",
              padding: 24,
              background: isDarkMode ? "#1f1f1f" : "#ffffff",
              minHeight: 280,
              color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
            }}
          >
            {/* Pillow Cover Details Section */}
            <Card
              title={
                <Title
                  level={4}
                  style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                >
                  PILLOW COVER DETAILS
                </Title>
              }
              style={{ marginBottom: 32, background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#262626" : "#f0f0f0",
                      border: "none",
                    }}
                  >
                    <Statistic
                      title="TOTAL PILLOW COVERS"
                      value={linenStats.pillowCover.total}
                      valueStyle={{
                        color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#162312" : "#f6ffed",
                      border: `2px solid ${isDarkMode ? "#389e0d" : "#52c41a"}`,
                    }}
                  >
                    <Statistic
                      title="AVAILABLE PILLOW COVERS"
                      value={linenStats.pillowCover.available}
                      valueStyle={{
                        color: isDarkMode ? "#b7eb8f" : "#52c41a",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#1a1a0f" : "#fffbe6",
                      border: `2px solid ${isDarkMode ? "#d4b106" : "#faad14"}`,
                    }}
                  >
                    <Statistic
                      title="IN-USE PILLOW COVERS"
                      value={linenStats.pillowCover.inUse}
                      valueStyle={{
                        color: isDarkMode ? "#fadb14" : "#faad14",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#2a1215" : "#fff2f0",
                      border: `2px solid ${isDarkMode ? "#a8071a" : "#ff4d4f"}`,
                    }}
                  >
                    <Statistic
                      title="USED PILLOW COVERS"
                      value={linenStats.pillowCover.used}
                      valueStyle={{
                        color: isDarkMode ? "#ffccc7" : "#ff4d4f",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Bedsheet Details Section */}
            <Card
              title={
                <Title
                  level={4}
                  style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                >
                  BEDSHEET DETAILS
                </Title>
              }
              style={{ marginBottom: 32, background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#262626" : "#f0f0f0",
                      border: "none",
                    }}
                  >
                    <Statistic
                      title="TOTAL BEDSHEETS"
                      value={linenStats.bedsheet.total}
                      valueStyle={{
                        color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#162312" : "#f6ffed",
                      border: `2px solid ${isDarkMode ? "#389e0d" : "#52c41a"}`,
                    }}
                  >
                    <Statistic
                      title="AVAILABLE BEDSHEETS"
                      value={linenStats.bedsheet.available}
                      valueStyle={{
                        color: isDarkMode ? "#b7eb8f" : "#52c41a",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#1a1a0f" : "#fffbe6",
                      border: `2px solid ${isDarkMode ? "#d4b106" : "#faad14"}`,
                    }}
                  >
                    <Statistic
                      title="IN-USE BEDSHEETS"
                      value={linenStats.bedsheet.inUse}
                      valueStyle={{
                        color: isDarkMode ? "#fadb14" : "#faad14",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#2a1215" : "#fff2f0",
                      border: `2px solid ${isDarkMode ? "#a8071a" : "#ff4d4f"}`,
                    }}
                  >
                    <Statistic
                      title="USED BEDSHEETS"
                      value={linenStats.bedsheet.used}
                      valueStyle={{
                        color: isDarkMode ? "#ffccc7" : "#ff4d4f",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Blanket Details Section */}
            <Card
              title={
                <Title
                  level={4}
                  style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                >
                  BLANKET DETAILS
                </Title>
              }
              style={{ marginBottom: 32, background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#262626" : "#f0f0f0",
                      border: "none",
                    }}
                  >
                    <Statistic
                      title="TOTAL BLANKET"
                      value={blanketInventory.totalBlanket}
                      valueStyle={{
                        color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#162312" : "#f6ffed",
                      border: `2px solid ${isDarkMode ? "#389e0d" : "#52c41a"}`,
                    }}
                  >
                    <Statistic
                      title="AVAILABLE BLANKET"
                      value={blanketInventory.availableBlanket}
                      valueStyle={{
                        color: isDarkMode ? "#b7eb8f" : "#52c41a",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#1a1a0f" : "#fffbe6",
                      border: `2px solid ${isDarkMode ? "#d4b106" : "#faad14"}`,
                    }}
                  >
                    <Statistic
                      title="IN-USE BLANKET"
                      value={blanketInventory.inUseBlanket}
                      valueStyle={{
                        color: isDarkMode ? "#fadb14" : "#faad14",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card
                    style={{
                      textAlign: "center",
                      background: isDarkMode ? "#2a1215" : "#fff2f0",
                      border: `2px solid ${isDarkMode ? "#a8071a" : "#ff4d4f"}`,
                    }}
                  >
                    <Statistic
                      title="USED BLANKET"
                      value={blanketInventory.usedBlanket}
                      valueStyle={{
                        color: isDarkMode ? "#ffccc7" : "#ff4d4f",
                        fontSize: "32px",
                        fontWeight: "bold",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Occupancy Section */}
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Title
                    level={4}
                    style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                  >
                    % OCCUPANCY
                  </Title>
                  <RangePicker
                    placeholder={["Start Date", "End Date"]}
                    format="DD-MM-YYYY"
                    onChange={(dates) => setOccupancyDateRange(dates)}
                    style={{ width: 300 }}
                  />
                </div>
              }
              style={{ background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                {occupancyDateRange && occupancyDateRange[0] && occupancyDateRange[1] ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {occupancyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{
                    textAlign: "center",
                    color: isDarkMode ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)",
                    fontSize: "16px"
                  }}>
                    Please select a date range to view occupancy statistics
                  </div>
                )}
              </div>
            </Card>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default Reports
