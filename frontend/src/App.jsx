import React from 'react';
import HomePage from "./pages/HomePage/HomePage";
import DiscoverPage from './pages/DiscoverPage/DiscoverPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AboutUsPage from './pages/HowItWorksPage/HowItWorksPage';
import ContactPage from './pages/ContactPage/ContactPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import { AuthProvider } from './context/AuthContext';
import { CollectionProvider } from './context/CollectionContext';
import { NotificationProvider } from './context/NotificationContext';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import CreateLocationPage from './pages/CreateLocationPage/CreateLocationPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ProfilePage from './pages/ProfilePage/ProfilePage';

import './index.css'; // Import file CSS toàn cục (để lấy font, màu nền)

function App() {
  return (
    <NotificationProvider>
    <AuthProvider>
      <CollectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/kham-pha" element={<DiscoverPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
            <Route path="/create-location" element={<CreateLocationPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/ho-so" element={<ProfilePage />} />

          </Routes>
        </BrowserRouter>
      </CollectionProvider>
    </AuthProvider>
    </NotificationProvider>
  );
}

export default App;