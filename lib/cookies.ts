// Helper baca/tulis cookie di browser. Tidak ada server/database sama
// sekali -> semua riwayat chat tersimpan di cookie di perangkat ini saja.
//
// CATATAN PENTING: cookie browser terbatas sekitar 4KB per cookie. Kalau
// riwayat chat kamu sudah panjang, aplikasi ini otomatis membuang
// percakapan paling lama supaya tetap muat, dan akan kasih tahu kamu di
// layar kalau itu terjadi. Kalau kamu perlu riwayat yang jauh lebih besar,
// pertimbangkan pindah ke localStorage atau database asli.

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
