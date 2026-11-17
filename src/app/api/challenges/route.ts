import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { challengeSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rallyIdParam = searchParams.get('rallyId');

    let rallyId: string | undefined = rallyIdParam || undefined;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id;
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        rallyId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { scoreLaunches: true },
        },
      },
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Erro ao buscar desafios:', error);
    return NextResponse.json({ error: 'Erro ao buscar desafios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = challengeSchema.parse(body);

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) {
      return NextResponse.json({ error: 'Nenhum rali ativo encontrado' }, { status: 400 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        rallyId: activeRally.id,
        title: validated.title,
        description: validated.description || null,
        defaultPoints: validated.defaultPoints,
        active: true,
      },
    });

    return NextResponse.json({ success: true, challenge });
  } catch (error: any) {
    console.error('Erro ao criar desafio:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || error.message || 'Erro ao criar desafio' },
      { status: 400 }
    );
  }
}
