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
    if (!rallyId) return NextResponse.json({ tribes: [] });

    const where: any = {};
    where.rallyId = rallyId;
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

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) return NextResponse.json({ error: 'Nenhum rali ativo encontrado' }, { status: 400 });
    const nation = await prisma.nation.findFirst({
      where: { id: nationId, rallyId: activeRally.id },
    });
    if (!nation) {
      return NextResponse.json({ error: 'Nação não encontrada' }, { status: 404 });
    }

    const tribe = await prisma.$transaction(async (tx) => {
      const count = await tx.tribe.count({ where: { nationId: nation.id } });
      if (count >= 6) return null;
      const lastTribe = await tx.tribe.findFirst({
        where: { nationId: nation.id }, orderBy: { orderIndex: 'desc' },
      });
      return tx.tribe.create({
        data: {
          rallyId: nation.rallyId,
          nationId: nation.id,
          name: name.trim(),
          code: code?.trim() || null,
          orderIndex: (lastTribe?.orderIndex || 0) + 1,
        },
        include: { nation: { select: { id: true, name: true, color: true } } },
      });
    });
    if (!tribe) return NextResponse.json({ error: 'Cada nação pode ter no máximo seis tribos' }, { status: 409 });

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
    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally || !await prisma.tribe.findFirst({ where: { id, rallyId: activeRally.id } })) {
      return NextResponse.json({ error: 'Tribo não encontrada no rali ativo' }, { status: 404 });
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
    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally || !await prisma.tribe.findFirst({ where: { id, rallyId: activeRally.id } })) {
      return NextResponse.json({ error: 'Tribo não encontrada no rali ativo' }, { status: 404 });
    }
    const target = await prisma.tribe.findUnique({ where: { id } });
    const tribeCount = await prisma.tribe.count({ where: { nationId: target!.nationId } });
    if (tribeCount <= 6) {
      return NextResponse.json({ error: 'Cada nação deve manter seis tribos; renomeie a tribo em vez de excluí-la' }, { status: 409 });
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
