import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Cursus, OrdonancementResult, Alerte } from '../types';
import { AlertTriangle, CheckCircle, Info, Play, RefreshCw, ArrowRight } from 'lucide-react';

const ALERTE_CONFIG: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  ERROR: { color: 'bg-red-50 border-red-200 text-red-800', icon: AlertTriangle },
  WARNING: { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: AlertTriangle },
  INFO: { color: 'bg-blue-50 border-blue-200 text-blue-800', icon: Info },
};

function AlerteItem({ alerte }: { alerte: Alerte }) {
  const config = ALERTE_CONFIG[alerte.severite] || ALERTE_CONFIG.INFO;
  const Icon = config.icon;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.color}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="text-sm">
        {alerte.coursCode && <span className="font-mono text-xs mr-2">[{alerte.coursCode}]</span>}
        {alerte.message}
      </div>
    </div>
  );
}

export default function OrdonancementPage() {
  const qc = useQueryClient();
  const [selectedCursus, setSelectedCursus] = useState<number | null>(null);

  const { data: cursus = [] } = useQuery<Cursus[]>({
    queryKey: ['cursus'],
    queryFn: () => api.get('/cursus').then(r => r.data),
  });

  const { data: result, isLoading, refetch } = useQuery<OrdonancementResult>({
    queryKey: ['ordonnancement', selectedCursus],
    queryFn: () => api.get(`/ordonnancement/cursus/${selectedCursus}`).then(r => r.data),
    enabled: !!selectedCursus,
  });

  const applyMutation = useMutation({
    mutationFn: () => api.post(`/ordonnancement/cursus/${selectedCursus}/appliquer`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cursus'] });
      refetch();
      alert('Ordre appliqué avec succès !');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erreur lors de l\'application');
    },
  });

  const erreurs = result?.alertes.filter(a => a.severite === 'ERROR') || [];
  const avertissements = result?.alertes.filter(a => a.severite === 'WARNING') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ordonnancement</h1>
        <p className="text-gray-500 mt-1">Analyse et optimisation de l'ordre des cours</p>
      </div>

      {/* Sélection du cursus */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Sélectionner un cursus</h2>
        <div className="flex gap-3 flex-wrap">
          {cursus.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCursus(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedCursus === c.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {c.intitule}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Analyse en cours...</div>}

      {result && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{erreurs.length}</div>
              <div className="text-sm text-gray-500 mt-1">Erreurs</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{avertissements.length}</div>
              <div className="text-sm text-gray-500 mt-1">Avertissements</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{result.nombreCours}</div>
              <div className="text-sm text-gray-500 mt-1">Cours analysés</div>
            </div>
          </div>

          {/* Alertes */}
          {result.alertes.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Alertes détectées</h2>
              <div className="space-y-2">
                {result.alertes.map((a, i) => <AlerteItem key={i} alerte={a} />)}
              </div>
            </div>
          )}

          {/* Ordre suggéré */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Ordre suggéré (tri topologique)</h2>
              <div className="flex gap-2">
                <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2 text-sm py-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Recalculer
                </button>
                {erreurs.length === 0 && (
                  <button
                    onClick={() => { if (confirm('Appliquer cet ordre au cursus ?')) applyMutation.mutate(); }}
                    className="btn-primary flex items-center gap-2 text-sm py-1.5"
                    disabled={applyMutation.isPending}
                  >
                    <Play className="w-3.5 h-3.5" /> Appliquer
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {result.ordreSuggere.map((item, idx) => {
                const hasAlerte = result.alertes.some(a => a.coursId === item.coursId);
                return (
                  <div
                    key={item.coursId}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${hasAlerte ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${hasAlerte ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {idx + 1}
                    </div>
                    {idx > 0 && <ArrowRight className="w-4 h-4 text-gray-300 -mx-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200">{item.code}</span>
                        <span className="font-medium text-sm text-gray-900">{item.titre}</span>
                        {hasAlerte && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                        {!hasAlerte && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.raisonnement}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparaison */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Comparaison : Ordre actuel vs Ordre suggéré</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ordre actuel</h3>
                <div className="space-y-1">
                  {result.ordreActuel.sort((a, b) => a.ordre - b.ordre).map((item, idx) => (
                    <div key={item.coursId} className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50">
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center shrink-0">{idx + 1}</span>
                      <span className="font-mono text-xs text-gray-500">{item.code}</span>
                      <span className="text-gray-700 truncate">{item.titre}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ordre suggéré</h3>
                <div className="space-y-1">
                  {result.ordreSuggere.map((item, idx) => {
                    const currentItem = result.ordreActuel.find(o => o.coursId === item.coursId);
                    const moved = currentItem && currentItem.ordre !== idx + 1;
                    return (
                      <div key={item.coursId} className={`flex items-center gap-2 text-sm p-2 rounded ${moved ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <span className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center shrink-0 ${moved ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span>
                        <span className="font-mono text-xs text-gray-500">{item.code}</span>
                        <span className="text-gray-700 truncate">{item.titre}</span>
                        {moved && <span className="ml-auto text-xs text-blue-600 shrink-0">déplacé</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Info about algorithm */}
          <div className="card bg-blue-50 border border-blue-100">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Algorithme de tri topologique (Kahn)</h3>
                <p className="text-sm text-blue-800">
                  L'ordre suggéré utilise l'algorithme de Kahn, qui respecte les dépendances entre cours (prérequis) 
                  et détecte automatiquement les cycles impossibles. Chaque cours est placé après tous ses prérequis, 
                  avec un tri secondaire basé sur l'ordre manuel défini. Cet algorithme est O(V+E), 
                  donc performant même pour de grands cursus.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedCursus && (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-4xl mb-3">🔀</div>
          <p className="text-gray-500">Sélectionnez un cursus pour analyser son ordonnancement</p>
        </div>
      )}
    </div>
  );
}
