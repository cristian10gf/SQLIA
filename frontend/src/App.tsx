import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { RegisterPage } from './features/auth/presentation/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/presentation/pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;