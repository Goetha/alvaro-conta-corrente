import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function CustoCapitalDrawer({ open, onClose, onSave, initial }) {
  const [formData, setFormData] = useState({
    data_aporte: new Date().toISOString().split('T')[0],
    historico: '',
    valor_aporte: '',
    periodo_aporte: '',
    custo_capital: ''
  });

  useEffect(() => {
    if (initial) {
      setFormData({
        data_aporte: initial.data_aporte || '',
        historico: initial.historico || '',
        valor_aporte: initial.valor_aporte || '',
        periodo_aporte: initial.periodo_aporte || '',
        custo_capital: initial.custo_capital || ''
      });
    } else {
      setFormData({
        data_aporte: new Date().toISOString().split('T')[0],
        historico: '',
        valor_aporte: '',
        periodo_aporte: '',
        custo_capital: ''
      });
    }
  }, [initial, open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-left">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{initial ? 'Editar Aporte' : 'Novo Aporte de Capital'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Data do Aporte</label>
            <input 
              type="date" 
              value={formData.data_aporte}
              onChange={(e) => setFormData({...formData, data_aporte: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Histórico / Descrição</label>
            <input 
              type="text" 
              value={formData.historico}
              onChange={(e) => setFormData({...formData, historico: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Aporte inicial de sócios"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Valor do Aporte (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.valor_aporte}
                onChange={(e) => setFormData({...formData, valor_aporte: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Custo do Capital (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.custo_capital}
                onChange={(e) => setFormData({...formData, custo_capital: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Período do Aporte</label>
            <input 
              type="text" 
              value={formData.periodo_aporte}
              onChange={(e) => setFormData({...formData, periodo_aporte: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Mensal, 01/2024"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button 
            onClick={() => {
              if (!formData.historico || !formData.valor_aporte) return alert('Preencha o histórico e o valor.');
              onSave(formData);
            }} 
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}
