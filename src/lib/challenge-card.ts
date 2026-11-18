export interface ChallengeCardData {
  title: string;
  description?: string | null;
  points: number;
}

const WIDTH = 1080;
const SIDE = 92;
const TEXT_WIDTH = WIDTH - SIDE * 2;

function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.replace(/\r/g, '').split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const character of word) {
        if (ctx.measureText(line + character).width > maxWidth && line) {
          lines.push(line);
          line = '';
        }
        line += character;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function createChallengeImage(challenge: ChallengeCardData): File {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador não conseguiu gerar a imagem.');

  const title = challenge.title.trim();
  const description = challenge.description?.trim() || '';
  ctx.font = 'bold 76px Arial, sans-serif';
  const titleLines = wrapText(ctx, title, TEXT_WIDTH);
  ctx.font = '40px Arial, sans-serif';
  const descriptionLines = description ? wrapText(ctx, description, TEXT_WIDTH) : [];
  const contentHeight = titleLines.length * 90 + (descriptionLines.length ? 80 + descriptionLines.length * 57 : 0);
  const height = Math.max(1350, 900 + contentHeight);
  if (height > 5000) throw new Error('O texto é longo demais para gerar a imagem. Reduza a descrição.');
  canvas.width = WIDTH;
  canvas.height = height;

  const background = ctx.createLinearGradient(0, 0, WIDTH, height);
  background.addColorStop(0, '#101b32');
  background.addColorStop(1, '#070b14');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.beginPath();
  ctx.arc(WIDTH, 0, 440, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, height, 350, 0, Math.PI * 2);
  ctx.fill();

  roundedRect(ctx, 42, 42, WIDTH - 84, height - 84, 38);
  ctx.strokeStyle = '#5d4825';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 35px Arial, sans-serif';
  ctx.fillText('IURD UMARIZAL', SIDE, 112);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('DESAFIO DO RALI', SIDE, 166);
  ctx.fillStyle = '#9a6a22';
  ctx.fillRect(SIDE, 232, TEXT_WIDTH, 3);

  let y = 325;
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 76px Arial, sans-serif';
  for (const line of titleLines) {
    ctx.fillText(line, SIDE, y);
    y += 90;
  }

  if (descriptionLines.length) {
    y += 42;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '40px Arial, sans-serif';
    for (const line of descriptionLines) {
      ctx.fillText(line, SIDE, y);
      y += 57;
    }
  }

  const pointsTop = height - 405;
  roundedRect(ctx, SIDE, pointsTop, TEXT_WIDTH, 230, 28);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.fillStyle = '#2b1a05';
  ctx.font = 'bold 35px Arial, sans-serif';
  ctx.fillText('VALE', SIDE + 45, pointsTop + 44);
  const pointValue = String(challenge.points);
  let pointFontSize = 105;
  do {
    ctx.font = `bold ${pointFontSize}px Arial, sans-serif`;
    if (ctx.measureText(pointValue).width <= 570) break;
    pointFontSize -= 5;
  } while (pointFontSize > 45);
  ctx.fillText(pointValue, SIDE + 45, pointsTop + 92);
  ctx.font = 'bold 35px Arial, sans-serif';
  const pointsText = 'PONTOS';
  ctx.fillText(pointsText, SIDE + TEXT_WIDTH - 45 - ctx.measureText(pointsText).width, pointsTop + 145);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '28px Arial, sans-serif';
  ctx.fillText('Participe e faça a diferença na sua nação.', SIDE, height - 125);

  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'rali';
  return new File([bytes], `desafio-${slug}.png`, { type: 'image/png' });
}
