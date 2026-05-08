import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useLancamentos } from '@/hooks/useLancamentos';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatBRL } from '@/lib/formatters';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tabs = [
  { id: 'fluxo', label: 'Fluxo de Caixa' },
  { id: 'despesas-veiculo', label: 'Despesas/Veículo' },
  { id: 'receitas-cliente', label: 'Receitas/Cliente' },
  { id: 'diesel-placa', label: 'Diesel/Placa' },
  { id: 'ranking', label: 'Ranking de Gastos' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatBRL(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

function RankingTable({ data, col1, col2, colorClass = 'text-red-600' }) {
  if (!data.length) return <p className="text-center text-slate-400 py-8 text-sm">Nenhum dado disponível</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{col1}</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{col2}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
              <td className="px-4 py-3 text-slate-700 font-medium">{row.label}</td>
              <td className={`px-4 py-3 text-right font-bold ${colorClass}`}>{formatBRL(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState('fluxo');
  const { data: lancamentos = [] } = useLancamentos();
  const { data: planoContas = [] } = usePlanoContas();

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
      if (l.placa && l.despesa > 0) {
        mapa[l.placa] = (mapa[l.placa] || 0) + l.despesa;
      }
    });
    return Object.entries(mapa).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [lancamentos]);

  // Receitas por cliente
  const receitasCliente = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.parceiro && l.receita > 0) {
        mapa[l.parceiro] = (mapa[l.parceiro] || 0) + l.receita;
      }
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
      if (l.placa && l.despesa > 0 && l.codigo && codigosDiesel.has(l.codigo)) {
        mapa[l.placa] = (mapa[l.placa] || 0) + l.despesa;
      }
    });
    return Object.entries(mapa).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [lancamentos, codigosDiesel]);

  // Ranking de gastos por categoria
  const ranking = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.codigo && l.despesa > 0) {
        const pc = planoContas.find((p) => p.codigo === l.codigo);
        const label = pc ? `${l.codigo} — ${pc.nome}` : l.codigo;
        mapa[label] = (mapa[label] || 0) + l.despesa;
      }
    });
    return Object.entries(mapa).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [lancamentos, planoContas]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Análises e rankings financeiros</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-fit px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === t.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {activeTab === 'fluxo' && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4">Fluxo de Caixa — Últimos 12 Meses</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'despesas-veiculo' && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4">Despesas por Veículo</h2>
            <RankingTable data={despesasVeiculo} col1="Placa" col2="Total Despesas" colorClass="text-red-600" />
          </div>
        )}

        {activeTab === 'receitas-cliente' && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4">Receitas por Cliente</h2>
            <RankingTable data={receitasCliente} col1="Parceiro" col2="Total Receitas" colorClass="text-emerald-600" />
          </div>
        )}

        {activeTab === 'diesel-placa' && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4">Gasto em Diesel por Placa</h2>
            <RankingTable data={dieselPlaca} col1="Placa" col2="Total Diesel" colorClass="text-orange-600" />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-4">Ranking de Gastos por Categoria</h2>
            <RankingTable data={ranking} col1="Categoria" col2="Total Despesas" colorClass="text-red-600" />
          </div>
        )}
      </div>
    </div>
  );
}
