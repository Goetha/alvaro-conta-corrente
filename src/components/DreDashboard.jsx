import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, RadialBarChart, RadialBar, LabelList } from 'recharts';
import { Plus, MoreVertical, Edit, Copy, Trash2, ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown, Activity, GripVertical, ArrowUpDown, Settings, X, CheckCircle, Filter, Search, Minus, HelpCircle, Calendar, AlertTriangle, Wallet } from 'lucide-react';
import { useLancamentos, useCreateLancamento, useUpdateLancamento, useDeleteLancamento } from '@/hooks/useLancamentos';
import { useCaixa, useCreateCaixa, useUpdateCaixa, useDeleteCaixa } from '@/hooks/useCaixa';
import { useDiesel, useCreateDiesel, useUpdateDiesel, useDeleteDiesel } from '@/hooks/useDiesel';
import { useReceber, useCreateReceber, useUpdateReceber, useDeleteReceber } from '@/hooks/useReceber';
import { useBancos } from '@/hooks/useBancos';
import { useParceiros } from '@/hooks/useParceiros';
import { LancamentoDrawer } from '@/components/lancamentos/LancamentoDrawer';
import { DieselDrawer } from '@/components/lancamentos/DieselDrawer';
import { ReceberDrawer } from '@/components/lancamentos/ReceberDrawer';
import { DreLinhaDrawer } from '@/components/lancamentos/DreLinhaDrawer';
import { StatCard } from '@/components/shared/StatCard';
import { formatBRL, formatDate } from '@/lib/formatters';
import { useDreConfig, useCreateDreLinha, useUpdateDreLinha, useDeleteDreLinha, useReorderDreLinhas } from '@/hooks/useDreConfig';
import { useCustoCapital, useCreateCustoCapital, useUpdateCustoCapital, useDeleteCustoCapital } from '@/hooks/useCustoCapital';
import { CustoCapitalDrawer } from '@/components/lancamentos/CustoCapitalDrawer';
import { useDreKpis, useCreateDreKpi, useUpdateDreKpi, useDeleteDreKpi } from '@/hooks/useDreKpis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useSalario, useCreateSalario, useUpdateSalario, useDeleteSalario } from '@/hooks/useSalario';
import { useManutencao, useCreateManutencao, useUpdateManutencao, useDeleteManutencao } from '@/hooks/useManutencao';
import { usePedagio, useCreatePedagio, useUpdatePedagio, useDeletePedagio } from '@/hooks/usePedagio';
import { DreKpiDrawer } from '@/components/lancamentos/DreKpiDrawer';
import { SalarioDrawer } from '@/components/lancamentos/SalarioDrawer';
import { ManutencaoDrawer } from '@/components/lancamentos/ManutencaoDrawer';
import { PedagioDrawer } from '@/components/lancamentos/PedagioDrawer';
import { useAppSettings } from '@/hooks/useAppSettings';

const PAGE_SIZE = 50;
const CUSTO_CAPITAL_RATE = 0.01; // 1% ao mês

