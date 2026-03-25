import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Promotion, Cursus } from '../types';
import { Plus, Edit2, Trash2, Calendar, Users } from 'lucide-react';

const emptyForm = { nom: '', code: '', cursusId: '', dateDebut: '', dateFin: '', effectif: '' };

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ['promotions'],
    queryFn: () => api.get('/promotions').then(r => r.data),
  });

  const { data: cursus = [] } = useQuery<Cursus[]>({
    queryKey: ['cursus'],
    queryFn: () => api.get('/cursus').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/promotions', {
      ...data, cursusId: parseInt(data.cursusId), effectif: data.effectif ? parseInt(data.effectif) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/promotions/${id}`, {
      ...data, cursusId: parseInt(data.cursusId), effectif: data.effectif ? parseInt(data.effectif) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/promotions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditing(null); };

  const startEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      nom: p.nom, code: p.code, cursusId: p.cursusId.toString(),
      dateDebut: p.dateDebut.split('T')[0], dateFin: p.dateFin.split('T')[0],
      effectif: p.effectif?.toString() || '',
    });
    setShowForm(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-500 mt-1">{promotions.length} promotions</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle promotion
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifier' : 'Nouvelle promotion'}</h2>
          <form onSubmit={e => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></div>
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></div>
            <div>
              <label className="label">Cursus *</label>
              <select className="input" value={form.cursusId} onChange={e => setForm({ ...form, cursusId: e.target.value })} required>
                <option value="">Sélectionner...</option>
                {cursus.map(c => <option key={c.id} value={c.id}>{c.intitule}</option>)}
              </select>
            </div>
            <div><label className="label">Effectif</label><input className="input" type="number" min="1" value={form.effectif} onChange={e => setForm({ ...form, effectif: e.target.value })} /></div>
            <div><label className="label">Date de début *</label><input className="input" type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} required /></div>
            <div><label className="label">Date de fin *</label><input className="input" type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} required /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Enregistrer' : 'Créer'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div className="text-center py-12 text-gray-500">Chargement...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map(p => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm('Supprimer ?')) deleteMutation.mutate(p.id); }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{p.nom}</h3>
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{p.code}</span>
              {p.cursus && <p className="text-sm text-gray-600 mt-1">{p.cursus.intitule}</p>}
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <div>📅 Du {formatDate(p.dateDebut)} au {formatDate(p.dateFin)}</div>
                {p.effectif && <div className="flex items-center gap-1"><Users className="w-3 h-3" />{p.effectif} apprenants</div>}
                <div>{p.planifications?.length || 0} cours planifiés</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
