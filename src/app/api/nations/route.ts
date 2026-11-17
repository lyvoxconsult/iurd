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
        },
      },
    });

    return NextResponse.json({ nations });
  } catch (error) {
    console.error('Erro ao buscar nações:', error);
    return NextResponse.json({ error: 'Erro ao buscar nações' }, { status: 500 });
  }
}
