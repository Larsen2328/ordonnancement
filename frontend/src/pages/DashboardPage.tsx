import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { DashboardData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GraduationCap, BookOpen, Users, Building2, Clock, Calendar } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  THEORIQUE: '#3b82f6', TP: '#10b981', PROJET: '#f59e0b',
  EVALUATION: '#ef4444', ATELIER: '#8b5cf6', ACCOMPAGNEMENT: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
  THEORIQUE: 'Théorie', TP: 'TP', PROJET: 'Projet',
  EVALUATION: 'Évaluation', ATELIER: 'Atelier', ACCOMPAGNEMENT: 'Accompagnement',
};

const MODALITE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  if (!data) return null;

  const { statistiques, repartitionParType, repartitionParModalite, activiteRecente } = data;

  const stats = [
    { label: 'Cursus', value: statistiques.nbCursus, icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
    { label: 'Cours', value: statistiques.nbCours, icon: BookOpen, color: 'bg-green-100 text-green-700' },
    { label: 'Formateurs', value: statistiques.nbFormateurs, icon: Users, color: 'bg-purple-100 text-purple-700' },
    { label: 'Salles', value: statistiques.nbSalles, icon: Building2, color: 'bg-orange-100 text-orange-700' },
    { label: 'Promotions', value: statistiques.nbPromotions, icon: Calendar, color: 'bg-pink-100 text-pink-700' },
    { label: 'Volume horaire', value: `${statistiques.volumeHoraireTotalHeures}h`, icon: Clock, color: 'bg-indigo-100 text-indigo-700' },
  ];

  const typeData = repartitionParType.map(r => ({
    name: TYPE_LABELS[r.type] || r.type,
    value: r.count,
    color: TYPE_COLORS[r.type] || '#6b7280',
  }));

  const modaliteData = repartitionParModalite.map((r, i) => ({
    name: r.modalite,
    value: r.count,
    color: MODALITE_COLORS[i % MODALITE_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de la gestion pédagogique</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Répartition par type de cours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Cours">
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Modalités pédagogiques</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modaliteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {modaliteData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Activité récente</h2>
        <div className="space-y-3">
          {activiteRecente.length === 0 && <p className="text-sm text-gray-500">Aucune activité récente</p>}
          {activiteRecente.map(log => (
            <div key={log.id} className="flex items-start gap-3 text-sm">
              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                log.action === 'CREATE' ? 'bg-green-500' :
                log.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
              }`} />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{log.action}</span> sur <span className="font-medium">{log.entite}</span>
                {log.user && <span className="text-gray-500"> par {log.user.prenom} {log.user.nom}</span>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{new Date(log.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