function CustoCapitalView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);

  const filtered = useMemo(() => {
    return [...data]
      .filter(l => {
        const s = search.toLowerCase();
        return !s || (l.historico || '').toLowerCase().includes(s);
      })
      .sort((a, b) => new Date(a.data_aporte) - new Date(b.data_aporte));
  }, [data, search]);

  const totais = useMemo(() => {
    // Usa data UTC para bater com HOJE() do Excel (Excel usa data do sistema em UTC)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const taxa = CUSTO_CAPITAL_RATE;

    const parseUTCDate = (dateStr) => {
      if (!dateStr) return todayUTC;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }
      return todayUTC;
    };

    const aporte = filtered.reduce((s, l) => s + (Number(l.valor_aporte) || 0), 0);
    const custo = filtered.reduce((s, l) => {
      const dataAporte = parseUTCDate(l.data_aporte);

      const diffDays = Math.round((todayUTC - dataAporte) / (1000 * 60 * 60 * 24));
      const periodo = (diffDays + 1) / 30;
      const valorCusto = (Number(l.valor_aporte) || 0) * (Math.pow(1 + taxa, periodo) - 1);

      return s - valorCusto;
    }, 0);

    return { aporte, custo };
  }, [filtered]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Aportado" value={formatBRL(totais.aporte)} icon={DollarSign} variant="success" />
        <StatCard title="Custo de Capital Total" value={formatBRL(totais.custo)} icon={TrendingDown} variant="danger" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Aporte
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <input type="text" placeholder="Buscar no histórico..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] tracking-tight">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Data Aporte</th>
                <th className="px-4 py-3 text-left">Histórico</th>
                <th className="px-4 py-3 text-right">Valor Aporte</th>
                <th className="px-4 py-3 text-center">Período Aporte</th>
                <th className="px-4 py-3 text-right">Custo Capital</th>
                <th className="px-4 py-3 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Carregando dados...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
              ) : (
                paginated.map(l => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const parseLocalDate = (dateStr) => {
                    if (!dateStr) return new Date();
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    }
                    const d = new Date(dateStr);
                    d.setHours(0, 0, 0, 0);
                    return d;
                  };

                  const dataAporte = parseLocalDate(l.data_aporte);

                  const diffDays = Math.round((today - dataAporte) / (1000 * 60 * 60 * 24));
                  const periodo = (diffDays + 1) / 30;
                  const custo = (Number(l.valor_aporte) || 0) * (Math.pow(1 + CUSTO_CAPITAL_RATE, periodo) - 1);

                  return (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">{formatDate(l.data_aporte)}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{l.historico}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatBRL(l.valor_aporte)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-600">{periodo.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">-{formatBRL(custo)}</td>
                      <td className="px-4 py-3 text-center relative">
                        <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><MoreVertical size={14} /></button>
                        {openMenu === l.id && (
                          <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-28 py-1 text-left">
                            <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-slate-50"><Edit size={12} /> Editar</button>
                            <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustoCapitalDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={(p) => { if (editItem) onUpdate.mutateAsync({ id: editItem.id, ...p }); else onCreate.mutateAsync(p); setDrawerOpen(false); }} initial={editItem} />
    </div>
  );
}

function LancamentosView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterConta, setFilterConta] = useState('');
  const [filterParceiro, setFilterParceiro] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);

  const { data: bancos = [] } = useBancos();

  const filtered = useMemo(() => {
    return data.filter((l) => {
      // Filtro de busca global
      const s = search.toLowerCase();
      const matchSearch = !s ||
        (l.historico || '').toLowerCase().includes(s) ||
        (l.parceiro || '').toLowerCase().includes(s) ||
        (l.numero || '').toLowerCase().includes(s);

      // Filtros por coluna (estilo Excel - seleção múltipla)
      const matchColumnFilters = Object.entries(columnFilters).every(([key, values]) => {
        if (values === null || values === undefined) return true;
        const itemValue = (l[key] || '').toString().trim();
        return values.includes(itemValue);
      });

      const matchConta = !filterConta || l.conta === filterConta;
      const matchParceiro = !filterParceiro || l.parceiro === filterParceiro;
      const matchTipo = !filterTipo || (filterTipo === 'receita' && (l.receita || 0) > 0) || (filterTipo === 'despesa' && (l.despesa || 0) > 0);
      const matchDataInicio = !dataInicio || l.data >= dataInicio;
      const matchDataFim = !dataFim || l.data <= dataFim;

      return matchSearch && matchColumnFilters && matchConta && matchParceiro && matchTipo && matchDataInicio && matchDataFim;
    });
  }, [data, search, columnFilters, filterConta, filterParceiro, filterTipo, dataInicio, dataFim]);

  const withSaldo = useMemo(() => {
    let acc = 0;
    return filtered.map((l) => { acc += (l.receita || 0) - (l.despesa || 0); return { ...l, saldoCorrente: acc }; });
  }, [filtered]);

  const totais = useMemo(() => {
    const receitas = filtered.reduce((s, l) => s + (l.receita || 0), 0);
    const despesas = filtered.reduce((s, l) => s + (l.despesa || 0), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(withSaldo.length / PAGE_SIZE));
  const paginated = withSaldo.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSave(payload) {
    const { saldoCorrente, created_at, ...cleanPayload } = payload;
    try {
      if (editItem) { await onUpdate.mutateAsync({ id: editItem.id, ...cleanPayload }); }
      else { await onCreate.mutateAsync(cleanPayload); }
      setDrawerOpen(false); setEditItem(null);
    } catch (error) { alert('Erro ao salvar: ' + error.message); }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Registro
        </button>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Saldo Atual" value={formatBRL(totais.saldo)} icon={DollarSign} variant={totais.saldo >= 0 ? 'info' : 'danger'} />
        <StatCard title="Receitas" value={formatBRL(totais.receitas)} icon={TrendingUp} variant="success" />
        <StatCard title="Despesas" value={formatBRL(totais.despesas)} icon={TrendingDown} variant="danger" />
        <StatCard title="Resultado" value={formatBRL(totais.saldo)} icon={Activity} variant={totais.saldo >= 0 ? 'success' : 'danger'} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-[11px] tracking-tight">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  { label: 'DATA', key: 'data' },
                  { label: 'COMP.', key: 'comp' },
                  { label: 'Nº', key: 'numero' },
                  { label: 'PARCEIRO', key: 'parceiro' },
                  { label: 'HISTÓRICO', key: 'historico' },
                  { label: 'PLACA', key: 'placa' },
                  { label: 'KM', key: 'km' },
                  { label: 'QTDADE', key: 'qtdade' },
                  { label: 'CÓD.', key: 'codigo' },
                  { label: 'CONTA', key: 'conta' },
                  { label: 'RECEITAS', key: 'receita' },
                  { label: 'DESPESAS', key: 'despesa' },
                  { label: 'SALDO', key: 'saldo' },
                  { label: 'CONC.', key: 'conciliado' },
                  { label: '', key: 'actions' }
                ].map((col, i) => (
                  <th key={i} className="px-1.5 py-2 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group relative">
                      <span>{col.label}</span>
                      {col.key !== 'actions' && col.key !== 'saldo' && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveFilter(activeFilter === col.key ? null : col.key)}
                            className={`p-1 rounded hover:bg-slate-200 transition-colors ${columnFilters[col.key] ? 'text-emerald-600' : 'text-slate-300'}`}
                          >
                            <Filter size={10} />
                          </button>

                          {activeFilter === col.key && (
                            <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 p-2 min-w-[220px]">
                              <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2 py-1 bg-white mb-2">
                                <Search size={12} className="text-slate-400" />
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder={`Buscar...`}
                                  className="w-full text-[10px] focus:outline-none"
                                  onChange={(e) => {
                                    const term = e.target.value.toLowerCase();
                                    const items = document.querySelectorAll(`.filter-item-${col.key}`);
                                    items.forEach(el => {
                                      const text = el.getAttribute('data-value').toLowerCase();
                                      el.style.display = text.includes(term) ? 'flex' : 'none';
                                    });
                                  }}
                                />
                              </div>

                              <div className="max-h-48 overflow-y-auto mb-2 border-t border-slate-50 pt-1">
                                {(() => {
                                  const allVals = [...new Set(data.map(l => (l[col.key] || '').toString().trim()))].filter(Boolean).sort();
                                  const selected = columnFilters[col.key];
                                  const isAllSelected = selected === null || selected === undefined;

                                  return (
                                    <div className="space-y-0.5">
                                      <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={isAllSelected}
                                          onChange={(e) => {
                                            setColumnFilters({ ...columnFilters, [col.key]: e.target.checked ? null : [] });
                                          }}
                                          className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-[10px] text-slate-700 font-bold">(Selecionar Tudo)</span>
                                      </label>

                                      {allVals.map((v, idx) => (
                                        <label
                                          key={idx}
                                          data-value={v}
                                          className={`filter-item-${col.key} flex items-center gap-2 px-2 py-1 hover:bg-indigo-50 rounded cursor-pointer group transition-colors`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isAllSelected || (Array.isArray(selected) && selected.includes(v))}
                                            onChange={(e) => {
                                              let newSelected = isAllSelected ? [...allVals] : [...(selected || [])];

                                              if (e.target.checked) {
                                                if (!newSelected.includes(v)) newSelected.push(v);
                                              } else {
                                                newSelected = newSelected.filter(item => item !== v);
                                              }

                                              // Se selecionou tudo, volta para o estado 'null' (todos)
                                              if (newSelected.length === allVals.length) {
                                                setColumnFilters({ ...columnFilters, [col.key]: null });
                                              } else {
                                                setColumnFilters({ ...columnFilters, [col.key]: newSelected });
                                              }
                                            }}
                                            className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <span className="text-[10px] text-slate-600 group-hover:text-indigo-700 truncate" title={v}>{v}</span>
                                        </label>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>

                              <div className="flex gap-1 border-t border-slate-100 pt-2">
                                <button
                                  onClick={() => setActiveFilter(null)}
                                  className="flex-1 text-center py-1.5 text-[9px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded shadow-sm transition-colors"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => {
                                    setColumnFilters({ ...columnFilters, [col.key]: null });
                                    setActiveFilter(null);
                                  }}
                                  className="px-2 text-center py-1.5 text-[9px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors"
                                >
                                  Limpar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={15} className="px-4 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : (
                paginated.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-1.5 py-1.5 whitespace-nowrap text-slate-700">{formatDate(l.data)}</td>
                    <td className="px-1.5 py-1.5 text-slate-500">{l.comp || '-'}</td>
                    <td className="px-1.5 py-1.5 text-slate-500">{l.numero || '-'}</td>
                    <td className="px-1.5 py-1.5 truncate max-w-[110px]" title={l.parceiro}>{l.parceiro || '-'}</td>
                    <td className="px-1.5 py-1.5 truncate max-w-[140px] text-slate-600" title={l.historico}>{l.historico || '-'}</td>
                    <td className="px-1.5 py-1.5 text-slate-500">{l.placa || '-'}</td>
                    <td className="px-1.5 py-1.5 text-slate-500">{l.km?.toLocaleString('pt-BR') || '-'}</td>
                    <td className="px-1.5 py-1.5 text-slate-500">{l.qtdade ?? '-'}</td>
                    <td className="px-1.5 py-1.5">{l.codigo || '-'}</td>
                    <td className="px-1.5 py-1.5 truncate max-w-[110px] text-slate-500">{l.conta || '-'}</td>
                    <td className="px-1.5 py-1.5 text-emerald-600 font-semibold">{l.receita > 0 ? formatBRL(l.receita) : '-'}</td>
                    <td className="px-1.5 py-1.5 text-red-600 font-semibold">{l.despesa > 0 ? formatBRL(l.despesa) : '-'}</td>
                    <td className={`px-1.5 py-1.5 font-bold ${l.saldoCorrente >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatBRL(l.saldoCorrente)}</td>
                    <td className="px-1.5 py-1.5 text-center">{l.conciliado ? '✅' : '❌'}</td>
                    <td className="px-1.5 py-1.5 relative text-right">
                      <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded"><MoreVertical size={14} className="text-slate-400" /></button>
                      {openMenu === l.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-32 py-1 text-left">
                          <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-slate-50"><Edit size={12} /> Editar</button>
                          <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-slate-200 rounded-b-xl">
        <div className="flex flex-1 justify-between sm:hidden">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Anterior</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Próximo</button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700">
              Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a <span className="font-medium">{Math.min(page * PAGE_SIZE, withSaldo.length)}</span> de <span className="font-medium">{withSaldo.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-slate-700">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <LancamentoDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={handleSave} initial={editItem} />
    </div>
  );
}

function DieselView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);

  const withStats = useMemo(() => {
    return data.filter(l => {
      const s = search.toLowerCase();
      return !s || (l.fornecedor || '').toLowerCase().includes(s) || (l.placa || '').toLowerCase().includes(s);
    }).map(l => ({ ...l, saldo: (l.valor_a_pagar || 0) - (l.valor_pago || 0), media: l.km && l.quantidade ? (l.km / l.quantidade).toFixed(2) : '-' }));
  }, [data, search]);

  const totais = useMemo(() => {
    const aPagar = withStats.reduce((s, l) => s + (l.valor_a_pagar || 0), 0);
    const pago = withStats.reduce((s, l) => s + (l.valor_pago || 0), 0);
    return { aPagar, pago, saldo: aPagar - pago };
  }, [withStats]);

  const paginated = withStats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Abastecimento
        </button>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total A Pagar" value={formatBRL(totais.aPagar)} icon={DollarSign} variant="danger" />
        <StatCard title="Total Pago" value={formatBRL(totais.pago)} icon={TrendingUp} variant="success" />
        <StatCard title="SALDO" value={formatBRL(totais.saldo)} icon={Activity} variant="info" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] tracking-tight">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-2 py-2 text-left">Emissão</th><th className="px-2 py-2 text-left">Documento</th><th className="px-2 py-2 text-left">Fornecedor</th><th className="px-2 py-2 text-left">Placa</th><th className="px-2 py-2 text-right">KM</th><th className="px-2 py-2 text-right">Qtde</th><th className="px-2 py-2 text-right">A Pagar</th><th className="px-2 py-2 text-center">Média</th><th className="px-2 py-2 text-right">Pago</th><th className="px-2 py-2 text-right">Saldo</th><th className="px-2 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(l => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-2">{formatDate(l.data_emissao)}</td><td className="px-2 py-2">{l.documento || '-'}</td><td className="px-2 py-2 font-medium">{l.fornecedor || '-'}</td><td className="px-2 py-2 font-bold">{l.placa || '-'}</td><td className="px-2 py-2 text-right">{l.km?.toLocaleString('pt-BR')}</td><td className="px-2 py-2 text-right">{l.quantidade?.toLocaleString('pt-BR')}</td><td className="px-2 py-2 text-right text-red-600 font-semibold">{formatBRL(l.valor_a_pagar)}</td><td className="px-2 py-2 text-center bg-slate-50">{l.media}</td><td className="px-2 py-2 text-right text-emerald-600 font-semibold">{formatBRL(l.valor_pago)}</td><td className={`px-2 py-2 text-right font-bold ${l.saldo > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatBRL(l.saldo)}</td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded"><MoreVertical size={14} className="text-slate-400" /></button>
                    {openMenu === l.id && (
                      <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-28 py-1 text-left">
                        <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-slate-50"><Edit size={12} /> Editar</button>
                        <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-slate-200 rounded-b-xl">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700">
              Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a <span className="font-medium">{Math.min(page * PAGE_SIZE, withStats.length)}</span> de <span className="font-medium">{withStats.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Adicionando cálculos de total de páginas */}
            {(() => {
              const totalPages = Math.max(1, Math.ceil(withStats.length / PAGE_SIZE));
              return (
                <>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium text-slate-700">Página {page} de {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16} /></button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <DieselDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={(p) => { if (editItem) onUpdate.mutateAsync({ id: editItem.id, ...p }); else onCreate.mutateAsync(p); setDrawerOpen(false); }} initial={editItem} />
    </div>
  );
}

function ReceberView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);

  const withStats = useMemo(() => {
    return data.filter(l => {
      const s = search.toLowerCase();
      return !s ||
        (l.cliente || '').toLowerCase().includes(s) ||
        (l.pagador || '').toLowerCase().includes(s) ||
        (l.doc_magna || '').toLowerCase().includes(s) ||
        (l.placa || '').toLowerCase().includes(s);
    }).map(l => {
      const saldo = (l.valor_a_receber || 0) - (l.valor_recebido || 0) + (l.ajustes || 0);
      return { ...l, saldo };
    });
  }, [data, search]);

  const totais = useMemo(() => {
    const icms = withStats.reduce((s, l) => s + (l.icms || 0), 0);
    const aReceber = withStats.reduce((s, l) => s + (l.valor_a_receber || 0), 0);
    const recebido = withStats.reduce((s, l) => s + (l.valor_recebido || 0), 0);
    const ajustes = withStats.reduce((s, l) => s + (l.ajustes || 0), 0);
    const saldo = withStats.reduce((s, l) => s + (l.saldo || 0), 0);
    return { icms, aReceber, recebido, ajustes, saldo };
  }, [withStats]);

  const paginated = withStats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Faturamento
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="ICMS" value={formatBRL(totais.icms)} icon={Activity} variant="info" />
        <StatCard title="A Receber" value={formatBRL(totais.aReceber)} icon={DollarSign} variant="danger" />
        <StatCard title="Recebido" value={formatBRL(totais.recebido)} icon={TrendingUp} variant="success" />
        <StatCard title="(-) Desc./Acr." value={formatBRL(totais.ajustes)} icon={TrendingDown} variant="info" />
        <StatCard title="Saldo" value={formatBRL(totais.saldo)} icon={Activity} variant={totais.saldo > 0 ? 'danger' : 'success'} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <input type="text" placeholder="Buscar cliente, pagador, documento..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] tracking-tighter">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-1.5 py-2 text-left">Data</th>
                <th className="px-1.5 py-2 text-left">Doc Magna</th>
                <th className="px-1.5 py-2 text-left">Doc Rio Log</th>
                <th className="px-1.5 py-2 text-left">Pagador</th>
                <th className="px-1.5 py-2 text-left">Cliente</th>
                <th className="px-1.5 py-2 text-left">Placa</th>
                <th className="px-1.5 py-2 text-left">Origem</th>
                <th className="px-1.5 py-2 text-left">Destino</th>
                <th className="px-1.5 py-2 text-right">Peso</th>
                <th className="px-1.5 py-2 text-left">Vcto</th>
                <th className="px-1.5 py-2 text-right">ICMS</th>
                <th className="px-1.5 py-2 text-right">Seguro</th>
                <th className="px-1.5 py-2 text-right">A Receber</th>
                <th className="px-1.5 py-2 text-right">Recebido</th>
                <th className="px-1.5 py-2 text-right">Desc/Acr</th>
                <th className="px-1.5 py-2 text-right">Saldo</th>
                <th className="px-1.5 py-2 text-center">Receb.</th>
                <th className="px-1.5 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(l => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-1.5 py-2 whitespace-nowrap">{formatDate(l.data)}</td>
                  <td className="px-1.5 py-2 font-mono text-slate-500">{l.doc_magna || '-'}</td>
                  <td className="px-1.5 py-2 font-mono text-slate-500">{l.doc_riolog || '-'}</td>
                  <td className="px-1.5 py-2 truncate max-w-[80px]" title={l.pagador}>{l.pagador || '-'}</td>
                  <td className="px-1.5 py-2 truncate max-w-[80px]" title={l.cliente}>{l.cliente || '-'}</td>
                  <td className="px-1.5 py-2 font-bold">{l.placa || '-'}</td>
                  <td className="px-1.5 py-2 truncate max-w-[60px]">{l.origem || '-'}</td>
                  <td className="px-1.5 py-2 truncate max-w-[60px]">{l.destino || '-'}</td>
                  <td className="px-1.5 py-2 text-right">{l.peso?.toLocaleString('pt-BR')}</td>
                  <td className="px-1.5 py-2 text-slate-500 whitespace-nowrap">{formatDate(l.data_vencimento)}</td>
                  <td className="px-1.5 py-2 text-right text-slate-500">{formatBRL(l.icms)}</td>
                  <td className="px-1.5 py-2 text-right text-slate-500">{formatBRL(l.seguro)}</td>
                  <td className="px-1.5 py-2 text-right text-red-600 font-semibold">{formatBRL(l.valor_a_receber)}</td>
                  <td className="px-1.5 py-2 text-right text-emerald-600 font-semibold">{formatBRL(l.valor_recebido)}</td>
                  <td className={`px-1.5 py-2 text-right ${l.ajustes < 0 ? 'text-red-400' : 'text-blue-400'}`}>{formatBRL(l.ajustes)}</td>
                  <td className={`px-1.5 py-2 text-right font-bold ${l.saldo > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatBRL(l.saldo)}</td>
                  <td className="px-1.5 py-2 text-center text-slate-500">{l.data_recebimento ? formatDate(l.data_recebimento) : '-'}</td>
                  <td className="px-1.5 py-2 relative text-center">
                    <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded"><MoreVertical size={14} className="text-slate-400" /></button>
                    {openMenu === l.id && (
                      <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-28 py-1 text-left text-xs">
                        <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50"><Edit size={12} /> Editar</button>
                        <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-slate-200 rounded-b-xl">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700">
              Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a <span className="font-medium">{Math.min(page * PAGE_SIZE, withStats.length)}</span> de <span className="font-medium">{withStats.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(withStats.length / PAGE_SIZE));
              return (
                <>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium text-slate-700">Página {page} de {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16} /></button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <ReceberDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={(p) => { if (editItem) onUpdate.mutateAsync({ id: editItem.id, ...p }); else onCreate.mutateAsync(p); setDrawerOpen(false); }} initial={editItem} />
    </div>
  );
}

function SalarioView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [dateRange, setDateRange] = useState({ inicio: '', fim: '' });

  const filtered = useMemo(() => {
    return data.filter(l => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        (l.favorecido || '').toLowerCase().includes(s) ||
        (l.historico || '').toLowerCase().includes(s) ||
        (l.placa || '').toLowerCase().includes(s);

      const matchDate = (!dateRange.inicio || l.data >= dateRange.inicio) &&
        (!dateRange.fim || l.data <= dateRange.fim);

      return matchSearch && matchDate;
    });
  }, [data, search, dateRange]);

  const total = useMemo(() => filtered.reduce((s, l) => s + (Number(l.valor) || 0), 0), [filtered]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex-1 lg:flex-none lg:w-64">
            <input type="text" placeholder="Buscar placa, favorecido..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full border-none px-2 py-1 text-sm focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
            <Calendar size={14} className="text-slate-400 ml-1" />
            <input type="date" value={dateRange.inicio} onChange={(e) => { setDateRange(r => ({ ...r, inicio: e.target.value })); setPage(1); }} className="text-xs border-none focus:outline-none" />
            <span className="text-slate-300 text-xs">até</span>
            <input type="date" value={dateRange.fim} onChange={(e) => { setDateRange(r => ({ ...r, fim: e.target.value })); setPage(1); }} className="text-xs border-none focus:outline-none" />
            {(dateRange.inicio || dateRange.fim) && <button onClick={() => setDateRange({ inicio: '', fim: '' })} className="text-[10px] text-red-500 font-bold hover:underline ml-1">Limpar</button>}
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="Total Salários (Filtrado)" value={formatBRL(total)} icon={DollarSign} variant="info" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] tracking-tight">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Placa</th>
                <th className="px-4 py-3 text-left">Favorecido</th>
                <th className="px-4 py-3 text-left">Histórico</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
              ) : (
                paginated.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.data)}</td>
                    <td className="px-4 py-3 font-bold">{l.placa || '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{l.favorecido || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{l.historico || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatBRL(l.valor)}</td>
                    <td className="px-4 py-3 text-center relative">
                      <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><MoreVertical size={14} /></button>
                      {openMenu === l.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-28 py-1 text-left text-xs">
                          <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50"><Edit size={12} /> Editar</button>
                          <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <SalarioDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={(p) => { if (editItem) onUpdate.mutateAsync({ id: editItem.id, ...p }); else onCreate.mutateAsync(p); setDrawerOpen(false); }} initial={editItem} />
    </div>
  );
}

function ManutencaoView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [dateRange, setDateRange] = useState({ inicio: '', fim: '' });

  const filtered = useMemo(() => {
    return data.filter(l => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        (l.parceiro || '').toLowerCase().includes(s) ||
        (l.historico || '').toLowerCase().includes(s) ||
        (l.placa || '').toLowerCase().includes(s) ||
        (l.documento || '').toLowerCase().includes(s);

      const matchDate = (!dateRange.inicio || l.data >= dateRange.inicio) &&
        (!dateRange.fim || l.data <= dateRange.fim);

      return matchSearch && matchDate;
    });
  }, [data, search, dateRange]);

  const total = useMemo(() => filtered.reduce((s, l) => s + (Number(l.valor) || 0), 0), [filtered]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex-1 lg:flex-none lg:w-64">
            <input type="text" placeholder="Buscar placa, parceiro, doc..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full border-none px-2 py-1 text-sm focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
            <Calendar size={14} className="text-slate-400 ml-1" />
            <input type="date" value={dateRange.inicio} onChange={(e) => { setDateRange(r => ({ ...r, inicio: e.target.value })); setPage(1); }} className="text-xs border-none focus:outline-none" />
            <span className="text-slate-300 text-xs">até</span>
            <input type="date" value={dateRange.fim} onChange={(e) => { setDateRange(r => ({ ...r, fim: e.target.value })); setPage(1); }} className="text-xs border-none focus:outline-none" />
            {(dateRange.inicio || dateRange.fim) && <button onClick={() => setDateRange({ inicio: '', fim: '' })} className="text-[10px] text-red-500 font-bold hover:underline ml-1">Limpar</button>}
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus size={16} /> Nova Manutenção
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="Total Manutenção (Filtrado)" value={formatBRL(total)} icon={DollarSign} variant="warning" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] tracking-tight">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Placa</th>
                <th className="px-4 py-3 text-left">Parceiro</th>
                <th className="px-4 py-3 text-left">Histórico</th>
                <th className="px-4 py-3 text-left">Doc</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
              ) : (
                paginated.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.data)}</td>
                    <td className="px-4 py-3 font-bold">{l.placa || '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{l.parceiro || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{l.historico || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{l.documento || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{formatBRL(l.valor)}</td>
                    <td className="px-4 py-3 text-center relative">
                      <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><MoreVertical size={14} /></button>
                      {openMenu === l.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-28 py-1 text-left text-xs">
                          <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50"><Edit size={12} /> Editar</button>
                          <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ManutencaoDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={(p) => { if (editItem) onUpdate.mutateAsync({ id: editItem.id, ...p }); else onCreate.mutateAsync(p); setDrawerOpen(false); }} initial={editItem} />
    </div>
  );
}

function PedagioView({ data = [], isLoading, onCreate, onUpdate, onDelete }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [dateRange, setDateRange] = useState({ inicio: '', fim: '' });

  const filtered = useMemo(() => {
    return data.filter(l => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        (l.parceiro || '').toLowerCase().includes(s) ||
        (l.historico || '').toLowerCase().includes(s) ||
        (l.placa || '').toLowerCase().includes(s) ||
        (l.documento || '').toLowerCase().includes(s);

      const matchDate = (!dateRange.inicio || l.data >= dateRange.inicio) &&
        (!dateRange.fim || l.data <= dateRange.fim);

      return matchSearch && matchDate;
    });
  }, [data, search, dateRange]);

  const total = useMemo(() => filtered.reduce((s, l) => s + (Number(l.valor) || 0), 0), [filtered]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex-1 lg:flex-none lg:w-64">
            <input type="text" placeholder="Buscar placa, parceiro, doc..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full border-none px-2 py-1 text-sm focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
            <Calendar size={14} className="text-slate-400 ml-1" />
            <input type="date" value={dateRange.inicio} onChange={(e) => { setDateRange(r => ({ ...r, inicio: e.target.value })); setPage(1); }} className="text-xs border-none focus:outline-none" />
            <span className="text-slate-300 text-xs">até</span>
            <input type="date" value={dateRange.fim} onChange={(e) => { setDateRange(r => ({ ...r, fim: e.target.value })); setPage(1); }} className="text-xs border-none focus:outline-none" />
            {(dateRange.inicio || dateRange.fim) && <button onClick={() => setDateRange({ inicio: '', fim: '' })} className="text-[10px] text-red-500 font-bold hover:underline ml-1">Limpar</button>}
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={() => { setEditItem(null); setDrawerOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus size={16} /> Novo Pedágio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pedágio (Filtrado)" value={formatBRL(total)} icon={DollarSign} variant="warning" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] tracking-tight">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Placa</th>
                <th className="px-4 py-3 text-left">Parceiro</th>
                <th className="px-4 py-3 text-left">Histórico</th>
                <th className="px-4 py-3 text-left">Doc</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
              ) : (
                paginated.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.data)}</td>
                    <td className="px-4 py-3 font-bold">{l.placa || '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{l.parceiro || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{l.historico || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{l.documento || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{formatBRL(l.valor)}</td>
                    <td className="px-4 py-3 text-center relative">
                      <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><MoreVertical size={14} /></button>
                      {openMenu === l.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-28 py-1 text-left text-xs">
                          <button onClick={() => { setEditItem(l); setDrawerOpen(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50"><Edit size={12} /> Editar</button>
                          <button onClick={() => onDelete.mutateAsync(l.id)} className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 size={12} /> Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <PedagioDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }} onSave={(p) => { if (editItem) onUpdate.mutateAsync({ id: editItem.id, ...p }); else onCreate.mutateAsync(p); setDrawerOpen(false); }} initial={editItem} />
    </div>
  );
}


class DreErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-700 font-bold text-lg mb-2">Erro ao carregar o DRE</p>
          <p className="text-red-500 text-sm mb-4">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GeracaoCaixaConfigDrawer({ open, onClose, systemKpiOps, setSystemKpiOps, customKpis, updateDreKpi, dreConfig, values }) {
  if (!open) return null;
  const systemItems = [
    { key: 'ccBB', label: 'Conta Corrente BB', val: values?.ccBB },
    { key: 'saldoCaixa', label: 'Caixa', val: values?.saldoCaixa },
    { key: 'aReceber', label: 'A Receber (Líquido)', val: values?.aReceberSaldoNet },
    { key: 'aPagar', label: 'A Pagar (Diesel)', val: values?.aPagarSaldo },
    { key: 'outrasEntradas', label: 'Outras Entradas (5,8)', val: values?.outrasEntradas },
    { key: 'emprestimoFco', label: 'Empréstimo Fco (9)', val: values?.emprestimoFco },
    { key: 'custoCapital', label: 'Custo de Capital', val: values?.custoCapitalTotal },
  ];

  const configuredSystemItems = systemItems.filter(item => systemKpiOps[item.key] && systemKpiOps[item.key] !== 'nenhum');
  const unconfiguredSystemItems = systemItems.filter(item => !systemKpiOps[item.key] || systemKpiOps[item.key] === 'nenhum');

  const configuredCustomKpis = customKpis.filter(k => k.operacao_caixa && k.operacao_caixa !== 'nenhum');
  const unconfiguredCustomKpis = customKpis.filter(k => !k.operacao_caixa || k.operacao_caixa === 'nenhum');

  const normalRows = (dreConfig || []).filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
  const configuredRows = normalRows.filter(l => systemKpiOps[l.id] && systemKpiOps[l.id] !== 'nenhum');
  const unconfiguredRows = normalRows.filter(l => !systemKpiOps[l.id] || systemKpiOps[l.id] === 'nenhum');

  const renderOpButtons = (currentOp, setOp) => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button onClick={() => setOp('soma')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'soma' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>+ SOMA</button>
      <button onClick={() => setOp('subtrai')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'subtrai' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>- SUB</button>
      <div className="w-[1px] h-4 bg-slate-300 mx-0.5"></div>
      <button onClick={() => setOp('nenhum')} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Ocultar/Ignorar"><X size={14} /></button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/10 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Configurar Geração de Caixa</h2>
            <p className="text-xs text-slate-400 mt-0.5">Defina os componentes do cálculo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs do Sistema</h3>
            <div className="space-y-2">
              {configuredSystemItems.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={item.label}>{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(item.val || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[item.key], (op) => setSystemKpiOps(prev => ({ ...prev, [item.key]: op })))}
                </div>
              ))}
              {unconfiguredSystemItems.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI do Sistema...</option>
                  {unconfiguredSystemItems.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              )}
            </div>
          </section>

          {(customKpis.length > 0) && (
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs Personalizados</h3>
              <div className="space-y-2">
                {configuredCustomKpis.map(k => (
                  <div key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-700 truncate" title={k.titulo}>{k.titulo}</p>
                      <p className="text-[10px] font-bold text-slate-500">{formatBRL(Number(k.valor) || 0)}</p>
                    </div>
                    {renderOpButtons(k.operacao_caixa, (op) => updateDreKpi.mutateAsync({ id: k.id, operacao_caixa: op }))}
                  </div>
                ))}
                {unconfiguredCustomKpis.length > 0 && (
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                    value=""
                    onChange={(e) => { if (e.target.value) updateDreKpi.mutateAsync({ id: e.target.value, operacao_caixa: 'soma' }); }}
                  >
                    <option value="">+ Adicionar KPI Personalizado...</option>
                    {unconfiguredCustomKpis.map(k => <option key={k.id} value={k.id}>{k.titulo}</option>)}
                  </select>
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Plano de Contas</h3>
            <div className="space-y-2">
              {configuredRows.map(l => (
                <div key={l.id} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-slate-700 leading-tight">{l.codigo_conta} - {l.nome}</span>
                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{formatBRL(values?.expensesData?.[l.id] || 0)}</span>
                  </div>
                  <div className="self-end">
                    {renderOpButtons(systemKpiOps[l.id], (op) => setSystemKpiOps(prev => ({ ...prev, [l.id]: op })))}
                  </div>
                </div>
              ))}

              {unconfiguredRows.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar conta do Plano...</option>
                  {unconfiguredRows.map(l => <option key={l.id} value={l.id}>{l.codigo_conta} - {l.nome}</option>)}
                </select>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md">Concluir e Salvar</button>
        </div>
      </div>
    </>
  );
}

function TkszConfigDrawer({ open, onClose, systemKpiOps, setSystemKpiOps, customKpis, updateDreKpi, dreConfig, values }) {
  if (!open) return null;
  const systemItems = [
    { key: 'difFinal', label: 'Diferença Final', val: values?.kpiDiferencaFinal },
    { key: 'outrasEntradas', label: 'Outras Entradas (5,8)', val: values?.outrasEntradas },
    { key: 'emprestimoFco', label: 'Empréstimo Fco (9)', val: values?.emprestimoFco },
    { key: 'ccBB', label: 'Conta Corrente BB', val: values?.ccBB },
    { key: 'saldoCaixa', label: 'Caixa', val: values?.saldoCaixa },
    { key: 'aReceber', label: 'A Receber (Líquido)', val: values?.aReceberSaldoNet },
    { key: 'aPagar', label: 'A Pagar (Diesel)', val: values?.aPagarSaldo },
    { key: 'custoCapital', label: 'Custo de Capital', val: values?.custoCapitalTotal },
  ];

  const configuredSystemItems = systemItems.filter(item => systemKpiOps[item.key] && systemKpiOps[item.key] !== 'nenhum');
  const unconfiguredSystemItems = systemItems.filter(item => !systemKpiOps[item.key] || systemKpiOps[item.key] === 'nenhum');

  const configuredCustomKpis = customKpis.filter(k => systemKpiOps[k.id] && systemKpiOps[k.id] !== 'nenhum');
  const unconfiguredCustomKpis = customKpis.filter(k => !systemKpiOps[k.id] || systemKpiOps[k.id] === 'nenhum');

  const renderOpButtons = (currentOp, setOp) => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button onClick={() => setOp('soma')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'soma' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>+ SOMA</button>
      <button onClick={() => setOp('subtrai')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'subtrai' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>- SUB</button>
      <div className="w-[1px] h-4 bg-slate-300 mx-0.5"></div>
      <button onClick={() => setOp('nenhum')} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Ocultar/Ignorar"><X size={14} /></button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/10 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Configurar Tem Que Ser Zero</h2>
            <p className="text-xs text-slate-400 mt-0.5">Defina os componentes do cálculo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs do Sistema</h3>
            <div className="space-y-2">
              {configuredSystemItems.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={item.label}>{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(item.val || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[item.key], (op) => setSystemKpiOps(prev => ({ ...prev, [item.key]: op })))}
                </div>
              ))}
              {unconfiguredSystemItems.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI do Sistema...</option>
                  {unconfiguredSystemItems.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs Personalizados</h3>
            <div className="space-y-2">
              {configuredCustomKpis.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={k.titulo}>{k.titulo}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(Number(k.valor) || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[k.id], (op) => setSystemKpiOps(prev => ({ ...prev, [k.id]: op })))}
                </div>
              ))}
              {unconfiguredCustomKpis.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI Personalizado...</option>
                  {unconfiguredCustomKpis.map(k => <option key={k.id} value={k.id}>{k.titulo}</option>)}
                </select>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md">Concluir e Salvar</button>
        </div>
      </div>
    </>
  );
}

function DespesasConfigDrawer({ open, onClose, systemKpiOps, setSystemKpiOps, customKpis, updateDreKpi, dreConfig, values }) {
  if (!open) return null;
  const systemItems = [
    { key: 'ccBB', label: 'Conta Corrente BB', val: values?.ccBB },
    { key: 'saldoCaixa', label: 'Caixa', val: values?.saldoCaixa },
    { key: 'aReceber', label: 'A Receber (Líquido)', val: values?.aReceberSaldoNet },
    { key: 'aPagar', label: 'A Pagar (Diesel)', val: values?.aPagarSaldo },
    { key: 'outrasEntradas', label: 'Outras Entradas (5,8)', val: values?.outrasEntradas },
    { key: 'emprestimoFco', label: 'Empréstimo Fco (9)', val: values?.emprestimoFco },
    { key: 'custoCapital', label: 'Custo de Capital', val: values?.custoCapitalTotal },
  ];

  const configuredSystemItems = systemItems.filter(item => systemKpiOps[item.key] && systemKpiOps[item.key] !== 'nenhum');
  const unconfiguredSystemItems = systemItems.filter(item => !systemKpiOps[item.key] || systemKpiOps[item.key] === 'nenhum');

  const configuredCustomKpis = customKpis.filter(k => systemKpiOps[k.id] && systemKpiOps[k.id] !== 'nenhum');
  const unconfiguredCustomKpis = customKpis.filter(k => !systemKpiOps[k.id] || systemKpiOps[k.id] === 'nenhum');

  const normalRows = (dreConfig || []).filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
  const configuredRows = normalRows.filter(l => systemKpiOps[l.id] && systemKpiOps[l.id] !== 'nenhum');
  const unconfiguredRows = normalRows.filter(l => !systemKpiOps[l.id] || systemKpiOps[l.id] === 'nenhum');

  const renderOpButtons = (currentOp, setOp) => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button onClick={() => setOp('soma')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'soma' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>+ SOMA</button>
      <button onClick={() => setOp('subtrai')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'subtrai' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>- SUB</button>
      <div className="w-[1px] h-4 bg-slate-300 mx-0.5"></div>
      <button onClick={() => setOp('nenhum')} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Ocultar/Ignorar"><X size={14} /></button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/10 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Configurar Despesas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Defina os componentes do cálculo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs do Sistema</h3>
            <div className="space-y-2">
              {configuredSystemItems.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={item.label}>{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(item.val || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[item.key], (op) => setSystemKpiOps(prev => ({ ...prev, [item.key]: op })))}
                </div>
              ))}
              {unconfiguredSystemItems.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI do Sistema...</option>
                  {unconfiguredSystemItems.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs Personalizados</h3>
            <div className="space-y-2">
              {configuredCustomKpis.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={k.titulo}>{k.titulo}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(Number(k.valor) || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[k.id], (op) => setSystemKpiOps(prev => ({ ...prev, [k.id]: op })))}
                </div>
              ))}
              {unconfiguredCustomKpis.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI Personalizado...</option>
                  {unconfiguredCustomKpis.map(k => <option key={k.id} value={k.id}>{k.titulo}</option>)}
                </select>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Plano de Contas</h3>
            <div className="space-y-2">
              {configuredRows.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate">{l.codigo_conta} - {l.nome}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(values?.expensesData?.[l.id] || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[l.id], (op) => setSystemKpiOps(prev => ({ ...prev, [l.id]: op })))}
                </div>
              ))}
              {unconfiguredRows.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar conta do Plano...</option>
                  {unconfiguredRows.map(l => <option key={l.id} value={l.id}>{l.codigo_conta} - {l.nome}</option>)}
                </select>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md">Concluir e Salvar</button>
        </div>
      </div>
    </>
  );
}

function ReceitasConfigDrawer({ open, onClose, systemKpiOps, setSystemKpiOps, customKpis, updateDreKpi, dreConfig, values }) {
  if (!open) return null;
  const systemItems = [
    { key: 'ccBB', label: 'Conta Corrente BB', val: values?.ccBB },
    { key: 'saldoCaixa', label: 'Caixa', val: values?.saldoCaixa },
    { key: 'aReceber', label: 'A Receber (Líquido)', val: values?.aReceberSaldoNet },
    { key: 'aPagar', label: 'A Pagar (Diesel)', val: values?.aPagarSaldo },
    { key: 'outrasEntradas', label: 'Outras Entradas (5,8)', val: values?.outrasEntradas },
    { key: 'emprestimoFco', label: 'Empréstimo Fco (9)', val: values?.emprestimoFco },
    { key: 'custoCapital', label: 'Custo de Capital', val: values?.custoCapitalTotal },
  ];

  const configuredSystemItems = systemItems.filter(item => systemKpiOps[item.key] && systemKpiOps[item.key] !== 'nenhum');
  const unconfiguredSystemItems = systemItems.filter(item => !systemKpiOps[item.key] || systemKpiOps[item.key] === 'nenhum');

  const configuredCustomKpis = customKpis.filter(k => systemKpiOps[k.id] && systemKpiOps[k.id] !== 'nenhum');
  const unconfiguredCustomKpis = customKpis.filter(k => !systemKpiOps[k.id] || systemKpiOps[k.id] === 'nenhum');

  const normalRows = (dreConfig || []).filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
  const configuredRows = normalRows.filter(l => systemKpiOps[l.id] && systemKpiOps[l.id] !== 'nenhum');
  const unconfiguredRows = normalRows.filter(l => !systemKpiOps[l.id] || systemKpiOps[l.id] === 'nenhum');

  const renderOpButtons = (currentOp, setOp) => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button onClick={() => setOp('soma')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'soma' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>+ SOMA</button>
      <button onClick={() => setOp('subtrai')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'subtrai' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>- SUB</button>
      <div className="w-[1px] h-4 bg-slate-300 mx-0.5"></div>
      <button onClick={() => setOp('nenhum')} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Ocultar/Ignorar"><X size={14} /></button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/10 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Configurar Receitas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Defina os componentes do cálculo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs do Sistema</h3>
            <div className="space-y-2">
              {configuredSystemItems.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={item.label}>{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(item.val || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[item.key], (op) => setSystemKpiOps(prev => ({ ...prev, [item.key]: op })))}
                </div>
              ))}
              {unconfiguredSystemItems.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI do Sistema...</option>
                  {unconfiguredSystemItems.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs Personalizados</h3>
            <div className="space-y-2">
              {configuredCustomKpis.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={k.titulo}>{k.titulo}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(Number(k.valor) || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[k.id], (op) => setSystemKpiOps(prev => ({ ...prev, [k.id]: op })))}
                </div>
              ))}
              {unconfiguredCustomKpis.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI Personalizado...</option>
                  {unconfiguredCustomKpis.map(k => <option key={k.id} value={k.id}>{k.titulo}</option>)}
                </select>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Plano de Contas</h3>
            <div className="space-y-2">
              {configuredRows.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate">{l.codigo_conta} - {l.nome}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatBRL(values?.expensesData?.[l.id] || 0)}</p>
                  </div>
                  {renderOpButtons(systemKpiOps[l.id], (op) => setSystemKpiOps(prev => ({ ...prev, [l.id]: op })))}
                </div>
              ))}
              {unconfiguredRows.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOps(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar conta do Plano...</option>
                  {unconfiguredRows.map(l => <option key={l.id} value={l.id}>{l.codigo_conta} - {l.nome}</option>)}
                </select>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md">Concluir e Salvar</button>
        </div>
      </div>
    </>
  );
}

function ResultadoConfigDrawer({ open, onClose, systemKpiOpsResultado, setSystemKpiOpsResultado, customKpis, updateDreKpi, dreConfig, values, descontoDieselManual, setDescontoDieselManual }) {
  if (!open) return null;
  const systemItems = [
    { key: 'receitasTotal', label: 'Receitas (Total Real)', val: values?.receitasTotal },
    { key: 'vendaBens', label: 'Venda de Bens (6)', val: values?.vendaBens },
    { key: 'despesasTotal', label: 'Despesas (Total Real)', val: values?.despesasTotal },
    { key: 'descontoDiesel', label: 'Desconto Diesel', val: values?.descontoDiesel },
    { key: 'ccBB', label: 'Conta Corrente BB', val: values?.ccBB },
    { key: 'saldoCaixa', label: 'Caixa', val: values?.saldoCaixa },
    { key: 'aReceber', label: 'A Receber (Líquido)', val: values?.aReceberSaldoNet },
    { key: 'aPagar', label: 'A Pagar (Diesel)', val: values?.aPagarSaldo },
    { key: 'outrasEntradas', label: 'Outras Entradas (5,8)', val: values?.outrasEntradas },
    { key: 'emprestimoFco', label: 'Empréstimo Fco (9)', val: values?.emprestimoFco },
    { key: 'custoCapital', label: 'Custo de Capital', val: values?.custoCapitalTotal },
  ];

  const configuredSystemItems = systemItems.filter(item => systemKpiOpsResultado[item.key] && systemKpiOpsResultado[item.key] !== 'nenhum');
  const unconfiguredSystemItems = systemItems.filter(item => !systemKpiOpsResultado[item.key] || systemKpiOpsResultado[item.key] === 'nenhum');

  const configuredCustomKpis = customKpis.filter(k => k.operacao_resultado && k.operacao_resultado !== 'nenhum');
  const unconfiguredCustomKpis = customKpis.filter(k => !k.operacao_resultado || k.operacao_resultado === 'nenhum');

  const normalRows = (dreConfig || []).filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
  const configuredRows = normalRows.filter(l => systemKpiOpsResultado[l.id] && systemKpiOpsResultado[l.id] !== 'nenhum');
  const unconfiguredRows = normalRows.filter(l => !systemKpiOpsResultado[l.id] || systemKpiOpsResultado[l.id] === 'nenhum');

  const renderOpButtons = (currentOp, setOp) => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button onClick={() => setOp('soma')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'soma' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>+ SOMA</button>
      <button onClick={() => setOp('subtrai')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${currentOp === 'subtrai' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>- SUB</button>
      <div className="w-[1px] h-4 bg-slate-300 mx-0.5"></div>
      <button onClick={() => setOp('nenhum')} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Ocultar/Ignorar"><X size={14} /></button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/10 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Configurar Resultado Líquido</h2>
            <p className="text-xs text-slate-400 mt-0.5">Defina os componentes do cálculo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs do Sistema</h3>
            <div className="space-y-2">
              {configuredSystemItems.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-700 truncate" title={item.label}>{item.label}</p>
                    {item.key === 'descontoDiesel' && setDescontoDieselManual ? (
                      <input
                        type="number"
                        step="0.01"
                        value={descontoDieselManual}
                        onChange={(e) => setDescontoDieselManual(Number(e.target.value))}
                        className="text-[10px] font-bold text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-400 mt-0.5"
                      />
                    ) : (
                      <p className="text-[10px] font-bold text-slate-500">{formatBRL(item.val || 0)}</p>
                    )}
                  </div>
                  {renderOpButtons(systemKpiOpsResultado[item.key], (op) => setSystemKpiOpsResultado(prev => ({ ...prev, [item.key]: op })))}
                </div>
              ))}
              {unconfiguredSystemItems.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOpsResultado(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar KPI do Sistema...</option>
                  {unconfiguredSystemItems.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              )}
            </div>
          </section>

          {(customKpis.length > 0) && (
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">KPIs Personalizados</h3>
              <div className="space-y-2">
                {configuredCustomKpis.map(k => (
                  <div key={k.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-700 truncate" title={k.titulo}>{k.titulo}</p>
                      <p className="text-[10px] font-bold text-slate-500">{formatBRL(Number(k.valor) || 0)}</p>
                    </div>
                    {renderOpButtons(k.operacao_resultado, (op) => updateDreKpi.mutateAsync({ id: k.id, operacao_resultado: op }))}
                  </div>
                ))}
                {unconfiguredCustomKpis.length > 0 && (
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                    value=""
                    onChange={(e) => { if (e.target.value) updateDreKpi.mutateAsync({ id: e.target.value, operacao_resultado: 'soma' }); }}
                  >
                    <option value="">+ Adicionar KPI Personalizado...</option>
                    {unconfiguredCustomKpis.map(k => <option key={k.id} value={k.id}>{k.titulo}</option>)}
                  </select>
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Plano de Contas</h3>
            <div className="space-y-2">
              {configuredRows.map(l => (
                <div key={l.id} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-slate-700 leading-tight">{l.codigo_conta} - {l.nome}</span>
                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{formatBRL(values?.expensesData?.[l.id] || 0)}</span>
                  </div>
                  <div className="self-end">
                    {renderOpButtons(systemKpiOpsResultado[l.id], (op) => setSystemKpiOpsResultado(prev => ({ ...prev, [l.id]: op })))}
                  </div>
                </div>
              ))}

              {unconfiguredRows.length > 0 && (
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-2"
                  value=""
                  onChange={(e) => { if (e.target.value) setSystemKpiOpsResultado(prev => ({ ...prev, [e.target.value]: 'soma' })); }}
                >
                  <option value="">+ Adicionar conta do Plano...</option>
                  {unconfiguredRows.map(l => <option key={l.id} value={l.id}>{l.codigo_conta} - {l.nome}</option>)}
                </select>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md">Concluir e Salvar</button>
        </div>
      </div>
    </>
  );
}

function ResultadoView({ receber = [], lancamentos = [], caixa = [], diesel = [], custoCapital = [] }) {
  const { data: dreConfig = [], isLoading } = useDreConfig();
  const { data: planoContas = [], isLoading: isLoadingPC } = usePlanoContas();
  const { data: customKpis = [], isLoading: isLoadingKpis } = useDreKpis();
  const createDreKpi = useCreateDreKpi();
  const updateDreKpi = useUpdateDreKpi();
  const deleteDreKpi = useDeleteDreKpi();

  const createDreLinha = useCreateDreLinha();
  const updateDreLinha = useUpdateDreLinha();
  const deleteDreLinha = useDeleteDreLinha();
  const reorderDreLinhas = useReorderDreLinhas();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kpiDrawerOpen, setKpiDrawerOpen] = useState(false);
  const [editKpi, setEditKpi] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');

  const { settings, isLoading: isSettingsLoading, updateSetting } = useAppSettings();
  const [isInitialized, setIsInitialized] = useState(false);

  const [excludedCodes, setExcludedCodes] = useState(new Set());

  useEffect(() => {
    if (isInitialized) {
      updateSetting('dre_excluded_codes', [...excludedCodes]);
    }
  }, [excludedCodes, isInitialized]);

  const handleRestore = (tipo) => {
    setExcludedCodes(prev => {
      const next = new Set(prev);
      [...next].forEach(code => {
        const p = planoContas.find(item => item.codigo === code);
        if (p && p.tipo === tipo) next.delete(code);
      });
      return next;
    });
  };

  const handleDragStart = (e, index) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
    // Setting a visual drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    if (!isEditMode) return;
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    if (!isEditMode) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...dreConfig];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    // Prepare updates array with new orders
    const updates = newOrder.map((item, idx) => ({ id: item.id, ordem: idx }));

    try {
      await reorderDreLinhas.mutateAsync(updates);
    } catch (err) {
      alert("Erro ao reordenar: " + err.message);
    }

    setDraggedIndex(null);
  };

  const faturamento = useMemo(() => {
    return receber.reduce((s, l) => s + (Number(l.valor_a_receber) || 0), 0);
  }, [receber]);

  const descontos = useMemo(() => {
    // Soma apenas ajustes NEGATIVOS (descontos concedidos)
    return receber.reduce((s, l) => {
      const aj = Number(l.ajustes) || 0;
      return s + (aj < 0 ? Math.abs(aj) : 0);
    }, 0);
  }, [receber]);

  const expensesData = useMemo(() => {
    const allMovimentos = [...lancamentos, ...caixa];
    const agg = {};

    const norm = (str) => (str || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // Pass 1: Calculate standard lines
    dreConfig.forEach(linha => {
      agg[linha.id] = 0;
      const nomeUpper = (linha.nome || '').toUpperCase();
      if (linha.codigo_conta && linha.codigo_conta.startsWith('VIRTUAL_')) return;

      const codigoString = String(linha.codigo_conta || '');
      const isDiesel = codigoString.includes('55') || nomeUpper.includes('DIESEL');

      if (isDiesel) {
        agg[linha.id] = diesel.reduce((s, d) => s + (Number(d.valor_a_pagar) || 0), 0);
      } else if (linha.codigo_conta) {
        const matched = allMovimentos.filter(l => l.codigo === linha.codigo_conta);
        const totalMat = matched.reduce((s, l) => s + (Number(l.despesa) || 0) + (Number(l.receita) || 0), 0);
        agg[linha.id] += totalMat;
      } else {
        // Fallback: match by historico string if no code is linked
        const linhaNomeNorm = norm(linha.nome);
        const matched = allMovimentos.filter(l => (Number(l.despesa) || 0) > 0 && norm(l.historico).includes(linhaNomeNorm));
        const totalMat = matched.reduce((s, l) => s + (Number(l.despesa) || 0), 0);
        agg[linha.id] += totalMat;
      }

      // Fallback for ICMS if 0
      if (nomeUpper.includes('ICMS') && agg[linha.id] === 0) {
        agg[linha.id] += receber.reduce((s, r) => s + (Number(r.icms) || 0), 0);
      }
    });

    // Pass 2: Calculate base virtual aggregators (Aportes, Diesel, Faturamento)
    dreConfig.forEach(linha => {
      if (!linha.codigo_conta || !linha.codigo_conta.startsWith('VIRTUAL_')) return;
      if (linha.codigo_conta === 'VIRTUAL_TOTAL_DESPESAS' || linha.codigo_conta === 'VIRTUAL_TOTAL_RECEITAS') return;

      if (linha.codigo_conta === 'VIRTUAL_FATURAMENTO') {
        agg[linha.id] = faturamento;
      } else if (linha.codigo_conta === 'VIRTUAL_DESCONTOS') {
        agg[linha.id] = descontos;
      } else if (linha.codigo_conta === 'VIRTUAL_DIESEL_TOTAL_A_PAGAR') {
        agg[linha.id] = diesel.reduce((s, d) => s + (Number(d.valor_a_pagar) || 0), 0);
      } else if (linha.codigo_conta === 'VIRTUAL_DIESEL_TOTAL_PAGO') {
        agg[linha.id] = diesel.reduce((s, d) => s + (Number(d.valor_pago) || 0), 0);
      } else if (linha.codigo_conta === 'VIRTUAL_DIESEL_SALDO') {
        agg[linha.id] = diesel.reduce((s, d) => s + (Number(d.valor_a_pagar) || 0), 0) - diesel.reduce((s, d) => s + (Number(d.valor_pago) || 0), 0);
      } else if (linha.codigo_conta === 'VIRTUAL_VALOR_APORTE') {
        agg[linha.id] = custoCapital.reduce((s, c) => s + Math.abs(Number(c.valor_aporte) || 0), 0);
      } else if (linha.codigo_conta === 'VIRTUAL_CUSTO_CAPITAL') {
        agg[linha.id] = custoCapital.reduce((s, c) => s + Math.abs(Number(c.custo_capital) || 0), 0);
      }
    });

    // Pass 3: Calculate custom arithmetic operations
    dreConfig.forEach(linha => {
      if (linha.codigo_conta === 'OPERACAO_ARITMETICA' && linha.id_referencia_1 && linha.id_referencia_2) {
        const resolveValue = (ref) => {
          if (!ref) return 0;
          if (agg[ref] !== undefined) return Number(agg[ref]) || 0;

          if (ref === 'VIRTUAL_TOTAL_RECEITAS') return [...lancamentos, ...caixa].reduce((s, l) => s + (Number(l.receita) || 0), 0);
          if (ref === 'VIRTUAL_FATURAMENTO') return Number(faturamento) || 0;
          if (ref === 'VIRTUAL_DESCONTOS') return Number(descontos) || 0;
          if (ref === 'VIRTUAL_DIESEL_TOTAL_A_PAGAR') return diesel.reduce((s, d) => s + (Number(d.valor_a_pagar) || 0), 0);
          if (ref === 'VIRTUAL_DIESEL_TOTAL_PAGO') return diesel.reduce((s, d) => s + (Number(d.valor_pago) || 0), 0);
          if (ref === 'VIRTUAL_DIESEL_SALDO') return diesel.reduce((s, d) => s + (Number(d.valor_a_pagar) || 0), 0) - diesel.reduce((s, d) => s + (Number(d.valor_pago) || 0), 0);
          if (ref === 'VIRTUAL_VALOR_APORTE') return custoCapital.reduce((s, c) => s + Math.abs(Number(c.valor_aporte) || 0), 0);
          if (ref === 'VIRTUAL_CUSTO_CAPITAL') return custoCapital.reduce((s, c) => s + (Number(c.custo_capital) || 0), 0);
          return 0;
        };

        const v1 = resolveValue(linha.id_referencia_1);
        const v2 = resolveValue(linha.id_referencia_2);
        const op = linha.operacao_aritmetica;

        if (op === '+') agg[linha.id] = v1 + v2;
        else if (op === '-') agg[linha.id] = v1 - v2;
        else if (op === '*') agg[linha.id] = v1 * v2;
        else if (op === '/') agg[linha.id] = v2 !== 0 ? v1 / v2 : 0;
      }
    });

    // Pass 4: Calculate Grand Totals (Receipts/Expenses)
    dreConfig.forEach(linha => {
      if (linha.codigo_conta === 'VIRTUAL_TOTAL_DESPESAS') {
        let total = 0;
        dreConfig.forEach(l => {
          if (l.id === linha.id || l.codigo_conta === 'VIRTUAL_TOTAL_RECEITAS') return;
          const val = agg[l.id] || 0;
          if (l.tipo_calculo === 'soma') total += val;
          else if (l.tipo_calculo === 'subtrai') total -= val;
        });
        agg[linha.id] = total;
      } else if (linha.codigo_conta === 'VIRTUAL_TOTAL_RECEITAS') {
        agg[linha.id] = [...lancamentos, ...caixa].reduce((s, l) => s + (Number(l.receita) || 0), 0);
      }
    });

    return agg;
  }, [dreConfig, lancamentos, caixa, diesel, receber]);

  const totaisCalculados = useMemo(() => {
    let sum = 0;
    let sub = 0;
    Object.keys(expensesData).forEach(k => {
      const l = dreConfig.find(c => c.id === k);
      if (l) {
        if (l.tipo_calculo === 'soma') sum += expensesData[k];
        if (l.tipo_calculo === 'subtrai') sub += expensesData[k];
      }
    });
    return { sum, sub };
  }, [expensesData, dreConfig]);

  const totalDespesasRow = dreConfig.find(l => l.codigo_conta === 'VIRTUAL_TOTAL_DESPESAS');
  const faturamentoRow = dreConfig.find(l => l.codigo_conta === 'VIRTUAL_FATURAMENTO');

  const totalDespesas = totalDespesasRow ? (expensesData[totalDespesasRow.id] || 0) : 0;
  const faturamentoValor = faturamentoRow ? (expensesData[faturamentoRow.id] || 0) : faturamento;
  const resultadoLiquidoBase = faturamentoValor - totalDespesas - descontos;

  const totalSomenteDespesas = useMemo(() => {
    return dreConfig.reduce((acc, l) => {
      if (l.codigo_conta?.startsWith('VIRTUAL_')) return acc;
      if (l.tipo_calculo === 'subtrai') return acc + (expensesData[l.id] || 0);
      return acc;
    }, 0);
  }, [dreConfig, expensesData]);


  const totalDespesasBancoOnly = useMemo(() => {
    return lancamentos.reduce((s, l) => s + (Number(l.despesa) || 0), 0);
  }, [lancamentos]);


  // Novos cálculos de KPI solicitados
  const ccBB = lancamentos.reduce((s, l) => s + (Number(l.receita) || 0) - (Number(l.despesa) || 0), 0);
  const saldoCaixa = caixa.reduce((s, l) => s + (Number(l.receita) || 0) - (Number(l.despesa) || 0), 0);
  const aReceberSaldoNet = receber.reduce((s, l) =>
    s + (Number(l.valor_a_receber) || 0) - (Number(l.valor_recebido) || 0) + (Number(l.ajustes) || 0)
    , 0);
  const aPagarSaldo = diesel.reduce((s, l) => s + (Number(l.valor_a_pagar) || 0) - (Number(l.valor_pago) || 0), 0);
  const custoCapitalTotal = useMemo(() => {
    // Usa data UTC para bater com HOJE() do Excel
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const taxa = CUSTO_CAPITAL_RATE;

    const parseUTCDate = (dateStr) => {
      if (!dateStr) return todayUTC;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }
      return todayUTC;
    };

    return custoCapital.reduce((s, c) => {
      const dataAporte = parseUTCDate(c.data_aporte);
      const diffDays = Math.round((todayUTC - dataAporte) / (1000 * 60 * 60 * 24));
      const periodo = (diffDays + 1) / 30;
      const valorCusto = (Number(c.valor_aporte) || 0) * (Math.pow(1 + taxa, periodo) - 1);
      return s + valorCusto;
    }, 0);
  }, [custoCapital]);

  // Outras Entradas (contas 5, 7, 8) lendo diretamente dos valores já calculados na tabela DRE (expensesData)
  const rendimentosValor = useMemo(() => {
    return dreConfig
      .filter(l => {
        const cod = (l.codigo_conta || '').toString().trim();
        return cod === '5' || cod === '7' || cod === '8' ||
          cod.startsWith('5.') || cod.startsWith('7.') || cod.startsWith('8.');
      })
      .reduce((s, l) => s + (expensesData[l.id] || 0), 0);
  }, [dreConfig, expensesData]);

  const outrasEntradas = rendimentosValor;

  // Empréstimo Fco (conta 9)
  const emprestimoFco = useMemo(() => {
    return dreConfig
      .filter(l => {
        const cod = (l.codigo_conta || '').toString().trim();
        return cod === '9' || cod.startsWith('9.');
      })
      .reduce((s, l) => s + (expensesData[l.id] || 0), 0);
  }, [dreConfig, expensesData]);


  const calculatedCustomKpis = useMemo(() => {
    return customKpis.map(k => {
      let val = 0;
      const formula = k.formula || {};

      const vCC = (formula.ccBB === 'soma' ? ccBB : formula.ccBB === 'subtrai' ? -ccBB : 0) || 0;
      const vCX = (formula.saldoCaixa === 'soma' ? saldoCaixa : formula.saldoCaixa === 'subtrai' ? -saldoCaixa : 0) || 0;
      const vREC = (formula.aReceber === 'soma' ? aReceberSaldoNet : formula.aReceber === 'subtrai' ? -aReceberSaldoNet : 0) || 0;
      const vPAG = (formula.aPagar === 'soma' ? aPagarSaldo : formula.aPagar === 'subtrai' ? -aPagarSaldo : 0) || 0;
      const vOUT = (formula.outrasEntradas === 'soma' ? outrasEntradas : formula.outrasEntradas === 'subtrai' ? -outrasEntradas : 0) || 0;
      const vEMP = (formula.emprestimoFco === 'soma' ? emprestimoFco : formula.emprestimoFco === 'subtrai' ? -emprestimoFco : 0) || 0;
      const vCCAP = (formula.custoCapital === 'soma' ? custoCapitalTotal : formula.custoCapital === 'subtrai' ? -custoCapitalTotal : 0) || 0;

      const normalRows = dreConfig.filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
      const rowsSoma = normalRows.reduce((acc, l) => {
        const rowVal = expensesData[l.id] || 0;
        if (formula[l.id] === 'soma') return acc + rowVal;
        if (formula[l.id] === 'subtrai') return acc - rowVal;
        return acc;
      }, 0);

      val = Number(vCC) + Number(vCX) + Number(vREC) + Number(vPAG) + Number(vOUT) + Number(vEMP) + Number(vCCAP) + Number(rowsSoma);

      // Fallback para valor antigo se fórmula estiver vazia
      if (Object.keys(formula).length === 0 && Number(k.valor) !== 0) {
        val = Number(k.valor);
      }

      return { ...k, valor: val };
    });
  }, [customKpis, ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, custoCapitalTotal, dreConfig, expensesData]);





  // Configuração dos itens automáticos na Geração de Caixa
  const [systemKpiOps, setSystemKpiOps] = useState({
    ccBB: 'soma',
    saldoCaixa: 'soma',
    aReceber: 'soma',
    aPagar: 'subtrai',
    outrasEntradas: 'soma',
    custoCapital: 'nenhum'
  });

  useEffect(() => {
    if (isInitialized) updateSetting('dre_system_kpi_ops', systemKpiOps);
  }, [systemKpiOps, isInitialized]);




  const displayRows = useMemo(() => {
    // Pegamos as despesas do plano de contas
    const despesasBase = planoContas.filter(p => p.tipo === 'despesa');

    // Agrupamos os valores
    const result = despesasBase.map(p => {
      const allMovimentos = [...lancamentos, ...caixa];
      const matched = allMovimentos.filter(l => l.codigo === p.codigo);
      const val = matched.reduce((s, l) => s + (Number(l.despesa) || 0) + (Number(l.receita) || 0), 0);

      // Forçamos o Diesel Cavalo (Código 55) a puxar o "A Pagar" da aba Diesel
      let finalVal = val;
      if (p.codigo === '55' || (p.nome || '').toUpperCase().includes('DIESEL')) {
        finalVal = diesel.reduce((s, d) => s + (Number(d.valor_a_pagar) || 0), 0);
      }

      return {
        ...p,
        valor: finalVal,
        tipo_calculo: 'subtrai'
      };
    });

    // Filtramos apenas as que possuem valor para não poluir
    const ativas = result.filter(r => r.valor > 0 && !excludedCodes.has(r.codigo));

    // Ordenação
    if (sortOrder === 'desc') ativas.sort((a, b) => b.valor - a.valor);
    else if (sortOrder === 'asc') ativas.sort((a, b) => a.valor - b.valor);
    else ativas.sort((a, b) => Number(a.codigo) - Number(b.codigo));

    return ativas;
  }, [planoContas, lancamentos, caixa, diesel, sortOrder, excludedCodes]);

  const displayReceitasRows = useMemo(() => {
    // Agrupamos os dados de 'receber' por placa
    const grouped = {};
    receber.forEach(l => {
      const placa = (l.placa || 'SEM PLACA').toUpperCase();
      if (!grouped[placa]) {
        grouped[placa] = { id: placa, codigo: placa, nome: placa, valor: 0 };
      }
      // Para o DRE de Receitas, usamos o valor bruto faturado (valor_a_receber)
      const val = (Number(l.valor_a_receber) || 0);
      grouped[placa].valor += val;
    });

    // Filtramos apenas placas com valor positivo e respeitamos a lista de excluídos
    const result = Object.values(grouped).filter(r => r.valor > 0 && !excludedCodes.has(r.codigo));

    // Ordenação por maior valor
    result.sort((a, b) => b.valor - a.valor);

    return result;
  }, [receber, excludedCodes]);

  const totalReceitasDRE = useMemo(() => {
    return displayReceitasRows.reduce((acc, r) => acc + (r.valor || 0), 0);
  }, [displayReceitasRows]);

  const totalDespesasDRE = useMemo(() => {
    return displayRows.reduce((acc, r) => acc + (r.valor || 0), 0);
  }, [displayRows]);

  const vendaBensCod6 = useMemo(() => {
    return [...lancamentos, ...caixa].reduce((s, l) => {
      const cod = (l.codigo || '').toString().trim();
      if (cod === '6') return s + (Number(l.receita) || 0) - (Number(l.despesa) || 0);
      return s;
    }, 0);
  }, [lancamentos, caixa]);

  const [descontoDieselManual, setDescontoDieselManual] = useState(501.36);

  useEffect(() => {
    if (isInitialized) updateSetting('dre_desconto_diesel', descontoDieselManual);
  }, [descontoDieselManual, isInitialized]);

  const kpiResultadoManual = totalReceitasDRE + vendaBensCod6 - totalDespesasDRE + descontoDieselManual;

  const [systemKpiOpsResultado, setSystemKpiOpsResultado] = useState({
    receitasTotal: 'soma',
    vendaBens: 'soma',
    despesasTotal: 'subtrai',
    descontoDiesel: 'soma'
  });

  useEffect(() => {
    if (isInitialized) updateSetting('dre_system_kpi_ops_resultado_v2', systemKpiOpsResultado);
  }, [systemKpiOpsResultado, isInitialized]);

  const [systemKpiOpsReceitas, setSystemKpiOpsReceitas] = useState({});

  useEffect(() => {
    if (isInitialized) updateSetting('dre_system_kpi_ops_receitas', systemKpiOpsReceitas);
  }, [systemKpiOpsReceitas, isInitialized]);

  const kpiReceitasDinamico = useMemo(() => {
    const op = systemKpiOpsReceitas || {};

    const vCC = (op.ccBB === 'soma' ? ccBB : op.ccBB === 'subtrai' ? -ccBB : 0) || 0;
    const vCX = (op.saldoCaixa === 'soma' ? saldoCaixa : op.saldoCaixa === 'subtrai' ? -saldoCaixa : 0) || 0;
    const vREC = (op.aReceber === 'soma' ? aReceberSaldoNet : op.aReceber === 'subtrai' ? -aReceberSaldoNet : 0) || 0;
    const vPAG = (op.aPagar === 'soma' ? aPagarSaldo : op.aPagar === 'subtrai' ? -aPagarSaldo : 0) || 0;
    const vOUT = (op.outrasEntradas === 'soma' ? outrasEntradas : op.outrasEntradas === 'subtrai' ? -outrasEntradas : 0) || 0;
    const vEMP = (op.emprestimoFco === 'soma' ? emprestimoFco : op.emprestimoFco === 'subtrai' ? -emprestimoFco : 0) || 0;
    const vCCAP = (op.custoCapital === 'soma' ? custoCapitalTotal : op.custoCapital === 'subtrai' ? -custoCapitalTotal : 0) || 0;

    const customSoma = calculatedCustomKpis.reduce((acc, k) => {
      const opRes = op[k.id] || 'nenhum';
      if (opRes === 'soma') return acc + (Number(k.valor) || 0);
      if (opRes === 'subtrai') return acc - (Number(k.valor) || 0);
      return acc;
    }, 0);

    // O valor base agora é o totalReceitasDRE (soma das placas)
    return totalReceitasDRE + Number(vCC) + Number(vCX) + Number(vREC) + Number(vPAG) + Number(vOUT) + Number(vEMP) + Number(vCCAP) + Number(customSoma);
  }, [totalReceitasDRE, ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, calculatedCustomKpis, systemKpiOpsReceitas]);

  const [gcConfigOpen, setGcConfigOpen] = useState(false);
  const [resultadoConfigOpen, setResultadoConfigOpen] = useState(false);
  const [receitasConfigOpen, setReceitasConfigOpen] = useState(false);
  const [despesasConfigOpen, setDespesasConfigOpen] = useState(false);
  const [tkszConfigOpen, setTkszConfigOpen] = useState(false);

  const [systemKpiOpsDespesas, setSystemKpiOpsDespesas] = useState({});

  useEffect(() => {
    if (isInitialized) updateSetting('dre_system_kpi_ops_despesas', systemKpiOpsDespesas);
  }, [systemKpiOpsDespesas, isInitialized]);

  const kpiDespesasDinamico = useMemo(() => {
    const op = systemKpiOpsDespesas || {};

    const vCC = (op.ccBB === 'soma' ? ccBB : op.ccBB === 'subtrai' ? -ccBB : 0) || 0;
    const vCX = (op.saldoCaixa === 'soma' ? saldoCaixa : op.saldoCaixa === 'subtrai' ? -saldoCaixa : 0) || 0;
    const vREC = (op.aReceber === 'soma' ? aReceberSaldoNet : op.aReceber === 'subtrai' ? -aReceberSaldoNet : 0) || 0;
    const vPAG = (op.aPagar === 'soma' ? aPagarSaldo : op.aPagar === 'subtrai' ? -aPagarSaldo : 0) || 0;
    const vOUT = (op.outrasEntradas === 'soma' ? outrasEntradas : op.outrasEntradas === 'subtrai' ? -outrasEntradas : 0) || 0;
    const vEMP = (op.emprestimoFco === 'soma' ? emprestimoFco : op.emprestimoFco === 'subtrai' ? -emprestimoFco : 0) || 0;
    const vCCAP = (op.custoCapital === 'soma' ? custoCapitalTotal : op.custoCapital === 'subtrai' ? -custoCapitalTotal : 0) || 0;

    const customSoma = calculatedCustomKpis.reduce((acc, k) => {
      const opRes = op[k.id] || 'nenhum';
      if (opRes === 'soma') return acc + (Number(k.valor) || 0);
      if (opRes === 'subtrai') return acc - (Number(k.valor) || 0);
      return acc;
    }, 0);

    const normalRows = dreConfig.filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
    const rowsSoma = normalRows.reduce((acc, l) => {
      if (excludedCodes.has(l.codigo_conta)) return acc;
      const rowVal = expensesData[l.id] || 0;
      const p = planoContas.find(pc => pc.codigo === l.codigo_conta);
      const isExpense = p?.tipo === 'despesa';
      const currentOp = op[l.id] || (isExpense ? 'soma' : 'nenhum');

      if (currentOp === 'soma') return acc + rowVal;
      if (currentOp === 'subtrai') return acc - rowVal;
      return acc;
    }, 0);

    return Number(vCC) + Number(vCX) + Number(vREC) + Number(vPAG) + Number(vOUT) + Number(vEMP) + Number(vCCAP) + Number(customSoma) + Number(rowsSoma);
  }, [ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, calculatedCustomKpis, dreConfig, expensesData, systemKpiOpsDespesas, planoContas, excludedCodes]);

  const kpiResultadoDinamico = useMemo(() => {
    const op = systemKpiOpsResultado || {};
    const vRecTot = (op.receitasTotal === 'soma' ? totalReceitasDRE : op.receitasTotal === 'subtrai' ? -totalReceitasDRE : 0) || 0;
    const vVendB = (op.vendaBens === 'soma' ? vendaBensCod6 : op.vendaBens === 'subtrai' ? -vendaBensCod6 : 0) || 0;
    const vDespTot = (op.despesasTotal === 'soma' ? kpiDespesasDinamico : op.despesasTotal === 'subtrai' ? -kpiDespesasDinamico : 0) || 0;
    const vDescDies = (op.descontoDiesel === 'soma' ? descontoDieselManual : op.descontoDiesel === 'subtrai' ? -descontoDieselManual : 0) || 0;

    // Antigos
    const vCC = (op.ccBB === 'soma' ? ccBB : op.ccBB === 'subtrai' ? -ccBB : 0) || 0;
    const vCX = (op.saldoCaixa === 'soma' ? saldoCaixa : op.saldoCaixa === 'subtrai' ? -saldoCaixa : 0) || 0;
    const vREC = (op.aReceber === 'soma' ? aReceberSaldoNet : op.aReceber === 'subtrai' ? -aReceberSaldoNet : 0) || 0;
    const vPAG = (op.aPagar === 'soma' ? aPagarSaldo : op.aPagar === 'subtrai' ? -aPagarSaldo : 0) || 0;
    const vOUT = (op.outrasEntradas === 'soma' ? outrasEntradas : op.outrasEntradas === 'subtrai' ? -outrasEntradas : 0) || 0;
    const vEMP = (op.emprestimoFco === 'soma' ? emprestimoFco : op.emprestimoFco === 'subtrai' ? -emprestimoFco : 0) || 0;
    const vCCAP = (op.custoCapital === 'soma' ? custoCapitalTotal : op.custoCapital === 'subtrai' ? -custoCapitalTotal : 0) || 0;

    const customSoma = calculatedCustomKpis.reduce((acc, kpi) => {
      const opRes = kpi.operacao_resultado || 'nenhum';
      if (opRes === 'soma') return acc + (Number(kpi.valor) || 0);
      if (opRes === 'subtrai') return acc - (Number(kpi.valor) || 0);
      return acc;
    }, 0);

    const normalRows = dreConfig.filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
    const rowsSoma = normalRows.reduce((acc, l) => {
      const rowVal = expensesData[l.id] || 0;
      if (op[l.id] === 'soma') return acc + rowVal;
      if (op[l.id] === 'subtrai') return acc - rowVal;
      return acc;
    }, 0);

    return Number(vRecTot) + Number(vVendB) + Number(vDespTot) + Number(vDescDies) + Number(vCC) + Number(vCX) + Number(vREC) + Number(vPAG) + Number(vOUT) + Number(vEMP) + Number(vCCAP) + Number(customSoma) + Number(rowsSoma);
  }, [totalReceitasDRE, vendaBensCod6, kpiDespesasDinamico, descontoDieselManual, ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, calculatedCustomKpis, dreConfig, expensesData, systemKpiOpsResultado]);
  const geracaoCaixaSoma = useMemo(() => {
    const op = systemKpiOps || {};
    const vCC = (op.ccBB === 'soma' ? ccBB : op.ccBB === 'subtrai' ? -ccBB : 0) || 0;
    const vCX = (op.saldoCaixa === 'soma' ? saldoCaixa : op.saldoCaixa === 'subtrai' ? -saldoCaixa : 0) || 0;
    const vREC = (op.aReceber === 'soma' ? aReceberSaldoNet : op.aReceber === 'subtrai' ? -aReceberSaldoNet : 0) || 0;
    const vPAG = (op.aPagar === 'soma' ? aPagarSaldo : op.aPagar === 'subtrai' ? -aPagarSaldo : 0) || 0;
    const vOUT = (op.outrasEntradas === 'soma' ? outrasEntradas : op.outrasEntradas === 'subtrai' ? -outrasEntradas : 0) || 0;
    const vEMP = (op.emprestimoFco === 'soma' ? emprestimoFco : op.emprestimoFco === 'subtrai' ? -emprestimoFco : 0) || 0;
    const vCCAP = (op.custoCapital === 'soma' ? custoCapitalTotal : op.custoCapital === 'subtrai' ? -custoCapitalTotal : 0) || 0;

    const customSoma = calculatedCustomKpis.reduce((s, k) => {
      const opRes = k.operacao_caixa || 'nenhum';
      if (opRes === 'soma') return s + (Number(k.valor) || 0);
      if (opRes === 'subtrai') return s - (Number(k.valor) || 0);
      return s;
    }, 0);

    const normalRows = dreConfig.filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
    const rowsSoma = normalRows.reduce((acc, l) => {
      const rowVal = expensesData[l.id] || 0;
      if (op[l.id] === 'soma') return acc + rowVal;
      if (op[l.id] === 'subtrai') return acc - rowVal;
      return acc;
    }, 0);

    return Number(vCC) + Number(vCX) + Number(vREC) + Number(vPAG) + Number(vOUT) + Number(vEMP) + Number(vCCAP) + Number(customSoma) + Number(rowsSoma);
  }, [ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, custoCapitalTotal, calculatedCustomKpis, dreConfig, expensesData, systemKpiOps]);
  const chartDataGC = useMemo(() => {
    const op = systemKpiOps || {};
    const items = [];

    const addItem = (label, value, operation) => {
      if (operation === 'soma') items.push({ name: label, valor: value, fill: '#10b981' });
      else if (operation === 'subtrai') items.push({ name: label, valor: -value, fill: '#ef4444' });
    };

    addItem('Conta BB', ccBB, op.ccBB);
    addItem('Caixa', saldoCaixa, op.saldoCaixa);
    addItem('A Receber', aReceberSaldoNet, op.aReceber);
    addItem('A Pagar', aPagarSaldo, op.aPagar);
    addItem('Outras Ent.', outrasEntradas, op.outrasEntradas);
    addItem('Empréstimos', emprestimoFco, op.emprestimoFco);
    addItem('Custo Cap.', custoCapitalTotal, op.custoCapital);

    calculatedCustomKpis.forEach(k => {
      addItem(k.titulo, Number(k.valor) || 0, k.operacao_caixa);
    });

    const normalRows = dreConfig.filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
    normalRows.forEach(l => {
      const rowVal = expensesData[l.id] || 0;
      addItem(l.nome, rowVal, op[l.id]);
    });

    return items.filter(i => i.valor !== 0);
  }, [systemKpiOps, ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, calculatedCustomKpis, dreConfig, expensesData]);



  const resultadoMaisCusto = kpiResultadoDinamico + custoCapitalTotal;
  const kpiDiferencaFinal = resultadoMaisCusto - geracaoCaixaSoma;
  const chartDataDif = useMemo(() => {
    return [
      { name: 'Caixa', valor: geracaoCaixaSoma, fill: '#10b981' }, // Verde UP
      { name: 'Livro', valor: -resultadoMaisCusto, fill: '#ef4444' }, // Vermelho DOWN
      { name: 'Dif.', valor: kpiDiferencaFinal, fill: '#f59e0b' }    // Amarelo UP
    ];
  }, [resultadoMaisCusto, geracaoCaixaSoma, kpiDiferencaFinal]);

  const aReceberBruto = useMemo(() => receber.reduce((s, l) => s + (Number(l.valor_a_receber) || 0), 0), [receber]);
  const chartDataReceber = useMemo(() => [
    { name: 'Receita', valor: aReceberBruto, fill: '#10b981' },
    { name: 'Despesa', valor: aReceberSaldoNet - aReceberBruto, fill: '#ef4444' },
    { name: 'A Receber', valor: aReceberSaldoNet, fill: '#f59e0b' }
  ], [aReceberBruto, aReceberSaldoNet]);

  const aPagarBruto = useMemo(() => diesel.reduce((s, l) => s + (Number(l.valor_a_pagar) || 0), 0), [diesel]);
  const chartDataPagar = useMemo(() => [
    { name: 'A Pagar', valor: aPagarBruto, fill: '#ef4444' },
    { name: 'Pago', valor: -(aPagarBruto - aPagarSaldo), fill: '#10b981' },
    { name: 'Saldo', valor: aPagarSaldo, fill: '#f59e0b' }
  ], [aPagarBruto, aPagarSaldo]);

  const [systemKpiOpsTksz, setSystemKpiOpsTksz] = useState({ difFinal: 'soma', outrasEntradas: 'subtrai', emprestimoFco: 'subtrai' });

  useEffect(() => {
    if (isInitialized) updateSetting('dre_system_kpi_ops_tksz', systemKpiOpsTksz);
  }, [systemKpiOpsTksz, isInitialized]);

  useEffect(() => {
    if (!isSettingsLoading && !isInitialized && Object.keys(settings).length > 0) {
      if (settings.dre_excluded_codes) setExcludedCodes(new Set(settings.dre_excluded_codes));
      if (settings.dre_system_kpi_ops) setSystemKpiOps(settings.dre_system_kpi_ops);
      if (settings.dre_desconto_diesel) setDescontoDieselManual(Number(settings.dre_desconto_diesel));
      if (settings.dre_system_kpi_ops_resultado_v2) setSystemKpiOpsResultado(settings.dre_system_kpi_ops_resultado_v2);
      if (settings.dre_system_kpi_ops_receitas) setSystemKpiOpsReceitas(settings.dre_system_kpi_ops_receitas);
      if (settings.dre_system_kpi_ops_despesas) setSystemKpiOpsDespesas(settings.dre_system_kpi_ops_despesas);
      if (settings.dre_system_kpi_ops_tksz) setSystemKpiOpsTksz(settings.dre_system_kpi_ops_tksz);
      setIsInitialized(true);
    } else if (!isSettingsLoading && !isInitialized && Object.keys(settings).length === 0) {
      setIsInitialized(true);
    }
  }, [isSettingsLoading, isInitialized, settings]);

  const kpiTkszDinamico = useMemo(() => {
    const op = systemKpiOpsTksz || {};
    const vDifFin = (op.difFinal === 'soma' ? kpiDiferencaFinal : op.difFinal === 'subtrai' ? -kpiDiferencaFinal : 0) || 0;
    const vOUT = (op.outrasEntradas === 'soma' ? outrasEntradas : op.outrasEntradas === 'subtrai' ? -outrasEntradas : 0) || 0;
    const vEMP = (op.emprestimoFco === 'soma' ? emprestimoFco : op.emprestimoFco === 'subtrai' ? -emprestimoFco : 0) || 0;

    // Antigos para compatibilidade se quiser adicionar outros
    const vCC = (op.ccBB === 'soma' ? ccBB : op.ccBB === 'subtrai' ? -ccBB : 0) || 0;
    const vCX = (op.saldoCaixa === 'soma' ? saldoCaixa : op.saldoCaixa === 'subtrai' ? -saldoCaixa : 0) || 0;
    const vREC = (op.aReceber === 'soma' ? aReceberSaldoNet : op.aReceber === 'subtrai' ? -aReceberSaldoNet : 0) || 0;
    const vPAG = (op.aPagar === 'soma' ? aPagarSaldo : op.aPagar === 'subtrai' ? -aPagarSaldo : 0) || 0;
    const vCCAP = (op.custoCapital === 'soma' ? custoCapitalTotal : op.custoCapital === 'subtrai' ? -custoCapitalTotal : 0) || 0;

    const customSoma = calculatedCustomKpis.reduce((acc, k) => {
      const opRes = op[k.id] || 'nenhum';
      if (opRes === 'soma') return acc + (Number(k.valor) || 0);
      if (opRes === 'subtrai') return acc - (Number(k.valor) || 0);
      return acc;
    }, 0);

    return Number(vDifFin) + Number(vOUT) + Number(vEMP) + Number(vCC) + Number(vCX) + Number(vREC) + Number(vPAG) + Number(vCCAP) + Number(customSoma);
  }, [kpiDiferencaFinal, outrasEntradas, emprestimoFco, ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, custoCapitalTotal, calculatedCustomKpis, systemKpiOpsTksz]);
  const diferenca = geracaoCaixaSoma - resultadoMaisCusto;

  const handleSaveLinha = async (payload) => {
    try {
      if (editItem) { await updateDreLinha.mutateAsync({ id: editItem.id, ...payload }); }
      else { await createDreLinha.mutateAsync({ ...payload, ordem: dreConfig.length + 1 }); }
      setDrawerOpen(false);
      setEditItem(null);
    } catch (e) { alert('Erro ao salvar linha: ' + e.message); }
  };

  if (isLoading || isLoadingKpis) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-500 font-medium">Carregando dados do DRE...</p>
    </div>
  );

  const isOk = Math.abs(kpiTkszDinamico) < 0.01;

  return (
    <div className="space-y-6">


      {/* NOVO BLOCO: Trava Zero Acima das Colunas */}
      <div className={`w-full p-6 lg:p-8 rounded-3xl shadow-xl border-2 flex flex-col md:flex-row items-center justify-between relative overflow-hidden transition-all duration-500 ${isOk
          ? 'bg-green-500 border-green-600 shadow-green-500/20'
          : 'bg-rose-500 border-rose-600 shadow-rose-500/20'
        }`}>
        <div className={`absolute -right-20 -top-20 opacity-20 blur-3xl w-96 h-96 rounded-full pointer-events-none bg-white`}></div>
        <div className={`absolute -left-20 -bottom-20 opacity-10 blur-3xl w-64 h-64 rounded-full pointer-events-none bg-white`}></div>

        <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
          <div className="p-4 rounded-2xl shrink-0 bg-white/20 text-white shadow-inner">
            {isOk ? <CheckCircle size={36} strokeWidth={2.5} /> : <AlertTriangle size={36} strokeWidth={2.5} />}
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
              Trava Zero / Conciliação Final
              <Settings
                size={16}
                className="text-white/70 hover:text-white cursor-pointer transition-colors"
                onClick={() => setTkszConfigOpen(true)}
              />
            </h2>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider mt-0.5 text-white/90 drop-shadow-sm">
              {isOk ? 'Tudo conferido e zerado' : 'Diferença detectada, revise os lançamentos'}
            </p>
          </div>
        </div>

        <div className="mt-6 md:mt-0 relative z-10 w-full md:w-auto text-center md:text-right">
          <p className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-md text-white">
            {formatBRL(kpiTkszDinamico)}
          </p>
        </div>
      </div>


      {/* NOVO BLOCO: Painel de Conferência (Acima de Receitas e Despesas) */}
      <div className="bg-slate-50 p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">

        {(() => {
          const totalReceitasDRE = displayReceitasRows.reduce((acc, r) => acc + (r.valor || 0), 0);
          const totalDespesasCard = displayRows.reduce((acc, r) => acc + (r.valor || 0), 0);
          const valorPlano = totalReceitasDRE - totalDespesasCard;

          const chartData = [
            { name: 'Receita', valor: totalReceitasDRE, fill: '#10b981' }, // Verde
            { name: 'Despesa', valor: -totalDespesasDRE, fill: '#ef4444' }, // Vermelho
            { name: 'Resultado', valor: kpiResultadoDinamico, fill: kpiResultadoDinamico >= 0 ? '#3b82f6' : '#ef4444' }, // Azul ou Vermelho
            { name: 'Capital', valor: -custoCapitalTotal, fill: '#f59e0b' }, // Amarelo
            { name: 'G. Caixa', valor: geracaoCaixaSoma, fill: '#0f766e' }, // Verde Escuro
          ];


          return (
            <div className="flex flex-col gap-6">

              {/* Linha 1: Top KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
                {/* Conta Corrente BB */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-yellow-400 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-yellow-200 shadow-sm bg-transparent">
                      <img src="/logos/bb_logo.png" alt="Banco do Brasil" className="w-full h-full object-contain" />
                    </div>
                    <div className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black uppercase rounded shadow-sm">BB</div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-1 group-hover:text-blue-700 transition-colors">Conta Corrente</p>
                  <p className="text-lg font-black text-slate-800 tracking-tight">{formatBRL(ccBB)}</p>
                </div>

                {/* Saldo Caixa */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-400 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-blue-100 shadow-sm bg-white">
                      <img src="/logos/caixa_logo.png" alt="Caixa" className="w-full h-full object-contain" />
                    </div>
                    <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded shadow-sm">CAIXA</div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Saldo Caixa</p>
                  <p className="text-lg font-black text-slate-800 tracking-tight">{formatBRL(saldoCaixa)}</p>
                </div>

                {/* A Receber (Gráfico) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mb-0.5">SALDO ( CONTAS A RECEBER )</p>
                        <p className="text-base font-black text-slate-800 tracking-tight">{formatBRL(aReceberSaldoNet)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 mt-2 min-h-[80px] h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataReceber} margin={{ top: 0, right: 0, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 'black', fill: '#94a3b8' }} interval={0} />
                        <Tooltip formatter={(val) => [formatBRL(val), 'Valor']} labelFormatter={(l) => <span className="font-black text-slate-700">{l}</span>} cursor={{ fill: 'rgba(241,245,249,0.5)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                        <ReferenceLine y={0} stroke="#e2e8f0" />
                        <Bar dataKey="valor" radius={[2, 2, 0, 0]} maxBarSize={20}>
                          {chartDataReceber.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* A Pagar (Gráfico) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group hover:border-rose-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mb-0.5">SALDO DIESEL</p>
                        <p className="text-base font-black text-slate-800 tracking-tight">{formatBRL(aPagarSaldo)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 mt-2 min-h-[80px] h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataPagar} margin={{ top: 0, right: 0, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 'black', fill: '#94a3b8' }} interval={0} />
                        <Tooltip formatter={(val) => [formatBRL(val), 'Valor']} labelFormatter={(l) => <span className="font-black text-slate-700">{l}</span>} cursor={{ fill: 'rgba(241,245,249,0.5)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                        <ReferenceLine y={0} stroke="#e2e8f0" />
                        <Bar dataKey="valor" radius={[2, 2, 0, 0]} maxBarSize={20}>
                          {chartDataPagar.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Geração de Caixa (Agora como Gráfico Detalhado) */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group hover:border-teal-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mb-0.5">Geração Caixa</p>
                        <p className="text-base font-black text-slate-800 tracking-tight">{formatBRL(geracaoCaixaSoma)}</p>
                      </div>
                    </div>
                    <Settings size={14} className="text-slate-300 cursor-pointer hover:text-teal-600 transition-colors" onClick={() => setGcConfigOpen(true)} />
                  </div>

                  <div className="flex-1 mt-2 min-h-[80px] h-20 w-full">
                    {chartDataGC.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataGC} margin={{ top: 0, right: 0, left: 0, bottom: 5 }}>
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 7, fontWeight: 'black', fill: '#94a3b8' }}
                            interval={0}
                            tickFormatter={(name) => {
                              if (name === 'Conta BB') return 'BB';
                              if (name === 'Caixa') return 'CX';
                              return name;
                            }}
                          />
                          <Tooltip
                            formatter={(val) => [formatBRL(val), 'Valor']}
                            labelFormatter={(label) => <span className="font-black text-slate-700">{label}</span>}
                            cursor={{ fill: 'rgba(241,245,249,0.5)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <ReferenceLine y={0} stroke="#e2e8f0" />
                          <Bar dataKey="valor" radius={[2, 2, 0, 0]} maxBarSize={20} minPointSize={4}>
                            {chartDataGC.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-medium">Nenhum componente configurado</div>
                    )}
                  </div>
                </div>

                {/* Diferença (Agora como Gráfico de Comparação) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group hover:border-orange-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mb-0.5">Diferença</p>
                        <p className="text-base font-black text-slate-800 tracking-tight">{formatBRL(kpiDiferencaFinal)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 mt-2 min-h-[80px] h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataDif} margin={{ top: 0, right: 0, left: 0, bottom: 5 }}>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 7, fontWeight: 'black', fill: '#94a3b8' }}
                          interval={0}
                        />
                        <Tooltip
                          formatter={(val) => [formatBRL(val), 'Valor']}
                          labelFormatter={(label) => <span className="font-black text-slate-700">{label}</span>}
                          cursor={{ fill: 'rgba(241,245,249,0.5)' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <ReferenceLine y={0} stroke="#e2e8f0" />
                        <Bar dataKey="valor" radius={[2, 2, 0, 0]} maxBarSize={20}>
                          {chartDataDif.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Linha 2: Gráficos e Detalhes (Receitas | Despesas | Composição) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Bloco Receitas (Esquerda - 4/12) */}
                <div className={`lg:col-span-4 bg-white rounded-xl border transition-colors duration-500 shadow-sm overflow-hidden flex flex-col ${isOk ? 'border-slate-200' : 'border-rose-300 ring-4 ring-rose-500/10'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors duration-500 ${isOk ? 'bg-green-50 border-green-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className={`transition-colors duration-500 ${isOk ? 'text-green-600' : 'text-rose-600'}`} />
                      <h2 className={`text-sm font-bold transition-colors duration-500 ${isOk ? 'text-green-800' : 'text-rose-800'}`}>Receitas</h2>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-full transition-colors duration-500 ${isOk ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isOk ? <CheckCircle size={9} /> : <AlertTriangle size={9} />} {isOk ? 'OK' : 'ERRO'}
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    <div className="space-y-2 mb-4">
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Total (Real)</p>
                          <Settings size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setReceitasConfigOpen(true)} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">{formatBRL(kpiReceitasDinamico)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Por Placa</h3>
                      {[...excludedCodes].some(c => planoContas.find(p => p.codigo === c)?.tipo === 'receita') && (
                        <button onClick={() => handleRestore('receita')} className="text-[9px] font-bold text-indigo-600 hover:underline">Restaurar</button>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto pr-1">
                      {displayReceitasRows.map((linha) => {
                        const val = linha.valor || 0;
                        const pct = faturamento > 0 ? (val / faturamento) * 100 : 0;
                        return (
                          <div key={linha.id} className="py-2 hover:bg-slate-50 transition-colors rounded-lg group/item">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  onClick={() => setExcludedCodes(prev => { const n = new Set(prev); n.add(linha.codigo); return n; })}
                                  className="w-3.5 h-3.5 flex items-center justify-center bg-red-50 text-red-500 rounded opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                >
                                  <Minus size={8} />
                                </button>
                                <span className="text-[11px] text-slate-700 font-bold truncate">{linha.placa || linha.nome}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`text-[11px] font-bold ${isOk ? 'text-green-600' : 'text-rose-600'}`}>{formatBRL(val)}</span>
                                <span className="text-[8px] font-bold text-slate-400">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1">
                              <div className={`h-1 rounded-full ${isOk ? 'bg-green-400' : 'bg-rose-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bloco Despesas (Centro - 4/12) */}
                <div className={`lg:col-span-4 bg-white rounded-xl border transition-colors duration-500 shadow-sm overflow-hidden flex flex-col ${isOk ? 'border-slate-200' : 'border-rose-300 ring-4 ring-rose-500/10'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors duration-500 ${isOk ? 'bg-green-50 border-green-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className={`transition-colors duration-500 ${isOk ? 'text-green-600' : 'text-rose-600'}`} />
                      <h2 className={`text-sm font-bold transition-colors duration-500 ${isOk ? 'text-green-800' : 'text-rose-800'}`}>Despesas</h2>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-full transition-colors duration-500 ${isOk ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isOk ? <CheckCircle size={9} /> : <AlertTriangle size={9} />} {isOk ? 'OK' : 'ERRO'}
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    <div className="space-y-2 mb-4">
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Total (Real)</p>
                          <Settings size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setDespesasConfigOpen(true)} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">{formatBRL(kpiDespesasDinamico)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Plano de Contas</h3>
                      {[...excludedCodes].some(c => planoContas.find(p => p.codigo === c)?.tipo === 'despesa') && (
                        <button onClick={() => handleRestore('despesa')} className="text-[9px] font-bold text-indigo-600 hover:underline">Restaurar</button>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto pr-1">
                      {displayRows.map((linha) => {
                        const val = linha.valor || 0;
                        const pct = faturamento > 0 ? (val / faturamento) * 100 : 0;
                        return (
                          <div key={linha.id} className="py-2 hover:bg-slate-50 transition-colors rounded-lg group/item">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  onClick={() => setExcludedCodes(prev => { const n = new Set(prev); n.add(linha.codigo); return n; })}
                                  className="w-3.5 h-3.5 flex items-center justify-center bg-green-50 text-green-600 rounded opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-green-500 hover:text-white"
                                >
                                  <Minus size={8} />
                                </button>
                                <span className="font-mono text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">{linha.codigo}</span>
                                <span className="text-[11px] text-slate-700 font-medium truncate">{linha.nome}</span>
                              </div>
                              <span className={`text-[11px] font-bold ${isOk ? 'text-green-600' : 'text-rose-600'}`}>-{formatBRL(val)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1">
                              <div className={`h-1 rounded-full ${isOk ? 'bg-green-400' : 'bg-rose-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bloco Direita (4/12): Detalhamento da Composição Separado */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  {(() => {
                    const op = systemKpiOpsResultado || {};
                    
                    // Dados para o Gráfico 1: OPERACIONAL (DRE)
                    const valReceita = op.receitasTotal === 'soma' ? totalReceitasDRE : (op.receitasTotal === 'subtrai' ? -totalReceitasDRE : 0);
                    const valVenda = op.vendaBens === 'soma' ? vendaBensCod6 : (op.vendaBens === 'subtrai' ? -vendaBensCod6 : 0);
                    const valDespesa = op.despesasTotal === 'soma' ? kpiDespesasDinamico : (op.despesasTotal === 'subtrai' ? -kpiDespesasDinamico : 0);
                    const valDiesel = op.descontoDiesel === 'soma' ? descontoDieselManual : (op.descontoDiesel === 'subtrai' ? -descontoDieselManual : 0);
                    const resultadoOperacional = valReceita + valVenda + valDespesa + valDiesel;

                    const barsOp = [];
                    if (totalReceitasDRE !== 0) barsOp.push({ name: 'Receita', valor: valReceita, fill: valReceita >= 0 ? '#10b981' : '#f43f5e' });
                    if (vendaBensCod6 !== 0) barsOp.push({ name: 'Venda B.', valor: valVenda, fill: valVenda >= 0 ? '#10b981' : '#f43f5e' });
                    if (kpiDespesasDinamico !== 0) barsOp.push({ name: 'Despesa', valor: valDespesa, fill: valDespesa >= 0 ? '#10b981' : '#f43f5e' });
                    if (descontoDieselManual !== 0) barsOp.push({ name: 'D. Diesel', valor: valDiesel, fill: valDiesel >= 0 ? '#10b981' : '#f43f5e' });
                    barsOp.push({ name: 'RESULTADO', valor: resultadoOperacional, fill: '#6366f1', isTotal: true });

                    // Dados para o Gráfico 2: CAIXA (FLUXO)
                    const barsCaixa = [
                      { name: 'Resultado', valor: resultadoOperacional, fill: '#6366f1' },
                      { name: 'C. Capital', valor: custoCapitalTotal, fill: '#10b981', opacity: 0.7 },
                      { name: 'Outras Ent.', valor: outrasEntradas, fill: '#10b981', opacity: 0.7 },
                      { name: 'Empréstimos', valor: emprestimoFco, fill: '#10b981', opacity: 0.7 }
                    ];
                    const geracaoCaixaFinal = resultadoOperacional + custoCapitalTotal + outrasEntradas + emprestimoFco;
                    barsCaixa.push({ name: 'FINAL', valor: geracaoCaixaFinal, fill: '#0f172a', isTotal: true });

                    return (
                      <>
                        {/* CARD 1: RESULTADO OPERACIONAL */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <Activity size={14} className="text-indigo-600" />
                              <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">DRE: Resultado Operacional</h2>
                            </div>
                            <Settings size={12} className="text-slate-300 hover:text-slate-500 cursor-pointer" onClick={() => setResultadoConfigOpen(true)} />
                          </div>
                          <div className="h-[220px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barsOp}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 7, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 7 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <ReferenceLine y={0} stroke="#cbd5e1" />
                                <Bar dataKey="valor" radius={[3, 3, 3, 3]} maxBarSize={30}>
                                  {barsOp.map((entry, index) => <Cell key={index} fill={entry.fill} stroke={entry.isTotal ? '#4f46e5' : 'transparent'} strokeWidth={entry.isTotal ? 2 : 0} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="px-4 py-2 bg-indigo-50/30 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Resultado</span>
                            <span className="text-xs font-black text-indigo-700">{formatBRL(resultadoOperacional)}</span>
                          </div>
                        </div>

                        {/* CARD 2: COMPOSIÇÃO DE CAIXA FINAL */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <Wallet size={14} className="text-slate-600" />
                              <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Fluxo: Composição de Caixa</h2>
                            </div>
                          </div>
                          <div className="h-[220px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barsCaixa}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 7, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 7 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <ReferenceLine y={0} stroke="#cbd5e1" />
                                <Bar dataKey="valor" radius={[3, 3, 3, 3]} maxBarSize={30}>
                                  {barsCaixa.map((entry, index) => <Cell key={index} fill={entry.fill} fillOpacity={entry.opacity || 1} stroke={entry.isTotal ? '#1e293b' : 'transparent'} strokeWidth={entry.isTotal ? 2 : 0} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Geração Final</span>
                            <span className="text-xs font-black text-slate-900">{formatBRL(geracaoCaixaFinal)}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>

              {/* Linha 3: Indicadores Secundários e KPIs */}
              <div className="pt-2 border-t border-slate-200/60 mt-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">

                  {/* KPIs Personalizados (Dinâmico) */}
                  <div className="lg:col-span-12 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPIs Personalizados</h3>
                      <button onClick={() => { setEditKpi(null); setKpiDrawerOpen(true); }} className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors">
                        <Plus size={10} /> ADD
                      </button>
                    </div>
                    {calculatedCustomKpis.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 h-[88px] flex items-center justify-center">Nenhum KPI manual configurado.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {calculatedCustomKpis.map(k => (
                          <button key={k.id} onClick={() => { setEditKpi(k); setKpiDrawerOpen(true); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-indigo-300 hover:shadow-md transition-all text-left group">
                            <div className="flex justify-between items-start mb-3 w-full">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${k.variante === 'success' ? 'bg-emerald-50 border border-emerald-100 group-hover:bg-emerald-100' : k.variante === 'danger' ? 'bg-red-50 border border-red-100 group-hover:bg-red-100' : 'bg-slate-50 border border-slate-100 group-hover:bg-slate-100'}`}>
                                <Activity size={16} className={`${k.variante === 'success' ? 'text-emerald-600' : k.variante === 'danger' ? 'text-red-600' : 'text-slate-500'}`} />
                              </div>
                              <Edit size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate w-full group-hover:text-indigo-600 transition-colors">{k.titulo}</p>
                            <p className={`text-sm font-black tracking-tight ${k.variante === 'success' ? 'text-emerald-700' : k.variante === 'danger' ? 'text-red-700' : 'text-slate-800'}`}>{formatBRL(Number(k.valor) || 0)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          );
        })()}
      </div>

      <TkszConfigDrawer
        open={tkszConfigOpen}
        onClose={() => setTkszConfigOpen(false)}
        systemKpiOps={systemKpiOpsTksz}
        setSystemKpiOps={setSystemKpiOpsTksz}
        customKpis={calculatedCustomKpis}
        updateDreKpi={updateDreKpi}
        dreConfig={dreConfig}
        values={{ kpiDiferencaFinal, outrasEntradas, emprestimoFco, ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, custoCapitalTotal, expensesData }}
      />
      <ResultadoConfigDrawer
        open={resultadoConfigOpen}
        onClose={() => setResultadoConfigOpen(false)}
        systemKpiOpsResultado={systemKpiOpsResultado}
        setSystemKpiOpsResultado={setSystemKpiOpsResultado}
        customKpis={calculatedCustomKpis}
        updateDreKpi={updateDreKpi}
        dreConfig={dreConfig}
        descontoDieselManual={descontoDieselManual}
        setDescontoDieselManual={setDescontoDieselManual}
        values={{
          receitasTotal: totalReceitasDRE,
          vendaBens: vendaBensCod6,
          despesasTotal: kpiDespesasDinamico,
          descontoDiesel: descontoDieselManual,
          ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, expensesData
        }}
      />
      <ReceitasConfigDrawer
        open={receitasConfigOpen}
        onClose={() => setReceitasConfigOpen(false)}
        systemKpiOps={systemKpiOpsReceitas}
        setSystemKpiOps={setSystemKpiOpsReceitas}
        customKpis={calculatedCustomKpis}
        updateDreKpi={updateDreKpi}
        dreConfig={dreConfig}
        values={{ ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, expensesData }}
      />
      <DespesasConfigDrawer
        open={despesasConfigOpen}
        onClose={() => setDespesasConfigOpen(false)}
        systemKpiOps={systemKpiOpsDespesas}
        setSystemKpiOps={setSystemKpiOpsDespesas}
        customKpis={calculatedCustomKpis}
        updateDreKpi={updateDreKpi}
        dreConfig={dreConfig}
        values={{ ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, expensesData }}
      />
      <GeracaoCaixaConfigDrawer
        open={gcConfigOpen}
        onClose={() => setGcConfigOpen(false)}
        systemKpiOps={systemKpiOps}
        setSystemKpiOps={setSystemKpiOps}
        customKpis={calculatedCustomKpis}
        updateDreKpi={updateDreKpi}
        dreConfig={dreConfig}
        values={{ ccBB, saldoCaixa, aReceberSaldoNet, aPagarSaldo, outrasEntradas, emprestimoFco, custoCapitalTotal, expensesData }}
      />
      <DreKpiDrawer
        open={kpiDrawerOpen}
        onClose={() => { setKpiDrawerOpen(false); setEditKpi(null); }}
        onSave={async (p) => {
          if (editKpi) await updateDreKpi.mutateAsync({ id: editKpi.id, ...p });
          else await createDreKpi.mutateAsync(p);
          setKpiDrawerOpen(false); setEditKpi(null);
        }}
        onDelete={async (id) => {
          await deleteDreKpi.mutateAsync(id);
          setKpiDrawerOpen(false); setEditKpi(null);
        }}
        initial={editKpi}
        dreConfig={dreConfig}
      />
      <DreLinhaDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditItem(null); }}
        onSave={handleSaveLinha}
        initial={editItem}
        dreLines={dreConfig}
      />
    </div>
  );
}
export function DreDashboard() {
  const { data: lancamentos = [], isLoading: isLoadingGeral } = useLancamentos();
  const { data: caixa = [], isLoading: isLoadingCaixa } = useCaixa();
  const { data: diesel = [], isLoading: isLoadingDiesel } = useDiesel();
  const { data: receber = [], isLoading: isLoadingReceber } = useReceber();
  const { data: custoCapital = [], isLoading: isLoadingCustoCapital } = useCustoCapital();

  const isLoadingData = isLoadingGeral || isLoadingCaixa || isLoadingDiesel || isLoadingReceber || isLoadingCustoCapital;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 font-medium">Carregando dados do DRE...</p>
      </div>
    );
  }

  return (
    <DreErrorBoundary>
      <ResultadoView
        receber={receber}
        lancamentos={lancamentos}
        caixa={caixa}
        diesel={diesel}
        custoCapital={custoCapital}
      />
    </DreErrorBoundary>
  );
}
