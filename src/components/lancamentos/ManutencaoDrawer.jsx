import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export function ManutencaoDrawer({ open, onClose, onSave, initial }) {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().slice(0, 10),
    comp: '',
    documento: '',
    parceiro: '',
    historico: '',
    placa: '',
    km: '',
    quantidade: '',
    codigo: '65',
    conta: 'MANUTENÇÃO CAVALO',
    valor: ''
  });

  useEffect(() => {
    if (initial) {
      setFormData({
        data: initial.data || '',
        comp: initial.comp || '',
        documento: initial.documento || '',
        parceiro: initial.parceiro || '',
        historico: initial.historico || '',
        placa: initial.placa || '',
        km: initial.km || '',
        quantidade: initial.quantidade || '',
        codigo: initial.codigo || '65',
        conta: initial.conta || '',
        valor: initial.valor || ''
      });
    } else {
      setFormData({
        data: new Date().toISOString().slice(0, 10),
        comp: '',
        documento: '',
        parceiro: '',
        historico: '',
        placa: '',
        km: '',
        quantidade: '',
        codigo: '65',
        conta: 'MANUTENÇÃO CAVALO',
        valor: ''
      });
    }
  }, [initial, open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{initial ? 'Editar Manutenção' : 'Nova Manutenção'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.data} onChange={(e) => setFormData(f => ({ ...f, data: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.placa} onChange={(e) => setFormData(f => ({ ...f, placa: e.target.value.toUpperCase() }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Documento</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.documento} onChange={(e) => setFormData(f => ({ ...f, documento: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parceiro/Oficina</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.parceiro} onChange={(e) => setFormData(f => ({ ...f, parceiro: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Histórico</label>
            <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={2} value={formData.historico} onChange={(e) => setFormData(f => ({ ...f, historico: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">KM</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.km} onChange={(e) => setFormData(f => ({ ...f, km: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.quantidade} onChange={(e) => setFormData(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label>
            <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.valor} onChange={(e) => setFormData(f => ({ ...f, valor: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cód. Plano</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.codigo} onChange={(e) => setFormData(f => ({ ...f, codigo: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Conta</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formData.conta} onChange={(e) => setFormData(f => ({ ...f, conta: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={() => onSave(formData)} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg">
            <Save size={18} /> Salvar Manutenção
          </button>
        </div>
      </div>
    </>
  );
}
