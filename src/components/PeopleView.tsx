'use client';

import React, { useState } from 'react';
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
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Integrante</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Busca por Nome */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filtro por Nação */}
          <div>
            <select
              value={filterNationId}
              onChange={(e) => {
                setFilterNationId(e.target.value);
                setFilterTribeId(''); // resetar tribo se mudar nação
              }}
              className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
              className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
              className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
              className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
            Mostrando <strong>{filteredPeople.length}</strong> de <strong>{people.length}</strong> integrantes cadastrados
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

      {/* TABELA / LISTA DE INTEGRANTES */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-dark-800 transition-colors"
                          title="Editar Integrante"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {editingPerson ? 'Editar Integrante' : 'Novo Integrante'}
                  </h3>
                  <p className="text-xs text-slate-400">Vínculo obrigatório entre tribo e nação</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePerson} className="mt-4 space-y-3.5">
              
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Nação */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nação <span className="text-amber-500">*</span>
                </label>
                <select
                  value={formNationId}
                  onChange={(e) => handleNationChange(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tribo (Pertencente à Nação) <span className="text-amber-500">*</span>
                </label>
                <select
                  value={formTribeId}
                  onChange={(e) => setFormTribeId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                >
                  {availableTribesForForm.length === 0 ? (
                    <option value="">Nenhuma tribo disponível</option>
                  ) : (
                    availableTribesForForm.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria <span className="text-amber-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Função no Rali <span className="text-amber-500">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="participante">Participante</option>
                  <option value="lider_tribo">Líder de Tribo</option>
                  <option value="lider_nacao">Líder de Nação</option>
                </select>
              </div>

              {/* Ação */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
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
