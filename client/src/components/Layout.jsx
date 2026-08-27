import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const links = [
  ['/', 'หน้าแรก'],
  ['/services', 'บริการ/ราคา'],
  ['/booking', 'จองคิว'],
  ['/status', 'ตรวจสอบสถานะ'],
  ['/contact', 'ติดต่อเรา']
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-blue-600 whitespace-nowrap">🚗 CarWash Queue</Link>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1' : 'text-slate-600 hover:text-blue-600'}>{label}</NavLink>
            ))}
            {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => isActive ? 'text-rose-600 font-semibold' : 'text-rose-500 hover:text-rose-700'}>หลังบ้าน</NavLink>}
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-xs text-slate-500 max-w-36 truncate">{user.email}</span>
              <button onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-semibold">ออกจากระบบ</button>
            </div>
          ) : (
            <Link to="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium">เข้าสู่ระบบ</Link>
          )}
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs">© 2026 CarWash Queue System. All rights reserved.</footer>
    </div>
  );
}
