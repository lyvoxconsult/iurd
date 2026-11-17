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
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let rallyId: string | undefined = rallyIdParam || undefined;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id;
    }

    const where: any = {};
    if (rallyId) where.rallyId = rallyId;
    if (nationId) where.nationId = nationId;
    if (tribeId) where.tribeId = tribeId;
    if (category) where.category = category;
    if (role) where.role = role;
    if (activeOnly) where.active = true;
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
      return NextResponse.json({ error: 'Nenhum rali ativo encontrado' }, { status: 400 });
    }

    // Regra Crítica: A tribo selecionada DEVE pertencer à nação indicada
    const tribe = await prisma.tribe.findUnique({
      where: { id: validated.tribeId },
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
        active: true,
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

    // Validação estrita do vínculo tribo e nação
    const tribe = await prisma.tribe.findUnique({
      where: { id: validated.tribeId },
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

    const updated = await prisma.person.update({
      where: { id },
      data: {
        name: validated.name,
        nationId: validated.nationId,
        tribeId: validated.tribeId,
        category: validated.category,
        role: validated.role,
      },
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
