import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Competence, BlocCompetence } from '../types';
import { Plus, Edit2, Trash2, Award } from 'lucide-react';

export default function CompetencesPage() {
  const qc = useQueryClient();
  const [showBlocForm, setShowBlocForm] = useState(false);
  const [showCompForm, setShowCompForm] = useState(false);
  const [editingComp, setEditingComp] = useState<Competence | null>(null);
  const [blocForm, setBlocForm] = useState({ code: '', intitule: '', description: '', rncp: '' });
  const [compForm, setCompForm] = useState({ code: '', intitule: '', description: '', blocId: '' });

  const { data: blocs = [] } = useQuery<BlocCompetence[]>({
    queryKey: ['blocs'],
    queryFn: () => api.get('/competences/blocs').then(r => r.data),
  });

  const { data: competences = [], isLoading } = useQuery<Competence[]>({
    queryKey: ['competences'],
    queryFn: () => api.get('/competences').then(r => r.data),
  });

  const createBlocMutation = useMutation({
    mutationFn: () => api.post('/competences/blocs', blocForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocs'] }); setBlocForm({ code: '', intitule: '', description: '', rncp: '' }); setShowBlocForm(false); },
  });

  const createCompMutation = useMutation({
    mutationFn: () => api.post('/competences', { ...compForm, blocId: compForm.blocId ? parseInt(compForm.blocId) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competences'] }); setCompForm({ code: '', intitule: '', description: '', blocId: '' }); setShowCompForm(false); },
  });

  const updateCompMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof compForm }) =>
      api.put(`/competences/${id}`, { ...data, blocId: data.blocId ? parseInt(data.blocId) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competences'] }); setEditingComp(null); setShowCompForm(false); setCompForm({ code: '', intitule: '', description: '', blocId: '' }); },
  });

  const deleteCompMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/competences/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competences'] }),
  });

  const startEditComp = (c: Competence) => {
    setEditingComp(c);
    setCompForm({ code: c.code, intitule: c.intitule, description: c.description || '', blocId: c.blocId?.toString() || '' });
    setShowCompForm(true);
  };

  // Group by bloc
  const grouped = competences.reduce((acc, c) => {
    const key = c.blocId?.toString() || 'none';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, Competence[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compétences</h1>
          <p className="text-gray-500 mt-1">{competences.length} compétences • {blocs.length} blocs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBlocForm(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau bloc
          </button>
          <button onClick={() => { setEditingComp(null); setCompForm({ code: '', intitule: '', description: '', blocId: '' }); setShowCompForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle compétence
          </button>
        </div>
      </div>

      {showBlocForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Nouveau bloc de compétences</h2>
          <form onSubmit={e => { e.preventDefault(); createBlocMutation.mutate(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Code *</label><input className="input" value={blocForm.code} onChange={e => setBlocForm({ ...blocForm, code: e.target.value })} required /></div>
            <div><label className="label">Intitulé *</label><input className="input" value={blocForm.intitule} onChange={e => setBlocForm({ ...blocForm, intitule: e.target.value })} required /></div>
            <div><label className="label">Code RNCP</label><input className="input" value={blocForm.rncp} onChange={e => setBlocForm({ ...blocForm, rncp: e.target.value })} /></div>
            <div><label className="label">Description</label><input className="input" value={blocForm.description} onChange={e => setBlocForm({ ...blocForm, description: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Créer le bloc</button>
              <button type="button" className="btn-secondary" onClick={() => setShowBlocForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {showCompForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editingComp ? 'Modifier la compétence' : 'Nouvelle compétence'}</h2>
          <form onSubmit={e => { e.preventDefault(); editingComp ? updateCompMutation.mutate({ id: editingComp.id, data: compForm }) : createCompMutation.mutate(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Code *</label><input className="input" value={compForm.code} onChange={e => setCompForm({ ...compForm, code: e.target.value })} required /></div>
            <div><label className="label">Intitulé *</label><input className="input" value={compForm.intitule} onChange={e => setCompForm({ ...compForm, intitule: e.target.value })} required /></div>
            <div>
              <label className="label">Bloc de compétences</label>
              <select className="input" value={compForm.blocId} onChange={e => setCompForm({ ...compForm, blocId: e.target.value })}>
                <option value="">Aucun bloc</option>
                {blocs.map(b => <option key={b.id} value={b.id}>{b.intitule}</option>)}
              </select>
            </div>
            <div><label className="label">Description</label><input className="input" value={compForm.description} onChange={e => setCompForm({ ...compForm, description: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editingComp ? 'Enregistrer' : 'Créer'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowCompForm(false); setEditingComp(null); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <div className="text-center py-12 text-gray-500">Chargement...</div> : (
        <div className="space-y-6">
          {blocs.map(bloc => {
            const blocsComps = grouped[bloc.id.toString()] || [];
            return (
              <div key={bloc.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{bloc.intitule}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono">{bloc.code}</span>
                      {bloc.rncp && <span className="badge bg-indigo-50 text-indigo-600">{bloc.rncp}</span>}
                      <span>{blocsComps.length} compétence(s)</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {blocsComps.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-600">{c.code}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{c.intitule}</p>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button onClick={() => startEditComp(c)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (confirm('Supprimer ?')) deleteCompMutation.mutate(c.id); }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {grouped['none'] && grouped['none'].length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-700 mb-4">Compétences sans bloc</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {grouped['none'].map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-mono text-xs text-gray-500">{c.code}</span>
                      <p className="text-sm font-medium text-gray-700">{c.intitule}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => startEditComp(c)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Supprimer ?')) deleteCompMutation.mutate(c.id); }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
