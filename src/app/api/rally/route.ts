import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { activateRally, closeRally, createRally } from '@/lib/rally-store';

const rallySchema = z.object({
  name: z.string().trim().min(3, 'Nome do rali deve ter no mínimo 3 caracteres'),
  startDate: z.string().optional(),
});

export async function GET() {
  try {
    const activeRally = await prisma.rally.findFirst({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            nations: true,
            tribes: true,
            people: true,
            challenges: true,
            scoreLaunches: true,
          },
        },
      },
    });

    const allRallies = await prisma.rally.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      activeRally,
      allRallies,
    });
  } catch (error) {
    console.error('Erro ao buscar rali:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados do rali' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rallyId, name, startDate } = body;

    // Ação: ativar um rali existente
    if (action === 'activate' && rallyId) {
      await activateRally(rallyId);

      return NextResponse.json({ success: true, message: 'Rali ativado com sucesso' });
    }

    // Ação: encerrar o rali ativo
    if (action === 'close' && rallyId) {
      await closeRally(rallyId);
      return NextResponse.json({ success: true, message: 'Rali encerrado com sucesso' });
    }

    // Ação: criar um novo rali
    const validated = rallySchema.parse({ name, startDate });

    const newRally = await createRally(validated.name, validated.startDate ? new Date(validated.startDate) : new Date());

    return NextResponse.json({ success: true, rally: newRally });
  } catch (error: any) {
    console.error('Erro na gestão do rali:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar solicitação de rali' }, { status: 400 });
  }
}
