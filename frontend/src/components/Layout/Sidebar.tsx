import { Layout } from 'antd';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // --- ELIMINADO: Todo el contenido del Sidebar de navegación global ---
  // Este archivo ya no debe contener lógica de navegación global.
  // --- Fin de eliminación ---

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={value => setCollapsed(value)}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0
      }}
    >
      <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
      {/* The Menu component and its items are removed as per the edit hint. */}
    </Sider>
  );
};

export default Sidebar; 