import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useParceiros } from '@/hooks/useParceiros';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useBancos } from '@/hooks/useBancos';
import { usePlanoContas } from '@/hooks/usePlanoContas';

const emptyForm = {
  data: '',
  comp: '',
  numero: '',
  parceiro: '',
  historico: '',
  placa: '',
  km: '',
  qtdade: '',
  codigo: '',
  conta: '',
  receita: '',
  despesa: '',
  conciliado: false,
  tipo: 'despesa',
};

export function LancamentoDrawer({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm);
  const { data: parceiros = [] } = useParceiros();
  const { data: veiculos = [] } = useVeiculos();
  const { data: bancos = [] } = useBancos();
  const { data: planoContas = [] } = usePlanoContas();

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...emptyForm, ...initial });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const comp = today.slice(0, 7);
        setForm({ ...emptyForm, data: today, comp });
      }
    }
  }, [open, initial]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleReceita(val) {
    setForm((prev) => ({ ...prev, receita: val, despesa: val ? '' : prev.despesa, tipo: val ? 'receita' : prev.tipo }));
  }

  function handleDespesa(val) {
    setForm((prev) => ({ ...prev, despesa: val, receita: val ? '' : prev.receita, tipo: val ? 'despesa' : prev.tipo }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      km: form.km ? Number(form.km) : null,
      qtdade: form.qtdade ? Number(form.qtdade) : null,
      receita: form.receita ? Number(form.receita) : 0,
      despesa: form.despesa ? Number(form.despesa) : 0,
    };
    onSave(payload);
  }

  if (!open) return null;

  const receitas = planoContas.filter((p) => p.tipo === 'receita');
  const despesas = planoContas.filter((p) => p.tipo === 'despesa');

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">
            {initial ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Data + Competência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Data *</label>
              <input
                type="date"
                required
                value={form.data}
                onChange={(e) => set('data', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Competência</label>
              <input
                type="month"
                value={form.comp}
                onChange={(e) => set('comp', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Nº Doc */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Documento</label>
            <input
              type="text"
              value={form.numero}
              onChange={(e) => set('numero', e.target.value)}
              placeholder="Ex: NF-001"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Parceiro */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Parceiro</label>
            <select
              value={form.parceiro}
              onChange={(e) => set('parceiro', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">— Selecionar —</option>
              {parceiros.map((p) => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Histórico */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Histórico</label>
            <input
              type="text"
              value={form.historico}
              onChange={(e) => set('historico', e.target.value)}
              placeholder="Descrição do lançamento"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Placa + KM + Qtde */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Placa</label>
              <select
                value={form.placa}
                onChange={(e) => set('placa', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">—</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.placa}>{v.placa}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">KM</label>
              <input
                type="number"
                value={form.km}
                onChange={(e) => set('km', e.target.value)}
                placeholder="0"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Qtde</label>
              <input
                type="number"
                value={form.qtdade}
                onChange={(e) => set('qtdade', e.target.value)}
                placeholder="0"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Código Plano de Contas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Código (Plano de Contas)</label>
            <select
              value={form.codigo}
              onChange={(e) => set('codigo', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">— Sem código —</option>
              <optgroup label="── Receitas ──">
                {receitas.map((p) => (
                  <option key={p.id} value={p.codigo}>{p.codigo} — {p.nome}</option>
                ))}
              </optgroup>
              <optgroup label="── Despesas ──">
                {despesas.map((p) => (
                  <option key={p.id} value={p.codigo}>{p.codigo} — {p.nome}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Conta Bancária */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Conta Bancária</label>
            <select
              value={form.conta}
              onChange={(e) => set('conta', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">— Sem conta —</option>
              {bancos.map((b) => (
                <option key={b.id} value={b.nome}>{b.nome}</option>
              ))}
            </select>
          </div>

          {/* Receita + Despesa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-600 mb-1">Receita (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.receita}
                onChange={(e) => handleReceita(e.target.value)}
                placeholder="0,00"
                className="w-full border-2 border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-red-600 mb-1">Despesa (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.despesa}
                onChange={(e) => handleDespesa(e.target.value)}
                placeholder="0,00"
                className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
              />
            </div>
          </div>

          {/* Conciliado */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('conciliado', !form.conciliado)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.conciliado ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.conciliado ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <label className="text-sm font-medium text-slate-700">
              {form.conciliado ? 'Conciliado ✅' : 'Pendente ❌'}
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {initial ? 'Salvar Alterações' : 'Criar Lançamento'}
          </button>
        </div>
      </div>
    </>
  );
}
