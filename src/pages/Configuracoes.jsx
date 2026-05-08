import { useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { usePlanoContas, useCreatePlanoContas, useUpdatePlanoContas, useDeletePlanoContas } from '@/hooks/usePlanoContas';
import { useBancos, useCreateBanco, useUpdateBanco, useDeleteBanco } from '@/hooks/useBancos';
import { useParceiros, useCreateParceiro, useUpdateParceiro, useDeleteParceiro } from '@/hooks/useParceiros';
import { useVeiculos, useCreateVeiculo, useUpdateVeiculo, useDeleteVeiculo } from '@/hooks/useVeiculos';
import { useOperacoes, useCreateOperacao, useUpdateOperacao, useDeleteOperacao } from '@/hooks/useOperacoes';
import { useCreatePeriodoOperacao, useClosePeriodoOperacao, usePeriodosOperacao } from '@/hooks/usePeriodosOperacao';
import { supabase } from '@/lib/supabase';
import FrotaPerformance from '@/components/FrotaPerformance';
import PeriodosOperacaoRelatorio from '@/components/PeriodosOperacaoRelatorio';

const tabs = [
  { id: 'plano', label: 'Plano de Contas' },
  { id: 'bancos', label: 'Contas Bancárias' },
  { id: 'parceiros', label: 'Parceiros' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'veiculos', label: 'Veículos' },
  { id: 'performance', label: 'Performance da Frota' },
  { id: 'historico', label: 'Histórico de Operações' },
];

function Dialog({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
const selectCls = `${inputCls} bg-white`;

function CrudTable({ columns, data, onEdit, onDelete, renderRow }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{c}</th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">Nenhum registro cadastrado.</td></tr>
          ) : data.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
              {renderRow(item)}
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Plano de Contas Tab ──
function PlanoContasTab() {
  const { data: items = [] } = usePlanoContas();
  const create = useCreatePlanoContas();
  const update = useUpdatePlanoContas();
  const del = useDeletePlanoContas();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', nome: '', tipo: 'despesa' });
  const [editId, setEditId] = useState(null);

  function openNew() { setForm({ codigo: '', nome: '', tipo: 'despesa' }); setEditId(null); setOpen(true); }
  function openEdit(item) { setForm({ codigo: item.codigo, nome: item.nome, tipo: item.tipo }); setEditId(item.id); setOpen(true); }
  async function handleSave() {
    if (editId) { await update.mutateAsync({ id: editId, ...form }); }
    else { await create.mutateAsync(form); }
    setOpen(false);
  }
  async function handleDelete(id) {
    if (window.confirm('Excluir esta conta?')) await del.mutateAsync(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Nova Conta
        </button>
      </div>
      <CrudTable
        columns={['Código','Nome','Tipo']}
        data={items}
        onEdit={openEdit}
        onDelete={handleDelete}
        renderRow={(item) => (
          <>
            <td className="px-4 py-3 font-mono text-slate-600">{item.codigo}</td>
            <td className="px-4 py-3 text-slate-700 font-medium">{item.nome}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {item.tipo}
              </span>
            </td>
          </>
        )}
      />
      <Dialog open={open} title={editId ? 'Editar Conta' : 'Nova Conta'} onClose={() => setOpen(false)}>
        <Field label="Código *"><input className={inputCls} value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ex: 55" /></Field>
        <Field label="Nome *"><input className={inputCls} value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: DIESEL CAVALO" /></Field>
        <Field label="Tipo *">
          <select className={selectCls} value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Bancos Tab ──
function BancosTab() {
  const { data: items = [] } = useBancos();
  const create = useCreateBanco();
  const update = useUpdateBanco();
  const del = useDeleteBanco();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', agencia: '', conta: '' });
  const [editId, setEditId] = useState(null);

  function openNew() { setForm({ nome: '', agencia: '', conta: '' }); setEditId(null); setOpen(true); }
  function openEdit(item) { setForm({ nome: item.nome, agencia: item.agencia || '', conta: item.conta || '' }); setEditId(item.id); setOpen(true); }
  async function handleSave() {
    if (editId) { await update.mutateAsync({ id: editId, ...form }); }
    else { await create.mutateAsync(form); }
    setOpen(false);
  }
  async function handleDelete(id) {
    if (window.confirm('Excluir esta conta bancária?')) await del.mutateAsync(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Nova Conta
        </button>
      </div>
      <CrudTable
        columns={['Banco','Agência','Conta']}
        data={items}
        onEdit={openEdit}
        onDelete={handleDelete}
        renderRow={(item) => (
          <>
            <td className="px-4 py-3 text-slate-700 font-medium">{item.nome}</td>
            <td className="px-4 py-3 text-slate-500">{item.agencia || '-'}</td>
            <td className="px-4 py-3 text-slate-500">{item.conta || '-'}</td>
          </>
        )}
      />
      <Dialog open={open} title={editId ? 'Editar Conta Bancária' : 'Nova Conta Bancária'} onClose={() => setOpen(false)}>
        <Field label="Banco *"><input className={inputCls} value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: CONTA CORRENTE" /></Field>
        <Field label="Agência"><input className={inputCls} value={form.agencia} onChange={(e) => setForm(f => ({ ...f, agencia: e.target.value }))} placeholder="Ex: 8615-1" /></Field>
        <Field label="Conta"><input className={inputCls} value={form.conta} onChange={(e) => setForm(f => ({ ...f, conta: e.target.value }))} placeholder="Ex: 1195-9" /></Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Parceiros Tab ──
function ParceirosTab() {
  const { data: items = [] } = useParceiros();
  const create = useCreateParceiro();
  const update = useUpdateParceiro();
  const del = useDeleteParceiro();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', tipo: 'cliente' });
  const [editId, setEditId] = useState(null);

  function openNew() { setForm({ nome: '', tipo: 'cliente' }); setEditId(null); setOpen(true); }
  function openEdit(item) { setForm({ nome: item.nome, tipo: item.tipo || 'cliente' }); setEditId(item.id); setOpen(true); }
  async function handleSave() {
    if (editId) { await update.mutateAsync({ id: editId, ...form }); }
    else { await create.mutateAsync(form); }
    setOpen(false);
  }
  async function handleDelete(id) {
    if (window.confirm('Excluir este parceiro?')) await del.mutateAsync(id);
  }

  const tipoBadge = { cliente: 'bg-blue-100 text-blue-700', fornecedor: 'bg-purple-100 text-purple-700', ambos: 'bg-slate-100 text-slate-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Novo Parceiro
        </button>
      </div>
      <CrudTable
        columns={['Nome','Tipo']}
        data={items}
        onEdit={openEdit}
        onDelete={handleDelete}
        renderRow={(item) => (
          <>
            <td className="px-4 py-3 text-slate-700 font-medium">{item.nome}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tipoBadge[item.tipo] || ''}`}>
                {item.tipo}
              </span>
            </td>
          </>
        )}
      />
      <Dialog open={open} title={editId ? 'Editar Parceiro' : 'Novo Parceiro'} onClose={() => setOpen(false)}>
        <Field label="Nome *"><input className={inputCls} value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: BRF S.A." /></Field>
        <Field label="Tipo">
          <select className={selectCls} value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="cliente">Cliente</option>
            <option value="fornecedor">Fornecedor</option>
            <option value="ambos">Ambos</option>
          </select>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Operações Tab ──
function OperacoesTab() {
  const { data: items = [] } = useOperacoes();
  const create = useCreateOperacao();
  const update = useUpdateOperacao();
  const del = useDeleteOperacao();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '' });
  const [editId, setEditId] = useState(null);

  function openNew() { setForm({ nome: '' }); setEditId(null); setOpen(true); }
  function openEdit(item) { setForm({ nome: item.nome }); setEditId(item.id); setOpen(true); }
  async function handleSave() {
    if (editId) { await update.mutateAsync({ id: editId, ...form }); }
    else { await create.mutateAsync(form); }
    setOpen(false);
  }
  async function handleDelete(id) {
    if (window.confirm('Excluir esta operação?')) await del.mutateAsync(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Nova Operação
        </button>
      </div>
      <CrudTable
        columns={['Nome']}
        data={items}
        onEdit={openEdit}
        onDelete={handleDelete}
        renderRow={(item) => (
          <td className="px-4 py-3 text-slate-700 font-medium">{item.nome}</td>
        )}
      />
      <Dialog open={open} title={editId ? 'Editar Operação' : 'Nova Operação'} onClose={() => setOpen(false)}>
        <Field label="Nome *"><input className={inputCls} value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Operação Transparaná" /></Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Veículos Tab ──
function VeiculosTab() {
  const { data: items = [] } = useVeiculos();
  const { data: operacoes = [] } = useOperacoes();
  const create = useCreateVeiculo();
  const update = useUpdateVeiculo();
  const del = useDeleteVeiculo();
  const createPeriodo = useCreatePeriodoOperacao();
  const closePeriodo = useClosePeriodoOperacao();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [originalVeiculo, setOriginalVeiculo] = useState(null);
  const [form, setForm] = useState({ placa: '', descricao: '', operacao_id: null, tipo: 'carreta', cavalo_id: null, data_primeiro_frete: '' });
  const [editId, setEditId] = useState(null);

  const hasTipoColumn = items.length > 0 && 'tipo' in items[0];

  function openNew() { setForm({ placa: '', descricao: '', operacao_id: null, tipo: 'cavalo', cavalo_id: null, data_primeiro_frete: '' }); setEditId(null); setOriginalVeiculo(null); setOpen(true); }
  function openEdit(item) { 
    let tipo = item.tipo || 'cavalo';
    let cavalo_id = item.cavalo_id || null;
    let cleanDesc = item.descricao || '';

    if (!hasTipoColumn && item.descricao?.includes('[V-DATA:')) {
      try {
        const match = item.descricao.match(/\[V-DATA:(.*?)\]/);
        if (match) {
          const data = JSON.parse(match[1]);
          tipo = data.tipo;
          cavalo_id = data.cavalo_id;
          cleanDesc = item.descricao.replace(/\[V-DATA:.*?\]/, '').trim();
        }
      } catch (e) { console.error('Erro ao ler metadados', e); }
    }

    setOriginalVeiculo({ operacao_id: item.operacao_id || null, cavalo_id, data_primeiro_frete: item.data_primeiro_frete || '' });
    setForm({ 
      placa: item.placa, 
      descricao: cleanDesc, 
      operacao_id: item.operacao_id || null,
      tipo,
      cavalo_id,
      data_primeiro_frete: item.data_primeiro_frete || ''
    }); 
    setEditId(item.id); 
    setOpen(true); 
  }
  async function handleSave() {
    try {
      const payload = { ...form };
      
      if (!hasTipoColumn) {
        const meta = JSON.stringify({ tipo: form.tipo, cavalo_id: form.cavalo_id });
        payload.descricao = `[V-DATA:${meta}] ${form.descricao}`.trim();
        delete payload.tipo;
        delete payload.cavalo_id;
      }

      if (editId) {
        await update.mutateAsync({ id: editId, ...payload });

        // Lógica de períodos: apenas para cavalos
        if (form.tipo === 'cavalo' && originalVeiculo) {
          const mudou =
            form.operacao_id !== originalVeiculo.operacao_id ||
            form.cavalo_id !== originalVeiculo.cavalo_id ||
            form.data_primeiro_frete !== originalVeiculo.data_primeiro_frete;

          if (mudou) {
            const hoje = new Date().toISOString().split('T')[0];
            // Fechar período ativo, se existir
            const { data: periodoAtivo } = await supabase
              .from('periodos_operacao')
              .select('id')
              .eq('cavalo_id', editId)
              .is('data_fim', null)
              .maybeSingle();

            if (periodoAtivo) {
              await closePeriodo.mutateAsync({ periodoId: periodoAtivo.id, dataFim: hoje });
            }

            // Abrir novo período
            await createPeriodo.mutateAsync({
              cavalo_id: editId,
              carreta_id: form.cavalo_id || null,
              operacao_id: form.operacao_id || null,
              data_inicio: form.data_primeiro_frete || hoje,
            });
          }
        }
      } else {
        const novoVeiculo = await create.mutateAsync(payload);
        // Criar primeiro período se for cavalo com data_primeiro_frete
        if (form.tipo === 'cavalo' && novoVeiculo?.id) {
          const hoje = new Date().toISOString().split('T')[0];
          await createPeriodo.mutateAsync({
            cavalo_id: novoVeiculo.id,
            carreta_id: form.cavalo_id || null,
            operacao_id: form.operacao_id || null,
            data_inicio: form.data_primeiro_frete || hoje,
          });
        }
      }

      setOpen(false);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar veículo: ' + (err.message || 'Verifique se os dados estão corretos.'));
    }
  }
  async function handleDelete() {
    if (!deleteId) return;
    
    const hasLinks = items.some(v => v.cavalo_id === deleteId);
    if (hasLinks) {
      alert('Não é possível excluir esta carreta pois existem cavalos vinculados a ela. Remova o vínculo nos cavalos primeiro.');
      setConfirmOpen(false);
      setDeleteId(null);
      return;
    }

    try {
      await del.mutateAsync(deleteId);
      setConfirmOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao excluir placa: ' + (err.message || 'Verifique se esta placa está sendo usada em lançamentos ou contas a receber.'));
    }
  }

  function requestDelete(id) {
    setDeleteId(id);
    setConfirmOpen(true);
  }

  const cavalos = items.filter(v => v.tipo === 'cavalo');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Novo Veículo
        </button>
      </div>
      <CrudTable
        columns={['Placa', 'Tipo', 'Vínculo (Carreta)', 'Operação', 'Descrição']}
        data={items}
        onEdit={openEdit}
        onDelete={requestDelete}
        renderRow={(item) => {
          let tipo = item.tipo || 'cavalo';
          let cavalo_id = item.cavalo_id || null;
          let cleanDesc = item.descricao || '';

          if (!hasTipoColumn && item.descricao?.includes('[V-DATA:')) {
            try {
              const match = item.descricao.match(/\[V-DATA:(.*?)\]/);
              if (match) {
                const data = JSON.parse(match[1]);
                tipo = data.tipo;
                cavalo_id = data.cavalo_id;
                cleanDesc = item.descricao.replace(/\[V-DATA:.*?\]/, '').trim();
              }
            } catch(e) {}
          }

          const op = operacoes.find(o => o.id === item.operacao_id);
          const vinculado = items.find(v => v.id === cavalo_id);
          
          return (
            <>
              <td className="px-4 py-3 font-mono font-bold text-slate-700">{item.placa}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tipo === 'carreta' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {tipo === 'cavalo' ? 'Cavalo' : 'Carreta'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 font-medium">
                {tipo === 'cavalo' && vinculado ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{vinculado.placa}</span>
                    <span className="text-[10px] text-slate-400">Carreta Vinculada</span>
                  </div>
                ) : '-'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {op ? <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{op.nome}</span> : '-'}
              </td>
              <td className="px-4 py-3 text-slate-500">{cleanDesc || '-'}</td>
            </>
          );
        }}
      />
      <Dialog open={open} title={editId ? 'Editar Veículo' : 'Novo Veículo'} onClose={() => setOpen(false)}>
        <Field label="Placa *"><input className={inputCls} value={form.placa} onChange={(e) => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} placeholder="Ex: RCA4F95" /></Field>
        
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo *">
            <select className={selectCls} value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value, cavalo_id: e.target.value === 'carreta' ? null : f.cavalo_id }))}>
              <option value="cavalo">Cavalo (Caminhão)</option>
              <option value="carreta">Equipamento / Carreta</option>
            </select>
          </Field>

          {form.tipo === 'cavalo' && (
            <Field label="Vincular a Carreta">
              <select className={selectCls} value={form.cavalo_id || ''} onChange={(e) => setForm(f => ({ ...f, cavalo_id: e.target.value || null }))}>
                <option value="">Nenhum Vínculo</option>
                {items.map(c => {
                  let cTipo = c.tipo;
                  let cDesc = c.descricao;
                  if (!hasTipoColumn && c.descricao?.includes('[V-DATA:')) {
                    try {
                      const m = c.descricao.match(/\[V-DATA:(.*?)\]/);
                      if (m) {
                        const d = JSON.parse(m[1]);
                        cTipo = d.tipo;
                        cDesc = c.descricao.replace(/\[V-DATA:.*?\]/, '').trim();
                      }
                    } catch(e) {}
                  }
                  if (cTipo !== 'carreta') return null;
                  return <option key={c.id} value={c.id}>{c.placa} - {cDesc}</option>;
                })}
              </select>
            </Field>
          )}
        </div>

        <Field label="Operação">
          <select className={selectCls} value={form.operacao_id || ''} onChange={(e) => setForm(f => ({ ...f, operacao_id: e.target.value || null }))}>
            <option value="">Nenhuma Operação</option>
            {operacoes.map(op => (
              <option key={op.id} value={op.id}>{op.nome}</option>
            ))}
          </select>
        </Field>

        {form.tipo === 'cavalo' && (
          <Field label="Primeiro Frete (início do período atual)">
            <input
              type="date"
              className={inputCls}
              value={form.data_primeiro_frete || ''}
              onChange={(e) => setForm(f => ({ ...f, data_primeiro_frete: e.target.value }))}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Alterar essa data (ou a operação/carreta) registrará automaticamente a troca no histórico.
            </p>
          </Field>
        )}

        <Field label="Descrição"><input className={inputCls} value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Cavalo Scania" /></Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
        </div>
      </Dialog>

      {/* Modal de Confirmação Customizado */}
      <Dialog open={confirmOpen} title="Confirmar Exclusão" onClose={() => setConfirmOpen(false)}>
        <div className="py-2">
          <p className="text-sm text-slate-600">Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition-all">Sim, Excluir</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── Main Page ──
export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('plano');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerenciar cadastros do sistema</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-fit px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-w-0">
        {activeTab === 'plano' && <PlanoContasTab />}
        {activeTab === 'bancos' && <BancosTab />}
        {activeTab === 'parceiros' && <ParceirosTab />}
        {activeTab === 'operacoes' && <OperacoesTab />}
        {activeTab === 'veiculos' && <VeiculosTab />}
        {activeTab === 'performance' && <FrotaPerformance />}
        {activeTab === 'historico' && <PeriodosOperacaoRelatorio />}
      </div>
    </div>
  );
}
