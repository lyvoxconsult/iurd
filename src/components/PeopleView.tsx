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
  UserCheck
} from 'lucide-react';

interface PeopleViewProps {
  people: any[];
  nations: any[];
  tribes: any[];
  onRefresh: () => void;
}

export default function PeopleView({
  people,
  nations,
  tribes,
  onRefresh,
}: PeopleViewProps) {
  // Filtros
  const [searchName, setSearchName] = useState('');
  const [filterNationId, setFilterNationId] = useState('');
  const [filterTribeId, setFilterTribeId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Modal de Cadastro / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formNationId, setFormNationId] = useState('');
  const [formTribeId, setFormTribeId] = useState('');
  const [formCategory, setFormCategory] = useState<'jovem' | 'membro' | 'obreiro' | 'colaborador'>('jovem');
  const [formRole, setFormRole] = useState<'participante' | 'lider_tribo' | 'lider_nacao'>('participante');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fechar modal ao pressionar Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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

  // Salvar Pessoa
  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError('Informe um nome válido (mínimo 2 caracteres)');
      return;
    }
    if (!formNationId) {
      setFormError('Selecione a nação');
      return;
    }
    if (!formTribeId) {
      setFormError('Selecione a tribo');
      return;
    }

    // Validação estrita de vínculo
    const chosenTribe = tribes.find((t) => t.id === formTribeId);
    if (!chosenTribe || chosenTribe.nationId !== formNationId) {
      setFormError('A tribo selecionada não pertence à nação indicada!');
      return;
    }

    setFormLoading(true);
    try {
      const url = '/api/people';
      const method = editingPerson ? 'PUT' : 'POST';
      const bodyPayload = {
        ...(editingPerson ? { id: editingPerson.id } : {}),
        name: formName.trim(),
        nationId: formNationId,
        tribeId: formTribeId,
        category: formCategory,
        role: formRole,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar integrante');
      }

      setFormSuccess(editingPerson ? 'Integrante atualizado com sucesso!' : 'Integrante cadastrado com sucesso!');
      setTimeout(() => {
        setIsModalOpen(false);
        onRefresh();
      }, 800);
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado');
    } finally {
      setFormLoading(false);
    }
  };

  // Filtragem local dos integrantes
  const filteredPeople = people.filter((p) => {
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
    <div className="space-y-6">
      
      {/* Cabeçalho da Seção de Integrantes */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Gestão de Integrantes do Rali</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro, consulta por nação e tribo e controle de papéis
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Integrante</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl space-y-2.5 sm:space-y-3">
        {/* Busca por Nome (linha cheia) */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            aria-label="Buscar integrante por nome"
            className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* 4 Filtros: 2x2 no mobile, 4 colunas em desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Filtro por Nação */}
          <div>
            <select
              value={filterNationId}
              onChange={(e) => {
                setFilterNationId(e.target.value);
                setFilterTribeId(''); // resetar tribo se mudar nação
              }}
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Tribos</option>
              {filterAvailableTribes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.nation?.name || 'Nação'})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Categorias</option>
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
              className="w-full min-h-10 bg-dark-950 border border-dark-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Funções</option>
              <option value="participante">Participante</option>
              <option value="lider_tribo">Líder de Tribo</option>
              <option value="lider_nacao">Líder de Nação</option>
            </select>
          </div>
        </div>

        {/* Totalizadores rápidos */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-dark-800">
          <span>
            Mostrando <strong>{filteredPeople.length}</strong> de <strong>{people.length}</strong> integrantes
          </span>
          {(searchName || filterNationId || filterTribeId || filterCategory || filterRole) && (
            <button
              onClick={() => {
                setSearchName('');
                setFilterNationId('');
                setFilterTribeId('');
                setFilterCategory('');
                setFilterRole('');
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Cartões de integrantes em telas pequenas. */}
      <div className="space-y-2.5 sm:hidden">
        {filteredPeople.length === 0 ? (
          <p className="rounded-xl border border-dark-800 bg-dark-900 p-6 text-center text-sm text-slate-400">Nenhum integrante encontrado.</p>
        ) : filteredPeople.map((person) => (
          <article key={person.id} className="rounded-xl border border-dark-800 bg-dark-900 p-3 shadow-md">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <h3 className="break-words text-sm font-bold text-slate-100">{person.name}</h3>
                <p className="mt-0.5 text-xs text-slate-300">{person.tribe?.name || 'Tribo'} · {person.nation?.name || 'Nação'}</p>
              </div>
              <button onClick={() => handleOpenEditModal(person)} aria-label={`Editar ${person.name}`} className="min-h-10 min-w-10 shrink-0 rounded-lg border border-dark-700 text-amber-400 flex items-center justify-center hover:bg-dark-800"><Edit2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full border border-dark-700 px-2 py-0.5 capitalize text-slate-300">{person.category}</span>
              <span className="rounded-full border border-amber-700/50 bg-amber-500/10 px-2 py-0.5 text-amber-200">{person.role === 'lider_nacao' ? 'Líder de Nação' : person.role === 'lider_tribo' ? 'Líder de Tribo' : 'Participante'}</span>
            </div>
          </article>
        ))}
      </div>
      {/* Tabela em tablet e desktop. */}
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
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum integrante encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPeople.map((person) => {
                  const isLeaderNation = person.role === 'lider_nacao';
                  const isLeaderTribe = person.role === 'lider_tribo';

                  return (
                    <tr key={person.id} className="hover:bg-dark-950/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100 flex items-center space-x-2">
                        {isLeaderNation ? (
                          <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : isLeaderTribe ? (
                          <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span>{person.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-300">
                          {person.nation?.name || 'Nação'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400">
                          {person.tribe?.name || 'Tribo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-medium bg-dark-950 border border-dark-700 text-slate-300">
                          {person.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isLeaderNation
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isLeaderTribe
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-dark-950 text-slate-400 border border-dark-800'
                          }`}
                        >
                          {person.role === 'lider_nacao'
                            ? 'Líder de Nação'
                            : person.role === 'lider_tribo'
                            ? 'Líder de Tribo'
                            : 'Participante'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(person)}
                          className="min-h-11 min-w-11 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-dark-800 transition-colors"
                          aria-label={`Editar ${person.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingPerson ? 'Editar integrante' : 'Cadastrar integrante'}
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-md overflow-y-auto bg-dark-900 border border-dark-700/80 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            {/* Barra de puxar no mobile (Bottom Sheet handle) */}
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />
            
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
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
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePerson} className="mt-3 sm:mt-4 space-y-3 flex-1 flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Nome */}
                <div>
                  <label htmlFor="person-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo <span className="text-amber-500">*</span>
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
                      Nação <span className="text-amber-500">*</span>
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
                      Tribo <span className="text-amber-500">*</span>
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
                      Categoria <span className="text-amber-500">*</span>
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
                      Função <span className="text-amber-500">*</span>
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
                  className="w-full min-h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
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
