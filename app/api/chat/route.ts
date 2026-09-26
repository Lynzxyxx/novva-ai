import { NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/types';

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 });
  }

  const apiKey = process.env.CHAT_API_KEY;
  const baseUrl = process.env.CHAT_API_BASE_URL;
  const model = process.env.CHAT_MODEL || 'qwen-plus';

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: 'Server belum dikonfigurasi: isi CHAT_API_KEY & CHAT_API_BASE_URL di Environment Variables.' },
      { status: 500 }
    );
  }

  const assistantName = process.env.ASSISTANT_NAME || 'Nova AI';
  const creatorAnswer =
    process.env.CREATOR_ANSWER ||
    'Saya dibuat dan dikembangkan secara mandiri oleh tim SoraPay.id';
  const nameAnswer =
    process.env.NAME_ANSWER || `Nama saya ${assistantName}, siap membantu kamu.`;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // Jawaban identitas langsung dari env, konsisten tanpa perlu panggil AI
  if (/siapa.*(pembuat|pencipta|developer|yang buat|yang membuat)/i.test(lastUserMessage) ||
      /who\s*(made|created|built)\s*you/i.test(lastUserMessage)) {
    return NextResponse.json({ reply: creatorAnswer });
  }
  if (/siapa\s*(nama\s*)?(kamu|anda|mu)/i.test(lastUserMessage) ||
      /what.?s?\s*your\s*name/i.test(lastUserMessage) ||
      /who\s*are\s*you/i.test(lastUserMessage)) {
    return NextResponse.json({ reply: nameAnswer });
  }

  const systemPrompt = `Kamu adalah ${assistantName}, asisten AI serba bisa: bisa mengobrol santai, menjawab pertanyaan, membantu menulis, MENULIS DAN MEMPERBAIKI KODE PROGRAM (berikan kode lengkap dalam blok \`\`\`bahasa), analisis, dan tugas lainnya. Jawab dengan jelas, terstruktur, dan gunakan blok kode markdown untuk semua kode program. Jika ditanya siapa pembuatmu, jawab: "${creatorAnswer}". Jika ditanya siapa namamu, jawab: "${nameAnswer}".`;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages.map(({ role, content }) => ({ role, content }))],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `AI API error (${res.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      'Maaf, tidak ada respon dari AI.';

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Gagal menghubungi AI API: ${e?.message || 'unknown error'}` },
      { status: 502 }
    );
  }
}
