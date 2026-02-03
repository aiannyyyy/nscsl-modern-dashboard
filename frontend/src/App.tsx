import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/login/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PDOOverview } from './pages/pdo/PDOOverview';
import { AdminOverview } from './pages/admin/AdminOverview';
import { LaboratoryOverview } from './pages/laboratory/LaboratoryOverview';
import { FollowupOverview } from './pages/followup/FollowupOverview';
import { ITJobOrderOverview } from './pages/it-job-order/ITJobOrderOverview';
import { SampleReceived } from './pages/pdo/SampleReceived';
import { SampleScreened } from './pages/pdo/SampleScreened';
import { Unsatisfactory } from './pages/pdo/Unsatisfactory';
import ListCar from './pages/pdo/ListCar';
import NSFPerformance from './pages/pdo/NSFPerformance';


function App() {
  return (
    <AuthProvider>
      {/* ✅ Only AuthProvider needed - it already has user info! */}
      <BrowserRouter>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Root redirects to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Redirect dashboard root to PDO */}
            <Route index element={<Navigate to="/dashboard/pdo" replace />} />

            {/* PDO Routes */}
            <Route path="pdo" element={<PDOOverview />} />
            <Route path="pdo/sample-received" element={<SampleReceived />} />
            <Route path="pdo/sample-screened" element={<SampleScreened />} />
            <Route path="pdo/unsatisfactory" element={<Unsatisfactory />} />
            <Route path="pdo/nsf-performance" element={<NSFPerformance />} />
            <Route path="pdo/list-of-car" element={<ListCar />} />

            {/* Admin Routes */}
            <Route path="admin" element={<AdminOverview />} />
            <Route path="admin/accounting" element={<div>Accounting Page</div>} />
            <Route path="admin/supply" element={<div>Supply & Purchasing Page</div>} />

            {/* Laboratory Routes */}
            <Route path="laboratory" element={<LaboratoryOverview />} />
            <Route path="laboratory/demo-unsat" element={<div>Demo & Unsat Page</div>} />

            {/* Followup Routes */}
            <Route path="followup" element={<FollowupOverview />} />

            {/* IT Job Order Routes */}
            <Route path="it-job-order" element={<ITJobOrderOverview />} />
          </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;