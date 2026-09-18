import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { formatThaiDate, getBangkokToday } from '../utils/date';

const timeSlots = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00'
];

export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalog, setCatalog] = useState({ services: [], addons: [] });
  const [serviceId, setServiceId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [slip, setSlip] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [form, setForm] = useState({
    bookingDate: '',
    bookingTime: '',
    customerName: '',
    customerPhone: '',
    carModel: '',
    carPlate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/services')
      .then((data) => {
        setCatalog(data);
        const wanted = new URLSearchParams(location.search).get('service');
        const selected = data.services.find((item) => item.name === wanted);
        setServiceId(String(selected?.id || data.services[0]?.id || ''));
      })
      .catch((err) => setError(err.message));
  }, [location.search]);

  useEffect(() => {
    if (!form.bookingDate) {
      setAvailability([]);
      return undefined;
    }

    let cancelled = false;
    setAvailabilityLoading(true);
    api(`/bookings/availability?date=${encodeURIComponent(form.bookingDate)}`)
      .then((data) => {
        if (cancelled) return;
        setAvailability(data.slots);
        setSlotCapacity(data.capacity);
        setForm((current) => {
          const selected = data.slots.find((slot) => slot.time === current.bookingTime);
          return selected?.available ? current : { ...current, bookingTime: '' };
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => { cancelled = true; };
  }, [form.bookingDate]);

  const selectedService = catalog.services.find((item) => String(item.id) === String(serviceId));
  const selectedAddons = catalog.addons.filter((item) => addonIds.includes(Number(item.id)));
  const total = useMemo(
    () => Number(selectedService?.price || 0) + selectedAddons.reduce((sum, item) => sum + Number(item.price), 0),
    [selectedService, selectedAddons]
  );

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'bookingDate' ? { bookingTime: '' } : {})
    }));
  };

  function getSlot(time) {
    return availability.find((slot) => slot.time === time) || {
      time,
      available: true,
      remaining: slotCapacity,
      bookedCount: 0
    };
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!user) return navigate(`/auth?return=${encodeURIComponent('/booking')}`);
    setBusy(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append('serviceId', serviceId);
      body.append('addonIds', JSON.stringify(addonIds));
      if (slip) body.append('slip', slip);

      const result = await api('/bookings', { method: 'POST', body });
      setSuccess(`จองคิวสำเร็จ รหัสการจอง ${result.bookingCode} ยอดรวม ฿${Number(result.totalPrice).toLocaleString()}`);
      setAvailability((current) => current.map((slot) => slot.time === form.bookingTime
        ? { ...slot, bookedCount: slot.bookedCount + 1, remaining: Math.max(slot.remaining - 1, 0), available: slot.remaining - 1 > 0 }
        : slot));
    } catch (err) {
      setError(err.message);
      if (err.message.includes('เต็มแล้ว')) {
        setAvailability((current) => current.map((slot) => slot.time === form.bookingTime
          ? { ...slot, remaining: 0, available: false }
          : slot));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
      <div className="mb-7">
        <p className="eyebrow">Make a booking</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f3a] md:text-5xl">จองคิวออนไลน์</h1>
        <p className="text-sm text-slate-500 mt-2">ระบุรายละเอียดและแนบสลิปเพื่อส่งคำขอจอง</p>
      </div>

      {error && <div className="mb-5 bg-rose-50 text-rose-700 rounded-xl p-3 text-sm">{error}</div>}
      {success && <div className="mb-5 bg-emerald-50 text-emerald-700 rounded-xl p-4 text-sm">{success} <Link to="/status" className="font-bold underline ml-2">ดูสถานะ</Link></div>}

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-6">
          <section className="surface rounded-xl p-6 md:p-7">
            <h2 className="border-l-2 border-blue-600 pl-3 font-bold text-[#0b1f3a]">เลือกวันและเวลา</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm font-semibold">
                วันที่
                <input type="date" required min={getBangkokToday()} value={form.bookingDate} onChange={(e) => update('bookingDate', e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" />
                {form.bookingDate && <span className="block mt-2 text-xs font-medium text-blue-600">วันที่เลือก: {formatThaiDate(form.bookingDate, { withWeekday: true })}</span>}
              </label>
              <label className="text-sm font-semibold">
                ช่วงเวลา
                <select required value={form.bookingTime} onChange={(e) => update('bookingTime', e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal bg-white">
                  <option value="">-- เลือกเวลา --</option>
                  {timeSlots.map((time) => {
                    const slot = getSlot(time);
                    return <option key={time} value={time} disabled={!slot.available}>
                      {time}{form.bookingDate && (slot.available ? ` (เหลือ ${slot.remaining}/${slotCapacity})` : ' (เต็มแล้ว)')}
                    </option>;
                  })}
                </select>
              </label>
            </div>
            {form.bookingDate && <p className="text-xs text-slate-500 mt-3">จำกัด {slotCapacity} คันต่อช่วงเวลา {availabilityLoading && '· กำลังตรวจสอบคิว...'}</p>}
          </section>

          <section className="surface rounded-xl p-6 md:p-7">
            <h2 className="border-l-2 border-blue-600 pl-3 font-bold text-[#0b1f3a]">บริการหลัก</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {catalog.services.map((service) => <label key={service.id} className={`cursor-pointer border-2 rounded-xl p-4 ${String(service.id) === String(serviceId) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <input type="radio" name="service" value={service.id} checked={String(service.id) === String(serviceId)} onChange={(e) => setServiceId(e.target.value)} className="sr-only" />
                <span className="block font-bold text-sm">{service.name}</span>
                <span className="block text-xs text-slate-500 mt-2">{service.description}</span>
                <span className="block text-blue-600 font-bold mt-3">฿{Number(service.price).toLocaleString()}</span>
              </label>)}
            </div>
          </section>

          <section className="surface rounded-xl p-6 md:p-7">
            <h2 className="border-l-2 border-blue-600 pl-3 font-bold text-[#0b1f3a]">บริการเสริม</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {catalog.addons.map((addon) => <label key={addon.id} className="border rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <span className="flex items-center gap-3"><input type="checkbox" checked={addonIds.includes(Number(addon.id))} onChange={(e) => setAddonIds(e.target.checked ? [...addonIds, Number(addon.id)] : addonIds.filter((id) => id !== Number(addon.id)))} /><span><b className="text-sm">{addon.name}</b><small className="block text-xs text-slate-500">{addon.description}</small></span></span>
                <b className="text-blue-600 text-sm">฿{Number(addon.price).toLocaleString()}</b>
              </label>)}
            </div>
          </section>

          <section className="surface rounded-xl p-6 md:p-7">
            <h2 className="font-bold mb-4">ข้อมูลลูกค้าและรถ</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[['customerName', 'ชื่อ - นามสกุล'], ['customerPhone', 'เบอร์โทรศัพท์'], ['carModel', 'รุ่นรถ'], ['carPlate', 'ทะเบียนรถ']].map(([key, label]) => <label key={key} className="text-sm font-semibold">
                {label}<input required value={form[key]} onChange={(e) => update(key, e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" />
              </label>)}
            </div>
            <label className="block text-sm font-semibold mt-4">สลิปการชำระเงิน <span className="text-xs text-slate-400 font-normal">(ถ้ามี)</span>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setSlip(e.target.files?.[0] || null)} className="mt-1 w-full border rounded-xl p-3 text-xs font-normal bg-slate-50" />
            </label>
            <p className="text-xs text-slate-500 mt-2">ระบบจะตั้งสถานะรอตรวจสอบเมื่อแนบสลิป แอดมินจะตรวจสอบก่อนยืนยันการจอง</p>
          </section>
        </div>

        <aside className="surface h-fit rounded-xl border-t-4 border-t-blue-600 p-6 shadow-sm sticky top-24">
          <h2 className="font-bold text-[#0b1f3a] border-b pb-4">สรุปการจอง</h2>
          <div className="space-y-3 text-sm py-4">
            <div className="flex justify-between gap-4"><span className="text-slate-500">บริการหลัก</span><b>{selectedService?.name || '-'}</b></div>
            {selectedAddons.map((addon) => <div key={addon.id} className="flex justify-between gap-4 text-xs"><span className="text-slate-500">+ {addon.name}</span><b>฿{Number(addon.price).toLocaleString()}</b></div>)}
            <div className="flex justify-between gap-4"><span className="text-slate-500">วันเวลา</span><b>{formatThaiDate(form.bookingDate, { withWeekday: true })} {form.bookingTime && `| ${form.bookingTime}`}</b></div>
          </div>
          <div className="border-t pt-4 flex justify-between items-center"><span className="font-semibold">ยอดรวม</span><span className="text-2xl text-blue-600 font-bold">฿{total.toLocaleString()}</span></div>
          <button disabled={busy || !catalog.services.length || availabilityLoading} className="w-full mt-5 bg-blue-600 disabled:opacity-60 hover:bg-blue-700 text-white py-3 rounded-xl font-bold">{busy ? 'กำลังบันทึก...' : user ? 'ยืนยันการจอง' : 'เข้าสู่ระบบเพื่อจอง'}</button>
        </aside>
      </form>
    </div>
  );
}
