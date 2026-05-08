import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLancamentos, useUpdateLancamento } from '@/hooks/useLancamentos';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatBRL, formatDate } from '@/lib/formatters';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, TrendingUp, TrendingDown, Info, Check } from 'lucide-react';

function Badge({ ok }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
      <CheckCircle size={11} /> OK
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
      <AlertTriangle size={11} /> Diferença
    </span>
  );
}

function ContaItem({ conta, total, maxTotal }) {
  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  const isReceita = conta.tipo === 'receita';
  return (
    <div className="py-2.5 px-4 hover:bg-slate-50 transition-colors rounded-lg">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{conta.codigo}</span>
          <span className="text-sm text-slate-700 font-medium">{conta.nome}</span>
        </div>
        <span className={`text-sm font-bold ${isReceita ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatBRL(total)}
        </span>
      </div>
      {total > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${isReceita ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ErrorTable({ items, columns, onAction }) {
  if (!items.length) return null;
  return (
    <div className="overflow-x-auto mt-3 rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left text-slate-500 font-semibold uppercase">{c}</th>
            ))}
            {onAction && <th className="px-3 py-2 text-right text-slate-500 font-semibold uppercase">Status</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v], j) => (
                <td key={j} className="px-3 py-2 text-slate-700">{v}</td>
              ))}
              {onAction && (
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end">
                    <button
                      onClick={() => onAction(row.id)}
                      className="group relative inline-flex h-5 w-9 items-center rounded-full bg-red-500 transition-all focus:outline-none hover:bg-emerald-600"
                      title="Conciliar agora"
                    >
                      <span className="translate-x-1 inline-block h-3 w-3 transform rounded-full bg-white transition-all group-hover:translate-x-5" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErrorSection({ title, icon: Icon, iconColor, items, columns, navigate, onAction }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColor} />
          <h4 className="font-medium text-slate-700 text-xs uppercase tracking-wide">{title}</h4>
          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{items.length}</span>
        </div>
        <button
          onClick={() => navigate('/lancamentos')}
          className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold hover:underline"
        >
          Corrigir Agora <ArrowRight size={10} />
        </button>
      </div>
      <ErrorTable items={items} columns={columns} onAction={onAction} />
    </div>
  );
}

export default function PlanoConferencia() {
  const navigate = useNavigate();
  const { data: lancamentos = [], isLoading: loadingLanc } = useLancamentos();
  const { data: planoContas = [], isLoading: loadingPC } = usePlanoContas();
  const updateMutation = useUpdateLancamento();

  async function handleConciliate(id) {
    if (window.confirm('TEM CERTEZA? \n\nEsta ação marca o lançamento como conferido e o remove desta lista. Fazer isso sem conferência física pode comprometer a integridade do saldo real.')) {
      try {
        await updateMutation.mutateAsync({ id, conciliado: true });
      } catch (err) {
        alert('Erro ao conciliar: ' + err.message);
      }
    }
  }

  // 1. Lógica do Plano de Contas (Breakdown por código)
  const totaisPorCodigo = useMemo(() => {
    const mapa = {};
    lancamentos.forEach((l) => {
      if (l.codigo) {
        if (!mapa[l.codigo]) mapa[l.codigo] = { receita: 0, despesa: 0 };
        mapa[l.codigo].receita += l.receita || 0;
        mapa[l.codigo].despesa += l.despesa || 0;
      }
    });
    return mapa;
  }, [lancamentos]);

  const receitas = useMemo(() => planoContas.filter((p) => p.tipo === 'receita').sort((a, b) => Number(a.codigo) - Number(b.codigo)), [planoContas]);
  const despesas = useMemo(() => planoContas.filter((p) => p.tipo === 'despesa').sort((a, b) => Number(a.codigo) - Number(b.codigo)), [planoContas]);

  const receitasAtivas = useMemo(() => receitas
    .filter(p => (totaisPorCodigo[p.codigo]?.receita || 0) > 0)
    .sort((a, b) => (totaisPorCodigo[b.codigo]?.receita || 0) - (totaisPorCodigo[a.codigo]?.receita || 0)), 
  [receitas, totaisPorCodigo]);

  const despesasAtivas = useMemo(() => despesas
    .filter(p => (totaisPorCodigo[p.codigo]?.despesa || 0) > 0)
    .sort((a, b) => (totaisPorCodigo[b.codigo]?.despesa || 0) - (totaisPorCodigo[a.codigo]?.despesa || 0)), 
  [despesas, totaisPorCodigo]);

  const maxReceita = Math.max(...receitas.map((p) => totaisPorCodigo[p.codigo]?.receita || 0), 0);
  const maxDespesa = Math.max(...despesas.map((p) => totaisPorCodigo[p.codigo]?.despesa || 0), 0);

  // 2. Lógica de Conferência e Erros
  const analise = useMemo(() => {
    const codigosReceita = new Set(receitas.map((p) => p.codigo));
    const coigosDespesa = new Set(despesas.map((p) => p.codigo));

    const receitasCC = lancamentos.reduce((s, l) => s + (l.receita || 0), 0);
    const despesasCC = lancamentos.reduce((s, l) => s + (l.despesa || 0), 0);

    const receitasPC = lancamentos.filter((l) => l.codigo && codigosReceita.has(l.codigo)).reduce((s, l) => s + (l.receita || 0), 0);
    const despesasPC = lancamentos.filter((l) => l.codigo && coigosDespesa.has(l.codigo)).reduce((s, l) => s + (l.despesa || 0), 0);

    const difReceitas = receitasCC - receitasPC;
    const difDespesas = despesasCC - despesasPC;

    // Erros agrupados
    const errosReceita = {
      semClassificacao: lancamentos.filter((l) => l.receita > 0 && (!l.codigo || !codigosReceita.has(l.codigo))),
      naoConciliados: lancamentos.filter((l) => l.receita > 0 && !l.conciliado)
    };

    const errosDespesa = {
      semClassificacao: lancamentos.filter((l) => l.despesa > 0 && (!l.codigo || !coigosDespesa.has(l.codigo))),
      naoConciliados: lancamentos.filter((l) => l.despesa > 0 && !l.conciliado)
    };

    const pendenciasGerais = {
      semConta: lancamentos.filter((l) => !l.conta),
      semCodigoGeral: lancamentos.filter((l) => !l.codigo),
    };

    // Possíveis duplicados
    const mapaDup = {};
    lancamentos.forEach((l) => {
      const p = (l.placa || '').trim().toUpperCase();
      const h = (l.historico || '').trim().toLowerCase();
      const n = (l.numero || '').trim().toLowerCase();
      const c = (l.comp || '').trim().toLowerCase();
      const key = `${l.parceiro}|${l.receita}|${l.despesa}|${l.data}|${p}|${h}|${n}|${c}`;
      if (!mapaDup[key]) mapaDup[key] = [];
      mapaDup[key].push(l);
    });
    const duplicados = Object.values(mapaDup).filter((g) => g.length > 1).flat();

    const totalPendencias = 
      errosReceita.semClassificacao.length + errosReceita.naoConciliados.length +
      errosDespesa.semClassificacao.length + errosDespesa.naoConciliados.length +
      pendenciasGerais.semConta.length + duplicados.length;

    return {
      receitasCC, despesasCC, receitasPC, despesasPC, difReceitas, difDespesas, totalPendencias,
      errosReceita, errosDespesa, pendenciasGerais, duplicados
    };
  }, [lancamentos, receitas, despesas]);

  const tudo_ok = analise.difReceitas === 0 && analise.difDespesas === 0 && analise.totalPendencias === 0;

  if (loadingLanc || loadingPC) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Plano de Contas & Conferência</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão unificada das classificações e divergências</p>
      </div>

      {/* 1. Banner Global */}
      {tudo_ok ? (
        <div className="flex items-center gap-3 bg-emerald-500 text-white rounded-xl px-5 py-4 shadow-md">
          <CheckCircle size={24} />
          <div>
            <p className="font-bold text-base">Contabilidade em dia!</p>
            <p className="text-emerald-100 text-sm">Nenhuma divergência encontrada. Lançamentos batem com o Plano de Contas.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4">
          <AlertTriangle size={24} className="text-amber-500" />
          <div>
            <p className="font-bold text-sm">Existem pendências a serem resolvidas</p>
            <p className="text-amber-700 text-xs">Total de {analise.totalPendencias} itens que precisam de atenção. Veja os detalhes abaixo nas seções correspondentes.</p>
          </div>
        </div>
      )}

      {/* 2. RECEITAS e DESPESAS (Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* BLOCO RECEITAS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header Receitas */}
          <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-emerald-800">Receitas</h2>
            </div>
            <Badge ok={analise.difReceitas === 0} />
          </div>

          <div className="p-5 flex-1">
            {/* Totais Comparativos Receitas */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Conta Corrente (Real)</p>
                <p className="text-base font-bold text-slate-700">{formatBRL(analise.receitasCC)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Plano (Classificado)</p>
                <p className="text-base font-bold text-slate-700">{formatBRL(analise.receitasPC)}</p>
              </div>
              <div className={`rounded-lg p-3 border ${analise.difReceitas === 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50 border-amber-200'}`}>
                <p className={`text-[10px] uppercase font-bold mb-1 ${analise.difReceitas === 0 ? 'text-emerald-500' : 'text-amber-600'}`}>Diferença</p>
                <p className={`text-base font-bold ${analise.difReceitas === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{formatBRL(analise.difReceitas)}</p>
              </div>
            </div>

            {/* Lista do Plano de Contas */}
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Composição (Plano de Contas)</h3>
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
              {receitasAtivas.map((p) => (
                <ContaItem key={p.id} conta={p} total={totaisPorCodigo[p.codigo]?.receita || 0} maxTotal={maxReceita} />
              ))}
              {receitasAtivas.length === 0 && (
                <p className="text-sm text-slate-400 py-3 px-4">Nenhuma receita classificada.</p>
              )}
            </div>

            {/* Erros de Receita */}
            {(analise.errosReceita.semClassificacao.length > 0 || analise.errosReceita.naoConciliados.length > 0) && (
              <div className="mt-2">
                <ErrorSection
                  title="Sem Classificação no Plano"
                  icon={AlertTriangle} iconColor="text-amber-500" navigate={navigate}
                  items={analise.errosReceita.semClassificacao.map((l) => ({ Data: formatDate(l.data), Parceiro: l.parceiro || '-', 'Conta Bancária': l.conta || '-', Valor: formatBRL(l.receita) }))}
                  columns={['Data', 'Parceiro', 'Conta Bancária', 'Valor']}
                />
                <ErrorSection
                  title="Não Conciliados"
                  icon={XCircle} iconColor="text-red-500" navigate={navigate}
                  items={analise.errosReceita.naoConciliados.map((l) => ({ id: l.id, Data: formatDate(l.data), Parceiro: l.parceiro || '-', 'Conta Bancária': l.conta || '-', Valor: formatBRL(l.receita) }))}
                  columns={['Data', 'Parceiro', 'Conta Bancária', 'Valor']}
                  onAction={handleConciliate}
                />
              </div>
            )}
          </div>
        </div>

        {/* BLOCO DESPESAS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header Despesas */}
          <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={20} className="text-red-600" />
              <h2 className="text-lg font-bold text-red-800">Despesas</h2>
            </div>
            <Badge ok={analise.difDespesas === 0} />
          </div>

          <div className="p-5 flex-1">
            {/* Totais Comparativos Despesas */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Conta Corrente (Real)</p>
                <p className="text-base font-bold text-slate-700">{formatBRL(analise.despesasCC)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Plano (Classificado)</p>
                <p className="text-base font-bold text-slate-700">{formatBRL(analise.despesasPC)}</p>
              </div>
              <div className={`rounded-lg p-3 border ${analise.difDespesas === 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50 border-amber-200'}`}>
                <p className={`text-[10px] uppercase font-bold mb-1 ${analise.difDespesas === 0 ? 'text-emerald-500' : 'text-amber-600'}`}>Diferença</p>
                <p className={`text-base font-bold ${analise.difDespesas === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{formatBRL(analise.difDespesas)}</p>
              </div>
            </div>

            {/* Lista do Plano de Contas */}
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Composição (Plano de Contas)</h3>
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
              {despesasAtivas.map((p) => (
                <ContaItem key={p.id} conta={p} total={totaisPorCodigo[p.codigo]?.despesa || 0} maxTotal={maxDespesa} />
              ))}
              {despesasAtivas.length === 0 && (
                <p className="text-sm text-slate-400 py-3 px-4">Nenhuma despesa classificada.</p>
              )}
            </div>

            {/* Erros de Despesa */}
            {(analise.errosDespesa.semClassificacao.length > 0 || analise.errosDespesa.naoConciliados.length > 0) && (
              <div className="mt-2">
                <ErrorSection
                  title="Sem Classificação no Plano"
                  icon={AlertTriangle} iconColor="text-amber-500" navigate={navigate}
                  items={analise.errosDespesa.semClassificacao.map((l) => ({ Data: formatDate(l.data), Parceiro: l.parceiro || '-', 'Conta Bancária': l.conta || '-', Valor: formatBRL(l.despesa) }))}
                  columns={['Data', 'Parceiro', 'Conta Bancária', 'Valor']}
                />
                <ErrorSection
                  title="Não Conciliados"
                  icon={XCircle} iconColor="text-red-500" navigate={navigate}
                  items={analise.errosDespesa.naoConciliados.map((l) => ({ id: l.id, Data: formatDate(l.data), Parceiro: l.parceiro || '-', 'Conta Bancária': l.conta || '-', Valor: formatBRL(l.despesa) }))}
                  columns={['Data', 'Parceiro', 'Conta Bancária', 'Valor']}
                  onAction={handleConciliate}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PENDÊNCIAS GERAIS (Só aparece se houver) */}
      {(analise.pendenciasGerais.semConta.length > 0 || analise.duplicados.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Info size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800">Outras Pendências Gerais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ErrorSection
              title="Lançamentos sem conta bancária"
              icon={AlertTriangle} iconColor="text-amber-500" navigate={navigate}
              items={analise.pendenciasGerais.semConta.map((l) => ({ Data: formatDate(l.data), Histórico: l.historico || '-', Valor: l.receita > 0 ? formatBRL(l.receita) : formatBRL(l.despesa) }))}
              columns={['Data', 'Histórico', 'Valor']}
            />
            <ErrorSection
              title="Possíveis duplicados"
              icon={AlertTriangle} iconColor="text-amber-500" navigate={navigate}
              items={analise.duplicados.map((l) => ({ Data: formatDate(l.data), Parceiro: l.parceiro || '-', Valor: l.receita > 0 ? formatBRL(l.receita) : formatBRL(l.despesa) }))}
              columns={['Data', 'Parceiro', 'Valor']}
            />
          </div>
        </div>
      )}
    </div>
  );
}
