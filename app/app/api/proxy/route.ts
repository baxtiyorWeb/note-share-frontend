// app/api/proxy/route.ts
import { NextResponse } from 'next/server';

const PROXY_URLS = {
  languagetool: 'https://api.languagetool.org/v2/check',
  translate: 'https://libretranslate.de/translate',
  hf: 'https://api-inference.huggingface.co/models/gpt2',
  // Cohere o‘chirildi — bepul emas
};

export async function POST(req: Request) {
  try {
    const { type, ...body } = await req.json();

    let url = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let fetchOptions: RequestInit = { method: 'POST', headers };

    switch (type) {
      case 'grammar':
        url = PROXY_URLS.languagetool;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchOptions.body = new URLSearchParams(body as any);
        const textRes = await fetch(url, fetchOptions);
        const text = await textRes.text();
        return NextResponse.json({ text });

      case 'translate':
        url = PROXY_URLS.translate;
        fetchOptions.body = JSON.stringify(body);
        break;

      case 'generate':
        url = PROXY_URLS.hf;
        fetchOptions.body = JSON.stringify(body);
        break;

      case 'summarize':
        // BEPUL fallback: oddiy qisqartirish
        return NextResponse.json({ summary: body.text.split('. ').slice(0, 3).join('. ') + '.' });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const res = await fetch(url, fetchOptions);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Proxy xatosi' }, { status: 500 });
  }
}