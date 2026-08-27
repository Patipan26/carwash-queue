import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ServicesPage() {
  const [catalog, setCatalog] = useState({ services: [], addons: [] });
  const [error, setError] = useState('');
  useEffect(() => { api('/services').then(setCatalog).catch((err) => setError(err.message)); }, []);
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
    <div><h1 className="text-3xl font-bold">บริการและอัตราค่าบริการ</h1><p className="text-sm text-slate-500 mt-2">เลือกแพ็กเกจที่เหมาะกับรถของคุณ</p></div>
    {error && <p className="text-rose-600">{error}</p>}
    <section className="grid md:grid-cols-3 gap-5">{catalog.services.map((service) => <div key={service.id} className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col"><span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full px-3 py-1 self-start">แพ็กเกจบริการ</span><h2 className="text-xl font-bold mt-5">{service.name}</h2><p className="text-sm text-slate-500 mt-3 flex-1">{service.description}</p><p className="text-blue-600 text-2xl font-bold mt-6">฿{Number(service.price).toLocaleString()}</p><Link to={`/booking?service=${encodeURIComponent(service.name)}`} className="mt-5 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm">จองบริการนี้</Link></div>)}</section>
    <section><h2 className="text-xl font-bold">บริการเสริม</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">{catalog.addons.map((addon) => <div key={addon.id} className="bg-white rounded-2xl border p-5"><div className="text-2xl">✨</div><h3 className="font-bold mt-3">{addon.name}</h3><p className="text-xs text-slate-500 mt-2">{addon.description}</p><p className="text-blue-600 font-bold mt-4">฿{Number(addon.price).toLocaleString()}</p></div>)}</div></section>
  </div>;
}
