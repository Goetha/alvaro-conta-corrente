import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

export function DreKpiDrawer({ open, onClose, onSave, onDelete, initial, dreConfig }) {
  const [formData, setFormData] = useState({
    titulo: '',
    variante: 'info',
    icone: 'Activity',
    operacao_caixa: 'nenhum',
    operacao_resultado: 'nenhum',
    formula: {}
  });

  useEffect(() => {
    if (initial) {
      setFormData({
        titulo: initial.titulo || '',
        variante: initial.variante || 'info',
        icone: initial.icone || 'Activity',
        operacao_caixa: initial.operacao_caixa || 'nenhum',
        operacao_resultado: initial.operacao_resultado || 'nenhum',
        formula: initial.formula || {}
      });
    } else {
      setFormData({
        titulo: '',
        variante: 'info',
        icone: 'Activity',
        operacao_caixa: 'nenhum',
        operacao_resultado: 'nenhum',
        formula: {}
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const variants = [
    { id: 'info', label: 'Azul (Info)', color: 'bg-sky-500' },
    { id: 'success', label: 'Verde (Sucesso)', color: 'bg-emerald-500' },
    { id: 'danger', label: 'Vermelho (Atenção)', color: 'bg-red-500' },
    { id: 'warning', label: 'Amarelo (Alerta)', color: 'bg-amber-500' },
  ];

  const opsBox = [
    { id: 'nenhum', label: 'Não afeta', color: 'bg-slate-100 text-slate-600' },
    { id: 'soma', label: 'Somar (+)', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'subtrai', label: 'Subtrair (-)', color: 'bg-red-100 text-red-700' },
  ];

  const opsBtn = [
    { id: 'soma', label: '+ Soma', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { id: 'subtrai', label: '− Subtrai', cls: 'bg-red-100 text-red-700 border-red-300' },
    { id: 'nenhum', label: 'Ø Ignora', cls: 'bg-slate-100 text-slate-500 border-slate-300' },
  ];

  const systemItems = [
    { key: 'ccBB', label: 'Conta Corrente BB' },
    { key: 'saldoCaixa', label: 'Caixa' },
    { key: 'aReceber', label: 'A Receber (Líquido)' },
    { key: 'aPagar', label: 'A Pagar (Diesel)' },
    { key: 'outrasEntradas', label: 'Outras Entradas (5,7,8,9)' },
    { key: 'custoCapital', label: 'Custo de Capital' },
  ];

  const setFormula = (key, val) => {
    setFormData(prev => ({ ...prev, formula: { ...prev.formula, [key]: val } }));
  };

  const normalRows = (dreConfig || []).filter(l => !l.codigo_conta?.startsWith('VIRTUAL_'));
  const configuredRows = normalRows.filter(l => formData.formula[l.id] && formData.formula[l.id] !== 'nenhum');
  const unconfiguredRows = normalRows.filter(l => !formData.formula[l.id] || formData.formula[l.id] === 'nenhum');

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col animate-slide-left">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">{initial ? 'Editar KPI' : 'Novo KPI Personalizado'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase">Título do Card</label>
            <input 
              type="text" 
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Reserva Técnica"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Composição da Fórmula</p>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">KPIs do Sistema</p>
                <div className="space-y-2">
                  {systemItems.map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      <div className="flex gap-1 shrink-0">
                        {opsBtn.map(op => (
                          <button
                            key={op.id}
                            onClick={() => setFormula(item.key, op.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              formData.formula[item.key] === op.id ? op.cls + ' ring-2 ring-offset-1 ring-indigo-400' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                            }`}
                          >{op.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Plano de Contas</p>
                <div className="space-y-2">
                  {configuredRows.map(l => (
                    <div key={l.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{l.codigo_conta} - {l.nome}</span>
                      <div className="flex gap-1 self-end">
                        {opsBtn.map(op => (
                          <button
                            key={op.id}
                            onClick={() => setFormula(l.id, op.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              formData.formula[l.id] === op.id ? op.cls + ' ring-2 ring-offset-1 ring-indigo-400' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                            }`}
                          >{op.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-2">
                    <select 
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setFormula(e.target.value, 'soma');
                      }}
                    >
                      <option value="">+ Adicionar conta do Plano...</option>
                      {unconfiguredRows.map(l => (
                         <option key={l.id} value={l.id}>{l.codigo_conta} - {l.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">Afeta Geração de Caixa?</label>
              <div className="grid grid-cols-3 gap-2">
                {opsBox.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setFormData({...formData, operacao_caixa: o.id})}
                    className={`p-2 rounded-lg text-[10px] font-bold transition-all border ${formData.operacao_caixa === o.id ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200'}`}
                  >
                    <div className={`py-1 rounded ${o.color}`}>{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">Afeta Resultado Líquido?</label>
              <div className="grid grid-cols-3 gap-2">
                {opsBox.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setFormData({...formData, operacao_resultado: o.id})}
                    className={`p-2 rounded-lg text-[10px] font-bold transition-all border ${formData.operacao_resultado === o.id ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200'}`}
                  >
                    <div className={`py-1 rounded ${o.color}`}>{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Cor / Estilo</label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setFormData({...formData, variante: v.id})}
                    className={`flex items-center gap-2 p-2 border rounded-lg text-xs transition-all ${formData.variante === v.id ? 'border-indigo-600 bg-indigo-50 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${v.color}`} />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between gap-3">
          {initial && (
            <button 
              onClick={() => { if(confirm('Excluir este KPI?')) onDelete(initial.id); }} 
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
            >
              <Trash2 size={18} />
            </button>
          )}
          <div className="flex gap-3 flex-1 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button 
              onClick={() => {
                if (!formData.titulo) return alert('Dê um título ao KPI');
                onSave({
                  ...formData,
                  valor: 0 // Removido o campo valor manual, mantido como fallback no DB
                });
              }} 
              className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md"
            >
              <Save size={16} /> Salvar KPI
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
