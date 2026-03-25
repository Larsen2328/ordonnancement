import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Cours } from '../types';
import { Plus, Edit2, Trash2, BookOpen, Clock } from 'lucide-react';

const MODALITES = ['PRESENTIEL', 'DISTANCIEL', 'HYBRIDE'];
const TYPES = ['THEORIQUE', 'TP', 'PROJET', 'EVALUATION', 'ATELIER', 'ACCOMPAGNEMENT'];
const TYPE_LABELS: Record<string, string> = {
  THEORIQUE: 'Théorie', TP: 'TP', PROJET: 'Projet', EVALUATION: 'Évaluation', ATELIER: 'Atelier', ACCOMPAGNEMENT: 'Accompagnement',
};
const MODALITE_COLORS: Record<string, string> = {
  PRESENTIEL: 'bg-green-100 text-green-700', DISTANCIEL: 'bg-blue-100 text-blue-700', HYBRIDE: 'bg-purple-100 text-purple-700',
};
const TYPE_COLORS: Record<string, string> = {
  THEORIQUE: 'bg-blue-100 text-blue-700', TP: 'bg-green-100 text-green-700', PROJET: 'bg-yellow-100 text-yellow-700',
  EVALUATION: 'bg-red-100 text-red-700', ATELIER: 'bg-purple-100 text-purple-700', ACCOMPAGNEMENT: 'bg-gray-100 text-gray-700',
};

const emptyForm = { code: '', titre: '', description: '', dureeHeures: '', niveau: '', modalite: 'PRESENTIEL', type: 'THEORIQUE', objectifs: '' };

export default function CoursPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cours | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data: cours = [], isLoading } = useQuery<Cours[]>({
    queryKey: ['cours'],
    queryFn: () => api.get('/cours').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/cours', { ...data, dureeHeures: parseInt(data.dureeHeures) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cours'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      api.put(`/cours/${id}`, { ...data, dureeHeures: parseInt(data.dureeHeures) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cours'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/cours/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cours'] }),
  });

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditing(null); };

  const startEdit = (c: Cours) => {
    setEditing(c);
    setForm({ code: c.code, titre: c.titre, description: c.description || '', dureeHeures: c.dureeHeures.toString(), niveau: c.niveau || '', modalite: c.modalite, type: c.type, objectifs: c.objectifs || '' });
    setShowForm(true);
  };

  const filtered = cours.filter(c => {
    const matchSearch = !search || c.titre.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || c.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cours</h1>
          <p className="text-gray-500 mt-1">{cours.length} cours au total</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau cours
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher par titre ou code..."
          className="input flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input sm:w-48" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifier le cours' : 'Nouveau cours'}</h2>
          <form onSubmit={e => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Code *</label>
              <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="label">Titre *</label>
              <input className="input" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
            </div>
            <div>
              <label className="label">Durée (heures) *</label>
              <input className="input" type="number" min="1" value={form.dureeHeures} onChange={e => setForm({ ...form, dureeHeures: e.target.value })} required />
            </div>
            <div>
              <label className="label">Niveau</label>
              <input className="input" value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} placeholder="ex: Débutant, Intermédiaire" />
            </div>
            <div>
              <label className="label">Modalité</label>
              <select className="input" value={form.modalite} onChange={e => setForm({ ...form, modalite: e.target.value })}>
                {MODALITES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Objectifs pédagogiques</label>
              <textarea className="input" rows={2} value={form.objectifs} onChange={e => setForm({ ...form, objectifs: e.target.value })} />
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
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun cours trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                  <span className={`badge ${TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-700'}`}>{TYPE_LABELS[c.type]}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm('Supprimer ce cours ?')) deleteMutation.mutate(c.id); }} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{c.titre}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.dureeHeures}h</span>
                <span className={`badge ${MODALITE_COLORS[c.modalite] || 'bg-gray-100 text-gray-600'}`}>{c.modalite}</span>
              </div>
              {c.competences && c.competences.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.competences.slice(0, 3).map(cc => (
                    <span key={cc.competence.id} className="badge bg-indigo-50 text-indigo-600 text-xs">{cc.competence.code}</span>
                  ))}
                  {c.competences.length > 3 && <span className="badge bg-gray-100 text-gray-500 text-xs">+{c.competences.length - 3}</span>}
                </div>
              )}
              {c.prerequis && c.prerequis.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Prérequis : {c.prerequis.map(p => p.prerequis.code).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
