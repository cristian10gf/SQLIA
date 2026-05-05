import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { RegisterPage } from './features/auth/presentation/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/presentation/pages/DashboardPage';
import { CoursesPage } from './features/courses/presentation/pages/CoursesPage';
import EvaluationsAndChallengesPage from './features/evaluationsAndChallenges/presentation/pages/EvaluationsAndChallengesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/courses" element={<CoursesPage />} />
      <Route
        path="/dashboard/evaluations-challenges"
        element={<EvaluationsAndChallengesPage />}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;