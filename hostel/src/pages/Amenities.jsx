"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { Layout, Menu, Table, Input, Select, Typography, ConfigProvider, Dropdown, Button, Modal } from "antd"
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import ThemeToggle from "../components/ThemeToggle"
import { useData } from "../context/DataContext"

const { Header, Sider, Content } = Layout
const { Title } = Typography
const { Option } = Select

const Amenities = () => {
  const { logout, user } = useContext(AuthContext)
  const { isDarkMode, themeConfig } = useTheme()
  const navigate = useNavigate()
  const [selectedBlock, setSelectedBlock] = useState("A")
  const [searchText, setSearchText] = useState("")
  const { getAllTrainees } = useData()

  const handleBlockChange = (block) => {
    setSelectedBlock(block)
  }

  const handleSearch = (value) => {
    setSearchText(value)
  }

  // Get all trainees with their amenities
  const getAllTraineesWithAmenities = () => {
    return getAllTrainees().map((trainee) => ({
      ...trainee,
      // Ensure amenities object exists
      amenities: trainee.amenities || {}
    }))
  }

  // Filter data based on search and block
  const filteredData = getAllTraineesWithAmenities().filter((trainee) => {
    const matchesSearch =
      !searchText ||
      trainee.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (trainee.roomNumber && trainee.roomNumber.toString().includes(searchText))

    const matchesBlock =
      selectedBlock === "ALL" ||
      (selectedBlock === "A" && trainee.roomNumber >= 1 && trainee.roomNumber <= 43) ||
      (selectedBlock === "B" && trainee.roomNumber >= 44 && trainee.roomNumber <= 86) ||
      (selectedBlock === "C" && trainee.roomNumber >= 87 && trainee.roomNumber <= 114)

    return matchesSearch && matchesBlock && trainee.status === "staying"
  })

  const columns = [
    {
      title: "NAME OF TRAINEE",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 200,
    },
    {
      title: "ROOM NUMBER",
      dataIndex: "roomNumber",
      key: "roomNumber",
      sorter: (a, b) => (a.roomNumber || 0) - (b.roomNumber || 0),
      width: 120,
      render: (roomNumber) => <strong>{roomNumber || "N/A"}</strong>,
    },
    {
      title: "ALLOTTED AMENITIES",
      key: "amenities",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            console.log("View amenities button clicked for:", record);
            showAmenitiesModal(record);
          }}
          style={{
            backgroundColor: "#1890ff",
            borderColor: "#1890ff",
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const showAmenitiesModal = (trainee) => {
    console.log("View amenities clicked for:", trainee);
    const amenitiesList = [];
    
    // Check all possible amenities from the trainee's amenities object
    if (trainee.amenities) {
      Object.entries(trainee.amenities).forEach(([amenityName, amenityData]) => {
        if (amenityData && (amenityData.allocated || amenityData === true)) {
          const quantity = amenityData.quantity || 1;
          amenitiesList.push({ 
            name: amenityName, 
            quantity: quantity 
          });
        }
      });
    }

    // Also check for legacy boolean amenities
    const legacyAmenities = ['linen', 'table', 'chair', 'blanket', 'bed'];
    legacyAmenities.forEach(amenity => {
      if (trainee.amenities && trainee.amenities[amenity] === true) {
        // Check if not already added
        if (!amenitiesList.find(item => item.name.toLowerCase() === amenity.toLowerCase())) {
          amenitiesList.push({ 
            name: amenity.charAt(0).toUpperCase() + amenity.slice(1), 
            quantity: 1 
          });
        }
      }
    });

    Modal.info({
      title: `Allotted Amenities - ${trainee.name}`,
      content: (
        <div style={{ padding: "16px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <strong>Room Number:</strong> {trainee.roomNumber || "N/A"}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>Bed Number:</strong> {trainee.bedNumber || "N/A"}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>Amenities:</strong>
          </div>
          {amenitiesList.length > 0 ? (
            <div>
              {amenitiesList.map((amenity, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "8px 0",
                  borderBottom: index < amenitiesList.length - 1 ? "1px solid #f0f0f0" : "none"
                }}>
                  <span><strong>{amenity.name}</strong></span>
                  <span>Quantity: {amenity.quantity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic" }}>No amenities allotted to this trainee.</p>
          )}
        </div>
      ),
      width: 500,
      okText: "Close",
      centered: true,
    });
  };

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
            selectedKeys={["5"]}
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
              Allotted Amenities
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
            {/* Controls Section */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Input
                placeholder="SEARCH"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Select value={selectedBlock} onChange={handleBlockChange} style={{ width: 120 }}>
                <Option value="ALL">ALL BLOCKS</Option>
                <Option value="A">BLOCK A</Option>
                <Option value="B">BLOCK B</Option>
                <Option value="C">BLOCK C</Option>
              </Select>
            </div>

            {/* Amenities Table */}
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} trainees`,
              }}
              style={{
                background: isDarkMode ? "#1f1f1f" : "#ffffff",
              }}
              scroll={{ x: 800 }}
            />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default Amenities
