import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { voidScoreSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = voidScoreSchema.parse(body);

    if (validated.launchType === 'challenge') {
      const launch = await prisma.scoreLaunch.findUnique({
        where: { id: validated.launchId },
      });

      if (!launch) {
        return NextResponse.json({ error: 'Lançamento de desafio não encontrado' }, { status: 404 });
      }

      if (launch.status === 'VOIDED') {
        return NextResponse.json({ error: 'Este lançamento já se encontra estornado/anulado' }, { status: 400 });
      }

      const updated = await prisma.scoreLaunch.update({
        where: { id: validated.launchId },
        data: {
          status: 'VOIDED',
          voidReason: validated.reason,
          voidedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Lançamento estornado com sucesso. A trilha histórica foi preservada.',
        launch: updated,
      });
    } else {
      const launch = await prisma.leaderScoreLaunch.findUnique({
        where: { id: validated.launchId },
      });

      if (!launch) {
        return NextResponse.json({ error: 'Lançamento de líder não encontrado' }, { status: 404 });
      }

      if (launch.status === 'VOIDED') {
        return NextResponse.json({ error: 'Este lançamento já se encontra estornado/anulado' }, { status: 400 });
      }

      const updated = await prisma.leaderScoreLaunch.update({
        where: { id: validated.launchId },
        data: {
          status: 'VOIDED',
          voidReason: validated.reason,
          voidedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Pontuação de líder estornada com sucesso. A trilha histórica foi preservada.',
        launch: updated,
      });
    }
  } catch (error: any) {
    console.error('Erro ao anular lançamento:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || error.message || 'Erro ao processar anulação' },
      { status: 400 }
    );
  }
}
