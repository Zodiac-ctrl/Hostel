"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { Layout, Menu, Card, Row, Col, Typography, Select, Dropdown, ConfigProvider, Collapse } from "antd"
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons"
import ThemeToggle from "../components/ThemeToggle"
import { useData } from "../context/DataContext"

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

const HostelDashboard = () => {
  const { logout, user } = useContext(AuthContext)
  const { isDarkMode, themeConfig } = useTheme()
  const { rooms, trainees, getOccupancyStats } = useData()
  const navigate = useNavigate()
  const [selectedBlock, setSelectedBlock] = useState("A")
  const [occupancyStats, setOccupancyStats] = useState(getOccupancyStats())

  useEffect(() => {
    setOccupancyStats(getOccupancyStats())
  }, [rooms, trainees, getOccupancyStats])

  const getBlockStats = (block) => {
    const blockRooms = rooms[block] || []
    const blockTrainees = trainees[block] || []

    return {
      name: `${block}-Wing`,
      totalRooms: blockRooms.length,
      occupiedRooms: blockRooms.filter((room) => room.status === "occupied").length,
      vacantRooms: blockRooms.filter((room) => room.status === "vacant").length,
      totalTrainees: blockTrainees.length,
      bedsAvailable: blockRooms.filter((room) => room.status === "vacant").length,
      floors: [
        {
          name: "Ground Floor",
          rooms: blockRooms.filter((room) => {
            if (block === "A") return room.number <= 21
            if (block === "B") return room.number <= 64
            if (block === "C") return room.number <= 100
            return false
          }),
        },
        {
          name: "First Floor",
          rooms: blockRooms.filter((room) => {
            if (block === "A") return room.number > 21
            if (block === "B") return room.number > 64
            if (block === "C") return room.number > 100
            return false
          }),
        },
      ],
    }
  }

  const currentBlock = getBlockStats(selectedBlock)

  const handleBedClick = (room, bedIndex) => {
    // Only navigate if the bed is available (room is vacant or specific bed is not occupied)
    console.log("Bed clicked:", room, bedIndex);
    
    if (room.status === "vacant") {
      navigate("/allotments", { 
        state: { 
          roomNumber: room.number, 
          block: selectedBlock,
          bedNumber: bedIndex + 1
        } 
      })
    } else {
      console.log("Bed not available for allocation");
    }
  }

  const getFloorSummary = (floor) => {
    const occupied = floor.rooms.filter((room) => room.status === "occupied").length
    const vacant = floor.rooms.filter((room) => room.status === "vacant").length
    const blocked = floor.rooms.filter((room) => room.status === "blocked" || room.status === "store").length

    return { occupied, vacant, blocked, total: floor.rooms.length }
  }

  const renderBedLayout = (room) => {
    if (room.status === "blocked" || room.status === "store") {
      return <span style={{ fontSize: "24px", color: isDarkMode ? "#8c8c8c" : "#595959" }}>🚫</span>
    }

    const bedCount = room.beds || 1
    const occupants = room.occupants || []
    const beds = []

    for (let i = 0; i < bedCount; i++) {
      const isOccupied = i < occupants.length
      const color = isOccupied ? "#ff4d4f" : "#52c41a"
      const occupant = occupants[i]
      const isClickable = room.status === "vacant"

      beds.push(
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: isClickable ? "pointer" : "default",
            margin: "2px",
            padding: "4px",
            borderRadius: "4px",
            backgroundColor: isOccupied 
              ? (isDarkMode ? "#2a1215" : "#fff2f0")
              : (isDarkMode ? "#162312" : "#f6ffed"),
            border: `1px solid ${color}`,
            minWidth: "60px",
            opacity: isClickable ? 1 : 0.7,
            transition: "all 0.3s ease",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isClickable) {
              console.log("Bed click handler called");
              handleBedClick(room, i);
            }
          }}
          onMouseEnter={(e) => {
            if (isClickable) {
              e.target.style.transform = "scale(1.05)"
              e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)"
            }
          }}
          onMouseLeave={(e) => {
            if (isClickable) {
              e.target.style.transform = "scale(1)"
              e.target.style.boxShadow = "none"
            }
          }}
        >
          <span style={{ fontSize: "20px", color }}>🛏️</span>
          {isOccupied && occupant && (
            <div style={{ textAlign: "center", marginTop: "2px" }}>
              <Text
                style={{
                  color: isDarkMode ? "#ffccc7" : "#ff4d4f",
                  fontSize: "10px",
                  fontWeight: "bold",
                  display: "block",
                  lineHeight: "1.2",
                }}
              >
                {occupant.name.split(" ")[0]}
              </Text>
              <Text
                style={{
                  color: isDarkMode ? "#d9d9d9" : "#595959",
                  fontSize: "8px",
                  display: "block",
                }}
              >
                Bed {i + 1}
              </Text>
            </div>
          )}
          {!isOccupied && (
            <div style={{ textAlign: "center", marginTop: "2px" }}>
              <Text
                style={{
                  color: isDarkMode ? "#b7eb8f" : "#52c41a",
                  fontSize: "8px",
                  fontWeight: "bold",
                  display: "block",
                }}
              >
                Bed {i + 1}
              </Text>
              <Text
                style={{
                  color: isDarkMode ? "#b7eb8f" : "#52c41a",
                  fontSize: "8px",
                  display: "block",
                }}
              >
                Click to Allot
              </Text>
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "4px",
          maxWidth: "120px",
        }}
      >
        {beds}
      </div>
    )
  }

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
            defaultSelectedKeys={["1"]}
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
              Dashboard
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
                  <Text style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                    {user?.username || "Admin"}
                  </Text>
                </div>
              </Dropdown>
            </div>
          </Header>

          <Content
            style={{
              margin: "24px",
              padding: 24,
              background: isDarkMode ? "#1f1f1f" : "#ffffff",
              minHeight: 280,
              color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  title="Total Rooms"
                  bordered={false}
                  headStyle={{
                    borderBottom: 0,
                    color: "#ffffff",
                    backgroundColor: "#1890ff",
                    borderRadius: "8px 8px 0 0",
                  }}
                  style={{
                    background: isDarkMode ? "#0f1419" : "#e6f7ff",
                    borderColor: "#1890ff",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
                  }}
                >
                  <Title
                    level={2}
                    style={{
                      margin: 0,
                      color: "#1890ff",
                      textAlign: "center",
                    }}
                  >
                    {currentBlock.totalRooms}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  title="Vacant Rooms"
                  bordered={false}
                  headStyle={{
                    borderBottom: 0,
                    color: "#ffffff",
                    backgroundColor: "#52c41a",
                    borderRadius: "8px 8px 0 0",
                  }}
                  style={{
                    background: isDarkMode ? "#0f1a0f" : "#f6ffed",
                    borderColor: "#52c41a",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(82, 196, 26, 0.15)",
                  }}
                >
                  <Title level={2} style={{ margin: 0, color: "#52c41a", textAlign: "center" }}>
                    {currentBlock.vacantRooms}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  title="Occupied Rooms"
                  bordered={false}
                  headStyle={{
                    borderBottom: 0,
                    color: "#ffffff",
                    backgroundColor: "#f5222d",
                    borderRadius: "8px 8px 0 0",
                  }}
                  style={{
                    background: isDarkMode ? "#1a0f0f" : "#fff2f0",
                    borderColor: "#f5222d",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(245, 34, 45, 0.15)",
                  }}
                >
                  <Title level={2} style={{ margin: 0, color: "#f5222d", textAlign: "center" }}>
                    {currentBlock.occupiedRooms}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  title="Total Trainees"
                  bordered={false}
                  headStyle={{
                    borderBottom: 0,
                    color: "#ffffff",
                    backgroundColor: "#722ed1",
                    borderRadius: "8px 8px 0 0",
                  }}
                  style={{
                    background: isDarkMode ? "#1a0f1a" : "#f9f0ff",
                    borderColor: "#722ed1",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(114, 46, 209, 0.15)",
                  }}
                >
                  <Title
                    level={2}
                    style={{
                      margin: 0,
                      color: "#722ed1",
                      textAlign: "center",
                    }}
                  >
                    {currentBlock.totalTrainees}
                  </Title>
                </Card>
              </Col>
            </Row>

            <div style={{ margin: "24px 0" }}>
              <Select defaultValue="A" style={{ width: 120 }} onChange={(value) => setSelectedBlock(value)}>
                <Option value="A">A-Wing</Option>
                <Option value="B">B-Wing</Option>
                <Option value="C">C-Wing</Option>
              </Select>
            </div>

            <div style={{ marginTop: "24px" }}>
              <Title level={3} style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                {currentBlock.name} Room Layout
              </Title>

              <div style={{ marginBottom: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "20px", color: "#ff4d4f" }}>🛏️</div>
                  <Text style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                    Occupied
                  </Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "20px", color: "#52c41a" }}>🛏️</div>
                  <Text style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                    Available (Click to Allot)
                  </Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "20px", color: isDarkMode ? "#8c8c8c" : "#595959" }}>🚫</div>
                  <Text style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                    Blocked/Store
                  </Text>
                </div>
              </div>

              <Collapse
                defaultActiveKey={["0"]}
                expandIcon={({ isActive }) => (isActive ? <DownOutlined /> : <RightOutlined />)}
                style={{
                  background: isDarkMode ? "#1f1f1f" : "#ffffff",
                  borderColor: isDarkMode ? "#434343" : "#d9d9d9",
                }}
              >
                {currentBlock.floors.map((floor, floorIndex) => {
                  const summary = getFloorSummary(floor)
                  return (
                    <Panel
                      header={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <Title
                            level={4}
                            style={{
                              margin: 0,
                              color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
                            }}
                          >
                            {floor.name}
                          </Title>
                          <div style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
                            <span style={{ color: "#f5222d" }}>🔴 Occupied: {summary.occupied}</span>
                            <span style={{ color: "#52c41a" }}>🟢 Vacant: {summary.vacant}</span>
                            <span style={{ color: isDarkMode ? "#8c8c8c" : "#595959" }}>
                              ⚫ Blocked: {summary.blocked}
                            </span>
                            <span style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                              Total: {summary.total}
                            </span>
                          </div>
                        </div>
                      }
                      key={floorIndex}
                      style={{
                        background: isDarkMode ? "#1f1f1f" : "#ffffff",
                        borderColor: isDarkMode ? "#434343" : "#d9d9d9",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                          gap: "16px",
                          padding: "16px 0",
                        }}
                      >
                        {floor.rooms.map((room, roomIndex) => (
                          <Card
                            key={roomIndex}
                            style={{
                              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                              borderColor: isDarkMode ? "#444444" : "#d9d9d9",
                              borderWidth: "1px",
                              borderStyle: "solid",
                              transition: "all 0.3s ease",
                              textAlign: "center",
                              minHeight: "120px",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              <Text
                                strong
                                style={{
                                  color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
                                  fontSize: "14px",
                                }}
                              >
                                Room {room.number}
                              </Text>
                              
                              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                {renderBedLayout(room)}
                              </div>

                              {room.status === "blocked" || room.status === "store" ? (
                                <div
                                  style={{
                                    fontSize: "10px",
                                    marginTop: "4px",
                                    fontWeight: "bold",
                                    color: isDarkMode ? "#8c8c8c" : "#595959",
                                    textAlign: "center",
                                  }}
                                >
                                  {room.type}
                                </div>
                              ) : room.status === "vacant" ? (
                                <div
                                  style={{
                                    fontSize: "10px",
                                    marginTop: "4px",
                                    fontWeight: "bold",
                                    color: isDarkMode ? "#b7eb8f" : "#52c41a",
                                  }}
                                >
                                  {room.beds} Bed{room.beds > 1 ? 's' : ''} Available
                                </div>
                              ) : null}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Panel>
                  )
                })}
              </Collapse>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default HostelDashboard
