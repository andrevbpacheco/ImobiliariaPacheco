// Extração de tags a partir de texto livre — heurística baseada em regras (sem IA).
// Ex.: "possui sacada com churrasqueira, sol da manhã e portaria 24h"
//   -> ["Sacada com churrasqueira", "Sol da manhã", "Portaria 24h"]

const LEADING_CONNECTORS = [
  /^possui\s+/i, /^tem\s+/i, /^conta com\s+/i, /^também tem\s+/i,
  /^e\s+/i, /^com\s+/i, /^além disso,?\s*/i, /^inclui\s+/i,
];

function cleanPhrase(raw) {
  let s = raw.trim();
  s = s.replace(/^[-•*•]\s*/, '');
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of LEADING_CONNECTORS) {
      if (re.test(s)) {
        s = s.replace(re, '');
        changed = true;
      }
    }
  }
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[.;:!]+$/, '').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractTagsFromText(text) {
  if (!text || !text.trim()) return [];

  // 1) quebra em sentenças (linha, ponto, ponto-e-vírgula)
  const sentences = text.split(/\n+|(?<=[.;])\s+/).map(s => s.trim()).filter(Boolean);

  const phrases = [];
  for (let sentence of sentences) {
    // remove pontuação final da sentença
    sentence = sentence.replace(/[.;]+$/, '');
    // separa por vírgula e por marcadores de lista
    let parts = sentence.split(/,|•|•|\*|- /).map(p => p.trim()).filter(Boolean);
    // se a sentença tem lista (2+ vírgulas) o "e" final também separa o último item
    const expanded = [];
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1 && parts.length > 1) {
        const eSplit = part.split(/\s+\be\b\s+/i);
        expanded.push(...eSplit);
      } else {
        expanded.push(part);
      }
    });
    // sentença única sem vírgulas mas com " e " no meio e curta o bastante -> ainda tratamos como frase única
    phrases.push(...expanded);
  }

  const seen = new Set();
  const tags = [];
  for (const raw of phrases) {
    const tag = cleanPhrase(raw);
    if (!tag) continue;
    if (tag.length > 60) continue; // provavelmente uma frase inteira, não uma característica
    if (tag.split(' ').length > 8) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}
