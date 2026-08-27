import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function AuthPage() {
  const [registerMode, setRegisterMode] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { const user = registerMode ? await register(form.email, form.password) : await login(form.email, form.password); navigate(user.role === 'admin' ? '/admin' : '/'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <div className="min-h-[70vh] flex items-center justify-center px-4 py-12"><div className="bg-white border rounded-2xl shadow-sm p-7 w-full max-w-md"><div className="flex border-b mb-6"><button onClick={() => setRegisterMode(false)} className={`w-1/2 pb-3 text-sm font-semibold ${!registerMode ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>เข้าสู่ระบบ</button><button onClick={() => setRegisterMode(true)} className={`w-1/2 pb-3 text-sm font-semibold ${registerMode ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>สมัครสมาชิก</button></div><h1 className="text-2xl font-bold">{registerMode ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}</h1><p className="text-sm text-slate-500 mt-2">ใช้บัญชีของคุณเพื่อจัดการการจอง</p>{error && <div className="mt-4 bg-rose-50 text-rose-700 rounded-xl p-3 text-sm">{error}</div>}<form onSubmit={submit} className="space-y-4 mt-6"><div><label className="text-sm font-semibold">อีเมล</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="example@mail.com" /></div><div><label className="text-sm font-semibold">รหัสผ่าน</label><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="อย่างน้อย 6 ตัวอักษร" /></div><button disabled={busy} className="w-full bg-blue-600 disabled:opacity-60 hover:bg-blue-700 text-white py-3 rounded-xl font-bold">{busy ? 'กำลังดำเนินการ...' : registerMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button></form></div></div>;
}
