import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Formateur } from '../types';
import { Plus, Edit2, Trash2, Users, Mail, Phone } from 'lucide-react';

const emptyForm = { nom: '', prenom: '', email: '', telephone: '', specialites: '' };

export default function FormateursPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Formateur | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: formateurs = [], isLoading } = useQuery<Formateur[]>({
    queryKey: ['formateurs'],
    queryFn: () => api.get('/formateurs').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/formateurs', {
      ...data,
      specialites: data.specialites ? data.specialites.split(',').map(s => s.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formateurs'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      api.put(`/formateurs/${id}`, {
        ...data,
        specialites: data.specialites ? data.specialites.split(',').map(s => s.trim()) : [],
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formateurs'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/formateurs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formateurs'] }),
  });

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditing(null); };

  const startEdit = (f: Formateur) => {
    setEditing(f);
    let specialitesStr = '';
    if (f.specialites) {
      try { specialitesStr = JSON.parse(f.specialites).join(', '); } catch { specialitesStr = f.specialites; }
    }
    setForm({ nom: f.nom, prenom: f.prenom, email: f.email, telephone: f.telephone || '', specialites: specialitesStr });
    setShowForm(true);
  };

  const parseSpecialites = (f: Formateur): string[] => {
    if (!f.specialites) return [];
    try { return JSON.parse(f.specialites); } catch { return [f.specialites]; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formateurs</h1>
          <p className="text-gray-500 mt-1">{formateurs.length} formateurs</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau formateur
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifier' : 'Nouveau formateur'}</h2>
          <form onSubmit={e => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom *</label>
              <input className="input" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Spécialités (séparées par des virgules)</label>
              <input className="input" value={form.specialites} onChange={e => setForm({ ...form, specialites: e.target.value })} placeholder="Python, Machine Learning, ..." />
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

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : formateurs.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun formateur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {formateurs.map(f => (
            <div key={f.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                  {f.prenom[0]}{f.nom[0]}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(f)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm('Supprimer ce formateur ?')) deleteMutation.mutate(f.id); }} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{f.prenom} {f.nom}</h3>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3.5 h-3.5" />{f.email}
                </div>
                {f.telephone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5" />{f.telephone}
                  </div>
                )}
              </div>
              {parseSpecialites(f).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {parseSpecialites(f).map(s => (
                    <span key={s} className="badge bg-purple-50 text-purple-700 text-xs">{s}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 text-xs text-gray-400">
                {f.coursFormateurs?.length || 0} cours assignés
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
