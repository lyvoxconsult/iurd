import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nationId = searchParams.get('nationId');
    const rallyIdParam = searchParams.get('rallyId');

    let rallyId: string | undefined = rallyIdParam || undefined;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id;
    }

    const where: any = {};
    if (rallyId) where.rallyId = rallyId;
    if (nationId) where.nationId = nationId;

    const tribes = await prisma.tribe.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        nation: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json({ tribes });
  } catch (error) {
    console.error('Erro ao buscar tribos:', error);
    return NextResponse.json({ error: 'Erro ao buscar tribos' }, { status: 500 });
  }
}
