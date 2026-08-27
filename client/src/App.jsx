import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import StatusPage from './pages/StatusPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return <Layout><Routes><Route path="/" element={<HomePage />} /><Route path="/services" element={<ServicesPage />} /><Route path="/booking" element={<BookingPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/auth" element={<AuthPage />} /><Route element={<ProtectedRoute />}><Route path="/status" element={<StatusPage />} /></Route><Route element={<AdminRoute />}><Route path="/admin" element={<AdminPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Layout>;
}
