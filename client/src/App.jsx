import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Upload from './pages/Upload';
import ProjectDetails from './pages/ProjectDetails';
import PublicProfile from './pages/PublicProfile';
import Studio from './pages/Studio';
import EditProject from './pages/EditProject';
import Support from './pages/Support';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import Hackathons from './pages/Hackathons';
import Explore from './pages/Explore';
import Admin from './pages/Admin';
import About from './pages/About';
import NexusExchange from './pages/NexusExchange';
import PulseForge from './pages/PulseForge';
import Changelog from './pages/Changelog';
import Economy from './pages/Economy';
import ProjectCard from './components/ProjectCard';
import ActivityFeed from './components/ActivityFeed';
import FeaturedCarousel from './components/FeaturedCarousel';
import AdUnit from './components/AdUnit';
import Ticker from './components/Ticker';
import Layout from './components/Layout'; // Import Layout
import CookieConsent from './components/CookieConsent';
import AchievementHub from './components/AchievementHub';
import { LogOut, Upload as UploadIcon, Trophy, User, Code, Terminal, Bell, BellDot, LayoutDashboard, ChevronDown, HelpCircle, Menu, X, Globe, Target } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from './api';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const { currentUser } = useAuth();

  // 2. Global Connection Monitor (Heartbeat) - REDIRECT PROTOCOL
  useEffect(() => {
    const monitorConnectivity = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
        if (!response.ok && response.status >= 502) {
          window.location.href = '/maintenance.html';
        }
      } catch (err) {
        // Network error (server down)
        window.location.href = '/maintenance.html';
      }
    };

    const checkInterval = setInterval(monitorConnectivity, 30000); // Check every 30s when on main app
    return () => clearInterval(checkInterval);
  }, []);

  // 3. Global Axios Interceptor for Auto-Moderation & IP Bans
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const { status } = error.response || {};

        // Handle Server Down (502, 503, 504) or Network Error (no status)
        if (!status || status >= 502) {
          window.location.href = '/maintenance.html';
        }

        if (status === 429) {
          console.error(`[FIREWALL] Throttling active.`);
          return Promise.reject(error);
        }

        if (status === 403) {
          if (window.location.pathname === '/banned') return Promise.reject(error);
          console.warn('[SECURITY] Access blocked.');
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/support" element={<Support />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/about" element={<About />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/exchange" element={<NexusExchange />} />
            <Route path="/forge" element={<PulseForge />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/economy" element={<Economy />} />


            <Route path="/studio" element={<Studio />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/edit/:id" element={<EditProject />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          {currentUser && <AchievementHub currentUser={currentUser} />}
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

const Home = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') || '');
  const [category, setCategory] = useState('All');
  const categories = ['All', 'Web', 'Game', 'Tool', 'AI', 'Script', 'Module', 'Mobile'];

  const [sortBy, setSortBy] = useState('newest');


  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/projects`, {
          params: { search, category, sort: sortBy }
        });
        setProjects(res.data);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProjects, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [search, category, sortBy]); // Added sortBy to dependencies

  // Sync search with URL for tags
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('search');
    if (tag) setSearch(tag);
  }, [window.location.search]);

  return (
    <div className="min-h-screen space-y-20">
      {/* Hero Section Reimagined */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl mt-4 border border-glass-border shadow-2xl bg-void">
        {/* Background Video/Image Parallax */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img src="https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop" className="w-full h-full object-cover opacity-20 mix-blend-screen scale-110 animate-float" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-transparent to-void" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay" />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-block px-4 py-2 border border-neon-green/30 rounded-full bg-neon-green/5 text-neon-green font-mono text-xs tracking-[0.3em] mb-6 backdrop-blur-md uppercase"
            >
              System_Version_3.0_Online
            </motion.span>
            <h1 className="text-7xl md:text-[9rem] font-black text-white tracking-tighter leading-[0.85] mb-6 text-glow select-none">
              KP<span className="text-neon-green relative inline-block">
                HUB
                <span className="absolute -top-4 -right-4 w-4 h-4 bg-neon-green rounded-full animate-pulse" />
              </span>
            </h1>
            <p className="text-xl md:text-3xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
              The decentralized nexus for <span className="text-white font-bold text-glow-sm">collaborative innovation</span>.
              Deploy protocols, earn KPC, and shape the future of the grid.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8"
          >

            <Link to="/explore" className="group relative px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">
              <span className="relative z-10 flex items-center gap-3">Enter The Grid <Globe className="w-5 h-5" /></span>
              <div className="absolute inset-0 bg-neon-green translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link to={currentUser ? "/upload" : "/signup"} className="px-10 py-5 border border-white/20 hover:border-white/50 bg-white/5 text-white font-black uppercase tracking-widest text-sm rounded-xl backdrop-blur-md hover:bg-white/10 transition-all flex items-center gap-3">
              <Terminal className="w-5 h-5 text-neon-blue" />
              {currentUser ? 'Deploy System' : 'Initialize Protocol'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Ticker */}
      <Ticker />

      {/* Search Bar - Floating */}
      <div className="sticky top-24 z-40 max-w-2xl mx-auto pt-4 pb-2">
        <div className="glass-panel p-2 rounded-2xl flex items-center shadow-2xl relative group focus-within:ring-2 focus-within:ring-neon-green/50 transition-all">
          <div className="pl-4 pr-3 text-gray-500 group-focus-within:text-neon-green transition-colors">
            <Terminal className="h-6 w-6" />
          </div>
          <input
            type="text"
            placeholder="Search systems by query..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 text-lg font-mono py-2 outline-none"
          />
          <div className="pr-2 flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-void/50 border border-gray-800 text-gray-400 text-xs font-bold uppercase rounded-lg px-3 py-2 focus:border-neon-blue outline-none cursor-pointer hover:text-white transition-all"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <FeaturedCarousel projects={projects} />

      {/* Promoted Systems */}
      {projects.some(p => p.boostedUntil && new Date(p.boostedUntil) > new Date()) && (
        <div className="max-w-7xl mx-auto px-4 mb-20">
          <section className="space-y-10">
            <div className="flex items-center gap-3 border-b border-neon-green/20 pb-6">
              <div className="w-2 h-8 bg-neon-green shadow-[0_0_15px_#39FF14]" />
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Promoted_Systems</h2>
                <p className="text-xs text-gray-500 font-mono italic uppercase">Priority bandwidth allocation via KPC Protocols.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {projects
                .filter(p => p.boostedUntil && new Date(p.boostedUntil) > new Date())
                .slice(0, 4)
                .map((project, i) => (
                  <ProjectCard key={`promoted-${project.id}`} project={project} index={i} />
                ))}
            </div>
          </section>
        </div>
      )}

      {/* Trending Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <section className="space-y-10">
          <div className="flex justify-between items-end border-b border-glass-border pb-6">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-neon-green" />
                Trending Protocols
              </h2>
              <p className="text-gray-500 font-mono text-sm">Most active systems in the last 24 cycles.</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-void border border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg focus:border-neon-blue outline-none cursor-pointer hover:text-white transition-all"
              >
                <option value="newest">Latest</option>
                <option value="liked">Top_Rated</option>
                <option value="viewed">Most_Viewed</option>
              </select>
              <Link to="/explore" className="text-neon-green font-bold uppercase tracking-widest text-xs hover:underline flex items-center gap-1">
                View_All <ChevronDown className="w-3 h-3 -rotate-90" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="aspect-[4/3] bg-terminal rounded-2xl animate-pulse border border-gray-900" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </section>

        <AdUnit slot="home-feed-slot" format="auto" />

        {/* Community Activity */}
        <div className="mt-20">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default App;
