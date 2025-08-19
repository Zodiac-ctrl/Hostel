"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { useData } from "../context/DataContext"
import {
  Layout,
  Menu,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Typography,
  ConfigProvider,
  Row,
  Col,
  Dropdown,
  message,
  InputNumber,
  Table,
  Modal,
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
  CalendarOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import ThemeToggle from "../components/ThemeToggle"

const { Header, Sider, Content } = Layout
const { Title } = Typography
const { Option } = Select

const Allotments = () => {
  const { logout, user } = useContext(AuthContext)
  const { isDarkMode, themeConfig } = useTheme()
  const { allocateRoom, rooms } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [selectedBlock, setSelectedBlock] = useState("A")
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [customAmenityName, setCustomAmenityName] = useState("")

  const amenityOptions = [
    { label: "Bedsheet", value: "bedsheet" },
    { label: "Pillow Cover", value: "pillowCover" },
    { label: "Blanket", value: "blanket" },
    { label: "Mosquito Repellant", value: "mosquitoRepellant" },
    { label: "Electric Cattle", value: "electricCattle" },
    { label: "Key Ring", value: "keyRing" },
    { label: "Others", value: "others" },
  ]

  const roomTypeOptions = [
    { label: "Single", value: "single" },
    { label: "Double", value: "double" },
    { label: "Triple", value: "triple" },
    { label: "Quad", value: "quad" },
  ]

  useEffect(() => {
    if (location.state?.roomNumber && location.state?.block) {
      setSelectedBlock(location.state.block)
      
      // Determine room type based on room data
      const roomData = rooms[location.state.block]?.find(r => r.number === location.state.roomNumber)
      let roomType = "single"
      if (roomData?.beds) {
        if (roomData.beds === 2) roomType = "double"
        else if (roomData.beds === 3) roomType = "triple"
        else if (roomData.beds === 4) roomType = "quad"
      }
      
      form.setFieldsValue({
        block: location.state.block,
        roomNumber: location.state.roomNumber,
        roomType: roomType,
      })
    }
  }, [location.state, form, rooms])

  const handleAmenitySelect = (value) => {
    if (value === 'others') {
      setIsModalVisible(true)
    } else {
      const existing = selectedAmenities.find(item => item.name === value)
      if (!existing) {
        const amenityLabel = amenityOptions.find(opt => opt.value === value)?.label || value
        setSelectedAmenities(prev => [...prev, {
          name: value,
          displayName: amenityLabel,
          quantity: 1
        }])
      }
    }
  }

  const handleCustomAmenitySubmit = () => {
    if (customAmenityName.trim()) {
      const existing = selectedAmenities.find(item => item.displayName === customAmenityName.trim())
      if (!existing) {
        setSelectedAmenities(prev => [...prev, {
          name: 'others',
          displayName: customAmenityName.trim(),
          quantity: 1
        }])
      }
      setCustomAmenityName("")
      setIsModalVisible(false)
    } else {
      message.error("Please enter a valid amenity name!")
    }
  }

  const handleQuantityChange = (index, quantity) => {
    setSelectedAmenities(prev => 
      prev.map((item, i) => 
        i === index 
          ? { ...item, quantity: quantity || 1 }
          : item
      )
    )
  }

  const removeAmenity = (index) => {
    setSelectedAmenities(prev => prev.filter((_, i) => i !== index))
  }

  const amenityColumns = [
    {
      title: 'Amenity',
      dataIndex: 'displayName',
      key: 'displayName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity, record, index) => (
        <InputNumber
          min={1}
          max={100}
          value={quantity}
          onChange={(value) => handleQuantityChange(index, value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeAmenity(index)}
        />
      )
    }
  ]

  // Validation rules
  const nameValidation = [
    { required: true, message: "This field is required!" },
    { 
      pattern: /^[a-zA-Z\s.]+$/, 
      message: "Only letters, spaces, and dots are allowed!" 
    },
    { 
      min: 2, 
      message: "Name must be at least 2 characters long!" 
    }
  ]

  const phoneValidation = [
    { required: true, message: "Phone number is required!" },
    { 
      pattern: /^[0-9]{10}$/, 
      message: "Phone number must be exactly 10 digits!" 
    }
  ]

  const handleSubmit = (values) => {
    console.log("Form submitted with values:", values)

    try {
      const amenitiesData = {}
      selectedAmenities.forEach(amenity => {
        if (amenity.displayName && amenity.quantity) {
          amenitiesData[amenity.displayName] = {
            quantity: amenity.quantity,
            allocated: true
          }
        }
      })

      const traineeData = {
        name: values.traineeName,
        designation: values.designation,
        division: values.division,
        mobile: values.contactNo,
        from: values.checkInDate.format("DD.MM.YYYY"),
        to: values.checkInDate.add(1, "year").format("DD.MM.YYYY"),
        trainingUnder: values.trainingUnder,
        bedNumber: 1, // Default bed number
        emergencyContact: {
          name: values.emergencyName,
          contact: values.emergencyContact,
          relation: values.relation,
          place: values.place,
        },
        amenities: amenitiesData,
      }

      const roomNumber = values.roomNumber || (rooms[selectedBlock].find(room => room.status === "vacant")?.number)
      
      if (!roomNumber) {
        message.error("No vacant rooms available in the selected block!")
        return
      }

      console.log("Allocating room:", roomNumber, "in block:", selectedBlock)

      const newTrainee = allocateRoom(traineeData, roomNumber, selectedBlock)

      message.success(`Room ${roomNumber} allocated successfully to ${newTrainee.name}!`)

      form.resetFields()
      setSelectedAmenities([])
      navigate("/")
    } catch (error) {
      console.error("Allocation error:", error)
      message.error(error.message || "Failed to allocate room. Please try again.")
    }
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
            selectedKeys={["4"]}
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
              Room Allotment
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

          <Content
            style={{
              margin: "24px",
              padding: 24,
              background: isDarkMode ? "#1f1f1f" : "#ffffff",
              minHeight: 280,
              color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)",
            }}
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 800 }}>
              {/* Trainee Details Section */}
              <Card
                title={
                  <Title
                    level={4}
                    style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                  >
                    TRAINEE DETAILS
                  </Title>
                }
                style={{ marginBottom: 24, background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="traineeName"
                      label="Name of Trainee"
                      rules={nameValidation}
                    >
                      <Input placeholder="Enter trainee name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="designation"
                      label="Designation"
                      rules={[{ required: true, message: "Please select designation!" }]}
                    >
                      <Select placeholder="Select designation">
                        <Option value="SSE">SSE</Option>
                        <Option value="JE">JE</Option>
                        <Option value="Tech-I">Tech-I</Option>
                        <Option value="Tech-II">Tech-II</Option>
                        <Option value="AJE">AJE</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="division"
                      label="Division"
                      rules={[
                        { required: true, message: "Please input division!" },
                        { 
                          pattern: /^[a-zA-Z0-9\s/()-]+$/, 
                          message: "Division contains invalid characters!" 
                        }
                      ]}
                    >
                      <Input placeholder="Enter division" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="contactNo"
                      label="Contact No."
                      rules={phoneValidation}
                    >
                      <Input placeholder="Enter 10-digit contact number" maxLength={10} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item 
                  name="trainingUnder" 
                  label="Training Under"
                  rules={[
                    { 
                      pattern: /^[a-zA-Z\s.,-]*$/, 
                      message: "Only letters, spaces, dots, commas, and hyphens are allowed!" 
                    }
                  ]}
                >
                  <Input placeholder="Enter training details" />
                </Form.Item>
              </Card>

              {/* Hostel Details Section */}
              <Card
                title={
                  <Title
                    level={4}
                    style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                  >
                    HOSTEL DETAILS
                  </Title>
                }
                style={{ marginBottom: 24, background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="block" label="Block" rules={[{ required: true, message: "Please select block!" }]}>
                      <Select placeholder="Select block" value={selectedBlock} onChange={setSelectedBlock}>
                        <Option value="A">A</Option>
                        <Option value="B">B</Option>
                        <Option value="C">C</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="roomNumber"
                      label="Room Number"
                      rules={[{ required: true, message: "Please input room number!" }]}
                    >
                      <InputNumber 
                        style={{ width: "100%" }}
                        placeholder="Enter room number" 
                        min={1}
                        max={200}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="roomType"
                      label="Room Type"
                      rules={[{ required: true, message: "Please select room type!" }]}
                    >
                      <Select placeholder="Select room type">
                        {roomTypeOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="checkInDate"
                      label="Check-in Date"
                      rules={[{ required: true, message: "Please select check-in date!" }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD-MM-YYYY"
                        placeholder="dd-mm-yyyy"
                        suffixIcon={<CalendarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Amenities Section */}
                <div style={{ marginTop: 24 }}>
                  <Row gutter={16} align="middle">
                    <Col span={12}>
                      <Title level={5} style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)", margin: 0 }}>
                        Add Amenities
                      </Title>
                    </Col>
                    <Col span={12}>
                      <Select
                        placeholder="Select amenity to add"
                        style={{ width: '100%' }}
                        onChange={handleAmenitySelect}
                        value={undefined}
                      >
                        {amenityOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>

                  {/* Selected Amenities Table */}
                  {selectedAmenities.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Title level={5} style={{ color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}>
                        Selected Amenities
                      </Title>
                      <Table
                        dataSource={selectedAmenities}
                        columns={amenityColumns}
                        rowKey={(record, index) => `${record.name}-${index}`}
                        pagination={false}
                        size="small"
                        style={{
                          background: isDarkMode ? "#1f1f1f" : "#ffffff",
                        }}
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Emergency Details Section */}
              <Card
                title={
                  <Title
                    level={4}
                    style={{ margin: 0, color: isDarkMode ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.88)" }}
                  >
                    EMERGENCY DETAILS
                  </Title>
                }
                style={{ marginBottom: 24, background: isDarkMode ? "#1f1f1f" : "#ffffff" }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="emergencyName"
                      label="Name"
                      rules={nameValidation}
                    >
                      <Input placeholder="Enter emergency contact name" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="emergencyContact"
                      label="Contact No."
                      rules={phoneValidation}
                    >
                      <Input placeholder="Enter 10-digit emergency contact" maxLength={10} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="relation"
                      label="Relation"
                      rules={[
                        { required: true, message: "Please input relation!" },
                        { 
                          pattern: /^[a-zA-Z\s]+$/, 
                          message: "Only letters and spaces are allowed!" 
                        }
                      ]}
                    >
                      <Input placeholder="Enter relation" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item 
                  name="place" 
                  label="Place" 
                  rules={[
                    { required: true, message: "Please input place!" },
                    { 
                      pattern: /^[a-zA-Z\s.,-]+$/, 
                      message: "Only letters, spaces, dots, commas, and hyphens are allowed!" 
                    }
                  ]}
                >
                  <Input placeholder="Enter place" />
                </Form.Item>
              </Card>

              {/* Submit Button */}
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{
                    backgroundColor: "#1890ff",
                    borderColor: "#1890ff",
                    minWidth: 200,
                    height: 45,
                  }}
                >
                  ALLOCATE ROOM
                </Button>
              </div>
            </Form>

            {/* Custom Amenity Modal */}
            <Modal
              title="Add Custom Amenity"
              visible={isModalVisible}
              onOk={handleCustomAmenitySubmit}
              onCancel={() => {
                setIsModalVisible(false)
                setCustomAmenityName("")
              }}
              okText="Add"
              cancelText="Cancel"
            >
              <Form.Item
                label="Amenity Name"
                rules={[
                  { required: true, message: "Please enter amenity name!" },
                  { 
                    pattern: /^[a-zA-Z\s.,-]+$/, 
                    message: "Only letters, spaces, dots, commas, and hyphens are allowed!" 
                  }
                ]}
              >
                <Input
                  placeholder="Enter custom amenity name"
                  value={customAmenityName}
                  onChange={(e) => setCustomAmenityName(e.target.value)}
                  onPressEnter={handleCustomAmenitySubmit}
                />
              </Form.Item>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default Allotments
