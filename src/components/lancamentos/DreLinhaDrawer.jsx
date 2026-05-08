import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlanoContas } from '@/hooks/usePlanoContas';

export function DreLinhaDrawer({ open, onClose, onSave, initial, dreLines = [] }) {
  const { data: planoContas = [] } = usePlanoContas();
  
  const [formData, setFormData] = useState({
    nome: '',
    plano_conta_id: '',
    tipo_calculo: 'soma',
    cor_fundo: '#ffffff',
    cor_texto: '#334155',
    id_referencia_1: '',
    id_referencia_2: '',
    operacao_aritmetica: ''
  });

  useEffect(() => {
    if (initial) {
      setFormData({
        nome: initial.nome || '',
        plano_conta_id: initial.plano_conta_id || initial.codigo_conta || '',
        tipo_calculo: initial.tipo_calculo || 'soma',
        cor_fundo: initial.cor_fundo || '#ffffff',
        cor_texto: initial.cor_texto || '#334155',
        id_referencia_1: initial.id_referencia_1 || '',
        id_referencia_2: initial.id_referencia_2 || '',
        operacao_aritmetica: initial.operacao_aritmetica || ''
      });
    } else {
      setFormData({
        nome: '',
        plano_conta_id: '',
        tipo_calculo: 'soma',
        cor_fundo: '#ffffff',
        cor_texto: '#334155',
        id_referencia_1: '',
        id_referencia_2: '',
        operacao_aritmetica: ''
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const isOperation = formData.plano_conta_id === 'OPERACAO_ARITMETICA';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-left">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{initial ? 'Editar Linha DRE' : 'Nova Linha DRE'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nome da Linha de Exibição</label>
            <input 
              type="text" 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: VENDAS DE BENS"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Cor do Fundo</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={formData.cor_fundo}
                  onChange={(e) => setFormData({...formData, cor_fundo: e.target.value})}
                  className="h-8 w-12 cursor-pointer border-0 p-0 rounded"
                />
                <span className="text-xs text-slate-500">{formData.cor_fundo}</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Cor do Texto</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={formData.cor_texto}
                  onChange={(e) => setFormData({...formData, cor_texto: e.target.value})}
                  className="h-8 w-12 cursor-pointer border-0 p-0 rounded"
                />
                <span className="text-xs text-slate-500">{formData.cor_texto}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Origem do Valor</label>
            <select 
              value={formData.plano_conta_id}
              onChange={(e) => setFormData({...formData, plano_conta_id: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Apenas manual ou informativa --</option>
              <optgroup label="Calculadores Globais (Automáticos)">
                <option value="VIRTUAL_TOTAL_DESPESAS">TOTAL GERAL DE DESPESAS (Corrente + Caixa)</option>
                <option value="VIRTUAL_TOTAL_RECEITAS">TOTAL GERAL DE RECEITAS (Corrente + Caixa)</option>
                <option value="VIRTUAL_FATURAMENTO">FATURAMENTO (Contas a Receber)</option>
                <option value="VIRTUAL_DESCONTOS">DESCONTOS (Contas a Receber)</option>
                <option value="VIRTUAL_VALOR_APORTE">TOTAL APORTADO (Custo Capital)</option>
                <option value="VIRTUAL_CUSTO_CAPITAL">CUSTO DE CAPITAL TOTAL</option>
              </optgroup>
              <optgroup label="Diesel (Contas a Pagar)">
                <option value="VIRTUAL_DIESEL_TOTAL_A_PAGAR">DIESEL: TOTAL A PAGAR</option>
                <option value="VIRTUAL_DIESEL_TOTAL_PAGO">DIESEL: TOTAL PAGO</option>
                <option value="VIRTUAL_DIESEL_SALDO">DIESEL: SALDO</option>
              </optgroup>
              <optgroup label="Operações Dinâmicas">
                <option value="OPERACAO_ARITMETICA">CALCULAR ENTRE LINHAS (Operação)</option>
              </optgroup>
              <optgroup label="Plano de Contas">
                {planoContas.map(p => (
                  <option key={p.id} value={p.id}>{p.codigo} - {p.nome}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {isOperation && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Configuração da Operação</p>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Valor da Linha 1</label>
                <select 
                  value={formData.id_referencia_1}
                  onChange={(e) => setFormData({...formData, id_referencia_1: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  <optgroup label="Calculadores Globais">
                    <option value="VIRTUAL_TOTAL_DESPESAS">TOTAL GERAL DE DESPESAS</option>
                    <option value="VIRTUAL_TOTAL_RECEITAS">TOTAL GERAL DE RECEITAS</option>
                    <option value="VIRTUAL_FATURAMENTO">FATURAMENTO</option>
                    <option value="VIRTUAL_DESCONTOS">DESCONTOS</option>
                    <option value="VIRTUAL_VALOR_APORTE">TOTAL APORTADO</option>
                    <option value="VIRTUAL_CUSTO_CAPITAL">CUSTO DE CAPITAL</option>
                  </optgroup>
                  <optgroup label="Diesel (Contas a Pagar)">
                    <option value="VIRTUAL_DIESEL_TOTAL_A_PAGAR">DIESEL: TOTAL A PAGAR</option>
                    <option value="VIRTUAL_DIESEL_TOTAL_PAGO">DIESEL: TOTAL PAGO</option>
                    <option value="VIRTUAL_DIESEL_SALDO">DIESEL: SALDO</option>
                  </optgroup>
                  <optgroup label="Linhas do DRE Atual">
                    {dreLines.map(l => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex justify-center">
                <select 
                  value={formData.operacao_aritmetica}
                  onChange={(e) => setFormData({...formData, operacao_aritmetica: e.target.value})}
                  className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                >
                  <option value="">Operador</option>
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="*">*</option>
                  <option value="/">/</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Valor da Linha 2</label>
                <select 
                  value={formData.id_referencia_2}
                  onChange={(e) => setFormData({...formData, id_referencia_2: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  <optgroup label="Calculadores Globais">
                    <option value="VIRTUAL_TOTAL_DESPESAS">TOTAL GERAL DE DESPESAS</option>
                    <option value="VIRTUAL_TOTAL_RECEITAS">TOTAL GERAL DE RECEITAS</option>
                    <option value="VIRTUAL_FATURAMENTO">FATURAMENTO</option>
                    <option value="VIRTUAL_DESCONTOS">DESCONTOS</option>
                    <option value="VIRTUAL_VALOR_APORTE">TOTAL APORTADO</option>
                    <option value="VIRTUAL_CUSTO_CAPITAL">CUSTO DE CAPITAL</option>
                  </optgroup>
                  <optgroup label="Diesel (Contas a Pagar)">
                    <option value="VIRTUAL_DIESEL_TOTAL_A_PAGAR">DIESEL: TOTAL A PAGAR</option>
                    <option value="VIRTUAL_DIESEL_TOTAL_PAGO">DIESEL: TOTAL PAGO</option>
                    <option value="VIRTUAL_DIESEL_SALDO">DIESEL: SALDO</option>
                  </optgroup>
                  <optgroup label="Linhas do DRE Atual">
                    {dreLines.map(l => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Regra de Cálculo no DRE</label>
            <select 
              value={formData.tipo_calculo}
              onChange={(e) => setFormData({...formData, tipo_calculo: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="soma">Soma (+) nas Despesas/Receitas</option>
              <option value="subtrai">Subtrai (-) nas Despesas/Receitas</option>
              <option value="informativa">Apenas Informativa (Não afeta o Saldo Líquido)</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button 
            onClick={() => {
              if (!formData.nome) return alert('O nome da linha é obrigatório.');
              if (isOperation && (!formData.id_referencia_1 || !formData.id_referencia_2 || !formData.operacao_aritmetica)) {
                return alert('Para operações, você deve selecionar as duas linhas e o operador.');
              }
              
              const isVirtual = formData.plano_conta_id && (formData.plano_conta_id.startsWith('VIRTUAL_') || formData.plano_conta_id === 'OPERACAO_ARITMETICA');
              let finalCodigoConta = null;
              
              if (isVirtual) {
                finalCodigoConta = formData.plano_conta_id;
              } else {
                const selectedConta = planoContas.find(p => p.id === formData.plano_conta_id);
                finalCodigoConta = selectedConta ? selectedConta.codigo : null;
              }
              
              onSave({
                ...formData,
                codigo_conta: finalCodigoConta,
                plano_conta_id: isVirtual ? null : (formData.plano_conta_id || null)
              });
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
