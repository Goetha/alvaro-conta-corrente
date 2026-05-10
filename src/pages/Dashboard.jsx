import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import { useLancamentos } from '@/hooks/useLancamentos';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { StatCard } from '@/components/shared/StatCard';
import { formatBRL, currentMonthRange } from '@/lib/formatters';
import { DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DreDashboard } from '@/components/DreDashboard';

function formatBRLShort(value) {
  if (Math.abs(value) >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`;
  }
  return formatBRL(value);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatBRL(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: lancamentos = [], isLoading } = useLancamentos();
  const { data: planoContas = [] } = usePlanoContas();
  const { start: mesStart, end: mesEnd } = currentMonthRange();

  // Métricas do mês atual
  const metricas = useMemo(() => {
    const doMes = lancamentos.filter((l) => l.data >= mesStart && l.data <= mesEnd);
    const receitasMes = doMes.reduce((s, l) => s + (l.receita || 0), 0);
    const despesasMes = doMes.reduce((s, l) => s + (l.despesa || 0), 0);
    const saldoTotal = lancamentos.reduce((s, l) => s + (l.receita || 0) - (l.despesa || 0), 0);
    const divergencias = lancamentos.filter((l) => !l.codigo || !l.conciliado).length;
    return { receitasMes, despesasMes, saldoTotal, divergencias, resultado: receitasMes - despesasMes };
  }, [lancamentos, mesStart, mesEnd]);

  // Dados dos últimos 6 meses (barras)
  const ultimos6Meses = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(hoje, 5 - i);
      const inicio = format(startOfMonth(d), 'yyyy-MM-dd');
      const fim = format(endOfMonth(d), 'yyyy-MM-dd');
      const mesLanc = lancamentos.filter((l) => l.data >= inicio && l.data <= fim);
      return {
        mes: format(d, 'MMM/yy', { locale: ptBR }),
        Receitas: mesLanc.reduce((s, l) => s + (l.receita || 0), 0),
        Despesas: mesLanc.reduce((s, l) => s + (l.despesa || 0), 0),
      };
    });
  }, [lancamentos]);

  // Ranking de despesas por categoria (barras do dashboard)
  const rankingDespesas = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.codigo && l.despesa > 0) {
        const pc = planoContas.find((p) => p.codigo === l.codigo);
        const nome = pc ? `${l.codigo} - ${pc.nome}` : l.codigo;
        mapa[nome] = (mapa[nome] || 0) + l.despesa;
      }
    });
    return Object.entries(mapa)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [lancamentos, planoContas]);

  // ── Dados de Relatórios ──────────────────────────────────────────────────────

  // Fluxo de caixa — últimos 12 meses
  const fluxoCaixa = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(hoje, 11 - i);
      const inicio = format(startOfMonth(d), 'yyyy-MM-dd');
      const fim = format(endOfMonth(d), 'yyyy-MM-dd');
      const mes = lancamentos.filter((l) => l.data >= inicio && l.data <= fim);
      const rec = mes.reduce((s, l) => s + (l.receita || 0), 0);
      const desp = mes.reduce((s, l) => s + (l.despesa || 0), 0);
      return { mes: format(d, 'MMM/yy', { locale: ptBR }), Receitas: rec, Despesas: desp, Saldo: rec - desp };
    });
  }, [lancamentos]);

  // Despesas por veículo
  const despesasVeiculo = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.placa && l.despesa > 0) mapa[l.placa] = (mapa[l.placa] || 0) + l.despesa;
    });
    return Object.entries(mapa).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [lancamentos]);

  // Receitas por cliente
  const receitasCliente = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.parceiro && l.receita > 0) mapa[l.parceiro] = (mapa[l.parceiro] || 0) + l.receita;
    });
    return Object.entries(mapa).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [lancamentos]);

  // Diesel por placa
  const codigosDiesel = useMemo(() => {
    return new Set(planoContas.filter((p) => p.nome.toUpperCase().includes('DIESEL')).map((p) => p.codigo));
  }, [planoContas]);

  const dieselPlaca = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.placa && l.despesa > 0 && l.codigo && codigosDiesel.has(l.codigo))
        mapa[l.placa] = (mapa[l.placa] || 0) + l.despesa;
    });
    return Object.entries(mapa).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [lancamentos, codigosDiesel]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão geral financeira</p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-xs font-semibold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {mesAtual}
        </span>
      </div>

      <div className="flex flex-col gap-8 mt-6">
        {/* DRE e Conferência inseridos no topo da Visão Geral */}
        <div className="w-full">
          <DreDashboard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Fluxo de Caixa - Principal Termômetro */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {/* Saldo Atual */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <DollarSign size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Atual</p>
              <p className="text-2xl font-black text-slate-800">{formatBRL(metricas.saldoTotal)}</p>
            </div>

            {/* Entradas */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Entradas (Mês)</p>
              <p className="text-2xl font-black text-slate-800">{formatBRL(metricas.receitasMes)}</p>
            </div>

            {/* Saídas */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                  <TrendingDown size={20} className="text-red-600" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saídas (Mês)</p>
              <p className="text-2xl font-black text-slate-800">{formatBRL(metricas.despesasMes)}</p>
            </div>

            {/* Resultado */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Activity size={20} className="text-slate-600" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resultado (Mês)</p>
              <p className="text-2xl font-black text-slate-800">{formatBRL(metricas.resultado)}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={fluxoCaixa} margin={{top:10, right:20, left:0, bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight:600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569', fontWeight:600 }} axisLine={false} tickLine={false} width={80} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{stroke:'rgba(148,163,184,0.1)', strokeWidth:2}} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight:600 }} />
              <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth:2 }} activeDot={{r:6}} />
              <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth:2 }} activeDot={{r:6}} />
              <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* === COLUNA ESQUERDA === */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 2. Receitas por Cliente */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Receitas por Cliente</h2>
                <p className="text-xs text-slate-400 mt-0.5">Distribuição de faturamento por parceiro</p>
              </div>
            </div>
            {(() => {
              const BAR_COLORS = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#0ea5e9'];
              const top = receitasCliente.slice(0, 8);
              const outrosVal = receitasCliente.slice(8).reduce((s,d)=>s+d.value,0);
              const data = outrosVal > 0 ? [...top, {label:'Outros', value: outrosVal}] : top;
              if (data.length === 0) return <div className="flex justify-center items-center h-48 text-slate-400 text-sm">Nenhum dado disponível</div>;
              const total = data.reduce((s,d)=>s+d.value,0);
              const maxVal = Math.max(...data.map(d=>d.value));
              
              return (
                <div className="flex flex-col gap-5 mt-2">
                  {data.map((d, i) => {
                    const pctVisual = ((d.value / maxVal) * 100).toFixed(0);
                    const pctReal = ((d.value / total) * 100).toFixed(1);
                    const color = BAR_COLORS[i % BAR_COLORS.length];
                    return (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{background: color}} />
                            <span className="text-sm font-bold text-slate-700">{d.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-800">{formatBRL(d.value)}</span>
                            <span className="text-xs font-bold text-slate-400 w-10 text-right">{pctReal}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${pctVisual}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 6. Gasto em Diesel por Placa */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Diesel por Placa</h2>
                <p className="text-xs text-slate-400 mt-0.5">Maiores consumidores da frota</p>
              </div>
            </div>
            {(() => {
              const FUEL_COLORS = ['#f59e0b','#f97316','#ef4444','#dc2626','#b91c1c','#ea580c','#d97706'];
              const top = dieselPlaca.slice(0, 7);
              if(top.length===0) return <div className="flex justify-center h-32 items-center text-slate-400 text-sm">Sem dados</div>;
              const maxVal = top[0]?.value || 1;
              return (
                <div className="flex flex-col gap-4">
                  {top.map((d, i) => {
                    const pct = ((d.value / maxVal) * 100).toFixed(0);
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm" style={{background: FUEL_COLORS[i]}}>{i+1}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="text-sm font-bold text-slate-700">{d.label}</span>
                            <span className="text-sm font-black" style={{color: FUEL_COLORS[i]}}>{formatBRL(d.value)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: FUEL_COLORS[i]}} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* === COLUNA DIREITA === */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 3. Receitas × Despesas */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Receitas × Despesas</h2>
                <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />Receitas</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" />Despesas</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ultimos6Meses} barGap={6} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight:600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatBRLShort} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<CustomTooltip />} cursor={{fill:'rgba(148,163,184,0.08)'}} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[6,6,0,0]} maxBarSize={48} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[6,6,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 4. Maiores Despesas por Categoria */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Maiores Despesas por Categoria</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Distribuição percentual</p>
                </div>
                {rankingDespesas[0] && (
                  <span className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full border border-red-100">
                    Top {rankingDespesas.length}
                  </span>
                )}
              </div>
              {(() => {
                const BAR_COLORS = ['#dc2626','#b91c1c','#ef4444','#f97316','#eab308','#7c3aed','#0284c7','#0d9488'];
                if (rankingDespesas.length === 0) return <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Nenhum dado disponível</div>;
                const total = rankingDespesas.reduce((s, d) => s + d.value, 0);
                const maxVal = Math.max(...rankingDespesas.map(d=>d.value));
                
                return (
                  <div className="flex flex-col gap-5 mt-2">
                    {rankingDespesas.map((d, i) => {
                      const pctVisual = ((d.value / maxVal) * 100).toFixed(0);
                      const pctReal = ((d.value / total) * 100).toFixed(1);
                      const color = BAR_COLORS[i % BAR_COLORS.length];
                      return (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{background: color}} />
                              <span className="text-sm font-bold text-slate-700">{d.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-slate-800">{formatBRL(d.value)}</span>
                              <span className="text-xs font-bold text-slate-400 w-10 text-right">{pctReal}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${pctVisual}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="w-full flex justify-between items-center mt-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-bold text-slate-600">Total geral</span>
                      <span className="text-lg font-black text-slate-800">{formatBRL(total)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 5. Despesas por Veículo */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Despesas por Veículo</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Top veículos com maior custo</p>
                </div>
              </div>
              {(() => {
                const top = despesasVeiculo.slice(0, 10);
                if(top.length===0) return <div className="flex justify-center h-32 items-center text-slate-400 text-sm">Sem dados</div>;
                const BAR_COLORS = ['#dc2626','#e03434','#e44545','#ea5454','#ef6363','#f37272','#f78181','#fb9090','#fda0a0','#feb0b0'];
                return (
                  <ResponsiveContainer width="100%" height={top.length * 40 + 20}>
                    <BarChart data={top.map((d,i)=>({...d, fill: BAR_COLORS[i]}))} layout="vertical" margin={{left:0,right:50,top:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatBRLShort} tick={{fontSize:10,fill:'#94a3b8',fontWeight:600}} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="label" width={80} tick={{fontSize:11,fill:'#374151',fontWeight:700}} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v)=>[formatBRL(v),'Despesa']} contentStyle={{fontSize:12,borderRadius:8,border:'1px solid #e2e8f0',fontWeight:600}} cursor={{fill:'rgba(148,163,184,0.06)'}} />
                      <Bar dataKey="value" radius={[0,4,4,0]} label={{position:'right',formatter:formatBRLShort,fontSize:10,fill:'#475569',fontWeight:800}} barSize={20}>
                        {top.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
