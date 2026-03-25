import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Salle } from '../types';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';

const TYPES_SALLE = ['SALLE', 'LABO', 'AMPHI', 'SALLE_INFO', 'DISTANCIEL'];
const TYPE_LABELS: Record<string, string> = {
  SALLE: 'Salle', LABO: 'Laboratoire', AMPHI: 'Amphithéâtre', SALLE_INFO: 'Salle Info', DISTANCIEL: 'Distanciel',
};
const emptyForm = { nom: '', code: '', capacite: '', type: 'SALLE', equipements: '', batiment: '' };

export default function SallesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Salle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: salles = [], isLoading } = useQuery<Salle[]>({
    queryKey: ['salles'],
    queryFn: () => api.get('/salles').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/salles', {
      ...data, capacite: parseInt(data.capacite),
      equipements: data.equipements ? data.equipements.split(',').map(e => e.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salles'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/salles/${id}`, {
      ...data, capacite: parseInt(data.capacite),
      equipements: data.equipements ? data.equipements.split(',').map(e => e.trim()) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salles'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/salles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salles'] }),
  });

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditing(null); };

  const startEdit = (s: Salle) => {
    setEditing(s);
    let equipStr = '';
    if (s.equipements) { try { equipStr = JSON.parse(s.equipements).join(', '); } catch { equipStr = s.equipements; } }
    setForm({ nom: s.nom, code: s.code, capacite: s.capacite.toString(), type: s.type, equipements: equipStr, batiment: s.batiment || '' });
    setShowForm(true);
  };

  const parseEquipements = (s: Salle): string[] => {
    if (!s.equipements) return [];
    try { return JSON.parse(s.equipements); } catch { return [s.equipements]; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salles & Ressources</h1>
          <p className="text-gray-500 mt-1">{salles.length} salles</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle salle
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifier' : 'Nouvelle salle'}</h2>
          <form onSubmit={e => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></div>
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></div>
            <div><label className="label">Capacité *</label><input className="input" type="number" min="1" value={form.capacite} onChange={e => setForm({ ...form, capacite: e.target.value })} required /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES_SALLE.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div><label className="label">Bâtiment</label><input className="input" value={form.batiment} onChange={e => setForm({ ...form, batiment: e.target.value })} /></div>
            <div><label className="label">Équipements (séparés par des virgules)</label><input className="input" value={form.equipements} onChange={e => setForm({ ...form, equipements: e.target.value })} placeholder="PC, Vidéoprojecteur, ..." /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Enregistrer' : 'Créer'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div className="text-center py-12 text-gray-500">Chargement...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {salles.map(s => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(s)} className="text-gray-400 hover:text-blue-600 p-1 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm('Supprimer cette salle ?')) deleteMutation.mutate(s.id); }} className="text-gray-400 hover:text-red-600 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{s.nom}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.code}</span>
                <span className="badge bg-orange-50 text-orange-700 text-xs">{TYPE_LABELS[s.type] || s.type}</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" /> {s.capacite} places
                {s.batiment && <span className="ml-2">• {s.batiment}</span>}
              </div>
              {parseEquipements(s).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {parseEquipements(s).map(eq => <span key={eq} className="badge bg-gray-100 text-gray-600 text-xs">{eq}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
