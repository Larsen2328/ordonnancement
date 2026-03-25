import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Cursus } from '../types';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';

const NIVEAUX = ['Bac', 'Bac+1', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Bac+6', 'Autre'];

export default function CursusPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cursus | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ code: '', intitule: '', description: '', niveau: 'Bac+3', dureeHeures: '' });

  const { data: cursus = [], isLoading } = useQuery<Cursus[]>({
    queryKey: ['cursus'],
    queryFn: () => api.get('/cursus').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/cursus', { ...data, dureeHeures: data.dureeHeures ? parseInt(data.dureeHeures) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cursus'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      api.put(`/cursus/${id}`, { ...data, dureeHeures: data.dureeHeures ? parseInt(data.dureeHeures) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cursus'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/cursus/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cursus'] }),
  });

  const resetForm = () => {
    setForm({ code: '', intitule: '', description: '', niveau: 'Bac+3', dureeHeures: '' });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (c: Cursus) => {
    setEditing(c);
    setForm({ code: c.code, intitule: c.intitule, description: c.description || '', niveau: c.niveau || 'Bac+3', dureeHeures: c.dureeHeures?.toString() || '' });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursus</h1>
          <p className="text-gray-500 mt-1">{cursus.length} cursus au total</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau cursus
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifier le cursus' : 'Nouveau cursus'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Code *</label>
              <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="label">Intitulé *</label>
              <input className="input" value={form.intitule} onChange={e => setForm({ ...form, intitule: e.target.value })} required />
            </div>
            <div>
              <label className="label">Niveau</label>
              <select className="input" value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                {NIVEAUX.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Durée (heures)</label>
              <input className="input" type="number" min="0" value={form.dureeHeures} onChange={e => setForm({ ...form, dureeHeures: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Enregistrer' : 'Créer'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : cursus.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun cursus. Créez le premier !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cursus.map(c => (
            <div key={c.id} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                    <span className="font-semibold text-gray-900">{c.intitule}</span>
                    {c.niveau && <span className="badge bg-blue-50 text-blue-700">{c.niveau}</span>}
                    {c.dureeHeures && <span className="badge bg-gray-100 text-gray-600">{c.dureeHeures}h</span>}
                    <span className="badge bg-gray-100 text-gray-500">v{c.version}</span>
                  </div>
                  {c.description && <p className="text-sm text-gray-500 mt-1 truncate">{c.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">{c.cours?.length || 0} cours • {c.promotions?.length || 0} promotions</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Supprimer ce cursus ?')) deleteMutation.mutate(c.id); }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded cours list */}
              {expanded === c.id && c.cours && c.cours.length > 0 && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  <div className="pt-4 space-y-2">
                    {c.cours.sort((a, b) => a.ordre - b.ordre).map((cc, idx) => (
                      <div key={cc.coursId} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-xs text-gray-500">{cc.cours.code}</span>
                        <span className="text-gray-700">{cc.cours.titre}</span>
                        <span className="text-xs text-gray-400 ml-auto">{cc.cours.dureeHeures}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
