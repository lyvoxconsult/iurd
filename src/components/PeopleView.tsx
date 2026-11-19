'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Crown,
  Award,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  UserMinus,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface PeopleViewProps {
  people: any[];
  nations: any[];
  tribes: any[];
  onRefresh: () => void;
  userRole?: 'ADMIN' | 'LEADER' | null;
}

export default function PeopleView({
  people,
  nations,
  tribes,
  onRefresh,
  userRole,
}: PeopleViewProps) {
  // Filtros
  const [searchName, setSearchName] = useState('');
  const [filterNationId, setFilterNationId] = useState('');
  const [filterTribeId, setFilterTribeId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active');

  // Modal de Cadastro / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any | null>(null);

  // Modal de Exclusão Lógica / Desativação
  const [deletingPerson, setDeletingPerson] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formNationId, setFormNationId] = useState('');
  const [formTribeId, setFormTribeId] = useState('');
  const [formCategory, setFormCategory] = useState<'jovem' | 'membro' | 'obreiro' | 'colaborador'>('jovem');
  const [formRole, setFormRole] = useState<'participante' | 'lider_tribo' | 'lider_nacao'>('participante');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fechar modals ao pressionar Escape
  useEffect(() => {
    if (!isModalOpen && !deletingPerson) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setDeletingPerson(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, deletingPerson]);

  // Tribos filtradas pela nação selecionada no formulário
  const availableTribesForForm = tribes.filter((t) => t.nationId === formNationId);

  // Abrir Modal para Criar
  const handleOpenCreateModal = () => {
    setEditingPerson(null);
    setFormName('');
    const defaultNationId = nations[0]?.id || '';
    setFormNationId(defaultNationId);
    const firstTribeOfNation = tribes.find((t) => t.nationId === defaultNationId);
    setFormTribeId(firstTribeOfNation?.id || '');
    setFormCategory('jovem');
    setFormRole('participante');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEditModal = (person: any) => {
    setEditingPerson(person);
    setFormName(person.name);
    setFormNationId(person.nationId);
    setFormTribeId(person.tribeId);
    setFormCategory(person.category);
    setFormRole(person.role);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Quando o usuário muda a Nação no form, atualiza o formTribeId para a primeira tribo dessa nação
  const handleNationChange = (nId: string) => {
    setFormNationId(nId);
    const validTribes = tribes.filter((t) => t.nationId === nId);
    if (validTribes.length > 0) {
      setFormTribeId(validTribes[0].id);
    } else {
      setFormTribeId('');
    }
  };

  // Salvar (Criar ou Atualizar)
  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError('O nome deve ter no mínimo 2 caracteres');
      return;
    }
    if (!formNationId) {
      setFormError('Selecione uma nação');
      return;
    }
    if (!formTribeId) {
      setFormError('Selecione uma tribo');
      return;
    }

    setFormLoading(true);
    try {
      const payload: any = {
        name: formName.trim(),
        nationId: formNationId,
        tribeId: formTribeId,
        category: formCategory,
        role: formRole,
      };

      let url = '/api/people';
      let method = 'POST';

      if (editingPerson) {
        url = '/api/people';
        method = 'PUT';
        payload.id = editingPerson.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar integrante');
      }

      setFormSuccess(editingPerson ? 'Integrante atualizado com sucesso!' : 'Integrante cadastrado com sucesso!');
      setTimeout(() => {
        setIsModalOpen(false);
        onRefresh();
      }, 700);
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado');
    } finally {
      setFormLoading(false);
    }
  };

  // Remover (Desativação Lógica com preservação de histórico)
  const handleConfirmDelete = async () => {
    if (!deletingPerson) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/people?id=${deletingPerson.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover integrante');

      setActionSuccess(`Integrante ${deletingPerson.name} desativado com sucesso. Histórico preservado.`);
      setDeletingPerson(null);
      onRefresh();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao remover integrante');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Reativar Integrante
  const handleReactivatePerson = async (person: any) => {
    try {
      const res = await fetch('/api/people', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: person.id, active: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reativar integrante');

      setActionSuccess(`Integrante ${person.name} reativado com sucesso!`);
      onRefresh();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao reativar integrante');
    }
  };

  // Filtragem local dos integrantes
  const filteredPeople = people.filter((p) => {
    // Filtro de status ativo/inativo
    if (filterStatus === 'active' && p.active === false) return false;
    if (filterStatus === 'inactive' && p.active !== false) return false;

    if (searchName && !p.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (filterNationId && p.nationId !== filterNationId) return false;
    if (filterTribeId && p.tribeId !== filterTribeId) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterRole && p.role !== filterRole) return false;
    return true;
  });

  // Tribos filtradas pelo filtro de nação na barra de busca
  const filterAvailableTribes = filterNationId
    ? tribes.filter((t) => t.nationId === filterNationId)
    : tribes;

  return (
    <div className="space-y-3.5 sm:space-y-6">

      {/* Cabeçalho da Seção de Integrantes */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-700" />
            <span>Gestão de Integrantes do Rally</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro, consulta por nação e tribo, controle de papéis e remoção auditada
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Integrante</span>
        </button>
      </div>

      {actionSuccess && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5 sm:space-y-3">
        {/* Linha 1: Busca por Nome + Seletor de Status (Ativos / Inativos / Todos) */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              aria-label="Buscar integrante por nome"
              className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Seletor de Status: Ativos | Inativos | Todos */}
          <div className="grid grid-cols-3 bg-dark-950 p-1 rounded-xl border border-dark-800 shrink-0 min-w-[210px]">
            {[
              { id: 'active', label: 'Ativos' },
              { id: 'inactive', label: 'Inativos' },
              { id: 'all', label: 'Todos' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilterStatus(s.id as any)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  filterStatus === s.id
                    ? 'bg-amber-500 text-slate-100 shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 2: 4 Filtros dropdown (2x2 no mobile, 4 colunas em desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {/* Filtro por Nação */}
          <div>
            <select
              value={filterNationId}
              onChange={(e) => {
                setFilterNationId(e.target.value);
                setFilterTribeId('');
              }}
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Nações</option>
              {nations.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tribo */}
          <div>
            <select
              value={filterTribeId}
              onChange={(e) => setFilterTribeId(e.target.value)}
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Tribos</option>
              {filterAvailableTribes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas Categorias</option>
              <option value="jovem">Jovem</option>
              <option value="membro">Membro</option>
              <option value="obreiro">Obreiro</option>
              <option value="colaborador">Colaborador</option>
            </select>
          </div>

          {/* Filtro por Função */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Funções</option>
              <option value="participante">Participante</option>
              <option value="lider_tribo">Líder de Tribo</option>
              <option value="lider_nacao">Líder de Nação</option>
            </select>
          </div>
        </div>

        {/* Totalizadores rápidos */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-dark-800">
          <span>
            Mostrando <strong>{filteredPeople.length}</strong> {filterStatus === 'inactive' ? 'inativos' : 'integrantes'}
          </span>
          {(searchName || filterNationId || filterTribeId || filterCategory || filterRole || filterStatus !== 'active') && (
            <button
              onClick={() => {
                setSearchName('');
                setFilterNationId('');
                setFilterTribeId('');
                setFilterCategory('');
                setFilterRole('');
                setFilterStatus('active');
              }}
              className="text-amber-700 hover:text-amber-800 font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Cartões de integrantes em celular (<640px) */}
      <div className="space-y-2 sm:hidden">
        {filteredPeople.length === 0 ? (
          <p className="rounded-xl border border-dark-800 bg-dark-900 p-6 text-center text-xs sm:text-sm text-slate-400">
            Nenhum integrante encontrado para os filtros selecionados.
          </p>
        ) : filteredPeople.map((person) => {
          const isInactive = person.active === false;

          return (
            <article
              key={person.id}
              className={`rounded-xl border p-3 shadow-md transition-all ${
                isInactive ? 'bg-dark-900/50 border-dark-800 opacity-70' : 'bg-dark-900 border-dark-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`break-words text-sm font-bold ${isInactive ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                      {person.name}
                    </h3>
                    {isInactive && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-dark-950 border border-dark-700 text-slate-400">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {person.tribe?.name || 'Tribo'} • {person.nation?.name || 'Nação'}
                  </p>
                </div>

                {/* Botões de Ação Mobile */}
                <div className="flex items-center gap-1 shrink-0">
                  {isInactive ? (
                    <button
                      onClick={() => handleReactivatePerson(person)}
                      aria-label={`Reativar ${person.name}`}
                      title="Reativar integrante"
                      className="min-h-9 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reativar</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(person)}
                        aria-label={`Editar ${person.name}`}
                        className="min-h-9 min-w-9 rounded-lg border border-dark-700 text-amber-700 flex items-center justify-center hover:bg-dark-800 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingPerson(person)}
                        aria-label={`Remover ${person.name}`}
                        title="Remover integrante da lista ativa"
                        className="min-h-9 min-w-9 rounded-lg border border-red-200 text-red-800 flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full border border-dark-700 px-2 py-0.5 capitalize text-slate-300">
                  {person.category}
                </span>
                <span className="rounded-full border border-amber-700/40 bg-amber-500/10 px-2 py-0.5 text-amber-800 font-medium">
                  {person.role === 'lider_nacao' ? 'Líder de Nação' : person.role === 'lider_tribo' ? 'Líder de Tribo' : 'Participante'}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Tabela em tablet e desktop */}
      <div className="hidden sm:block bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-dark-950 text-slate-400 border-b border-dark-800 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Nação</th>
                <th className="py-3 px-4">Tribo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Função</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum integrante encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPeople.map((person) => {
                  const isLeaderNation = person.role === 'lider_nacao';
                  const isLeaderTribe = person.role === 'lider_tribo';
                  const isInactive = person.active === false;

                  return (
                    <tr key={person.id} className={`hover:bg-dark-950/50 transition-colors ${isInactive ? 'opacity-65' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-slate-100 flex items-center space-x-2">
                        {isLeaderNation ? (
                          <Award className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        ) : isLeaderTribe ? (
                          <Crown className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                        )}
                        <span className={isInactive ? 'line-through text-slate-400' : ''}>{person.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="inline-flex items-center space-x-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: person.nation?.color || '#b9923f' }}
                          />
                          <span>{person.nation?.name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{person.tribe?.name}</td>
                      <td className="py-3 px-4 text-slate-300 capitalize">{person.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isLeaderNation
                              ? 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
                              : isLeaderTribe
                              ? 'bg-sky-500/20 text-sky-800 border border-sky-500/40'
                              : 'text-slate-400'
                          }`}
                        >
                          {isLeaderNation
                            ? 'Líder de Nação'
                            : isLeaderTribe
                            ? 'Líder de Tribo'
                            : 'Participante'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isInactive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-950 text-slate-400 border border-dark-700">
                            Inativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {isInactive ? (
                            <button
                              onClick={() => handleReactivatePerson(person)}
                              className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors text-xs font-semibold flex items-center space-x-1"
                              title="Reativar integrante"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reativar</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(person)}
                                className="min-h-9 min-w-9 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-dark-800 transition-colors flex items-center justify-center"
                                aria-label={`Editar ${person.name}`}
                                title="Editar dados"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingPerson(person)}
                                className="min-h-9 min-w-9 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center"
                                aria-label={`Remover ${person.name}`}
                                title="Remover da lista ativa"
                              >
                                <Trash2 className="w-4 h-4 text-red-700" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM SHEET: CONFIRMAÇÃO DE REMOÇÃO / DESATIVAÇÃO */}
      {deletingPerson && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-md overflow-y-auto bg-dark-900 border border-red-200 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-800 flex items-center justify-center border border-red-200 shrink-0">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="delete-dialog-title" className="text-base sm:text-lg font-bold text-slate-100">
                    Remover Integrante
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Preservação integral do histórico</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingPerson(null)}
                aria-label="Fechar confirmação"
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-3 sm:mt-4 space-y-3 text-xs sm:text-sm text-slate-300">
              <p>
                Deseja remover <strong>{deletingPerson.name}</strong> da lista ativa?
              </p>
              <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-xs space-y-1.5 text-slate-400">
                <p className="text-amber-700 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Garantia de Integridade dos Dados:</span>
                </p>
                <p>
                  • O integrante deixará de aparecer para novos lançamentos de pontuação.
                </p>
                <p>
                  • Todas as pontuações e histórico acumulado no Rally permanecem <strong>100% preservados</strong>.
                </p>
                <p>
                  • Você poderá reativá-lo a qualquer momento através do filtro de inativos.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-4 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-4 flex space-x-2.5">
              <button
                type="button"
                onClick={() => setDeletingPerson(null)}
                disabled={deleteLoading}
                className="min-h-11 flex-1 py-2.5 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="min-h-11 flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Removendo...' : 'Confirmar Remoção'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingPerson ? 'Editar integrante' : 'Cadastrar integrante'}
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-md overflow-y-auto bg-dark-900 border border-dark-700/80 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    {editingPerson ? 'Editar Integrante' : 'Novo Integrante'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Vínculo obrigatório entre tribo e nação</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar cadastro"
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePerson} className="mt-3 sm:mt-4 space-y-3 flex-1 flex flex-col justify-between">

              <div className="space-y-3">
                {/* Nome */}
                <div>
                  <label htmlFor="person-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo <span className="text-amber-700">*</span>
                  </label>
                  <input
                    id="person-name"
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Nação e Tribo em 2 colunas */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Nação */}
                  <div>
                    <label htmlFor="person-nation" className="block text-xs font-semibold text-slate-300 mb-1">
                      Nação <span className="text-amber-700">*</span>
                    </label>
                    <select
                      id="person-nation"
                      value={formNationId}
                      onChange={(e) => handleNationChange(e.target.value)}
                      className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      required
                    >
                      {nations.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tribo (Filtrada estritamente pela nação) */}
                  <div>
                    <label htmlFor="person-tribe" className="block text-xs font-semibold text-slate-300 mb-1">
                      Tribo <span className="text-amber-700">*</span>
                    </label>
                    <select
                      id="person-tribe"
                      value={formTribeId}
                      onChange={(e) => setFormTribeId(e.target.value)}
                      className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      required
                    >
                      {availableTribesForForm.length === 0 ? (
                        <option value="">Nenhuma</option>
                      ) : (
                        availableTribesForForm.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Categoria e Função em 2 colunas */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Categoria */}
                  <div>
                    <label htmlFor="person-category" className="block text-xs font-semibold text-slate-300 mb-1">
                      Categoria <span className="text-amber-700">*</span>
                    </label>
                    <select
                      id="person-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="jovem">Jovem</option>
                      <option value="membro">Membro</option>
                      <option value="obreiro">Obreiro</option>
                      <option value="colaborador">Colaborador</option>
                    </select>
                  </div>

                  {/* Função */}
                  <div>
                    <label htmlFor="person-role" className="block text-xs font-semibold text-slate-300 mb-1">
                      Função <span className="text-amber-700">*</span>
                    </label>
                    <select
                      id="person-role"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="participante">Participante</option>
                      <option value="lider_tribo">Líder de Tribo</option>
                      <option value="lider_nacao">Líder de Nação</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ação Sticky */}
              <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-3 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full min-h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {formLoading
                    ? 'Salvando...'
                    : editingPerson
                    ? 'Atualizar Integrante'
                    : 'Cadastrar Integrante'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
