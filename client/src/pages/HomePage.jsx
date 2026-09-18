import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';

const highlights = [
  ['01', 'เลือกบริการ', 'ดูแพ็กเกจและราคาที่เหมาะกับรถของคุณ'],
  ['02', 'เลือกวันเวลา', 'เห็นจำนวนคิวว่างก่อนยืนยันการจอง'],
  ['03', 'ติดตามสถานะ', 'ตรวจสอบรายการจองได้จากบัญชีของคุณ']
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[#0b1f3a] text-white">
        <div className="absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full border-[70px] border-blue-400/10" />
        <div className="absolute -bottom-52 left-1/3 h-[28rem] w-[28rem] rounded-full border-[45px] border-white/5" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-300"><span className="h-px w-8 bg-blue-400" /> Carwash / Online booking</p>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl">ล้างรถแบบมีแผน<br /><span className="text-blue-300">ไม่ต้องเสียเวลารอ</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg">จองคิวล่วงหน้า เลือกบริการและช่วงเวลาที่สะดวก พร้อมติดตามสถานะการจองได้ในที่เดียว</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link to="/booking" className="primary-button bg-blue-500 hover:bg-blue-400">จองคิวทันที <Icon name="arrow" size={17} /></Link><Link to="/services" className="secondary-button border-white/20 bg-white/5 text-white hover:border-blue-300 hover:bg-white/10 hover:text-white">ดูบริการและราคา</Link></div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-300"><span className="flex items-center gap-2"><Icon name="check" size={16} className="text-blue-300" />เลือกเวลาได้ล่วงหน้า</span><span className="flex items-center gap-2"><Icon name="check" size={16} className="text-blue-300" />แจ้งสถานะทุกขั้นตอน</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-2xl border border-blue-300/15" />
            <div className="relative overflow-hidden rounded-xl bg-white p-5 text-slate-900 shadow-2xl shadow-blue-950/40">
              <div className="border-b border-slate-100 pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Booking overview</p><h2 className="mt-2 text-xl font-bold text-[#0b1f3a]">จัดคิวให้พร้อมก่อนออกเดินทาง</h2></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">คิวที่รองรับต่อช่วง</p><p className="mt-2 text-2xl font-bold text-[#0b1f3a]">01 <span className="text-sm font-medium text-slate-400">คัน</span></p></div><div className="rounded-lg bg-blue-50 p-4"><p className="text-xs text-blue-700">เปิดให้จอง</p><p className="mt-2 text-2xl font-bold text-blue-700">09:00</p></div></div>
              <div className="mt-4 rounded-lg border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">ตัวอย่างรายการจอง</span><span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />พร้อมให้บริการ</span></div><div className="mt-4 flex items-center gap-3"><div><p className="font-bold">Standard Wash</p><p className="mt-0.5 text-xs text-slate-500">ล้างรถภายนอก · 250 บาท</p></div><Icon name="arrow" size={18} className="ml-auto text-slate-400" /></div></div>
              <Link to="/booking" className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-blue-600">เริ่มจองคิวของคุณ <Icon name="arrow" size={17} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20">
        <div className="max-w-2xl"><p className="eyebrow">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f3a] md:text-4xl">จองง่าย เป็นขั้นตอน</h2><p className="mt-3 text-slate-500">ลดเวลารอที่หน้าร้านด้วยการวางแผนล่วงหน้า</p></div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 md:grid-cols-3">{highlights.map(([number, title, description]) => <div key={number} className="bg-white p-6 md:p-8"><span className="text-sm font-bold text-blue-600">{number}</span><h3 className="mt-8 text-lg font-bold text-[#0b1f3a]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}</div>
      </section>

      <section className="border-y border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">พร้อมเมื่อคุณพร้อม</p><h2 className="mt-3 text-2xl font-bold text-[#0b1f3a] md:text-3xl">เลือกแพ็กเกจที่เหมาะกับรถของคุณ</h2></div><Link to="/services" className="secondary-button justify-self-start md:justify-self-end">ดูแพ็กเกจทั้งหมด <Icon name="arrow" size={17} /></Link></div></section>
    </div>
  );
}
