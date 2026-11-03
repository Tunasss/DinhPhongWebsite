// Vercel Serverless Function Proxy cho Google Apps Script
// Tránh 100% lỗi CORS và preflight OPTIONS khi chạy production trên Vercel

export default async function handler(req: any, res: any) {
  // Bật CORS cho mọi domain
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { gasUrl, method, payload } = req.body || {};
  if (!gasUrl) {
    return res.status(400).json({ error: 'Thiếu gasUrl' });
  }

  try {
    const fetchInit: RequestInit = {
      method: method || 'POST',
      redirect: 'follow',
    };
    if (method === 'POST' && payload) {
      fetchInit.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      fetchInit.body = JSON.stringify(payload);
    }
    const response = await fetch(gasUrl, fetchInit);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
