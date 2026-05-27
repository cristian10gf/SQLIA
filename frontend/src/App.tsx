import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { RegisterPage } from './features/auth/presentation/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/presentation/pages/DashboardPage';
import { CoursesPage } from './features/courses/presentation/pages/CoursesPage';
import ProfessorEvaluationsPage from './features/evaluationsAndChallenges/presentation/pages/ProfessorEvaluationsPage';
import EvaluationsListPage from './features/evaluationsAndChallenges/presentation/pages/EvaluationsListPage';
import EvaluationDetailPage from './features/evaluationsAndChallenges/presentation/pages/EvaluationDetailPage';
import { ResultsPage } from './features/results/presentation/pages/ResultsPage';
import ReportsPage from './features/reports/presentation/pages/ReportsPage';
import ManagementPage from './features/managemen/presentation/pages/ManagemenPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/evaluation" element={<ProfessorEvaluationsPage />} />
      <Route path="/evaluation/:courseId" element={<ProfessorEvaluationsPage />} />
      <Route
        path="/courses/evaluations-challenges/:courseId"
        element={<ProfessorEvaluationsPage />}
      <Route path="/evaluation" element={<ResultsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/managemen" element={<ManagementPage />} />

      <Route
        path="/courses/evaluations-challenges/:courseId"
        element={<EvaluationsListPage />}
      />

      <Route
        path="/courses/evaluations-challenges/:courseId/evaluation/:evaluationId"
        element={<EvaluationDetailPage />}
      />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/managemen" element={<ManagementPage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
