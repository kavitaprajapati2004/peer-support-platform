import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Groups from './pages/Groups';
import Chat from './pages/Chat';
import Resources from './pages/Resources';
import Forum from './pages/Forum';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import GroupChat from './pages/GroupChat';
import ResourceCategory from './pages/ResourceCategory';
import ForumPost from './pages/ForumPost';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen pb-16 md:pb-0 flex flex-col w-full bg-slate-50">
      <Navbar />
      <main className="flex-1 overflow-x-hidden pt-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          <Route path="/groups" element={<AppLayout><Groups /></AppLayout>} />
          <Route path="/groups/:id" element={<AppLayout><GroupChat /></AppLayout>} />
          <Route path="/chat" element={<AppLayout><Chat /></AppLayout>} />
          <Route path="/forum" element={<AppLayout><Forum /></AppLayout>} />
          <Route path="/forum/:id" element={<AppLayout><ForumPost /></AppLayout>} />
          <Route path="/resources" element={<AppLayout><Resources /></AppLayout>} />
          <Route path="/resources/:id" element={<AppLayout><ResourceCategory /></AppLayout>} />
          <Route path="/admin" element={<AppLayout><AdminDashboard /></AppLayout>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
