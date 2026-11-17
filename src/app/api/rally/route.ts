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

    const defaultTribesJuda = [
      'Tribo Leão', 'Tribo Guerreiros', 'Tribo Vencedores',
      'Tribo Conquistadores', 'Tribo Aliança', 'Tribo Firmeza'
    ];
    const defaultTribesBenjamim = [
      'Tribo Águia', 'Tribo Valentes', 'Tribo Sentinela',
      'Tribo Chama', 'Tribo Rocha', 'Tribo Redenção'
    ];
    const newRally = await prisma.$transaction(async (tx) => {
      await tx.rally.updateMany({ data: { isActive: false } });
      const rally = await tx.rally.create({
        data: {
          name: validated.name,
          startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
          isActive: true,
        },
      });
      const juda = await tx.nation.create({
        data: { rallyId: rally.id, name: 'Nação Judá', color: '#f59e0b', orderIndex: 1 },
      });
      const benjamim = await tx.nation.create({
        data: { rallyId: rally.id, name: 'Nação Benjamim', color: '#0ea5e9', orderIndex: 2 },
      });
      await tx.tribe.createMany({ data: [
        ...defaultTribesJuda.map((name, index) => ({ rallyId: rally.id, nationId: juda.id, name, orderIndex: index + 1 })),
        ...defaultTribesBenjamim.map((name, index) => ({ rallyId: rally.id, nationId: benjamim.id, name, orderIndex: index + 1 })),
      ] });
      return rally;
    });

    return NextResponse.json({ success: true, rally: newRally });
  } catch (error: any) {
    console.error('Erro na gestão do rali:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar solicitação de rali' }, { status: 400 });
  }
}
