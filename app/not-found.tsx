import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-50 text-gray-900" id="not-found-container">
      <h2 className="text-3xl font-bold mb-2" id="not-found-title">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-600 mb-6" id="not-found-desc">Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
      <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition" id="back-home-btn">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
