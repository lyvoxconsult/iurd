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
        _count: {
          select: { people: true },
        },
      },
    });

    return NextResponse.json({ tribes });
  } catch (error) {
    console.error('Erro ao buscar tribos:', error);
    return NextResponse.json({ error: 'Erro ao buscar tribos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nationId, name, code } = body;

    if (!nationId || !name || !name.trim()) {
      return NextResponse.json({ error: 'Nação e nome da tribo são obrigatórios' }, { status: 400 });
    }

    const nation = await prisma.nation.findUnique({
      where: { id: nationId },
    });
    if (!nation) {
      return NextResponse.json({ error: 'Nação não encontrada' }, { status: 404 });
    }

    // Calcular o próximo orderIndex
    const lastTribe = await prisma.tribe.findFirst({
      where: { nationId },
      orderBy: { orderIndex: 'desc' },
    });
    const nextOrder = (lastTribe?.orderIndex || 0) + 1;

    const tribe = await prisma.tribe.create({
      data: {
        rallyId: nation.rallyId,
        nationId: nation.id,
        name: name.trim(),
        code: code?.trim() || null,
        orderIndex: nextOrder,
      },
      include: {
        nation: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({ success: true, tribe });
  } catch (error: any) {
    console.error('Erro ao criar tribo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar tribo' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, code } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'ID e nome da tribo são obrigatórios' }, { status: 400 });
    }

    const updated = await prisma.tribe.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(code !== undefined ? { code: code ? code.trim() : null } : {}),
      },
      include: {
        nation: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({ success: true, tribe: updated });
  } catch (error: any) {
    console.error('Erro ao atualizar tribo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar tribo' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da tribo é obrigatório' }, { status: 400 });
    }

    // 1. Checar se existem pessoas cadastradas na tribo
    const peopleCount = await prisma.person.count({
      where: { tribeId: id },
    });

    if (peopleCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível remover a tribo pois ela possui ${peopleCount} integrante(s) vinculado(s). Realoque ou exclua os integrantes antes de remover a tribo.`,
        },
        { status: 400 }
      );
    }

    // 2. Checar se existem lançamentos de pontuação com snapshot desta tribo
    const launchesCount = await prisma.scoreLaunch.count({
      where: { snapshotTribeId: id },
    });

    if (launchesCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível remover a tribo pois ela possui ${launchesCount} pontuação(ões) histórica(s) registrada(s).`,
        },
        { status: 400 }
      );
    }

    await prisma.tribe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Tribo removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir tribo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir tribo' }, { status: 400 });
  }
}
