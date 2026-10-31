'use client';

import React, { useState } from 'react';
import { ChatSession, Property } from '@/lib/types';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  PanelRightClose,
  Building2, 
  Star, 
  Sun, 
  Moon,
  User,
  LogOut,
  ShieldCheck,
  PhoneCall,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isAllowedAdminEmail } from '@/lib/admin-auth-client';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import WallpaperSelector, { ChatWallpaper } from '@/components/WallpaperSelector';
import { Locale } from '@/lib/i18n';

interface BrokerChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onSelectPrompt: (promptText: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  myListings?: Property[];
  onOpenSellerModal?: (mode?: 'list' | 'create', editProp?: Property | null) => void;
  onOpenContactBroker?: () => void;
  onOpenWallpaperModal?: () => void;
  onOpenAuthModal?: () => void;
  wallpaper?: ChatWallpaper;
  onSelectWallpaper?: (wp: ChatWallpaper) => void;
}

const SIDEBAR_SELLER_COPY: Record<
  Locale,
  { myListedUnits: string; listForSale: string; editUnit: string; sqm: string }
> = {
  ar: {
    myListedUnits: 'وحداتي المعروضة للبيع',
    listForSale: 'اعرض وحدة أو أرض للبيع',
    editUnit: 'تعديل الوحدة',
    sqm: 'م²',
  },
  en: {
    myListedUnits: 'My Listed Units',
    listForSale: 'List Unit / Land for Sale',
    editUnit: 'Edit Unit',
    sqm: 'm²',
  },
  tr: {
    myListedUnits: 'Satılık İlanlarım',
    listForSale: 'İlan / Arsa Ekle',
    editUnit: 'İlanı Düzenle',
    sqm: 'm²',
  },
  ru: {
    myListedUnits: 'Мои объекты на продажу',
    listForSale: 'Разместить объект / участок',
    editUnit: 'Редактировать',
    sqm: 'м²',
  },
  de: {
    myListedUnits: 'Meine Inserate',
    listForSale: 'Immobilie / Grundstück anbieten',
    editUnit: 'Bearbeiten',
    sqm: 'm²',
  },
  fr: {
    myListedUnits: 'Mes biens en vente',
    listForSale: 'Mettre un bien en vente',
    editUnit: 'Modifier',
    sqm: 'm²',
  },
  es: {
    myListedUnits: 'Mis propiedades en venta',
    listForSale: 'Publicar propiedad / terreno',
    editUnit: 'Editar',
    sqm: 'm²',
  },
};

