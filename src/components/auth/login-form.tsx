'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      login({
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
        token: data.token,
      });
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#362981] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-[#C7FFEE]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#9AD2E2]" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-[#009446]" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <Image src="/logo.jpg" alt="AAEA" width={80} height={80} className="rounded-xl" />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white">AAEA</h1>
            <p className="text-lg text-white/80">African Water and Sanitation Association</p>
          </div>
          <p className="text-sm text-white/60 max-w-xs mt-4">
            Tableau de bord de gestion des adhésions et cotisations
          </p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-lg lg:border">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col gap-6">
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center justify-center gap-3 mb-4">
                <Image src="/logo.jpg" alt="AAEA" width={48} height={48} className="rounded-xl" />
                <div>
                  <h1 className="text-xl font-bold text-[#362981]">AAEA</h1>
                  <p className="text-xs text-muted-foreground">Membership Dashboard</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-[#362981]">Connexion</h2>
                <p className="text-sm text-muted-foreground">
                  Entrez vos identifiants pour accéder au tableau de bord
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="kalexane@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#362981] hover:bg-[#372D72] text-white font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>

              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  AAEA/AfWASA © {new Date().getFullYear()} — Tous droits réservés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
