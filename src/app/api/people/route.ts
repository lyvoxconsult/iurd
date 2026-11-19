import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { personSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rallyIdParam = searchParams.get('rallyId');
    const nationId = searchParams.get('nationId');
    const tribeId = searchParams.get('tribeId');
    const category = searchParams.get('category');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const statusParam = searchParams.get('status'); // 'active' | 'inactive' | 'all'
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let rallyId: string | undefined = rallyIdParam || undefined;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id;
    }
    if (!rallyId) return NextResponse.json({ people: [] });

    const where: any = {};
    where.rallyId = rallyId;
    if (nationId) where.nationId = nationId;
    if (tribeId) where.tribeId = tribeId;
    if (category) where.category = category;
    if (role) where.role = role;

    if (statusParam === 'inactive') {
      where.active = false;
    } else if (statusParam === 'all' || !activeOnly) {
      // Sem filtro de active (retorna todos)
    } else {
      where.active = true;
    }

    if (search) {
      where.name = { contains: search };
    }

    const people = await prisma.person.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        nation: { select: { id: true, name: true, color: true } },
        tribe: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ people });
  } catch (error) {
    console.error('Erro ao buscar pessoas:', error);
    return NextResponse.json({ error: 'Erro ao buscar integrantes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = personSchema.parse(body);

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) {
      return NextResponse.json({ error: 'Nenhum rally ativo encontrado' }, { status: 400 });
    }

    // Regra Crítica: A tribo selecionada DEVE pertencer à nação indicada
    const tribe = await prisma.tribe.findFirst({
      where: { id: validated.tribeId, rallyId: activeRally.id },
    });

    if (!tribe) {
      return NextResponse.json({ error: 'Tribo não encontrada' }, { status: 404 });
    }

    if (tribe.nationId !== validated.nationId) {
      return NextResponse.json(
        { error: 'A tribo selecionada não pertence à nação indicada!' },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: {
        rallyId: activeRally.id,
        name: validated.name,
        nationId: validated.nationId,
        tribeId: validated.tribeId,
        category: validated.category,
        role: validated.role,
        active: validated.active !== undefined ? validated.active : true,
      },
      include: {
        nation: { select: { id: true, name: true, color: true } },
        tribe: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, person });
  } catch (error: any) {
    console.error('Erro ao cadastrar pessoa:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || error.message || 'Erro ao cadastrar integrante' },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da pessoa é obrigatório' }, { status: 400 });
    }

    const validated = personSchema.parse(data);
    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) return NextResponse.json({ error: 'Nenhum rally ativo encontrado' }, { status: 400 });
    const person = await prisma.person.findFirst({ where: { id, rallyId: activeRally.id } });
    if (!person) return NextResponse.json({ error: 'Integrante não encontrado no rally ativo' }, { status: 404 });

    // Validação estrita do vínculo tribo e nação
    const tribe = await prisma.tribe.findFirst({
      where: { id: validated.tribeId, rallyId: activeRally.id },
    });

    if (!tribe) {
      return NextResponse.json({ error: 'Tribo não encontrada' }, { status: 404 });
    }

    if (tribe.nationId !== validated.nationId) {
      return NextResponse.json(
        { error: 'A tribo selecionada não pertence à nação indicada!' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: validated.name,
      nationId: validated.nationId,
      tribeId: validated.tribeId,
      category: validated.category,
      role: validated.role,
    };
    if (validated.active !== undefined) {
      updateData.active = validated.active;
    }

    const updated = await prisma.person.update({
      where: { id },
      data: updateData,
      include: {
        nation: { select: { id: true, name: true, color: true } },
        tribe: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, person: updated });
  } catch (error: any) {
    console.error('Erro ao atualizar pessoa:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || error.message || 'Erro ao atualizar integrante' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do integrante é obrigatório' }, { status: 400 });
    }

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) return NextResponse.json({ error: 'Nenhum rally ativo encontrado' }, { status: 400 });

    const person = await prisma.person.findFirst({ where: { id, rallyId: activeRally.id } });
    if (!person) return NextResponse.json({ error: 'Integrante não encontrado no rally ativo' }, { status: 404 });

    // Remoção lógica (Soft Delete): define active: false para retirar das listas ativas
    // Preserva integralmente lançamentos históricos, snapshots e pontuações
    const updated = await prisma.person.update({
      where: { id },
      data: { active: false },
      include: {
        nation: { select: { id: true, name: true, color: true } },
        tribe: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Integrante removido da lista ativa com sucesso. O histórico de pontuações permanece preservado.',
      person: updated,
    });
  } catch (error: any) {
    console.error('Erro ao desativar integrante:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao remover integrante' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do integrante é obrigatório' }, { status: 400 });
    }
    if (active !== true && active !== false) {
      return NextResponse.json({ error: 'Status do integrante deve ser verdadeiro ou falso' }, { status: 400 });
    }

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) return NextResponse.json({ error: 'Nenhum rally ativo encontrado' }, { status: 400 });

    const person = await prisma.person.findFirst({ where: { id, rallyId: activeRally.id } });
    if (!person) return NextResponse.json({ error: 'Integrante não encontrado no rally ativo' }, { status: 404 });

    const updated = await prisma.person.update({
      where: { id },
      data: { active },
      include: {
        nation: { select: { id: true, name: true, color: true } },
        tribe: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: updated.active ? 'Integrante reativado com sucesso!' : 'Integrante desativado com sucesso.',
      person: updated,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status do integrante:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}
