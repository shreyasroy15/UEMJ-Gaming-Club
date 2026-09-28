import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "animate.css/animate.compat.css";
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Loading from './components/Loading/Loading';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Home is kept eager for immediate 0ms first paint
import Home from './pages/Home';

// Lazy-loaded Public & Student Pages (Code Splitting)
const Tournaments = lazy(() => import('./pages/Tournaments'));
const TournamentDetails = lazy(() => import('./pages/TournamentDetails'));
const TournamentRegister = lazy(() => import('./pages/TournamentRegister'));
const Games = lazy(() => import('./pages/Games'));
const Teams = lazy(() => import('./pages/Teams'));
const TeamDetails = lazy(() => import('./pages/TeamDetails'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Events = lazy(() => import('./pages/Events'));
const Gallery = lazy(() => import('./pages/Gallery'));
const News = lazy(() => import('./pages/News'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const MyTournaments = lazy(() => import('./pages/MyTournaments'));
const MyTeams = lazy(() => import('./pages/MyTeams'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Lazy-loaded Admin Pages (Massive bundle reduction for normal visitors)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminTournaments = lazy(() => import('./pages/admin/Tournaments'));
const AdminFormBuilder = lazy(() => import('./pages/admin/FormBuilder'));
const AdminMatches = lazy(() => import('./pages/admin/Matches'));
const AdminPointsTable = lazy(() => import('./pages/admin/PointsTable'));
const AdminTeams = lazy(() => import('./pages/admin/Teams'));
const AdminTournamentTeams = lazy(() => import('./pages/admin/AdminTournamentTeams'));
const AdminTeamDetails = lazy(() => import('./pages/admin/AdminTeamDetails'));
const AdminGames = lazy(() => import('./pages/admin/Games'));
const AdminEvents = lazy(() => import('./pages/admin/Events'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminGallery = lazy(() => import('./pages/admin/Gallery'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminGameView = lazy(() => import('./pages/admin/AdminGameView'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Route Guards
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<Loading message="Entering arena..." compact />}>
            <Routes>
            {/* Main Public & Player Layout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="tournaments" element={<Tournaments />} />
              <Route path="tournaments/:id" element={<TournamentDetails />} />
              <Route path="tournaments/:id/register" element={<TournamentRegister />} />
              <Route path="games" element={<Games />} />
              <Route path="teams" element={<Teams />} />
              <Route path="teams/:id" element={<TeamDetails />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="points-table" element={<Leaderboard />} />
              <Route path="events" element={<Events />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="news" element={<News />} />
              <Route path="announcements" element={<News />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />

              {/* Protected Student Routes */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile/:id"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-tournaments"
                element={
                  <ProtectedRoute>
                    <MyTournaments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-teams"
                element={
                  <ProtectedRoute>
                    <MyTeams />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Management Suite */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="tournaments" element={<AdminTournaments />} />
              <Route path="tournaments/:id/form" element={<AdminFormBuilder />} />
              <Route path="matches" element={<AdminMatches />} />
              <Route path="points-table" element={<AdminPointsTable />} />
              <Route path="teams">
                <Route index element={<AdminTeams />} />
                <Route path=":tournamentId" element={<AdminTournamentTeams />} />
                <Route path=":tournamentId/:registrationId" element={<AdminTeamDetails />} />
              </Route>
              <Route path="games" element={<AdminGames />} />
              <Route path="games/:gameKey" element={<AdminGameView />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
