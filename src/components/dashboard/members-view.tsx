'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import { StatusBadge } from './status-badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Member {
  id: string;
  societe: string;
  pays: string;
  email: string;
  categorie: string;
  statutPaiement: string;
  statutActivation: string;
  montant: number;
  dateInscription: string;
}

interface CategoryData {
  id: string;
  nom: string;
  count: number;
  pourcentage: number;
}

const PIE_COLORS = ['#362981', '#009446', '#029CB1', '#9AD2E2', '#C7FFEE'];

export function MembersView() {
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/members').then((r) => r.json()).then((d) => setMembers(d.members || [])),
      fetch('/api/dashboard/categories').then((r) => r.json()).then((d) => setCategories(d.categories || [])),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derived data for charts
  const byCategory = categories.map((c) => ({ name: c.nom, value: c.count }));
  const paymentStatusData = React.useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      map[m.statutPaiement] = (map[m.statutPaiement] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [members]);

  const activationData = React.useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      map[m.statutActivation] = (map[m.statutActivation] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [members]);

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* By Category - Horizontal Bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Membres par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={55} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="value" name="Membres" fill="#362981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status - Stacked Bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Statut de Paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[paymentStatusData]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="value" name="Nombre" fill="#009446" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activation Status - Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Statut d&apos;Activation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {activationData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Liste des Membres</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'id', header: 'Code', className: 'w-24 font-medium' },
              { key: 'societe', header: 'Société' },
              { key: 'pays', header: 'Pays' },
              {
                key: 'categorie',
                header: 'Catégorie',
                render: (item) => (
                  <span className="text-xs">{(item as unknown as Member).categorie}</span>
                ),
              },
              {
                key: 'statutPaiement',
                header: 'Paiement',
                render: (item) => <StatusBadge status={(item as unknown as Member).statutPaiement} />,
              },
              {
                key: 'statutActivation',
                header: 'Activation',
                render: (item) => <StatusBadge status={(item as unknown as Member).statutActivation} />,
              },
              { key: 'montant', header: 'Montant (€)', className: 'text-right' },
            ]}
            data={members as unknown as Record<string, unknown>[]}
            pageSize={10}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