export default function BrokerChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onSelectPrompt,
  isOpen,
  onToggle,
  favoritesCount,
  onOpenFavorites,
  myListings = [],
  onOpenSellerModal,
  onOpenContactBroker,
  onOpenWallpaperModal,
  onOpenAuthModal,
  wallpaper,
  onSelectWallpaper,
}: BrokerChatSidebarProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, t, isRtl } = useLanguage();
  const sellerCopy = SIDEBAR_SELLER_COPY[locale] || SIDEBAR_SELLER_COPY.en;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  const quickFilters = isRtl ? [
    { label: 'مشاريع معارض عقارات الرسمية', icon: '🏛️' },
    { label: 'شاليهات الساحل الشمالي والعين السخنة', icon: '🏖️' },
    { label: 'شقق التجمع الخامس بتقسيط 8 سنين', icon: '🏙️' },
    { label: 'الشيخ زايد و6 أكتوبر بمقدم 10%', icon: '🏡' },
    { label: 'وحدات استلام فوري جاهزة للسكن', icon: '🔑' },
  ] : [
    { label: 'Official Expo Partner Projects', icon: '🏛️' },
    { label: 'North Coast & Ain Sokhna Chalets', icon: '🏖️' },
    { label: 'New Cairo with 8-Year Installments', icon: '🏙️' },
    { label: 'Sheikh Zayed & October (10% Down)', icon: '🏡' },
    { label: 'Ready-to-Move Units', icon: '🔑' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onToggle}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        aria-hidden="true"
      />

      {/* Main Sidebar: Fixed permanently on the right so changing language never jumps the UI across the screen */}
      <aside 
        aria-label={t.chatHistory}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="fixed inset-y-0 right-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-l border-slate-200/90 bg-white text-slate-900 shadow-2xl transition-all duration-300 md:relative md:z-auto md:w-[290px] md:shadow-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {/* Brand & New Chat Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 p-3.5 dark:border-zinc-800/80">
          <button
            onClick={() => {
              onNewChat();
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onToggle();
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-3.5 py-2.5 text-xs font-black text-black shadow-sm transition hover:brightness-105 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>{t.newChat}</span>
          </button>

          {/* Close Sidebar icon */}
          <button
            onClick={onToggle}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="Toggle Sidebar"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        {/* Favorites & Seller Profile Units in Sidebar */}
        <div className="px-3 pt-3 space-y-2">
          <button
            onClick={onOpenFavorites}
            className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-500/15 dark:text-amber-400"
          >
            <span className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{t.savedUnits}</span>
            </span>
            <span className="rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-black text-black">
              {favoritesCount}
            </span>
          </button>

          {/* Contact Real Estate Broker button (Moved exclusively to sidebar per user request) */}
          {onOpenContactBroker && (
            <button
              onClick={() => {
                onOpenContactBroker();
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  onToggle();
                }
              }}
              className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-500/20 hover:text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 shadow-2xs"
              title={t.contactAdvisor}
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-amber-500" />
                <span>{t.contactAdvisor}</span>
              </span>
              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {isRtl ? 'مستشار معتمد' : 'Advisor'}
              </span>
            </button>
          )}

          {/* User's Own Listed Units for Sale (بروفايل البائع) */}
          {onOpenSellerModal && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onOpenSellerModal('list', null)}
                  className="flex flex-1 items-center justify-between text-xs font-black text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{sellerCopy.myListedUnits}</span>
                  </span>
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-[10px] font-black text-black">
                    {myListings.length}
                  </span>
                </button>
              </div>

              {myListings.length > 0 && (
                <div className="mt-2 space-y-1.5 border-t border-emerald-500/20 pt-2">
                  {myListings.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenSellerModal('list', item)}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-[11px] transition hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {item.unit_type}: {item.title}
                        </div>
                        <div className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          {(item.total_price || 0).toLocaleString()} {item.currency} • {item.area_sqm}{sellerCopy.sqm}
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"
                        title={sellerCopy.editUnit}
                      >
                        <Edit2 className="h-3 w-3" />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onOpenSellerModal('create', null)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-black text-black transition hover:bg-emerald-400"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>{sellerCopy.listForSale}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Discovery Presets */}
        <div className="px-3 pt-3">
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {t.quickFilters}
          </div>
          <div className="flex flex-col gap-1">
            {quickFilters.map((qf, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(qf.label)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left rtl:text-right text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <span>{qf.icon}</span>
                <span className="truncate">{qf.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {t.chatHistory}
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
              {t.noChats}
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const isEditing = editingId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      onToggle();
                    }
                  }}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs transition ${
                    isActive
                      ? 'bg-slate-100 font-bold text-slate-900 dark:bg-zinc-900 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(s.id, e as any);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full rounded-md border border-amber-500 bg-white px-1.5 py-0.5 text-xs text-slate-900 focus:outline-hidden dark:bg-zinc-800 dark:text-white"
                      />
                    ) : (
                      <span className="truncate">{s.title}</span>
                    )}
                  </div>

                  {/* Actions: Rename / Delete */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(s.id, e)}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartRename(s, e)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: User Account + Language Switcher and Theme Toggle in Sidebar */}
        <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50 space-y-2.5">
          {/* User Account Card */}
          {user ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-xs font-black text-black shadow-xs">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-[10px] text-slate-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isAllowedAdminEmail(user.email) && (
                  <Link
                    href="/admin"
                    className="grid h-8 w-8 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
                    title={isRtl ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  title={isRtl ? 'تسجيل الخروج' : 'Sign Out'}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-2.5 text-xs font-bold text-black shadow-xs transition hover:brightness-105 active:scale-[0.98]"
            >
              <User className="h-4 w-4" />
              <span>{isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}</span>
            </button>
          )}

          {/* Controls row: Language Selector + Wallpaper Modal Button + Theme Toggle */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <LanguageSelector />

            {onOpenWallpaperModal ? (
              <button
                type="button"
                onClick={onOpenWallpaperModal}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-amber-400 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                title={isRtl ? 'تغيير ورق حائط وخلفية الشات' : 'Change Chat Wallpaper'}
              >
                <Palette className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-bold">
                  {isRtl ? 'ورق الحائط' : 'Wallpaper'}
                </span>
              </button>
            ) : (
              wallpaper && onSelectWallpaper && (
                <WallpaperSelector
                  currentWallpaper={wallpaper}
                  onSelectWallpaper={onSelectWallpaper}
                  isRtl={isRtl}
                />
              )
            )}

            <button
              onClick={toggleTheme}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
