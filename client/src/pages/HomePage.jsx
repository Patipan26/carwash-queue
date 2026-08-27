import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-blue-100 text-sm font-semibold mb-3">CARWASH QUEUE</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">จองคิวล้างรถ<br />ง่าย ๆ ในไม่กี่ขั้นตอน</h1>
            <p className="mt-5 text-blue-100 max-w-lg">เลือกบริการ วันเวลา และติดตามสถานะการจองได้จากที่เดียว</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl shadow hover:bg-blue-50">จองคิวทันที</Link>
              <Link to="/services" className="border border-blue-200 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-600">ดูบริการทั้งหมด</Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center text-[9rem]">🚗</div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-800">บริการของเรา</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-6">
          {[
            ['Standard Wash', 'ล้างรถ ฉีดซุ้มล้อ เช็ดแห้ง', 250],
            ['Premium Wash', 'เคลือบแว็กซ์และดูแลห้องเครื่อง', 450],
            ['Full Detailing', 'ฟื้นฟูสภาพรถเต็มรูปแบบ', 1200]
          ].map(([name, description, price]) => <div key={name} className="bg-white rounded-2xl border p-6 shadow-sm"><h3 className="font-bold text-lg">{name}</h3><p className="text-sm text-slate-500 mt-2">{description}</p><p className="text-blue-600 text-xl font-bold mt-5">฿{price.toLocaleString()}</p></div>)}
        </div>
      </section>
    </div>
  );
}
