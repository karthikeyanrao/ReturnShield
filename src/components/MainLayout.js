import React from 'react';
import AdminPanel from './AdminPanel'; // Sidebar navigation
import { Outlet } from 'react-router-dom';
import './MainLayout.css'; // Create this file for layout-specific styles

const MainLayout = () => (
  <div className="main-layout">
    <aside className="sidebar">
      <AdminPanel />
    </aside>
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

export default MainLayout;
