import React, { useMemo, useState } from 'react';
import { usePeriodosOperacao, calcularDias } from '@/hooks/usePeriodosOperacao';
import { Clock, CheckCircle, TrendingUp, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const operacaoBadge = {
  'frigorifica':      'bg-blue-100 text-blue-700',
  'granel':           'bg-amber-100 text-amber-700',
  'granel_liquido':   'bg-cyan-100 text-cyan-700',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function PeriodosOperacaoRelatorio() {
  const { data: periodos = [], isLoading } = usePeriodosOperacao();
  const [filterCavalo, setFilterCavalo] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // todos | ativo | encerrado
  const [sortField, setSortField] = useState('dias');
  const [sortDir, setSortDir] = useState('desc');

  const enriched = useMemo(() => {
    return periodos.map(p => ({
      ...p,
      dias: calcularDias(p.data_inicio, p.data_fim),
      ativo: !p.data_fim,
    }));
  }, [periodos]);

  const filtered = useMemo(() => {
    let list = [...enriched];

    if (filterCavalo) {
      list = list.filter(p =>
        (p.cavalo?.placa || '').toLowerCase().includes(filterCavalo.toLowerCase())
      );
    }

    if (filterStatus === 'ativo') list = list.filter(p => p.ativo);
    if (filterStatus === 'encerrado') list = list.filter(p => !p.ativo);

    list.sort((a, b) => {
      let va, vb;
      if (sortField === 'dias') { va = a.dias; vb = b.dias; }
      else if (sortField === 'data_inicio') { va = a.data_inicio; vb = b.data_inicio; }
      else if (sortField === 'cavalo') { va = a.cavalo?.placa || ''; vb = b.cavalo?.placa || ''; }
      else { va = a.dias; vb = b.dias; }

      if (sortDir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });

    return list;
  }, [enriched, filterCavalo, filterStatus, sortField, sortDir]);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-slate-600" />
      : <ChevronDown size={12} className="text-slate-600" />;
  };

  const stats = useMemo(() => ({
    total: enriched.length,
    ativos: enriched.filter(p => p.ativo).length,
    diasMedio: enriched.length
      ? Math.round(enriched.reduce((s, p) => s + p.dias, 0) / enriched.length)
      : 0,
    maxDias: enriched.reduce((m, p) => Math.max(m, p.dias), 0),
  }), [enriched]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm font-medium">Carregando histórico de operações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Histórico de Períodos de Operação
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreamento automático de trocas de operação por veículo
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-indigo-500 mb-1">Total de Períodos</p>
          <p className="text-2xl font-black text-indigo-800">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Períodos Ativos</p>
          <p className="text-2xl font-black text-emerald-800">{stats.ativos}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Média de Dias</p>
          <p className="text-2xl font-black text-amber-800">{stats.diasMedio}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Maior Período</p>
          <p className="text-2xl font-black text-slate-800">{stats.maxDias} dias</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <Filter size={14} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Filtrar por placa do cavalo..."
          value={filterCavalo}
          onChange={e => setFilterCavalo(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-48"
        />
        <div className="flex items-center gap-1 rounded-lg overflow-hidden border border-slate-200 bg-white">
          {[
            { val: 'todos', label: 'Todos' },
            { val: 'ativo', label: 'Ativos' },
            { val: 'encerrado', label: 'Encerrados' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setFilterStatus(opt.val)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterStatus === opt.val
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} registro(s)</span>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum período encontrado</p>
          <p className="text-xs mt-1">
            Os períodos são criados automaticamente ao editar um veículo Cavalo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white uppercase text-[10px] font-bold">
                <th className="px-4 py-3 text-left">Período</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => toggleSort('cavalo')}
                >
                  <span className="flex items-center gap-1">Cavalo <SortIcon field="cavalo" /></span>
                </th>
                <th className="px-4 py-3 text-left">Carreta</th>
                <th className="px-4 py-3 text-left">Operação</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => toggleSort('dias')}
                >
                  <span className="flex items-center gap-1">Dias <SortIcon field="dias" /></span>
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => toggleSort('data_inicio')}
                >
                  <span className="flex items-center gap-1">1º Frete <SortIcon field="data_inicio" /></span>
                </th>
                <th className="px-4 py-3 text-left">Troca Op.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  {/* Status */}
                  <td className="px-4 py-3">
                    {p.ativo ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                        <CheckCircle size={11} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-semibold text-[10px] uppercase">
                        <Clock size={11} /> Encerrado
                      </span>
                    )}
                  </td>
                  {/* Cavalo */}
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">
                    {p.cavalo?.placa || '-'}
                  </td>
                  {/* Carreta */}
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {p.carreta?.placa || '-'}
                  </td>
                  {/* Operação */}
                  <td className="px-4 py-3">
                    {p.operacao ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        operacaoBadge[p.operacao.nome?.toLowerCase().replace(' ', '_')]
                        || 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.operacao.nome}
                      </span>
                    ) : '-'}
                  </td>
                  {/* Dias */}
                  <td className="px-4 py-3">
                    <span className={`font-black text-base ${
                      p.ativo ? 'text-indigo-700' : 'text-slate-600'
                    }`}>
                      {p.dias}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">dias</span>
                  </td>
                  {/* 1º Frete */}
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {formatDate(p.data_inicio)}
                  </td>
                  {/* Troca Op */}
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(p.data_fim)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
