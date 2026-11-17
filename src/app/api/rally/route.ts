import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
      await prisma.$transaction([
        prisma.rally.updateMany({
          data: { isActive: false },
        }),
        prisma.rally.update({
          where: { id: rallyId },
          data: { isActive: true },
        }),
      ]);

      return NextResponse.json({ success: true, message: 'Rali ativado com sucesso' });
    }

    // Ação: encerrar o rali ativo
    if (action === 'close' && rallyId) {
      await prisma.rally.update({
        where: { id: rallyId },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: 'Rali encerrado com sucesso' });
    }

    // Ação: criar um novo rali
    const validated = rallySchema.parse({ name, startDate });

    // Desativa ralis anteriores
    await prisma.rally.updateMany({
      data: { isActive: false },
    });

    const newRally = await prisma.rally.create({
      data: {
        name: validated.name,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        isActive: true,
      },
    });

    // Clona ou inicializa as 2 nações e 12 tribos padrão para o novo rali
    const juda = await prisma.nation.create({
      data: {
        rallyId: newRally.id,
        name: 'Nação Judá',
        color: '#f59e0b',
        orderIndex: 1,
      },
    });

    const benjamim = await prisma.nation.create({
      data: {
        rallyId: newRally.id,
        name: 'Nação Benjamim',
        color: '#0ea5e9',
        orderIndex: 2,
      },
    });

    const defaultTribesJuda = [
      'Tribo Leão', 'Tribo Guerreiros', 'Tribo Vencedores',
      'Tribo Conquistadores', 'Tribo Aliança', 'Tribo Firmeza'
    ];
    for (let i = 0; i < defaultTribesJuda.length; i++) {
      await prisma.tribe.create({
        data: {
          rallyId: newRally.id,
          nationId: juda.id,
          name: defaultTribesJuda[i],
          orderIndex: i + 1,
        },
      });
    }

    const defaultTribesBenjamim = [
      'Tribo Águia', 'Tribo Valentes', 'Tribo Sentinela',
      'Tribo Chama', 'Tribo Rocha', 'Tribo Redenção'
    ];
    for (let i = 0; i < defaultTribesBenjamim.length; i++) {
      await prisma.tribe.create({
        data: {
          rallyId: newRally.id,
          nationId: benjamim.id,
          name: defaultTribesBenjamim[i],
          orderIndex: i + 1,
        },
      });
    }

    return NextResponse.json({ success: true, rally: newRally });
  } catch (error: any) {
    console.error('Erro na gestão do rali:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar solicitação de rali' }, { status: 400 });
  }
}
