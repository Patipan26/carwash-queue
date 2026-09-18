import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Icon } from '../components/Icons';
import { formatThaiDate, toDateInputValue } from '../utils/date';

const statusLabels = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก'
};

const paymentLabels = {
  unpaid: 'ยังไม่ชำระ',
  pending_review: 'รอตรวจสอบ',
  verified: 'ตรวจสอบแล้ว',
  rejected: 'ไม่ผ่านการตรวจสอบ'
};

function includesText(item, search) {
  if (!search.trim()) return true;
  const value = [
    item.bookingCode,
    item.customerName,
    item.customerPhone,
    item.carPlate,
    item.carModel,
    item.service
  ].join(' ').toLowerCase();
  return value.includes(search.trim().toLowerCase());
}

export default function AdminPage() {
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [bookingFilter, setBookingFilter] = useState({ search: '', status: 'all', date: '', payment: 'all' });
  const [contactFilter, setContactFilter] = useState({ search: '', status: 'all' });
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [bookingData, contactData] = await Promise.all([
        api('/admin/bookings'),
        api('/admin/contacts')
      ]);
      setBookings(bookingData.bookings);
      setContacts(contactData.contacts);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try {
      await api(`/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteContact(id) {
    if (!window.confirm('ต้องการลบข้อความนี้หรือไม่')) return;
    try {
      await api(`/admin/contacts/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredBookings = useMemo(() => bookings.filter((item) => {
    const bookingDate = toDateInputValue(item.bookingDate);
    return includesText(item, bookingFilter.search)
      && (bookingFilter.status === 'all' || item.status === bookingFilter.status)
      && (!bookingFilter.date || bookingDate === bookingFilter.date)
      && (bookingFilter.payment === 'all' || item.paymentStatus === bookingFilter.payment);
  }), [bookings, bookingFilter]);

  const filteredContacts = useMemo(() => contacts.filter((item) => {
    const value = [item.senderName, item.senderContact, item.subject, item.message].join(' ').toLowerCase();
    return (!contactFilter.search.trim() || value.includes(contactFilter.search.trim().toLowerCase()))
      && (contactFilter.status === 'all' || item.status === contactFilter.status);
  }), [contacts, contactFilter]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f3a] md:text-5xl">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-2">จัดการรายการจองและข้อความจากลูกค้า</p>
        </div>
        <button onClick={load} className="secondary-button !px-3 !py-2 text-sm"><Icon name="dashboard" size={16} />รีเฟรช</button>
      </div>

      {error && <p className="text-rose-600 mb-4">{error}</p>}

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('bookings')} className={`px-4 py-3 text-sm font-semibold ${tab === 'bookings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          รายการจอง ({filteredBookings.length}/{bookings.length})
        </button>
        <button onClick={() => setTab('contacts')} className={`px-4 py-3 text-sm font-semibold ${tab === 'contacts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
          ข้อความ ({filteredContacts.length}/{contacts.length})
        </button>
      </div>

      {tab === 'bookings' ? (
        <>
          <div className="surface mb-6 rounded-xl p-5">
            <div className="grid md:grid-cols-4 gap-3">
              <input
                value={bookingFilter.search}
                onChange={(e) => setBookingFilter({ ...bookingFilter, search: e.target.value })}
                placeholder="ค้นหารหัสจอง ชื่อลูกค้า ทะเบียนรถ"
                className="border rounded-xl px-3 py-2 text-sm md:col-span-2"
              />
              <select value={bookingFilter.status} onChange={(e) => setBookingFilter({ ...bookingFilter, status: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white">
                <option value="all">ทุกสถานะการจอง</option>
                {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <input type="date" value={bookingFilter.date} onChange={(e) => setBookingFilter({ ...bookingFilter, date: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <select value={bookingFilter.payment} onChange={(e) => setBookingFilter({ ...bookingFilter, payment: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white">
                <option value="all">ทุกสถานะการชำระเงิน</option>
                {Object.entries(paymentLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <button onClick={() => setBookingFilter({ search: '', status: 'all', date: '', payment: 'all' })} className="text-sm text-slate-500 hover:text-blue-600">ล้างตัวกรอง</button>
              <span className="text-xs text-slate-400">พบ {filteredBookings.length} รายการ</span>
            </div>
          </div>

          <div className="surface overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-4">วันเวลา</th><th className="p-4">ลูกค้า</th><th className="p-4">รถ</th><th className="p-4">บริการ</th><th className="p-4">ยอดรวม</th><th className="p-4">สถานะ</th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredBookings.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4">{formatThaiDate(item.bookingDate, { withWeekday: true })}<br /><span className="text-xs text-slate-400">{item.bookingTime}</span></td>
                    <td className="p-4">{item.customerName}<br /><span className="text-xs text-slate-400">{item.customerPhone}</span></td>
                    <td className="p-4">{item.carPlate}<br /><span className="text-xs text-slate-400">{item.carModel}</span></td>
                    <td className="p-4 font-semibold">{item.service}<br /><span className="text-xs text-slate-500">{item.addons?.map((a) => `+ ${a.name}`).join(', ') || 'ไม่มีบริการเสริม'}</span></td>
                    <td className="p-4 font-bold text-blue-600">฿{Number(item.totalPrice).toLocaleString()}</td>
                    <td className="p-4 min-w-44">
                      <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} className="border rounded-lg p-2 text-xs bg-white w-full">
                        {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                      <div className="text-[11px] text-slate-400 mt-2">ชำระเงิน: {paymentLabels[item.paymentStatus] || item.paymentStatus}</div>
                      {item.slipPath && <a href={item.slipPath} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">ดูสลิป</a>}
                    </td>
                  </tr>
                ))}
                {!filteredBookings.length && <tr><td colSpan="6" className="p-10 text-center text-slate-400">ไม่พบรายการตามตัวกรอง</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="surface mb-6 flex flex-wrap gap-3 rounded-xl p-5">
            <input value={contactFilter.search} onChange={(e) => setContactFilter({ ...contactFilter, search: e.target.value })} placeholder="ค้นหาผู้ส่ง หัวข้อ หรือข้อความ" className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-64" />
            <select value={contactFilter.status} onChange={(e) => setContactFilter({ ...contactFilter, status: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white">
              <option value="all">ทุกสถานะข้อความ</option><option value="unread">ยังไม่อ่าน</option><option value="read">อ่านแล้ว</option><option value="archived">เก็บถาวร</option>
            </select>
            <button onClick={() => setContactFilter({ search: '', status: 'all' })} className="text-sm text-slate-500 hover:text-blue-600">ล้างตัวกรอง</button>
          </div>

          <div className="surface overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b"><tr><th className="p-4">ผู้ส่ง</th><th className="p-4">หัวข้อ</th><th className="p-4">ข้อความ</th><th className="p-4">ไฟล์แนบ</th><th className="p-4">จัดการ</th></tr></thead>
              <tbody className="divide-y">
                {filteredContacts.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4">{item.senderName}<br /><span className="text-xs text-slate-400">{item.senderContact}</span></td>
                    <td className="p-4">{item.subject}<br /><span className="text-xs text-slate-400">{item.status}</span></td>
                    <td className="p-4 max-w-sm">{item.message}</td>
                    <td className="p-4">{item.attachmentPath ? <a href={item.attachmentPath} target="_blank" rel="noreferrer" className="text-blue-600 underline">เปิดไฟล์</a> : '-'}</td>
                    <td className="p-4"><button onClick={() => deleteContact(item.id)} className="text-rose-600 font-semibold">ลบ</button></td>
                  </tr>
                ))}
                {!filteredContacts.length && <tr><td colSpan="5" className="p-10 text-center text-slate-400">ไม่พบข้อความตามตัวกรอง</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
