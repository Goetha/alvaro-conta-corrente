import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useParceiros } from '@/hooks/useParceiros';
import { useVeiculos } from '@/hooks/useVeiculos';

const emptyForm = {
  data_emissao: '',
  data_pagamento: '',
  data_vencimento: '',
  documento: '',
  fornecedor: '',
  observacao: '',
  placa: '',
  km: '',
  quantidade: '',
  valor_a_pagar: '',
  valor_unitario: '',
  valor_pago: '',
};

export function DieselDrawer({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm);
  const { data: parceiros = [] } = useParceiros();
  const { data: veiculos = [] } = useVeiculos();

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...emptyForm, ...initial });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setForm({ ...emptyForm, data_emissao: today });
      }
    }
  }, [open, initial]);

  function set(field, value) {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      
      // Auto-calculate unit price if paying and qty are present
      if (field === 'valor_a_pagar' || field === 'quantidade') {
        const pag = field === 'valor_a_pagar' ? Number(value) : Number(prev.valor_a_pagar);
        const qty = field === 'quantidade' ? Number(value) : Number(prev.quantidade);
        if (pag && qty) {
          newForm.valor_unitario = (pag / qty).toFixed(3);
        }
      }
      
      return newForm;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      km: form.km ? Number(form.km) : null,
      quantidade: form.quantidade ? Number(form.quantidade) : null,
      valor_a_pagar: form.valor_a_pagar ? Number(form.valor_a_pagar) : 0,
      valor_unitario: form.valor_unitario ? Number(form.valor_unitario) : 0,
      valor_pago: form.valor_pago ? Number(form.valor_pago) : 0,
      data_pagamento: form.data_pagamento || null,
      data_vencimento: form.data_vencimento || null,
    };
    onSave(payload);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">
            {initial ? 'Editar Registro Diesel' : 'Novo Registro Diesel'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Data Emissão *</label>
              <input type="date" required value={form.data_emissao} onChange={(e) => set('data_emissao', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Data Vencimento</label>
              <input type="date" value={form.data_vencimento} onChange={(e) => set('data_vencimento', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Data Pagamento</label>
              <input type="date" value={form.data_pagamento} onChange={(e) => set('data_pagamento', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Documento</label>
              <input type="text" value={form.documento} onChange={(e) => set('documento', e.target.value)} placeholder="Ex: NF-123" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fornecedor (Posto)</label>
            <select value={form.fornecedor} onChange={(e) => set('fornecedor', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">— Selecionar —</option>
              {parceiros.filter(p => p.tipo !== 'cliente').map((p) => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Observação</label>
            <input type="text" value={form.observacao} onChange={(e) => set('observacao', e.target.value)} placeholder="Obs. adicional" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Placa</label>
              <select value={form.placa} onChange={(e) => set('placa', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">—</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.placa}>{v.placa}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">KM</label>
              <input type="number" value={form.km} onChange={(e) => set('km', e.target.value)} placeholder="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade (L)</label>
              <input type="number" step="0.01" value={form.quantidade} onChange={(e) => set('quantidade', e.target.value)} placeholder="0,00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-red-600 mb-1">R$ A Pagar</label>
              <input type="number" step="0.01" value={form.valor_a_pagar} onChange={(e) => set('valor_a_pagar', e.target.value)} placeholder="0,00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">R$ Unit.</label>
              <input type="number" step="0.001" value={form.valor_unitario} onChange={(e) => set('valor_unitario', e.target.value)} placeholder="0,000" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-600 mb-1">R$ Pago</label>
              <input type="number" step="0.01" value={form.valor_pago} onChange={(e) => set('valor_pago', e.target.value)} placeholder="0,00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50" />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            {initial ? 'Salvar Alterações' : 'Criar Registro'}
          </button>
        </div>
      </div>
    </>
  );
}
