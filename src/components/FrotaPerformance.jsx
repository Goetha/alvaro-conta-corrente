import React, { useMemo, useState } from 'react';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useReceber } from '@/hooks/useReceber';
import { useDiesel } from '@/hooks/useDiesel';
import { useSalario } from '@/hooks/useSalario';
import { useManutencao } from '@/hooks/useManutencao';
import { usePedagio } from '@/hooks/usePedagio';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useOperacoes } from '@/hooks/useOperacoes';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { usePeriodosOperacao, calcularDias } from '@/hooks/usePeriodosOperacao';
import { formatBRL } from '@/lib/formatters';
import { Loader2, TrendingUp, TrendingDown, Calendar, Truck, Clock, X, Settings, ChevronDown, ChevronRight } from 'lucide-react';

const operacaoColor = {
  frigorifica:    { bg: 'bg-blue-500/20',  text: 'text-blue-200',  border: 'border-blue-500/30' },
  granel:         { bg: 'bg-amber-500/20', text: 'text-amber-200', border: 'border-amber-500/30' },
  granel_liquido: { bg: 'bg-cyan-500/20',  text: 'text-cyan-200',  border: 'border-cyan-500/30' },
};

function pct(part, total) {
  if (!total) return '0%';
  return ((part / total) * 100).toFixed(1) + '%';
}

function OpBadge({ nome }) {
  const key = (nome || '').toLowerCase().replace(/\s+/g, '_');
  const c = operacaoColor[key] || { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
      {nome || '-'}
    </span>
  );
}

