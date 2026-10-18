import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { IconX, IconEye, IconShieldCheck, IconAlertTriangle } from '../common/Icons';

export default function AdminLogin({ onLoginSuccess, onBackToStore }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Error de configuración del servidor de acceso.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Credenciales incorrectas. Verifica el correo y la contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('El correo aún no ha sido confirmado en el sistema.');
        } else if (error.status === 429) {
          setErrorMessage('Demasiados intentos fallidos. Por seguridad, espera unos minutos.');
        } else {
          setErrorMessage(`Error de acceso: ${error.message}`);
        }
        return;
      }

      if (data?.session) {
        if (onLoginSuccess) onLoginSuccess(data.session);
      }
    } catch (err) {
      setErrorMessage('Error inesperado de conexión. Revisa tu acceso a internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-stone-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Fondo rústico y resplandores cálidos */}
      <div className="absolute inset-0 bg-stone-950 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-[#cb6115]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#f59e0b]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Tarjeta de Login */}
      <div className="relative z-10 max-w-md w-full bg-stone-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-scale-up">
        {/* Bevel superior de cristal */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-6">
          <img
            src="/logokampina3.webp"
            alt="La Kampiña"
            className="h-12 w-auto mx-auto mb-3 object-contain filter drop-shadow-md"
          />
          <h1 className="font-display font-bold text-xl sm:text-2xl text-white tracking-wide">
            Portal de Control
          </h1>
          <p className="text-xs text-amber-400 font-bold tracking-widest uppercase mt-1">
            La Kampiña • Cochabamba
          </p>
        </div>

        {/* Mensaje de error */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-medium flex items-center justify-between space-x-2 animate-fade-in">
            <div className="flex items-center space-x-2 min-w-0">
              <IconAlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="p-1 hover:text-white flex-shrink-0"
              aria-label="Cerrar error"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lakampina.bo"
              autoComplete="email"
              disabled={isLoading}
              className="w-full bg-stone-950/80 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full bg-stone-950/80 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition duration-200 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-3 p-1 text-stone-400 hover:text-amber-300 transition cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                title={showPassword ? 'Ocultar' : 'Ver'}
              >
                <IconEye className={`w-4 h-4 ${showPassword ? 'text-amber-400' : 'text-stone-400'}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 text-white font-bold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#cb6115] via-[#df6f1c] to-[#e67a28] hover:brightness-110 active:scale-[0.98]"
          >
            {isLoading ? 'Verificando acceso...' : 'Ingresar al Portal'}
          </button>
        </form>

        {/* Footer del login con botón para volver al menú */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={onBackToStore}
            className="text-xs text-stone-400 hover:text-amber-400 transition-colors duration-200 font-medium"
          >
            ← Volver a la Carta Pública
          </button>
        </div>
      </div>

      <p className="relative z-10 text-[11px] text-stone-600 mt-6">
        Acceso restringido • Sistema de Gestión La Kampiña
      </p>
    </div>
  );
}
