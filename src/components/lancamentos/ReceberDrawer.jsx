import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useParceiros } from '@/hooks/useParceiros';
import { useVeiculos } from '@/hooks/useVeiculos';

const emptyForm = {
  data: '',
  doc_magna: '',
  doc_riolog: '',
  pagador: '',
  cliente: '',
  placa: '',
  origem: '',
  destino: '',
  peso: '',
  data_vencimento: '',
  icms: '',
  seguro: '',
  valor_a_receber: '',
  valor_recebido: '',
  ajustes: '',
  data_recebimento: '',
};

export function ReceberDrawer({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm);
  const { data: parceiros = [] } = useParceiros();
  const { data: veiculos = [] } = useVeiculos();

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...emptyForm, ...initial });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setForm({ ...emptyForm, data: today });
      }
    }
  }, [open, initial]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      peso: form.peso ? Number(form.peso) : null,
      icms: form.icms ? Number(form.icms) : 0,
      seguro: form.seguro ? Number(form.seguro) : 0,
      valor_a_receber: form.valor_a_receber ? Number(form.valor_a_receber) : 0,
      valor_recebido: form.valor_recebido ? Number(form.valor_recebido) : 0,
      ajustes: form.ajustes ? Number(form.ajustes) : 0,
      data_vencimento: form.data_vencimento || null,
      data_recebimento: form.data_recebimento || null,
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
            {initial ? 'Editar Contas a Receber' : 'Novo Contas a Receber'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Data *</label>
              <input type="date" required value={form.data} onChange={(e) => set('data', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vencimento</label>
              <input type="date" value={form.data_vencimento} onChange={(e) => set('data_vencimento', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Doc Magna</label>
              <input type="text" value={form.doc_magna} onChange={(e) => set('doc_magna', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Doc Rio Log</label>
              <input type="text" value={form.doc_riolog} onChange={(e) => set('doc_riolog', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pagador</label>
              <input type="text" value={form.pagador} onChange={(e) => set('pagador', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cliente</label>
              <input type="text" value={form.cliente} onChange={(e) => set('cliente', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Placa</label>
              <select value={form.placa} onChange={(e) => set('placa', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">—</option>
                {veiculos.map((v) => <option key={v.id} value={v.placa}>{v.placa}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Origem</label>
              <input type="text" value={form.origem} onChange={(e) => set('origem', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Destino</label>
              <input type="text" value={form.destino} onChange={(e) => set('destino', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Peso</label>
              <input type="number" step="0.01" value={form.peso} onChange={(e) => set('peso', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ICMS (R$)</label>
              <input type="number" step="0.01" value={form.icms} onChange={(e) => set('icms', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Seguro (R$)</label>
              <input type="number" step="0.01" value={form.seguro} onChange={(e) => set('seguro', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-red-600 mb-1">R$ A Receber (S/ ICMS)</label>
              <input type="number" step="0.01" value={form.valor_a_receber} onChange={(e) => set('valor_a_receber', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">(-)Desc / (+)Acrés</label>
              <input type="number" step="0.01" value={form.ajustes} onChange={(e) => set('ajustes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-600 mb-1">R$ Recebido</label>
              <input type="number" step="0.01" value={form.valor_recebido} onChange={(e) => set('valor_recebido', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Data Recebimento</label>
            <input type="date" value={form.data_recebimento} onChange={(e) => set('data_recebimento', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            {initial ? 'Salvar Alterações' : 'Criar Lançamento'}
          </button>
        </div>
      </div>
    </>
  );
}
