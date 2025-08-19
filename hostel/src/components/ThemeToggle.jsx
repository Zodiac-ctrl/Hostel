import React from 'react';
import { Button, Tooltip } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Tooltip 
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      placement="bottom"
    >
      <Button
        type="text"
        icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
        onClick={toggleTheme}
        style={{ 
          color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
          fontSize: '16px'
        }}
        aria-label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
      />
    </Tooltip>
  );
};

export default ThemeToggle;