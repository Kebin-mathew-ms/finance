import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  User, 
  LogOut, 
  Key, 
  Settings, 
  Menu, 
  X,
  Camera,
  Phone,
  Wallet,
  Target,
  Clock,
  Bell,
  Mic,
  Search,
  Download,
  FileText,
  Heart,
  BarChart2,
  Sparkles,
  BrainCircuit,
  ShieldAlert
} from 'lucide-react';
import apiClient from '../api/client';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const AppLayout = () => {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile update form states
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await apiClient.get('/notifications?size=1');
        setUnreadCount(res.data.unread_count || 0);
      } catch (err) {
        console.error("Failed to load notifications count:", err);
      }
    };
    fetchUnreadCount();
  }, [location.pathname]);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Income', path: '/income', icon: ArrowUpRight },
    { name: 'Expenses', path: '/expense', icon: ArrowDownRight },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Savings Goals', path: '/goals', icon: Target },
    { name: 'Reminders', path: '/reminders', icon: Clock },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'OCR Scans', path: '/ocr/history', icon: Camera },
    { name: 'Voice Input', path: '/voice/expense', icon: Mic },
    { name: 'Global Search', path: '/search', icon: Search },
    { name: 'Data Export', path: '/exports', icon: Download },
    { name: 'Storage Settings', path: '/files/management', icon: FileText },
    { name: 'Financial Health', path: '/analytics/health', icon: Heart },
    { name: 'Expense Trends', path: '/analytics/trends', icon: BarChart2 },
    { name: 'Spending Patterns', path: '/analytics/patterns', icon: BarChart2 },
    { name: 'AI Suggestions', path: '/ai/recommendations', icon: Sparkles },
    { name: 'Expense Forecasts', path: '/ai/predictions', icon: BrainCircuit },
    { name: 'Outlier Anomalies', path: '/ai/anomalies', icon: ShieldAlert },
    { name: 'Statement Reports', path: '/reports', icon: FileText }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('phone_number', phoneNumber);
    if (profileImageFile) {
      formData.append('profile_image', profileImageFile);
    }

    const res = await updateProfile(formData);
    setProfileLoading(false);
    if (res.success) {
      setProfileSuccess('Profile updated successfully!');
      setProfileImageFile(null);
    } else {
      setProfileError(res.error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwLoading(true);
    setPwError('');
    setPwSuccess('');

    const res = await changePassword({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword
    });
    
    setPwLoading(false);
    if (res.success) {
      setPwSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPwError(res.error);
    }
  };

  const openSettings = () => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setPhoneNumber(user?.phone_number || '');
    setProfilePreview(user?.profile_image ? `http://localhost:8000/uploads/${user.profile_image}` : null);
    setProfileError('');
    setProfileSuccess('');
    setPwError('');
    setPwSuccess('');
    setSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex">
      {/* 1. Mobile Sidebar Toggle Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        ></div>
      )}

      {/* 2. Sidebar Navigation */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-indigo to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-indigo/25">
              <span className="text-sm font-bold text-white tracking-wider">F</span>
            </div>
            <span className="font-bold text-zinc-200 tracking-tight text-sm uppercase">Finance</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-accent-indigo/10 text-accent-indigo border-l-2 border-accent-indigo shadow-md shadow-accent-indigo/5' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-accent-indigo' : 'text-zinc-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent-rose text-white shrink-0">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Controls */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/20">
          <div className="flex items-center space-x-3 px-2 py-2 mb-2">
            <div className="relative w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
              {user?.profile_image ? (
                <img 
                  src={`http://localhost:8000/uploads/${user.profile_image}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-zinc-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={openSettings}
              className="flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-800 hover:text-zinc-200 transition"
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-800 text-accent-rose bg-zinc-900/40 hover:bg-accent-rose/10 transition"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-zinc-200 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-base font-bold text-zinc-200 tracking-tight capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link 
              to="/notifications" 
              className="relative p-1.5 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-800 hover:text-zinc-200 transition duration-150"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-rose text-[8px] font-extrabold text-white ring-2 ring-zinc-950">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="hidden sm:block text-xs font-semibold text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800">
              Session Expires: 24 Hours
            </div>
          </div>
        </header>

        {/* Content Area Viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* 4. Settings / Profile Edit Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Account Settings"
        confirmText="Save Settings"
      >
        {/* Tab Selection */}
        <div className="flex border-b border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-sm font-semibold border-b-2 text-center transition-all ${
              activeTab === 'profile'
                ? 'border-accent-indigo text-accent-indigo'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 text-sm font-semibold border-b-2 text-center transition-all ${
              activeTab === 'password'
                ? 'border-accent-indigo text-accent-indigo'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Password Security
          </button>
        </div>

        {/* PROFILE TAB FORM */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && <p className="text-xs text-accent-rose bg-accent-rose/10 p-2.5 rounded-lg border border-accent-rose/25">⚠ {profileError}</p>}
            {profileSuccess && <p className="text-xs text-accent-emerald bg-accent-emerald/10 p-2.5 rounded-lg border border-accent-emerald/25">✓ {profileSuccess}</p>}

            {/* Profile Avatar Upload Layout */}
            <div className="flex flex-col items-center py-2 space-y-2">
              <div className="relative w-20 h-20 rounded-full border-2 border-white/10 bg-zinc-800 flex items-center justify-center overflow-hidden group shadow-lg">
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-zinc-500" />
                )}
                {/* Upload Hover Overlay */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-200">
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Hover to Upload Profile Image</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            
            <Input
              label="Phone Number"
              icon={Phone}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={profileLoading}>
                Save Profile
              </Button>
            </div>
          </form>
        )}

        {/* PASSWORD TAB FORM */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {pwError && <p className="text-xs text-accent-rose bg-accent-rose/10 p-2.5 rounded-lg border border-accent-rose/25">⚠ {pwError}</p>}
            {pwSuccess && <p className="text-xs text-accent-emerald bg-accent-emerald/10 p-2.5 rounded-lg border border-accent-emerald/25">✓ {pwSuccess}</p>}

            <Input
              label="Current Password"
              type="password"
              icon={Key}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            
            <Input
              label="New Password"
              type="password"
              icon={Key}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={Key}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={pwLoading}>
                Change Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AppLayout;
