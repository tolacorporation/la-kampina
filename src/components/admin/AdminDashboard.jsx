import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  IconSearch,
  IconUtensils,
  IconMeat,
  IconX,
  IconLiveRadio,
  IconFlame,
  IconSettings,
  IconTag,
  IconCheck,
  IconAlertTriangle,
  IconLogOut,
  IconExternalLink,
  IconPhone,
  IconClock,
  IconEye,
  IconRefresh,
  IconStore,
  IconCamera,
  IconUpload,
  IconTrash,
} from '../common/Icons';
import { uploadAndAssignDishImage, removeDishImage, triggerKvSync } from '../../lib/imageUpload';

/**
 * Switch accesible y táctil con haptic visual feedback
 */
function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel = 'Toggle' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-emerald-500' : 'bg-stone-700'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function AdminDashboard({ user, onLogout, onGoToStore }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [onlySoldOut, setOnlySoldOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Estados de edición de precio
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceInputValue, setPriceInputValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para gestión de fotografía de platos (Storage)
  const [photoModalDish, setPhotoModalDish] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Estado de Ajustes (Live, Horarios, WhatsApp, etc.)
  const [settings, setSettings] = useState({
    live_discount_active: 'false',
    live_discount_amount: '5',
    live_discount_title: '¡Estamos En Vivo! Descuento especial en todos los platos',
    whatsapp_number: '59163993851',
    is_closed_override: 'false',
    closed_message: 'Hoy cerrado por evento privado',
    schedule_hours: '12:00 PM - 18:00 PM',
  });

  // Estado del Jueves de Ají
  const [ajiPromo, setAjiPromo] = useState(null);

  // Pestaña activa ('menu' | 'promos' | 'settings')
  const [currentTab, setCurrentTab] = useState('menu');

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Cargar datos
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Platos y categorías
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select(`
          id, slug, name, short_name, sort_order, is_active,
          products (
            id, slug, name, short_name, description, image_url, sort_order, is_active,
            product_options (id, name, short_name, badge, price, sort_order, is_active)
          )
        `)
        .order('sort_order', { ascending: true });

      if (catErr) throw catErr;
      setCategories(catData || []);

      // 2. Settings generales
      const { data: setData } = await supabase.from('store_settings').select('key, value');
      if (setData) {
        const map = {};
        setData.forEach((item) => {
          map[item.key] = item.value;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }

      // 3. Promoción Jueves de Ají
      const { data: promoData } = await supabase
        .from('event_promotions')
        .select('*')
        .eq('is_weekly', true)
        .eq('day_of_week', 4)
        .maybeSingle();

      if (promoData) setAjiPromo(promoData);
    } catch (err) {
      console.error(err);
      showToast('Error cargando datos del menú', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guardar un valor específico de store_settings en Supabase
  const updateSingleSetting = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast('Ajuste actualizado correctamente');
      triggerKvSync();
    } catch (e) {
      console.error(e);
      showToast('Error al guardar ajuste', 'error');
    }
  };

  // Toggle rápido de Modo Live
  const handleToggleLive = async () => {
    const nextState = settings.live_discount_active === 'true' ? 'false' : 'true';
    await updateSingleSetting('live_discount_active', nextState);
    showToast(
      nextState === 'true'
        ? `Modo Live activado (-${settings.live_discount_amount || 5} Bs. en platos)`
        : 'Modo Live desactivado (Precios regulares restaurados)'
    );
  };

  // Toggle rápido de Jueves de Ají
  const handleToggleAji = async () => {
    if (!ajiPromo) return;
    const nextState = !ajiPromo.is_active;
    setAjiPromo((prev) => ({ ...prev, is_active: nextState }));
    try {
      const { error } = await supabase
        .from('event_promotions')
        .update({ is_active: nextState })
        .eq('id', ajiPromo.id);
      if (error) throw error;
      showToast(nextState ? 'Especial de Ají activado en carta' : 'Especial de Ají pausado');
      triggerKvSync();
    } catch (e) {
      showToast('Error al actualizar especial de ají', 'error');
    }
  };

  // Toggle rápido de Cierre Temporal del Local
  const handleToggleClosed = async () => {
    const nextState = settings.is_closed_override === 'true' ? 'false' : 'true';
    await updateSingleSetting('is_closed_override', nextState);
    showToast(
      nextState === 'true'
        ? 'Cierre temporal activado (Pedidos bloqueados en la carta)'
        : 'Local abierto (Recepción de pedidos normal)'
    );
  };

  // Toggle de disponibilidad de plato (Disponible / Agotado)
  const handleToggleDish = async (productId, currentStatus) => {
    setIsUpdating(true);
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          products: cat.products.map((p) =>
            p.id === productId ? { ...p, is_active: newStatus } : p
          ),
        }))
      );

      showToast(newStatus ? 'Plato disponible en la carta' : 'Plato marcado como agotado');
      triggerKvSync();
    } catch (err) {
      showToast('Error al cambiar disponibilidad', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Guardar nuevo precio de una opción
  const handleSavePrice = async (optionId, currentPrice) => {
    const parsed = parseFloat(priceInputValue);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Ingresa un precio numérico válido', 'error');
      return;
    }
    if (parsed === parseFloat(currentPrice)) {
      setEditingPriceId(null);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('product_options')
        .update({ price: parsed })
        .eq('id', optionId);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          products: cat.products.map((p) => ({
            ...p,
            product_options: p.product_options.map((opt) =>
              opt.id === optionId ? { ...opt, price: parsed } : opt
            ),
          })),
        }))
      );

      setEditingPriceId(null);
      showToast(`Precio actualizado: ${parsed} Bs.`);
      triggerKvSync();
    } catch (err) {
      showToast('Error al actualizar precio', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Procesar archivo de imagen y subir a Supabase Storage con compresión WebP
  const processAndUploadFile = async (file) => {
    if (!file || !photoModalDish) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP o AVIF).');
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const { publicUrl } = await uploadAndAssignDishImage(
        photoModalDish.id,
        photoModalDish.slug,
        file
      );

      // Actualizar estado local reactivo inmediatamente
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          products: cat.products.map((p) =>
            p.id === photoModalDish.id ? { ...p, image_url: publicUrl } : p
          ),
        }))
      );

      setPhotoModalDish((prev) => (prev ? { ...prev, image_url: publicUrl } : null));
      showToast(`Foto de "${photoModalDish.name}" actualizada con éxito`);
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setUploadError(err.message || 'Error al procesar y subir la fotografía.');
      showToast('Error al subir la fotografía', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoModalDish) return;
    if (
      !window.confirm(
        `¿Quitar la fotografía de "${photoModalDish.name}"? El plato volverá a mostrar la ilustración rústica tradicional.`
      )
    ) {
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      await removeDishImage(photoModalDish.id, photoModalDish.image_url);

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          products: cat.products.map((p) =>
            p.id === photoModalDish.id ? { ...p, image_url: null } : p
          ),
        }))
      );

      setPhotoModalDish((prev) => (prev ? { ...prev, image_url: null } : null));
      showToast(`Fotografía quitada de "${photoModalDish.name}"`);
    } catch (err) {
      console.error('Error al quitar foto:', err);
      setUploadError(err.message || 'Error al desasignar la fotografía.');
      showToast('Error al quitar la fotografía', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processAndUploadFile(files[0]);
    }
  };

  // Aplanar todos los platos para la vista
  const allDishes = categories.flatMap((cat) =>
    (cat.products || []).map((p) => ({
      ...p,
      categoryName: cat.name,
      categoryId: cat.id,
      categorySlug: cat.slug,
    }))
  );

  const activeDishesCount = allDishes.filter((d) => d.is_active).length;
  const soldOutCount = allDishes.filter((d) => !d.is_active).length;

  const filteredDishes = allDishes.filter((dish) => {
    const matchesCategory =
      selectedCategory === 'all' || dish.categoryId === selectedCategory;
    const matchesQuery =
      !searchFilter ||
      dish.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      dish.categoryName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesSoldOut = !onlySoldOut || !dish.is_active;
    return matchesCategory && matchesQuery && matchesSoldOut;
  });

  const isLiveActive = settings.live_discount_active === 'true';
  const isClosedOverride = settings.is_closed_override === 'true';

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-[#cb6115] selection:text-white pb-24">
      {/* Toast Notification Minimalista */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-scale-up max-w-sm">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-center space-x-3 text-xs font-semibold ${
              toastMessage.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <IconAlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <IconCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="leading-tight">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Ejecutivo */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-2xl border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand + Status */}
          <div className="flex items-center space-x-3">
            <img
              src="/logokampina3.webp"
              alt="La Kampiña"
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-display font-black text-sm tracking-wide text-white uppercase">
                  La Kampiña
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  Portal de Control
                </span>
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onGoToStore}
              className="text-stone-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Abrir la carta pública en modo cliente"
            >
              <span>Ver Menú</span>
              <IconExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl text-stone-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition cursor-pointer active:scale-95"
              title="Recargar datos"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-stone-400 hover:text-red-400 bg-white/[0.06] hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition cursor-pointer active:scale-95"
              title="Cerrar sesión"
            >
              <IconLogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 1. COMMAND STRIP: Switches Maestros de Alta Prioridad */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Modo Live */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
              isLiveActive
                ? 'bg-rose-950/40 border-rose-500/40 shadow-[0_4px_30px_rgba(244,63,94,0.15)]'
                : 'bg-stone-900/60 border-white/[0.08]'
            }`}
          >
            <div className="flex items-start space-x-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isLiveActive
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-stone-800/80 border-white/10 text-stone-400'
                }`}
              >
                <IconLiveRadio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h2 className="font-display font-bold text-xs sm:text-sm text-white truncate">
                    Descuento Live
                  </h2>
                  {isLiveActive && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-rose-500 text-white">
                      En Vivo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-tight truncate">
                  {isLiveActive
                    ? `-${settings.live_discount_amount || 5} Bs. en platos`
                    : 'Activa descuento en directos'}
                </p>
              </div>
            </div>

            <ToggleSwitch
              checked={isLiveActive}
              onChange={handleToggleLive}
              ariaLabel="Activar Modo Live"
            />
          </div>

          {/* Card 2: Jueves de Ají */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
              ajiPromo?.is_active
                ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_4px_30px_rgba(245,158,11,0.12)]'
                : 'bg-stone-900/60 border-white/[0.08]'
            }`}
          >
            <div className="flex items-start space-x-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  ajiPromo?.is_active
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-stone-800/80 border-white/10 text-stone-400'
                }`}
              >
                <IconFlame className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h2 className="font-display font-bold text-xs sm:text-sm text-white truncate">
                    Jueves de Ají
                  </h2>
                  {ajiPromo?.is_active && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400 text-stone-950">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-tight truncate">
                  {ajiPromo?.is_active ? 'Banner visible en carta' : 'Banner especial oculto'}
                </p>
              </div>
            </div>

            <ToggleSwitch
              checked={Boolean(ajiPromo?.is_active)}
              onChange={handleToggleAji}
              ariaLabel="Activar Banner Jueves de Ají"
            />
          </div>

          {/* Card 3: Cierre Temporal (Control de Pedidos) */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
              isClosedOverride
                ? 'bg-red-950/40 border-red-500/40 shadow-[0_4px_30px_rgba(239,68,68,0.18)]'
                : 'bg-stone-900/60 border-white/[0.08]'
            }`}
          >
            <div className="flex items-start space-x-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isClosedOverride
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {isClosedOverride ? (
                  <IconAlertTriangle className="w-4 h-4" />
                ) : (
                  <IconStore className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h2 className="font-display font-bold text-xs sm:text-sm text-white truncate">
                    Recepción de Pedidos
                  </h2>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isClosedOverride
                        ? 'bg-red-500 text-white'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isClosedOverride ? 'Pausados' : 'Abierto'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-tight truncate">
                  {isClosedOverride
                    ? `${settings.closed_message || 'Hoy cerrado por evento privado'}`
                    : 'Recibiendo pedidos normales'}
                </p>
              </div>
            </div>

            <ToggleSwitch
              checked={isClosedOverride}
              onChange={handleToggleClosed}
              ariaLabel="Cerrar local temporalmente"
            />
          </div>
        </section>

        {/* 2. TELEMETRÍA RÁPIDA (Contadores de Estado) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-900/40 border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
              <IconUtensils className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-medium uppercase text-stone-400 block">
                Platos Activos
              </span>
              <span className="font-display font-bold text-base text-white tabular-nums">
                {activeDishesCount} / {allDishes.length}
              </span>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
              soldOutCount > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {soldOutCount > 0 ? (
                <IconAlertTriangle className="w-4 h-4" />
              ) : (
                <IconCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono font-medium uppercase text-stone-400 block">
                Platos Agotados
              </span>
              <span className={`font-display font-bold text-base tabular-nums ${
                soldOutCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {soldOutCount}
              </span>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
              isLiveActive
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-white/[0.04] border-white/10 text-stone-400'
            }`}>
              <IconLiveRadio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-medium uppercase text-stone-400 block">
                Modo Live
              </span>
              <span className={`font-display font-bold text-xs uppercase tracking-wide ${
                isLiveActive ? 'text-rose-400' : 'text-stone-400'
              }`}>
                {isLiveActive ? `Activo (-${settings.live_discount_amount} Bs)` : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-white/[0.06] rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <IconPhone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-medium uppercase text-stone-400 block truncate">
                WhatsApp
              </span>
              <span className="font-display font-bold text-xs text-white truncate block">
                +{settings.whatsapp_number || '591'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. SEGMENTED TABS: Navegación de Vistas Adaptable (Sin recortes ni overflow oculto) */}
        <div className="w-full bg-stone-900/90 sm:bg-transparent p-1.5 sm:p-0 rounded-2xl sm:rounded-none border border-white/10 sm:border-0 sm:border-b sm:border-white/[0.08] sm:pb-3">
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:space-x-2">
            {/* Tab 1: Carta y Precios */}
            <button
              type="button"
              onClick={() => setCurrentTab('menu')}
              className={`min-h-[46px] sm:min-h-0 px-2 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer select-none active:scale-95 ${
                currentTab === 'menu'
                  ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/20'
                  : 'text-stone-400 hover:text-white bg-stone-950/40 sm:bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
              title="Ver Carta y Precios"
            >
              <IconUtensils className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="inline sm:hidden">Carta</span>
                <span className="hidden sm:inline">Carta y Precios</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                  currentTab === 'menu' ? 'bg-stone-950/20 text-stone-950' : 'bg-white/10 text-stone-300'
                }`}
              >
                {allDishes.length}
              </span>
            </button>

            {/* Tab 2: Promociones y Live */}
            <button
              type="button"
              onClick={() => setCurrentTab('promos')}
              className={`min-h-[46px] sm:min-h-0 px-2 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer select-none active:scale-95 ${
                currentTab === 'promos'
                  ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/20'
                  : 'text-stone-400 hover:text-white bg-stone-950/40 sm:bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
              title="Configurar Promociones y Modo Live"
            >
              <IconTag className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="inline sm:hidden">Promos & Live</span>
                <span className="hidden sm:inline">Promociones y Live</span>
              </span>
              {isLiveActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              )}
            </button>

            {/* Tab 3: Ajustes del Local */}
            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className={`min-h-[46px] sm:min-h-0 px-2 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer select-none active:scale-95 ${
                currentTab === 'settings'
                  ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/20'
                  : 'text-stone-400 hover:text-white bg-stone-950/40 sm:bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
              title="Ajustes del Local y Horarios"
            >
              <IconSettings className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="inline sm:hidden">Ajustes</span>
                <span className="hidden sm:inline">Ajustes del Local</span>
              </span>
            </button>
          </div>
        </div>

        {/* 4. CONTENIDO: TAB CARTA Y PRECIOS */}
        {currentTab === 'menu' && (
          <div className="space-y-4">
            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-stone-900/40 p-3 rounded-2xl border border-white/[0.06]">
              {/* Buscador */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por nombre de plato o categoría..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-stone-950/80 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition"
                />
                <IconSearch className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botón Filtro Agotados */}
              {soldOutCount > 0 && (
                <button
                  onClick={() => setOnlySoldOut(!onlySoldOut)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition flex items-center space-x-2 self-start sm:self-auto cursor-pointer ${
                    onlySoldOut
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  }`}
                >
                  <IconAlertTriangle className="w-3.5 h-3.5" />
                  <span>{soldOutCount} Platos Agotados</span>
                </button>
              )}
            </div>

            {/* Categorías (Pills Horizontales con scroll táctil suave) */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1.5 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 active:scale-95 ${
                  selectedCategory === 'all'
                    ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                    : 'text-stone-400 hover:text-white bg-white/[0.04] border border-transparent'
                }`}
              >
                Todos ({allDishes.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 active:scale-95 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'text-stone-400 hover:text-white bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {cat.name} ({cat.products?.length || 0})
                </button>
              ))}
            </div>

            {/* Lista Grid de Platos (Diseño Terminal Restaurant POS) */}
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                  Cargando carta en tiempo real...
                </p>
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="py-20 text-center text-stone-500 bg-stone-900/30 rounded-3xl border border-white/[0.06]">
                <IconUtensils className="w-8 h-8 mx-auto mb-2 text-stone-600" />
                <p className="text-xs font-medium">No se encontraron platos que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDishes.map((dish) => {
                  const primaryOption = dish.product_options?.[0];
                  const hasMultipleOptions = (dish.product_options?.length || 0) > 1;

                  return (
                    <div
                      key={dish.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                        dish.is_active
                          ? 'bg-stone-900/80 border-white/[0.08] hover:border-white/20'
                          : 'bg-stone-950 border-rose-500/20 opacity-75'
                      }`}
                    >
                      {/* Top: Miniatura, Información y Switch de Disponibilidad */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          {/* Miniatura interactiva con trigger de cambio de foto */}
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoModalDish(dish);
                              setUploadError(null);
                            }}
                            className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-950 border border-white/10 hover:border-amber-400/60 flex-shrink-0 flex items-center justify-center group cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-inner"
                            title="Toca para cambiar o subir la foto de este plato"
                          >
                            {dish.image_url ? (
                              <img
                                src={dish.image_url}
                                alt={dish.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <IconMeat className="w-6 h-6 text-[#cb6115] group-hover:scale-110 transition-transform duration-300" />
                            )}

                            {/* Overlay hover/touch con icono de cámara */}
                            <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-300 backdrop-blur-[1px]">
                              <IconCamera className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Foto</span>
                            </div>

                            {/* Badge de cámara discreto en la esquina */}
                            <div className="absolute bottom-0 right-0 p-1 bg-stone-950/80 backdrop-blur-sm rounded-tl-md text-stone-400 group-hover:text-amber-400 transition-colors">
                              <IconCamera className="w-2.5 h-2.5" />
                            </div>

                            {!dish.is_active && (
                              <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                                <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">
                                  Agotado
                                </span>
                              </div>
                            )}
                          </button>

                          {/* Título & Categoría */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-display font-bold text-sm text-white truncate">
                                {dish.name}
                              </h3>
                              {primaryOption?.badge && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 flex-shrink-0">
                                  {primaryOption.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-stone-400 uppercase font-mono font-medium">
                                {dish.categoryName}
                              </span>
                              <span className="text-stone-600 text-[10px]">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoModalDish(dish);
                                  setUploadError(null);
                                }}
                                className="text-[10px] text-amber-400/80 hover:text-amber-300 font-medium underline-offset-2 hover:underline cursor-pointer flex items-center space-x-1 transition"
                              >
                                <IconCamera className="w-2.5 h-2.5" />
                                <span>{dish.image_url ? 'Cambiar foto' : 'Subir foto'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Switch de Disponibilidad */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <button
                            onClick={() => handleToggleDish(dish.id, dish.is_active)}
                            disabled={isUpdating}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center space-x-1.5 ${
                              dish.is_active
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                            }`}
                            title={dish.is_active ? 'Click para marcar como Agotado' : 'Click para marcar como Disponible'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <span>{dish.is_active ? 'Disponible' : 'Agotado'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Bottom: Módulo Estructurado de Precio de Venta (100% Ordenado, Uniforme y Espacioso) */}
                      <div className="mt-2 pt-3 border-t border-white/[0.08] flex flex-col gap-2">
                        {/* Cabecera del Módulo de Precio */}
                        <div className="flex items-center justify-between text-xs px-0.5">
                          <div className="flex items-center space-x-1.5 text-stone-300">
                            <IconTag className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-stone-300">
                              {hasMultipleOptions ? 'Porciones y Precios' : 'Precio de Venta'}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider flex items-center space-x-1">
                            <span>Toca para editar</span>
                            <span className="text-amber-400/80">✎</span>
                          </span>
                        </div>

                        {/* Cápsula(s) de Precio de Ancho Completo y Geometría Uniforme */}
                        <div className={`grid gap-2 ${hasMultipleOptions ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                          {dish.product_options?.map((opt) => {
                            const isEditingThisPrice = editingPriceId === opt.id;

                            // Etiqueta limpia: evita duplicar el nombre del plato y usa badges o porción regular
                            const portionLabel = hasMultipleOptions
                              ? opt.name
                              : opt.badge
                              ? opt.badge
                              : opt.name && opt.name.toLowerCase() !== dish.name.toLowerCase() && opt.name !== 'Porción Estándar'
                              ? opt.name
                              : 'Porción Estándar';

                            if (isEditingThisPrice) {
                              return (
                                <div
                                  key={opt.id}
                                  className="w-full flex items-center justify-between gap-2 bg-stone-950 border-2 border-amber-400 rounded-xl px-3 py-2 shadow-xl animate-scale-up"
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                                    <span className="text-xs font-mono font-bold text-amber-200 truncate">
                                      {portionLabel}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                                    <input
                                      type="number"
                                      step="1"
                                      value={priceInputValue}
                                      onChange={(e) => setPriceInputValue(e.target.value)}
                                      autoFocus
                                      className="w-20 sm:w-24 bg-stone-900 border border-white/20 rounded-lg px-2.5 py-1 text-base sm:text-lg font-mono font-black text-amber-300 text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                    <span className="text-xs font-mono font-black text-amber-400">Bs.</span>
                                    <button
                                      type="button"
                                      onClick={() => handleSavePrice(opt.id, opt.price)}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 transition cursor-pointer active:scale-95 shadow-md"
                                      title="Guardar precio"
                                    >
                                      <IconCheck className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Guardar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPriceId(null)}
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer active:scale-95"
                                      title="Cancelar"
                                    >
                                      <IconX className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setEditingPriceId(opt.id);
                                  setPriceInputValue(opt.price);
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-400/[0.08] hover:bg-amber-400/[0.15] border border-amber-400/25 hover:border-amber-400/60 transition-all duration-200 group active:scale-[0.99] cursor-pointer shadow-sm text-left"
                                title="Toca para editar este precio"
                              >
                                {/* Lado Izquierdo: Porción / Tipo Ordenado */}
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full bg-amber-400/60 group-hover:bg-amber-400 transition-colors flex-shrink-0" />
                                  <span className="text-xs font-mono font-semibold text-stone-300 group-hover:text-white transition-colors truncate">
                                    {portionLabel}
                                  </span>
                                </div>

                                {/* Lado Derecho: Precio Numérico Prominente y Moneda */}
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                  <div className="flex items-baseline space-x-1">
                                    <span className="font-mono font-black text-lg sm:text-xl text-amber-300 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                                      {opt.price}
                                    </span>
                                    <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-wide">
                                      Bs.
                                    </span>
                                  </div>
                                  <span
                                    className="text-xs font-bold text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-transform"
                                    title="Editar precio"
                                  >
                                    ✎
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. CONTENIDO: TAB PROMOCIONES Y LIVE */}
        {currentTab === 'promos' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Sección: Descuento en Vivo */}
            <div className="bg-stone-900/80 p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <IconLiveRadio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">
                      Descuento de Transmisión en Vivo
                    </h3>
                    <p className="text-xs text-stone-400">
                      Configuración del descuento automático en directos de TikTok y Facebook.
                    </p>
                  </div>
                </div>

                <ToggleSwitch
                  checked={isLiveActive}
                  onChange={handleToggleLive}
                  ariaLabel="Toggle Live"
                />
              </div>

              {/* Parámetros del Live */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-stone-300">
                    Monto de Descuento (Bs.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.live_discount_amount || '5'}
                      onChange={(e) => updateSingleSetting('live_discount_amount', e.target.value)}
                      className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-stone-400 font-mono">
                      Bs. / plato
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    Se deduce automáticamente de cada plato calificado.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-stone-300">
                    Texto del Banner Promocional
                  </label>
                  <input
                    type="text"
                    value={settings.live_discount_title || ''}
                    onChange={(e) => updateSingleSetting('live_discount_title', e.target.value)}
                    placeholder="¡Estamos En Vivo! Descuento especial en todos los platos"
                    className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[11px] text-stone-500 block">
                    Mensaje visible en la cabecera de la tienda.
                  </span>
                </div>
              </div>

              {/* Vista Previa en Vivo (Live Preview) */}
              <div className="pt-3 border-t border-white/[0.06]">
                <div className="flex items-center space-x-1.5 mb-2.5 text-xs font-bold text-stone-400">
                  <IconEye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vista previa de cómo lo ve el cliente en su teléfono:</span>
                </div>

                <div className="bg-stone-950 rounded-2xl p-4 border border-white/10">
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping flex-shrink-0" />
                      <span className="font-black uppercase tracking-wider text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                        En Vivo
                      </span>
                      <p className="text-xs font-bold truncate">
                        {settings.live_discount_title || 'Descuento especial en todos los platos'}
                      </p>
                    </div>
                    <span className="font-mono font-black text-xs bg-black/20 px-2 py-0.5 rounded-lg flex-shrink-0">
                      -{settings.live_discount_amount || 5} Bs.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Jueves de Ají */}
            <div className="bg-stone-900/80 p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <IconFlame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">
                      Especial Jueves de Ají de Fideo
                    </h3>
                    <p className="text-xs text-stone-400">
                      Tradición cochabambina destacada en la cabecera todos los jueves.
                    </p>
                  </div>
                </div>

                <ToggleSwitch
                  checked={Boolean(ajiPromo?.is_active)}
                  onChange={handleToggleAji}
                  ariaLabel="Toggle Jueves de Ají"
                />
              </div>

              {ajiPromo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase text-stone-300">
                      Título del Evento
                    </label>
                    <input
                      type="text"
                      value={ajiPromo.title || ''}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setAjiPromo((p) => ({ ...p, title: val }));
                        await supabase
                          .from('event_promotions')
                          .update({ title: val })
                          .eq('id', ajiPromo.id);
                      }}
                      className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase text-stone-300">
                      Descripción de la Promo
                    </label>
                    <input
                      type="text"
                      value={ajiPromo.description || ''}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setAjiPromo((p) => ({ ...p, description: val }));
                        await supabase
                          .from('event_promotions')
                          .update({ description: val })
                          .eq('id', ajiPromo.id);
                      }}
                      className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. CONTENIDO: TAB AJUSTES DEL LOCAL */}
        {currentTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-5 bg-stone-900/80 p-6 rounded-3xl border border-white/[0.08] shadow-xl">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="font-display font-bold text-base text-white">
                Información Operativa del Local
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Datos de contacto y disponibilidad de atención al público.
              </p>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-stone-300 flex items-center space-x-1.5">
                <IconPhone className="w-3.5 h-3.5 text-amber-400" />
                <span>WhatsApp de Pedidos y Delivery</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => updateSingleSetting('whatsapp_number', e.target.value)}
                  placeholder="59163993851"
                  className="flex-1 bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-emerald-500/20 text-xs font-bold text-stone-300 hover:text-emerald-300 border border-white/10 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Probar Chat</span>
                  <IconExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[11px] text-stone-500 block">
                Incluye el código de país sin signos (Ej: 59163993851).
              </span>
            </div>

            {/* Horario de Atención */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-stone-300 flex items-center space-x-1.5">
                <IconClock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horario de Atención al Cliente</span>
              </label>
              <input
                type="text"
                value={settings.schedule_hours || ''}
                onChange={(e) => updateSingleSetting('schedule_hours', e.target.value)}
                placeholder="12:00 PM - 18:00 PM"
                className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-stone-500 block">
                Formato: 12:00 PM - 18:00 PM. Se refleja en tiempo real en la portada del restaurante.
              </span>
            </div>

            {/* Control Maestro de Cierre Temporal */}
            <div className="pt-4 border-t border-white/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-white">
                    Cierre Temporal del Local (Bloqueo de Pedidos)
                  </h3>
                  <p className="text-xs text-stone-400">
                    Inhabilita todo el sistema de pedidos en la carta pública y muestra un aviso oficial.
                  </p>
                </div>
                <ToggleSwitch
                  checked={isClosedOverride}
                  onChange={handleToggleClosed}
                  ariaLabel="Cierre temporal"
                />
              </div>

              {isClosedOverride && (
                <div className="space-y-3 bg-stone-950/80 p-4 rounded-2xl border border-red-500/30 animate-scale-up">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase text-stone-300">
                      Mensaje del Aviso al Público
                    </label>
                    <input
                      type="text"
                      value={settings.closed_message || ''}
                      onChange={(e) => updateSingleSetting('closed_message', e.target.value)}
                      placeholder="Hoy cerrado por evento privado"
                      className="w-full bg-stone-900 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  {/* Botones de Motivo Rápido */}
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-stone-400 block mb-1.5">
                      Motivos Frecuentes (Toca para aplicar):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Hoy cerrado por evento privado',
                        'Feriado familiar, volvemos mañana',
                        'Cocina al tope de pedidos por el momento',
                        'Mantenimiento programado del local',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateSingleSetting('closed_message', preset)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/[0.04] hover:bg-white/[0.1] text-stone-300 border border-white/10 transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vista Previa de la Alerta en Carta */}
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono font-bold uppercase text-stone-400 block mb-1">
                      Vista previa del banner en la carta pública:
                    </span>
                    <div className="bg-amber-500 text-stone-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-md">
                      <div className="flex items-center space-x-2 truncate">
                        <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          <span className="uppercase text-[9px] bg-stone-950 text-amber-300 px-1.5 py-0.5 rounded font-black mr-1">
                            Local Cerrado
                          </span>
                          {settings.closed_message || 'Hoy cerrado por evento privado'} · Pedidos pausados
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-black hidden sm:inline flex-shrink-0">
                        Solo Lectura
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-stone-500">
              <span>La Kampiña • Sistema de Administración</span>
              <span>Guardado en tiempo real</span>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Gestión de Fotografía */}
      {photoModalDish && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            if (!isUploadingPhoto) setPhotoModalDish(null);
          }}
        >
          <div
            className="relative w-full max-w-lg bg-stone-900 border border-white/15 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <IconCamera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-white truncate">
                    {photoModalDish.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono">
                    {photoModalDish.categoryName || 'Plato de la carta'} • Fotografía
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPhotoModalDish(null)}
                disabled={isUploadingPhoto}
                className="p-2 rounded-xl text-stone-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/10 transition cursor-pointer disabled:opacity-30"
                title="Cerrar ventana"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Vista previa de imagen actual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                  Vista Previa Actual
                </span>
                {photoModalDish.image_url ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Visible en la Carta</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-stone-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    Sin foto (Ilustración tradicional)
                  </span>
                )}
              </div>

              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-stone-950 border border-white/10 flex items-center justify-center">
                {photoModalDish.image_url ? (
                  <img
                    src={photoModalDish.image_url}
                    alt={photoModalDish.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-600 p-6 text-center">
                    <IconUtensils className="w-12 h-12 mb-2 text-stone-700" />
                    <p className="text-xs font-medium text-stone-400">
                      Este plato no tiene fotografía asignada.
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1">
                      En la carta pública se muestra el icono tradicional de La Kampiña.
                    </p>
                  </div>
                )}

                {/* Overlay de carga cuando está subiendo */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
                    <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">Optimizando y subiendo...</p>
                      <p className="text-[10px] text-amber-300 font-mono mt-0.5">
                        Convirtiendo a WebP ultraligero
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zona de Carga / Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!isUploadingPhoto && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDraggingFile
                  ? 'border-amber-400 bg-amber-400/10 scale-[1.01]'
                  : 'border-white/15 hover:border-amber-400/50 bg-stone-950/40 hover:bg-stone-950/70'
              } ${isUploadingPhoto ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                <IconUpload className="w-6 h-6" />
              </div>

              <p className="font-display font-bold text-sm text-white">
                {photoModalDish.image_url ? 'Reemplazar por otra foto' : 'Subir foto del plato'}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Toca para seleccionar de tu galería o tomar foto con la cámara
              </p>
              <p className="text-[10px] text-stone-500 mt-2 font-mono">
                JPG, PNG o WEBP • Compresión WebP automática instantánea
              </p>
            </div>

            {/* Mensaje de error si existiera */}
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Acciones del pie del modal */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
              {photoModalDish.image_url ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                  title="Eliminar foto y restaurar ilustración tradicional"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  <span>Quitar foto</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setPhotoModalDish(null)}
                disabled={isUploadingPhoto}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer disabled:opacity-40"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
