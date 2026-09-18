import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "animate.css/animate.compat.css";
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public & Student Pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import TournamentRegister from './pages/TournamentRegister';
import Games from './pages/Games';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Leaderboard from './pages/Leaderboard';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import News from './pages/News';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import MyTournaments from './pages/MyTournaments';
import MyTeams from './pages/MyTeams';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminTournaments from './pages/admin/Tournaments';
import AdminFormBuilder from './pages/admin/FormBuilder';
import AdminMatches from './pages/admin/Matches';
import AdminTeams from './pages/admin/Teams';
import AdminTournamentTeams from './pages/admin/AdminTournamentTeams';
import AdminTeamDetails from './pages/admin/AdminTeamDetails';
import AdminGames from './pages/admin/Games';
import AdminEvents from './pages/admin/Events';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminGallery from './pages/admin/Gallery';
import AdminUsers from './pages/admin/Users';

// Route Guards
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
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
              <Route path="teams">
                <Route index element={<AdminTeams />} />
                <Route path=":tournamentId" element={<AdminTournamentTeams />} />
                <Route path=":tournamentId/:registrationId" element={<AdminTeamDetails />} />
              </Route>
              <Route path="games" element={<AdminGames />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
