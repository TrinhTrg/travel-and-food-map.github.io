import React from 'react';
import HomePage from "./pages/HomePage/HomePage";
import DiscoverPage from './pages/DiscoverPage/DiscoverPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HowItWorksPage from './pages/HowItWorksPage/HowItWorksPage';
import ContactPage from './pages/ContactPage/ContactPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import { AuthProvider } from './context/AuthContext';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import CreateLocationPage from './pages/CreateLocationPage/CreateLocationPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import './index.css'; // Import file CSS toàn cục (để lấy font, màu nền)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kham-pha" element={<DiscoverPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/create-location" element={<CreateLocationPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;