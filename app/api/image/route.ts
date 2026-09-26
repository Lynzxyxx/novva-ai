import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt } = (await req.json()) as { prompt: string };
  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: 'Prompt gambar tidak boleh kosong.' }, { status: 400 });
  }

  const apiKey = process.env.CHAT_API_KEY;
  const baseUrl = process.env.CHAT_API_BASE_URL;
  const model = process.env.CHAT_IMAGE_MODEL || process.env.CHAT_MODEL || '';

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: 'Server belum dikonfigurasi: isi CHAT_API_KEY & CHAT_API_BASE_URL di Environment Variables.' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          error: `Provider AI kamu menolak permintaan gambar (${res.status}). Kemungkinan besar provider ini belum mendukung fitur pembuatan gambar. Detail: ${errText.slice(0, 300)}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const item = data?.data?.[0];
    const imageUrl: string | undefined =
      item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Respon dari provider tidak berisi gambar yang bisa ditampilkan.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Gagal menghubungi AI API: ${e?.message || 'unknown error'}` },
      { status: 502 }
    );
  }
}
