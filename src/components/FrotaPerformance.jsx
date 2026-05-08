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
import { Loader2, TrendingUp, TrendingDown, Calendar, Truck, Clock, X, Settings } from 'lucide-react';

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

  const performanceData = useMemo(() => {
    if (loadingL || loadingR || loadingV || loadingD || loadingS || loadingM || loadingP) return [];
    const cavalos = veiculos.filter(v => v.tipo === 'cavalo' || !v.tipo);
    const carretas = veiculos.filter(v => v.tipo === 'carreta');

    let faturamentoTotalFrota = 0;
    cavalos.forEach(cavalo => {
      const placas = [cavalo.placa, ...carretas.filter(c => c.cavalo_id === cavalo.id).map(c => c.placa)];
      const fat = filteredReceber.filter(r => placas.includes(r.placa)).reduce((a, r) => a + (Number(r.valor_a_receber) || 0), 0);
      faturamentoTotalFrota += fat;
    });

    const rateioCodesStr = rateioCodes.map(c => String(c));
    const totalRateioReal = filteredLancamentos
      .filter(l => rateioCodesStr.includes(String(l.codigo)))
      .reduce((acc, l) => acc + (Number(l.despesa) || 0), 0);

    const taxaRateio = faturamentoTotalFrota > 0 ? (totalRateioReal / faturamentoTotalFrota) : 0;

    return cavalos.map(cavalo => {
      const placas = [cavalo.placa, ...carretas.filter(c => c.cavalo_id === cavalo.id).map(c => c.placa)];
      const faturamento   = filteredReceber.filter(r => placas.includes(r.placa)).reduce((a, r) => a + (Number(r.valor_a_receber) || 0), 0);
      const abastecimento = filteredDiesel.filter(d => placas.includes(d.placa)).reduce((a, d) => a + (Number(d.valor_a_pagar)  || 0), 0);
      const salario       = filteredSalarios.filter(s => placas.includes(s.placa)).reduce((a, s) => a + (Number(s.valor)        || 0), 0);
      const manutencao    = filteredManutencoes.filter(m => placas.includes(m.placa)).reduce((a, m) => a + (Number(m.valor)     || 0), 0);
      const pedagio       = filteredPedagios.filter(p => placas.includes(p.placa)).reduce((a, p) => a + (Number(p.valor)       || 0), 0);
      const rateio        = faturamento * taxaRateio;
      const resultado     = faturamento - abastecimento - salario - manutencao - pedagio - rateio;
      const periodoInfo   = diasPorCavalo[cavalo.id];
      const dias          = periodoInfo?.dias      || 30;
      const dataInicio    = periodoInfo?.dataInicio || null;
      const periodoAtivo  = periodoInfo?.ativo      ?? true;
      return {
        id: cavalo.id, placa: cavalo.placa,
        operacao: operacoes.find(o => o.id === cavalo.operacao_id)?.nome || '-',
        faturamento, abastecimento, salario, manutencao, pedagio, rateio, resultado,
        dias, dataInicio, periodoAtivo,
        margem: faturamento > 0 ? (resultado / faturamento) * 100 : 0,
        resultadoMedio: dias > 0 ? (resultado / dias) * 30 : 0,
      };
    }).sort((a, b) => b.faturamento - a.faturamento);
  }, [filteredLancamentos, filteredReceber, filteredDiesel, filteredSalarios, filteredManutencoes,
      filteredPedagios, veiculos, operacoes, diasPorCavalo, rateioCodes,
      loadingL, loadingR, loadingV, loadingD, loadingS, loadingM, loadingP]);

  const totals = performanceData.reduce((acc, s) => ({
    faturamento:   acc.faturamento   + s.faturamento,
    abastecimento: acc.abastecimento + s.abastecimento,
    salario:       acc.salario       + s.salario,
    manutencao:    acc.manutencao    + s.manutencao,
    pedagio:       acc.pedagio       + s.pedagio,
    rateio:        acc.rateio        + s.rateio,
    resultado:     acc.resultado     + s.resultado,
    dias:          acc.dias          + s.dias,
  }), { faturamento: 0, abastecimento: 0, salario: 0, manutencao: 0, pedagio: 0, rateio: 0, resultado: 0, dias: 0 });

  const hasFilter = df.inicio || df.fim;

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

      {/* ── Desktop Table (scroll horizontal) ── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-md">
        <table className="text-xs border-collapse" style={{ minWidth: '900px', width: '100%' }}>
          <thead>
            <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white uppercase text-[9px] font-bold tracking-wider">
              <th className="px-3 py-4 text-left sticky left-0 bg-slate-900 z-10 border-r border-slate-700/50">Placa</th>
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
            {performanceData.map((s, i) => {
              const pos = s.resultado >= 0;
              return (
                <tr key={s.id}
                  className={`border-b border-slate-100 transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-indigo-50/50`}>
                  {/* Placa */}
                  <td className="px-3 py-3.5 sticky left-0 bg-inherit border-r border-slate-200 z-10">
                    <div className="flex items-center gap-2">
                      <span className={`w-1 h-6 rounded-full flex-shrink-0 ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="font-black text-slate-800 tracking-wider font-mono text-xs">{s.placa}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-bold text-emerald-700">{formatBRL(s.faturamento)}</td>
                  {/* Cost cols com % */}
                  {[
                    { v: s.abastecimento, c: 'text-amber-500'  },
                    { v: s.salario,       c: 'text-blue-500',   extraCol: true, extraKey: 'pct-sal',  extraThreshold: 0.12, extraValue: () => s.salario },
                    { v: s.manutencao,    c: 'text-purple-500', extraCol: true, extraKey: 'pct-man',  extraThreshold: 0.06, extraValue: () => s.manutencao },
                    { v: s.pedagio,       c: 'text-orange-400', extraCol: true, extraKey: 'pct-ped', extraThreshold: 0.04, extraValue: () => s.pedagio },
                  ].flatMap((col, ci) => {
                    const cells = [
                      <td key={`v-${ci}`} className="px-4 py-3.5 text-right text-slate-600">
                        <div className="font-medium">{formatBRL(col.v)}</div>
                        <div className={`text-[9px] font-bold ${col.c}`}>{pct(col.v, s.faturamento)}</div>
                      </td>
                    ];
                    if (col.extraCol) {
                      const ratio = col.extraValue() / (s.faturamento || 1);
                      cells.push(
                        <td key={col.extraKey} className="px-4 py-3.5 text-right">
                          <span className={`text-xs font-black ${ratio <= col.extraThreshold ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {pct(col.extraValue(), s.faturamento)}
                          </span>
                        </td>
                      );
                    }
                    return cells;
                  })}
                  <td className="px-4 py-3.5 text-right text-slate-400 italic">{formatBRL(s.rateio)}</td>
                  <td className={`px-4 py-3.5 text-right font-black text-sm ${pos ? 'text-indigo-700' : 'text-rose-600'}`}>
                    {formatBRL(s.resultado)}
                  </td>
                  {/* Margem bar */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-black ${pos ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {s.margem.toFixed(1)}%
                      </span>
                      <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`}
                          style={{ width: `${Math.min(100, Math.abs(s.margem))}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><OpBadge nome={s.operacao} /></td>
                  {/* Dias */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`font-black text-base leading-tight ${s.periodoAtivo ? 'text-violet-700' : 'text-slate-400'}`}>{s.dias}</span>
                      {s.dataInicio && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {s.dataInicio.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3.5 text-right font-bold ${s.resultadoMedio >= 0 ? 'text-teal-700' : 'text-rose-500'}`}>
                    {formatBRL(s.resultadoMedio)}
                  </td>
                </tr>
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

      {/* ── Mobile Cards (shown only below md) ── */}
      <div className="md:hidden space-y-3">
        {performanceData.map(s => {
          const pos = s.resultado >= 0;
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="font-black text-white font-mono tracking-widest text-sm">{s.placa}</span>
                </div>
                <div className="flex items-center gap-2">
                  <OpBadge nome={s.operacao} />
                  <span className="text-[10px] text-violet-300 font-bold">{s.dias}d</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs text-slate-500 font-medium">Faturamento</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatBRL(s.faturamento)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Abast.',  value: s.abastecimento, color: 'text-amber-600'  },
                    { label: 'Salário', value: s.salario,       color: 'text-blue-600'   },
                    { label: 'Manut.',  value: s.manutencao,    color: 'text-purple-600' },
                    { label: 'Pedágio', value: s.pedagio,       color: 'text-orange-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">{item.label}</p>
                      <p className={`font-semibold text-xs ${item.color}`}>{formatBRL(item.value)}</p>
                      <p className={`text-[9px] font-bold ${item.color} opacity-70`}>{pct(item.value, s.faturamento)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Resultado</p>
                    <p className={`text-xl font-black ${pos ? 'text-indigo-700' : 'text-rose-600'}`}>{formatBRL(s.resultado)}</p>
                    <p className={`text-[10px] font-black ${pos ? 'text-emerald-600' : 'text-rose-500'}`}>{s.margem.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Méd./30d</p>
                    <p className={`font-bold text-sm ${s.resultadoMedio >= 0 ? 'text-teal-700' : 'text-rose-500'}`}>
                      {formatBRL(s.resultadoMedio)}
                    </p>
                    {s.dataInicio && (
                      <p className="text-[9px] text-slate-400 mt-0.5">desde {s.dataInicio.split('-').reverse().join('/')}</p>
                    )}
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
