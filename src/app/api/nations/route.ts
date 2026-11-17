import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rallyIdParam = searchParams.get('rallyId');

    let rallyId = rallyIdParam;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id || null;
    }

    if (!rallyId) {
      return NextResponse.json({ nations: [] });
    }

    const nations = await prisma.nation.findMany({
      where: { rallyId },
      orderBy: { orderIndex: 'asc' },
      include: {
        tribes: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { people: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ nations });
  } catch (error) {
    console.error('Erro ao buscar nações:', error);
    return NextResponse.json({ error: 'Erro ao buscar nações' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, color } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'ID e nome da nação são obrigatórios' }, { status: 400 });
    }
    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally || !await prisma.nation.findFirst({ where: { id, rallyId: activeRally.id } })) {
      return NextResponse.json({ error: 'Nação não encontrada no rali ativo' }, { status: 404 });
    }

    const updated = await prisma.nation.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(color ? { color } : {}),
      },
    });

    return NextResponse.json({ success: true, nation: updated });
  } catch (error: any) {
    console.error('Erro ao atualizar nação:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar nação' }, { status: 400 });
  }
}
