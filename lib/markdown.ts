function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render markdown ringan: code block ```lang ... ```, inline `code`,
 * **bold**, *italic*, dan line break. Cukup untuk tampilan mirip ChatGPT
 * tanpa perlu dependency tambahan.
 */
export function renderMarkdown(raw: string): string {
  const codeBlocks: string[] = [];
  let text = escapeHtml(raw);

  // ambil semua code block dulu supaya tidak ikut ke-transform aturan lain
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length;
    const label = lang ? `<div class="code-lang">${lang}</div>` : '';
    codeBlocks.push(
      `<div class="code-block">${label}<pre><code>${code.replace(/\n$/, '')}</code></pre></div>`
    );
    return `\u0000CB${idx}\u0000`;
  });

  text = text.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/\n/g, '<br/>');

  text = text.replace(/\u0000CB(\d+)\u0000/g, (_m, i) => codeBlocks[Number(i)]);

  return text;
}