export default function FrotaPerformance() {
  const { data: lancamentos = [], isLoading: loadingL } = useLancamentos();
  const { data: receber = [],     isLoading: loadingR } = useReceber();
  const { data: diesel = [],      isLoading: loadingD } = useDiesel();
  const { data: salarios = [],    isLoading: loadingS } = useSalario();
  const { data: manutencoes = [], isLoading: loadingM } = useManutencao();
  const { data: pedagios = [],    isLoading: loadingP } = usePedagio();
  const { data: veiculos = [],    isLoading: loadingV } = useVeiculos();
  const { data: operacoes = [] }                        = useOperacoes();
  const { data: periodos = [] }                         = usePeriodosOperacao();
  const { data: planoContas = [] }                      = usePlanoContas();

  const [dateFilter, setDateFilter] = useState({ inicio: '', fim: '' });
  const [configOpen, setConfigOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [rateioCodes, setRateioCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('frota_rateio_codigos');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  // Mapa cavalo_id → info do período ativo
  const diasPorCavalo = useMemo(() => {
    const map = {};
    periodos.forEach(p => {
      const cid = p.cavalo_id;
      const dias = calcularDias(p.data_inicio, p.data_fim);
      if (!map[cid] || !p.data_fim) {
        map[cid] = { dias, dataInicio: p.data_inicio, ativo: !p.data_fim };
      }
    });
    return map;
  }, [periodos]);

  const df = dateFilter;
  const inRange = (val, field) => {
    if (df.inicio && val[field] < df.inicio) return false;
    if (df.fim    && val[field] > df.fim)    return false;
    return true;
  };

  const filteredReceber     = useMemo(() => receber.filter(r     => inRange(r, 'data_competencia')), [receber, dateFilter]);
  const filteredDiesel      = useMemo(() => diesel.filter(d      => inRange(d, 'data_emissao')),     [diesel, dateFilter]);
  const filteredSalarios    = useMemo(() => salarios.filter(s    => inRange(s, 'data')),             [salarios, dateFilter]);
  const filteredManutencoes = useMemo(() => manutencoes.filter(m => inRange(m, 'data')),             [manutencoes, dateFilter]);
  const filteredPedagios    = useMemo(() => pedagios.filter(p    => inRange(p, 'data')),             [pedagios, dateFilter]);
  const filteredLancamentos = useMemo(() => lancamentos.filter(l => inRange(l, 'data')),             [lancamentos, dateFilter]);

  const conjuntosData = useMemo(() => {
    if (loadingL || loadingR || loadingV || loadingD || loadingS || loadingM || loadingP) return [];
    const cavalos = veiculos.filter(v => v.tipo === 'cavalo' || !v.tipo);
    const carretas = veiculos.filter(v => v.tipo === 'carreta');

    // Faturamento total para calcular taxa do rateio
    let faturamentoTotalFrota = 0;
    cavalos.forEach(cavalo => {
      const todasPlacas = [cavalo.placa, ...carretas.filter(c => c.cavalo_id === cavalo.id).map(c => c.placa)];
      faturamentoTotalFrota += filteredReceber.filter(r => todasPlacas.includes(r.placa)).reduce((a, r) => a + (Number(r.valor_a_receber) || 0), 0);
    });

    const rateioCodesStr = rateioCodes.map(c => String(c));
    // Descontos vêm dos ajustes NEGATIVOS em receber + lançamentos bancários
    const hasDescontoCode = rateioCodesStr.includes('7');
    const totalDescontosReceberRateio = hasDescontoCode
      ? filteredReceber.reduce((acc, r) => { const aj = Number(r.ajustes) || 0; return acc + (aj < 0 ? Math.abs(aj) : 0); }, 0)
      : 0;
    
    const totalRateioLancamentos = filteredLancamentos
      .filter(l => rateioCodesStr.includes(String(l.codigo)))
      .reduce((acc, l) => acc + (Number(l.despesa) || 0), 0);
      
    const totalRateioReal = totalRateioLancamentos + totalDescontosReceberRateio;

    // Métricas por placa individual
    const metricsForPlaca = (placa, comRateio) => {
      const fat   = filteredReceber.filter(r => r.placa === placa).reduce((a, r) => a + (Number(r.valor_a_receber) || 0), 0);
      const abast = filteredDiesel.filter(d => d.placa === placa).reduce((a, d) => a + (Number(d.valor_a_pagar) || 0), 0);
      const sal   = filteredSalarios.filter(s => s.placa === placa).reduce((a, s) => a + (Number(s.valor) || 0), 0);
      const man   = filteredManutencoes.filter(m => m.placa === placa).reduce((a, m) => a + (Number(m.valor) || 0), 0);
      const ped   = filteredPedagios.filter(p => p.placa === placa).reduce((a, p) => a + (Number(p.valor) || 0), 0);
      let rat = 0;
      if (comRateio) {
        const desc = hasDescontoCode
          ? filteredReceber.filter(r => r.placa === placa).reduce((a, r) => { const aj = Number(r.ajustes) || 0; return a + (aj < 0 ? Math.abs(aj) : 0); }, 0)
          : 0;
        rat = fat * (faturamentoTotalFrota > 0 ? totalRateioLancamentos / faturamentoTotalFrota : 0) + desc;
      }
      return { faturamento: fat, abastecimento: abast, salario: sal, manutencao: man, pedagio: ped, rateio: rat, resultado: fat - abast - sal - man - ped - rat };
    };

    return cavalos.map(cavalo => {
      const carretasVinculadas = carretas.filter(c => c.cavalo_id === cavalo.id);
      const cavaloRow = { id: `c-${cavalo.id}`, placa: cavalo.placa, tipo: 'cavalo', ...metricsForPlaca(cavalo.placa, false) };
      const carretaRows = carretasVinculadas.map(ct => ({
        id: `ct-${ct.id}`, placa: ct.placa, tipo: 'carreta', ...metricsForPlaca(ct.placa, true),
      }));
      const allRows = [cavaloRow, ...carretaRows];
      const tot = allRows.reduce((acc, v) => ({
        faturamento: acc.faturamento + v.faturamento, abastecimento: acc.abastecimento + v.abastecimento,
        salario: acc.salario + v.salario, manutencao: acc.manutencao + v.manutencao,
        pedagio: acc.pedagio + v.pedagio, rateio: acc.rateio + v.rateio, resultado: acc.resultado + v.resultado,
      }), { faturamento: 0, abastecimento: 0, salario: 0, manutencao: 0, pedagio: 0, rateio: 0, resultado: 0 });
      const periodoInfo = diasPorCavalo[cavalo.id];
      const dias = periodoInfo?.dias || 30;
      return {
        id: cavalo.id, cavaloPlaca: cavalo.placa,
        operacao: operacoes.find(o => o.id === cavalo.operacao_id)?.nome || '-',
        cavaloRow, carretaRows,
        totals: { ...tot, margem: tot.faturamento > 0 ? (tot.resultado / tot.faturamento) * 100 : 0,
          resultadoMedio: dias > 0 ? (tot.resultado / dias) * 30 : 0,
          dias, dataInicio: periodoInfo?.dataInicio || null, periodoAtivo: periodoInfo?.ativo ?? true },
      };
    }).sort((a, b) => b.totals.faturamento - a.totals.faturamento);
  }, [filteredLancamentos, filteredReceber, filteredDiesel, filteredSalarios, filteredManutencoes,
      filteredPedagios, veiculos, operacoes, diasPorCavalo, rateioCodes,
      loadingL, loadingR, loadingV, loadingD, loadingS, loadingM, loadingP]);

  const totals = conjuntosData.reduce((acc, c) => ({
    faturamento: acc.faturamento + c.totals.faturamento, abastecimento: acc.abastecimento + c.totals.abastecimento,
    salario: acc.salario + c.totals.salario, manutencao: acc.manutencao + c.totals.manutencao,
    pedagio: acc.pedagio + c.totals.pedagio, rateio: acc.rateio + c.totals.rateio,
    resultado: acc.resultado + c.totals.resultado, dias: acc.dias + c.totals.dias,
  }), { faturamento: 0, abastecimento: 0, salario: 0, manutencao: 0, pedagio: 0, rateio: 0, resultado: 0, dias: 0 });

  const hasFilter = df.inicio || df.fim;
  const toggleGroup = (id) => setExpandedGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandAll = () => setExpandedGroups(new Set(conjuntosData.map(c => c.id)));
  const collapseAll = () => setExpandedGroups(new Set());

  if (loadingL || loadingR || loadingV || loadingD || loadingS || loadingM || loadingP) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm font-medium">Calculando performance da frota...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Truck size={18} className="text-white" />
            </span>
            Performance por Veículo
          </h2>
          <p className="text-xs text-slate-500 mt-1 ml-12">
            Análise consolidada da operação e rentabilidade da frota
          </p>
        </div>

        {/* Date filter */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm w-full sm:w-auto">
          <Calendar size={13} className="text-slate-400 flex-shrink-0" />
          <input type="date" className="bg-transparent outline-none text-slate-600 flex-1 min-w-[110px]"
            value={df.inicio} onChange={e => setDateFilter(f => ({ ...f, inicio: e.target.value }))} />
          <span className="text-slate-300 font-bold">→</span>
          <input type="date" className="bg-transparent outline-none text-slate-600 flex-1 min-w-[110px]"
            value={df.fim} onChange={e => setDateFilter(f => ({ ...f, fim: e.target.value }))} />
          {hasFilter && (
            <button onClick={() => setDateFilter({ inicio: '', fim: '' })}
              className="p-0.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>


      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Faturamento */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Faturamento Total</p>
          <div>
            <p className="text-xl font-black text-emerald-800 leading-tight">{formatBRL(totals.faturamento)}</p>
            <p className="text-[9px] text-emerald-500/80 mt-1">valor bruto acumulado</p>
          </div>
        </div>

        {/* Resultado */}
        <div className={`bg-gradient-to-br border rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full ${totals.resultado >= 0 ? 'from-indigo-50 to-blue-50 border-indigo-100' : 'from-rose-50 to-pink-50 border-rose-100'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${totals.resultado >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Resultado Total</p>
          <div>
            <p className={`text-xl font-black leading-tight ${totals.resultado >= 0 ? 'text-indigo-800' : 'text-rose-700'}`}>{formatBRL(totals.resultado)}</p>
            <p className={`text-[9px] mt-1 ${totals.resultado >= 0 ? 'text-indigo-500/80' : 'text-rose-500/80'}`}>lucro operacional bruto</p>
          </div>
        </div>

        {/* Margem */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1">Margem Líquida</p>
          <div>
            <p className="text-xl font-black text-teal-800 leading-tight">
              {totals.faturamento ? pct(totals.resultado, totals.faturamento) : '0%'}
            </p>
            <p className="text-[9px] text-teal-500/80 mt-1">sobre faturamento</p>
          </div>
        </div>

        {/* Dias */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">Dias Acumulados</p>
          <div>
            <p className="text-xl font-black text-violet-800 leading-tight">{totals.dias} dias</p>
            <p className="text-[9px] text-violet-500/80 mt-1">operação da frota</p>
          </div>
        </div>

        {/* Rateio Dinâmico */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full group transition-all hover:border-indigo-300">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Rateio Dinâmico</p>
            <button
              onClick={() => setConfigOpen(true)}
              className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200 transition-all hover:scale-110"
              title="Configurar contas do Rateio"
            >
              <Settings size={13} />
            </button>
          </div>
          <div>
            <p className="text-xl font-black text-slate-800 leading-tight">{formatBRL(totals.rateio)}</p>
            <p className="text-[9px] text-slate-500/80 font-medium mt-1">
              {totals.faturamento ? pct(totals.rateio, totals.faturamento) : '0%'} · {rateioCodes.length} contas
            </p>
          </div>
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-xs text-slate-500 font-medium">{conjuntosData.length} conjuntos · clique para expandir</span>
          <div className="flex gap-2">
            <button onClick={expandAll} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors">Expandir tudo</button>
            <button onClick={collapseAll} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors">Colapsar tudo</button>
          </div>
        </div>
        <table className="text-xs border-collapse" style={{ minWidth: '900px', width: '100%' }}>
          <thead>
            <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white uppercase text-[9px] font-bold tracking-wider">
              <th className="px-3 py-4 text-left sticky left-0 bg-slate-900 z-10 border-r border-slate-700/50">Conjunto / Placa</th>
              <th className="px-3 py-4 text-right text-emerald-400">Faturamento</th>
              <th className="px-4 py-4 text-right text-amber-300">Abast.</th>
              <th className="px-4 py-4 text-right text-blue-300">Salário</th>
              <th className="px-4 py-4 text-right text-blue-400/70">% Sal.</th>
              <th className="px-4 py-4 text-right text-purple-300">Manut.</th>
              <th className="px-4 py-4 text-right text-purple-400/70">% Man.</th>
              <th className="px-4 py-4 text-right text-orange-300">Pedágio</th>
              <th className="px-4 py-4 text-right text-orange-400/70">% Ped.</th>
              <th className="px-4 py-4 text-right text-slate-400 italic">Rateio</th>
              <th className="px-4 py-4 text-right">Resultado</th>
              <th className="px-4 py-4 text-center">Margem</th>
              <th className="px-4 py-4 text-left">Operação</th>
              <th className="px-4 py-4 text-center">Dias Op.</th>
              <th className="px-4 py-4 text-right">Méd./30d</th>
            </tr>
          </thead>
          <tbody>
            {conjuntosData.map((grupo) => {
              const t = grupo.totals;
              const pos = t.resultado >= 0;
              const expanded = expandedGroups.has(grupo.id);
              const SubRow = ({ row }) => {
                const rpos = row.resultado >= 0;
                return (
                  <tr key={row.id} className="border-b border-slate-100 bg-slate-50/60">
                    <td className="px-3 py-2 sticky left-0 bg-slate-50/60 border-r border-slate-100 z-10">
                      <div className="flex items-center gap-2 pl-7">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${row.tipo === 'cavalo' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {row.tipo === 'cavalo' ? '🚛 Cavalo' : '🚌 Carreta'}
                        </span>
                        <span className="font-mono font-bold text-[10px] text-slate-600">{row.placa}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{row.faturamento > 0 ? <span className="font-bold text-emerald-700">{formatBRL(row.faturamento)}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{row.abastecimento > 0 ? formatBRL(row.abastecimento) : '—'}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{row.salario > 0 ? formatBRL(row.salario) : '—'}</td>
                    <td className="px-3 py-2 text-right text-[9px] text-blue-400">{row.faturamento > 0 ? pct(row.salario, t.faturamento) : '—'}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{row.manutencao > 0 ? formatBRL(row.manutencao) : '—'}</td>
                    <td className="px-3 py-2 text-right text-[9px] text-purple-400">{row.faturamento > 0 ? pct(row.manutencao, t.faturamento) : '—'}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{row.pedagio > 0 ? formatBRL(row.pedagio) : '—'}</td>
                    <td className="px-3 py-2 text-right text-[9px] text-orange-400">{row.faturamento > 0 ? pct(row.pedagio, t.faturamento) : '—'}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-400 italic">{row.rateio > 0 ? formatBRL(row.rateio) : '—'}</td>
                    <td className={`px-3 py-2 text-right font-bold text-xs ${rpos ? 'text-indigo-600' : 'text-rose-500'}`}>{formatBRL(row.resultado)}</td>
                    <td className="px-3 py-2 text-center">{row.faturamento > 0 ? <span className={`text-[10px] font-black ${rpos ? 'text-emerald-600' : 'text-rose-500'}`}>{(row.resultado / row.faturamento * 100).toFixed(1)}%</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                    <td className="px-3 py-2" /><td className="px-3 py-2" /><td className="px-3 py-2" />
                  </tr>
                );
              };
              return (
                <React.Fragment key={grupo.id}>
                  {/* Grupo / Conjunto row */}
                  <tr
                    className={`border-b-2 border-slate-300 cursor-pointer transition-all duration-150 ${pos ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                    onClick={() => toggleGroup(grupo.id)}
                  >
                    <td className="px-3 py-3 sticky left-0 bg-slate-800 border-r border-slate-600 z-10">
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown size={13} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={13} className="text-slate-400 flex-shrink-0" />}
                        <span className={`w-1.5 h-6 rounded-full flex-shrink-0 ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <div className="flex flex-col">
                          <span className="font-black text-white tracking-wider font-mono text-xs">{grupo.cavaloPlaca}</span>
                          <span className="text-[8px] text-slate-400 font-medium">{grupo.carretaRows.map(r => r.placa).join(' · ') || 'sem carreta'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-400">{formatBRL(t.faturamento)}</td>
                    {[
                      { v: t.abastecimento, c: 'text-amber-300' },
                      { v: t.salario,       c: 'text-blue-300',   extraThreshold: 0.12 },
                      { v: t.manutencao,    c: 'text-purple-300', extraThreshold: 0.06 },
                      { v: t.pedagio,       c: 'text-orange-300', extraThreshold: 0.04 },
                    ].flatMap((col, ci) => {
                      const ratio = col.v / (t.faturamento || 1);
                      const cells = [
                        <td key={`g-v-${ci}`} className="px-4 py-3 text-right text-slate-300">
                          <div className="font-medium text-xs">{formatBRL(col.v)}</div>
                          <div className={`text-[9px] font-bold ${col.c}`}>{pct(col.v, t.faturamento)}</div>
                        </td>
                      ];
                      if (col.extraThreshold !== undefined) {
                        cells.push(
                          <td key={`g-pct-${ci}`} className="px-4 py-3 text-right">
                            <span className={`text-xs font-black ${ratio <= col.extraThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>{pct(col.v, t.faturamento)}</span>
                          </td>
                        );
                      }
                      return cells;
                    })}
                    <td className="px-4 py-3 text-right text-slate-500 italic text-xs">{formatBRL(t.rateio)}</td>
                    <td className={`px-4 py-3 text-right font-black text-sm ${pos ? 'text-indigo-300' : 'text-rose-400'}`}>{formatBRL(t.resultado)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[10px] font-black ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>{t.margem.toFixed(1)}%</span>
                        <div className="w-14 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${Math.min(100, Math.abs(t.margem))}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><OpBadge nome={grupo.operacao} /></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`font-black text-base leading-tight ${t.periodoAtivo ? 'text-violet-400' : 'text-slate-500'}`}>{t.dias}</span>
                        {t.dataInicio && <span className="text-[9px] text-slate-500">{t.dataInicio.split('-').reverse().join('/')}</span>}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold text-xs ${t.resultadoMedio >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>{formatBRL(t.resultadoMedio)}</td>
                  </tr>
                  {/* Sub-rows: cavalo + carretas */}
                  {expanded && <SubRow row={grupo.cavaloRow} />}
                  {expanded && grupo.carretaRows.map(r => <SubRow key={r.id} row={r} />)}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs border-t-2 border-slate-700">
              <td className="px-4 py-4 sticky left-0 bg-slate-900 z-10 uppercase text-[10px] tracking-widest font-black">Total Frota</td>
              <td className="px-4 py-4 text-right text-emerald-400 font-bold">{formatBRL(totals.faturamento)}</td>
              <td className="px-4 py-4 text-right text-slate-300">{formatBRL(totals.abastecimento)}</td>
              <td className="px-4 py-4 text-right text-slate-300">{formatBRL(totals.salario)}</td>
              <td className="px-4 py-4 text-right text-blue-400/80 font-bold text-[10px]">{pct(totals.salario, totals.faturamento)}</td>
              <td className="px-4 py-4 text-right text-slate-300">{formatBRL(totals.manutencao)}</td>
              <td className="px-4 py-4 text-right text-purple-400/80 font-bold text-[10px]">{pct(totals.manutencao, totals.faturamento)}</td>
              <td className="px-4 py-4 text-right text-slate-300">{formatBRL(totals.pedagio)}</td>
              <td className="px-4 py-4 text-right text-orange-400/80 font-bold text-[10px]">{pct(totals.pedagio, totals.faturamento)}</td>
              <td className="px-4 py-4 text-right text-slate-500 italic">{formatBRL(totals.rateio)}</td>
              <td className={`px-4 py-4 text-right text-lg font-black ${totals.resultado >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                {formatBRL(totals.resultado)}
              </td>
              <td className="px-4 py-4 text-center text-teal-300 font-bold text-[10px]">
                {totals.faturamento ? pct(totals.resultado, totals.faturamento) : '0%'}
              </td>
              <td className="px-4 py-4" />
              <td className="px-4 py-4 text-center text-violet-300 font-bold">{totals.dias}d</td>
              <td className="px-4 py-4" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-3">
        {conjuntosData.map(grupo => {
          const t = grupo.totals;
          const pos = t.resultado >= 0;
          return (
            <div key={grupo.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <div>
                    <span className="font-black text-white font-mono tracking-widest text-sm">{grupo.cavaloPlaca}</span>
                    <span className="text-[9px] text-slate-400 ml-2">{grupo.carretaRows.map(r => r.placa).join(' + ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <OpBadge nome={grupo.operacao} />
                  <span className="text-[10px] text-violet-300 font-bold">{t.dias}d</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Faturamento</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatBRL(t.faturamento)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Abast.',  value: t.abastecimento, color: 'text-amber-600'  },
                    { label: 'Salário', value: t.salario,       color: 'text-blue-600'   },
                    { label: 'Manut.',  value: t.manutencao,    color: 'text-purple-600' },
                    { label: 'Pedágio', value: t.pedagio,       color: 'text-orange-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">{item.label}</p>
                      <p className={`font-semibold text-xs ${item.color}`}>{formatBRL(item.value)}</p>
                      <p className={`text-[9px] font-bold ${item.color} opacity-70`}>{pct(item.value, t.faturamento)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Resultado</p>
                    <p className={`text-xl font-black ${pos ? 'text-indigo-700' : 'text-rose-600'}`}>{formatBRL(t.resultado)}</p>
                    <p className={`text-[10px] font-black ${pos ? 'text-emerald-600' : 'text-rose-500'}`}>{t.margem.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Méd./30d</p>
                    <p className={`font-bold text-sm ${t.resultadoMedio >= 0 ? 'text-teal-700' : 'text-rose-500'}`}>{formatBRL(t.resultadoMedio)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom KPI Breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Peso Combustível</p>
          <p className="text-2xl font-black text-amber-800 my-1">{totals.faturamento ? pct(totals.abastecimento, totals.faturamento) : '0%'}</p>
          <p className="text-[10px] text-amber-500">abastecimento / faturamento</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Peso Salários</p>
          <p className="text-2xl font-black text-blue-800 my-1">{totals.faturamento ? pct(totals.salario, totals.faturamento) : '0%'}</p>
          <p className="text-[10px] text-blue-500">mão de obra / faturamento</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Peso Manutenção</p>
          <p className="text-2xl font-black text-purple-800 my-1">{totals.faturamento ? pct(totals.manutencao, totals.faturamento) : '0%'}</p>
          <p className="text-[10px] text-purple-500">manutenção / faturamento</p>
        </div>
      </div>



      {/* ── Modal Configurar Rateio ── */}
      {configOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
              <div>
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  <Settings size={18} /> Configurar Rateio
                </h3>
                <p className="text-xs text-indigo-200 mt-1">Marque as contas do DRE que formam o custo rateado na frota.</p>
              </div>
              <button onClick={() => setConfigOpen(false)} className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><X size={20}/></button>
            </div>

            {/* Search / quick select */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">
                {rateioCodes.length} de {planoContas.length} contas selecionadas
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { const all = planoContas.map(pc => pc.codigo); setRateioCodes(all); localStorage.setItem('frota_rateio_codigos', JSON.stringify(all)); }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >Selecionar tudo</button>
                <button
                  onClick={() => { setRateioCodes([]); localStorage.setItem('frota_rateio_codigos', '[]'); }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                >Limpar</button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {planoContas.map(pc => {
                const checked = rateioCodes.map(c => String(c)).includes(String(pc.codigo));
                return (
                  <label key={pc.id} className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...rateioCodes, String(pc.codigo)]
                          : rateioCodes.filter(c => String(c) !== String(pc.codigo));
                        setRateioCodes(next);
                        localStorage.setItem('frota_rateio_codigos', JSON.stringify(next));
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                    />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-xs font-black w-8 flex-shrink-0 ${rateioCodes.map(c => String(c)).includes(String(pc.codigo)) ? 'text-indigo-700' : 'text-slate-400'}`}>{pc.codigo}</span>
                      <span className={`text-sm font-semibold truncate ${rateioCodes.map(c => String(c)).includes(String(pc.codigo)) ? 'text-indigo-900' : 'text-slate-700'}`}>{pc.nome}</span>
                    </div>
                    {rateioCodes.map(c => String(c)).includes(String(pc.codigo)) && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end">
               <button onClick={() => setConfigOpen(false)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                 Confirmar
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
