"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import {
  Layout,
  Menu,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Typography,
  ConfigProvider,
  Space,
  Dropdown,
  message,
  Tag,
  Input,
} from "antd"
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons"
import ThemeToggle from "../components/ThemeToggle"
import { useData } from "../context/DataContext"

const { Header, Sider, Content } = Layout
const { Title } = Typography
const { Option } = Select

const Rooms = () => {
  const { logout, user } = useContext(AuthContext)
  const { isDarkMode, themeConfig } = useTheme()
  const navigate = useNavigate()
  const [selectedBlock, setSelectedBlock] = useState("A")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { rooms: contextRooms, addRoom, updateRoom, deleteRoom, trainees } = useData()
  const [rooms, setRooms] = useState(contextRooms["A"] || [])
  const [editingRoom, setEditingRoom] = useState(null)

  // Update rooms when context changes or block changes
  useEffect(() => {
    setRooms(contextRooms[selectedBlock] || [])
  }, [contextRooms, selectedBlock])

  const handleBlockChange = (block) => {
    setSelectedBlock(block)
  }

  const handleAddRoom = () => {
    console.log("Add room button clicked")
    setIsModalVisible(true)
    setEditingRoom(null)
    form.resetFields()
    // Set default block in form
    form.setFieldsValue({ block: selectedBlock })
  }

  const handleEditRoom = (record) => {
    form.setFieldsValue({
      number: record.number,
      status: record.status,
      type: record.type,
      block: selectedBlock, // Set current block
    })
    setEditingRoom(record)
    setIsModalVisible(true)
  }

  const handleDeleteRoom = (record) => {
    console.log("Delete room clicked for:", record)

    // Check if room is occupied
    const occupants = getRoomOccupants(record.number);
    if (occupants.length > 0) {
      message.error("Cannot delete occupied room. Please checkout all trainees first.");
      return;
    }

    Modal.confirm({
      title: "Delete Room",
      content: `Are you sure you want to delete Room ${record.number}?`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        console.log("Confirming delete for room:", record.number, "in block:", selectedBlock)

        const success = deleteRoom(record.number, selectedBlock)
        if (success) {
          message.success(`Room ${record.number} has been deleted successfully`)
        } else {
          message.error("Failed to delete room")
        }
      },
    })
  }

  const handleModalOk = () => {
    console.log("Modal OK clicked")

    form
      .validateFields()
      .then((values) => {
        console.log("Form values:", values)

        const targetBlock = values.block || selectedBlock

        if (editingRoom) {
          // Edit existing room
          const updatedData = {
            status: values.status,
            type: values.type,
          }

          const success = updateRoom(editingRoom.number, selectedBlock, updatedData)
          if (success) {
            message.success("Room updated successfully")
          } else {
            message.error("Failed to update room")
          }
        } else {
          // Add new room
          const newRoomData = {
            number: Number.parseInt(values.number),
            status: values.status,
            type: values.type,
          }

          console.log("Adding new room:", newRoomData, "to block:", targetBlock)

          // Check if room number already exists in the target block
          const existingRoom = contextRooms[targetBlock].find((room) => room.number === newRoomData.number)
          if (existingRoom) {
            message.error("Room number already exists in this block!")
            return
          }

          const success = addRoom(newRoomData, targetBlock)
          if (success) {
            message.success("Room added successfully")
            // If we added to a different block, switch to that block
            if (targetBlock !== selectedBlock) {
              setSelectedBlock(targetBlock)
            }
          } else {
            message.error("Failed to add room")
          }
        }

        setIsModalVisible(false)
        setEditingRoom(null)
        form.resetFields()
      })
      .catch((info) => {
        console.log("Validate Failed:", info)
      })
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setEditingRoom(null)
    form.resetFields()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "occupied":
        return "red"
      case "vacant":
        return "green"
      case "blocked":
        return "orange"
      case "store":
        return "gray"
      default:
        return "default"
    }
  }

  // Get occupants for a room
  const getRoomOccupants = (roomNumber) => {
    const blockTrainees = trainees[selectedBlock] || []
    return blockTrainees.filter(trainee => 
      trainee.roomNumber === roomNumber && trainee.status === "staying"
    )
  }

  // Get room type based on bed count
  const getRoomType = (room) => {
    if (room.status === "blocked" || room.status === "store") {
      return room.type || "N/A"
    }
    
    const bedCount = room.beds || 1
    if (bedCount === 1) return "Single"
    if (bedCount === 2) return "Double"
    if (bedCount === 3) return "Triple"
    if (bedCount === 4) return "Quad"
    return `${bedCount}-Bed`
  }

  // Render bed status indicators
  const renderBedStatus = (room) => {
    if (room.status === "blocked" || room.status === "store") {
      return <span>N/A</span>
    }

    const bedCount = room.beds || 1
    const occupants = getRoomOccupants(room.number)
    const occupiedBeds = occupants.length
    
    const bedIcons = []
    
    // Occupied beds (red checkboxes)
    for (let i = 0; i < occupiedBeds; i++) {
      bedIcons.push(
        <CheckSquareOutlined 
          key={`occupied-${i}`} 
          style={{ color: "#ff4d4f", fontSize: "16px", margin: "0 2px" }} 
        />
      )
    }
    
    // Vacant beds (green checkboxes)
    for (let i = occupiedBeds; i < bedCount; i++) {
      bedIcons.push(
        <CheckSquareOutlined 
          key={`vacant-${i}`} 
          style={{ color: "#52c41a", fontSize: "16px", margin: "0 2px" }} 
        />
      )
    }
    
    return <div>{bedIcons}</div>
  }

  const columns = [
    {
      title: "ROOM NUMBER",
      dataIndex: "number",
      key: "number",
      sorter: (a, b) => a.number - b.number,
      render: (number) => <strong>{number}</strong>,
    },
    {
      title: "STATUS",
      key: "status",
      filters: [
        { text: "Occupied", value: "occupied" },
        { text: "Vacant", value: "vacant" },
        { text: "Blocked", value: "blocked" },
        { text: "Store", value: "store" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (_, record) => (
        <div>
          <Tag color={getStatusColor(record.status)} style={{ textTransform: "uppercase", marginBottom: "4px" }}>
            {record.status}
          </Tag>
          <div>{renderBedStatus(record)}</div>
        </div>
      ),
    },
    {
      title: "TYPE",
      key: "type",
      filters: [
        { text: "Single", value: "Single" },
        { text: "Double", value: "Double" },
        { text: "Triple", value: "Triple" },
        { text: "Quad", value: "Quad" },
        { text: "Store", value: "Store" },
      ],
      onFilter: (value, record) => getRoomType(record) === value,
      render: (_, record) => <span style={{ textTransform: "uppercase" }}>{getRoomType(record)}</span>,
    },
    {
      title: "OCCUPANT",
      key: "occupant",
      render: (_, record) => {
        if (record.status === "blocked" || record.status === "store") {
          return record.type || "N/A"
        }
        
        const occupants = getRoomOccupants(record.number)
        if (occupants.length === 0) {
          return ""
        }
        
        return (
          <div>
            {occupants.map((occupant, index) => (
              <div key={occupant.id} style={{ marginBottom: "2px" }}>
                {occupant.name}
                {occupant.bedNumber && ` (Bed ${occupant.bedNumber})`}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            onClick={() => handleEditRoom(record)}
          >
            EDIT
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              console.log("Delete button clicked for:", record);
              handleDeleteRoom(record)
            }}
          >
            DELETE
          </Button>
        </Space>
      ),
    },
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
            selectedKeys={["2"]}
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
              Rooms
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRoom}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                ADD ROOM
              </Button>
              <Select value={selectedBlock} onChange={handleBlockChange} style={{ width: 120 }}>
                <Option value="A">BLOCK A</Option>
                <Option value="B">BLOCK B</Option>
                <Option value="C">BLOCK C</Option>
              </Select>
            </div>

            {/* Rooms Table */}
            <Table
              columns={columns}
              dataSource={rooms}
              rowKey="number"
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} rooms`,
              }}
              style={{
                background: isDarkMode ? "#1f1f1f" : "#ffffff",
              }}
            />

            {/* Add/Edit Room Modal */}
            <Modal
              title={editingRoom ? "Edit Room" : "Add New Room"}
              visible={isModalVisible}
              onOk={handleModalOk}
              onCancel={handleModalCancel}
              width={500}
            >
              <Form form={form} layout="vertical" name="room_form">
                <Form.Item
                  name="number"
                  label="Room Number"
                  rules={[
                    { required: true, message: "Please input room number!" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        if (!/^\d+$/.test(value)) {
                          return Promise.reject(new Error("Room number must contain only digits!"))
                        }
                        const num = parseInt(value)
                        if (num < 1 || num > 200) {
                          return Promise.reject(new Error("Room number must be between 1 and 200!"))
                        }
                        return Promise.resolve()
                      }
                    }
                  ]}
                >
                  <Input disabled={!!editingRoom} placeholder="Enter room number" />
                </Form.Item>

                {!editingRoom && (
                  <Form.Item name="block" label="Block" rules={[{ required: true, message: "Please select block!" }]}>
                    <Select>
                      <Option value="A">Block A</Option>
                      <Option value="B">Block B</Option>
                      <Option value="C">Block C</Option>
                    </Select>
                  </Form.Item>
                )}

                <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status!" }]}>
                  <Select>
                    <Option value="vacant">Vacant</Option>
                    <Option value="occupied">Occupied</Option>
                    <Option value="blocked">Blocked</Option>
                    <Option value="store">Store</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="type"
                  label="Room Type"
                  rules={[{ required: true, message: "Please select room type!" }]}
                >
                  <Select>
                    <Option value="Single">Single</Option>
                    <Option value="Double">Double</Option>
                    <Option value="Triple">Triple</Option>
                    <Option value="Quad">Quad</Option>
                    <Option value="Store">Store</Option>
                  </Select>
                </Form.Item>
              </Form>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default Rooms
