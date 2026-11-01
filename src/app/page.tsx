'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Building2, 
  Star, 
  Sun, 
  Moon, 
  PanelLeft, 
  PanelRight,
  PhoneCall, 
  ArrowUp,
  Loader2,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  ExternalLink,
  LogOut,
  ImagePlus,
  X,
  Plus,
  Zap,
  ShieldCheck,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { Property, ChatSession, ChatMessage, SessionContext, SellerFormPrefill, UsageInfo } from '@/lib/types';
import { emptySessionContext, toShownUnit } from '@/lib/ai/session-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { isAllowedAdminEmail } from '@/lib/admin-auth-client';
import BrokerChatSidebar from '@/components/BrokerChatSidebar';
import PropertyCard from '@/components/PropertyCard';
import BookingLeadModal from '@/components/BookingLeadModal';
import FavoritesModal from '@/components/FavoritesModal';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import LanguageSelector from '@/components/LanguageSelector';
import UsagePill from '@/components/UsagePill';
import AuthModal from '@/components/AuthModal';
import PricingModal from '@/components/PricingModal';
import UserPersonaModal, { UserPersona } from '@/components/UserPersonaModal';
import LeadQuotaUnlockModal from '@/components/LeadQuotaUnlockModal';
import BuyerAdvisorHandoverModal from '@/components/BuyerAdvisorHandoverModal';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import PropertiesTableModal from '@/components/PropertiesTableModal';
import InlinePropertiesTable from '@/components/InlinePropertiesTable';
import SellerPropertiesModal from '@/components/SellerPropertiesModal';
import DirectSearchPanel from '@/components/DirectSearchPanel';
import ChatWallpaperModal from '@/components/ChatWallpaperModal';
import { 
  CHAT_WALLPAPERS, 
  DEFAULT_WALLPAPER_ID, 
  DEFAULT_WALLPAPER_OPACITY, 
  getSavedWallpaperConfig, 
  saveWallpaperConfig 
} from '@/lib/chat-wallpapers';
import { ChatWallpaper } from '@/components/WallpaperSelector';
import { Locale } from '@/lib/i18n';

const OPEN_FORM_BTN_LABELS: Record<Locale, string> = {
  ar: '🏠 فتح فورم إضافة الوحدة للبيع',
  en: '🏠 Open Property Listing Form',
  tr: '🏠 Satılık İlan Formunu Aç',
  ru: '🏠 Открыть форму добавления объекта',
  de: '🏠 Immobilien-Formular öffnen',
  fr: '🏠 Ouvrir le formulaire de mise en vente',
  es: '🏠 Abrir formulario de propiedad',
};

export default function SkanybotChatPage() {
  const { locale, t, dir, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, session, signOut } = useAuth();
  const authHeaders = (): Record<string, string> =>
    session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [referencedProperty, setReferencedProperty] = useState<Property | null>(null);
  const [isReferencedCollapsed, setIsReferencedCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // open by default on md+, closed on mobile
    }
    return true;
  });

  // Application Mode: 'chat' (AI Agent) vs 'direct_search' (Off-Agent Instant Filter)
  const [appMode, setAppMode] = useState<'chat' | 'direct_search'>('chat');

  // Chat Wallpaper State with live user-controlled opacity & custom image support
  const [showWallpaperModal, setShowWallpaperModal] = useState<boolean>(false);
  const [wallpaperId, setWallpaperId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cfg = getSavedWallpaperConfig();
      return cfg.id;
    }
    return DEFAULT_WALLPAPER_ID;
  });
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const cfg = getSavedWallpaperConfig();
      return cfg.opacity;
    }
    return DEFAULT_WALLPAPER_OPACITY;
  });
  const [customWallpaperImage, setCustomWallpaperImage] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const cfg = getSavedWallpaperConfig();
      return cfg.customImage;
    }
    return undefined;
  });

  const activeWallpaper = useMemo(() => {
    if (wallpaperId === 'custom' && customWallpaperImage) {
      return {
        backgroundColor: '#000000',
        backgroundImage: `url(${customWallpaperImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center' as const,
        backgroundRepeat: 'no-repeat' as const,
      };
    }
    const found = CHAT_WALLPAPERS.find((w) => w.id === wallpaperId);
    return found ? found.style : CHAT_WALLPAPERS[0].style;
  }, [wallpaperId, customWallpaperImage]);

  const handleSelectWallpaper = (wp: ChatWallpaper) => {
    const id = (wp as string) === 'whatsapp' ? 'architectural' : wp;
    setWallpaperId(id);
    saveWallpaperConfig(id, wallpaperOpacity, customWallpaperImage);
  };

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [leadUnlockModalOpen, setLeadUnlockModalOpen] = useState(false);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<UserPersona | null>(null);

  // Daily Free Quota — enforced on the server to protect AI costs and keep service fast
  // Guest: 3 free trials · Registered: 20 free inquiries / day (resets daily at midnight)
  const GUEST_MSG_LIMIT = 3;
  const DAILY_LIMIT = 20;
  const [usage, setUsage] = useState<UsageInfo>({
    plan: 'guest',
    used: 0,
    limit: GUEST_MSG_LIMIT,
    remaining: GUEST_MSG_LIMIT,
    window: 'day',
    resetDate: '',
    proUntil: null,
  });
  const guestMsgCount = usage.plan === 'guest' ? Math.max(0, usage.limit - usage.remaining) : 0;
  const dailyUsage = usage;

  const refreshUsage = async () => {
    try {
      const res = await fetch('/api/usage', { headers: authHeaders(), cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        if (d.usage) setUsage(d.usage);
      }
    } catch {
      // non-blocking
    }
  };

  // Favorites state
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);

  // Booking lead modal state
  const [selectedPropertyForLead, setSelectedPropertyForLead] = useState<Property | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Fullscreen / Expanded Property Details & Gallery modal
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<Property | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Full results table (shown when a search matches more than the 4 cards)
  const [tableProps, setTableProps] = useState<{ list: Property[]; total: number } | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext>(() => emptySessionContext());

  // Seller Marketplace State (وحداتي المعروضة للبيع + رفع صور من الشات)
  const [localSellerId, setLocalSellerId] = useState<string>('guest_seller');
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [sellerModalMode, setSellerModalMode] = useState<'list' | 'create'>('list');
  const [sellerEditingProp, setSellerEditingProp] = useState<Property | null>(null);
  const [sellerPrefill, setSellerPrefill] = useState<SellerFormPrefill | null>(null);
  const [chatAttachedImages, setChatAttachedImages] = useState<string[]>([]);

  const sellerOwnerId = user?.id || localSellerId;

  const refreshMyListings = async (oid?: string) => {
    const targetOwner = oid || user?.id || localSellerId;
    if (!targetOwner) return;
    try {
      const res = await fetch(`/api/seller/properties?ownerId=${encodeURIComponent(targetOwner)}`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.properties)) setMyListings(d.properties);
      }
    } catch {}
  };

  useEffect(() => {
    try {
      let sid = localStorage.getItem('skanybot_seller_owner_id');
      if (!sid) {
        sid = `seller_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem('skanybot_seller_owner_id', sid);
      }
      setLocalSellerId(sid);
      refreshMyListings(user?.id || sid);
    } catch {}
  }, [user?.id]);

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files)
      .slice(0, 4)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 900;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
              setChatAttachedImages((prev) => [...prev.slice(0, 5), dataUrl]);
            }
          };
          img.src = String(ev.target?.result || '');
        };
        reader.readAsDataURL(file);
      });
    e.target.value = '';
  };

  const openPropertyDetails = (p: Property) => {
    setSelectedPropertyForDetails(p);
    setDetailsModalOpen(true);
    setSessionContext((prev) => {
      const next = { ...prev, focus: toShownUnit(p) };
      if (activeSessionId) {
        try { localStorage.setItem(`skanybot_ctx_${activeSessionId}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Floating Scroll to Bottom & Progressive Message Windowing
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const handleChatScroll = () => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 450);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Keep device snappy by windowing to latest 25 messages unless user requests all
  const MESSAGE_CHUNK_LIMIT = 25;
  const displayedMessages = useMemo(() => {
    if (showAllMessages || messages.length <= MESSAGE_CHUNK_LIMIT) {
      return messages;
    }
    return messages.slice(messages.length - MESSAGE_CHUNK_LIMIT);
  }, [messages, showAllMessages]);

  // Dynamic multilingual welcome prompts per selected country/language
  const getWelcomePrompts = () => {
    switch (locale) {
      case 'tr':
        return [
          {
            title: 'İstanbul & Boğaz Projeleri 🏛️',
            desc: 'Vatandaşlığa uygun lüks rezidanslar ve taksit imkanları',
            prompt: 'İstanbul\'da Türk vatandaşlığına uygun lüks daireleri göster'
          },
          {
            title: 'Antalya & Sahil Villaları 🏖️',
            desc: 'Özel havuzlu bağımsız villalar ve yüksek kira getirisi',
            prompt: 'Antalya\'da müstakil havuzlu sıfır villaları listele'
          },
          {
            title: 'Dubai Yatırım Fırsatları 🌐',
            desc: 'Marina ve Creek bölgesinde Golden Visa uyumlu birimler',
            prompt: 'Dubai Marina\'da yüksek getirili taksitli daireler'
          },
          {
            title: 'Hemen Teslim Daireler 🔑',
            desc: 'Taşınmaya hazır, tam donanımlı sıfır konutlar',
            prompt: 'Hemen teslim hazır satılık daire fırsatları'
          }
        ];
      case 'ru':
        return [
          {
            title: 'Недвижимость в Дубае (ОАЭ) 🌐',
            desc: 'Апартаменты в Marina и Creek под Golden Visa с рассрочкой',
            prompt: 'Покажи лучшие апартаменты в Дубае с рассрочкой под ВНЖ'
          },
          {
            title: 'Стамбул и Анталья (Турция) 🏛️',
            desc: 'Объекты под получение турецкого гражданства и ВНЖ',
            prompt: 'Квартиры в Турции под гражданство и готовые к заселению'
          },
          {
            title: 'Испания (Коста-дель-Соль) 🇪🇸',
            desc: 'Апартаменты с видом на море в Малаге под европейский ВНЖ',
            prompt: 'Недвижимость в Испании в Малаге с видом на море'
          },
          {
            title: 'Готовые объекты к заселению 🔑',
            desc: 'Полная чистовая отделка и сдача в этом году',
            prompt: 'Покажи квартиры с готовым ремонтом и быстрой сдачей'
          }
        ];
      case 'de':
        return [
          {
            title: 'Spanien & Costa del Sol 🇪🇸',
            desc: 'Luxuswohnungen in Málaga mit Meerblick & Golden Visa',
            prompt: 'Zeige mir Immobilien in Spanien Málaga mit Meerblick'
          },
          {
            title: 'Dubai Premium Investitionen 🌐',
            desc: 'Marina & Downtown mit hoher Rendite und flexibler Ratenzahlung',
            prompt: 'Top Investment-Apartments in Dubai mit Ratenzahlung'
          },
          {
            title: 'Türkei (Istanbul & Antalya) 🇹🇷',
            desc: 'Wohnungen und Villen mit hoher Mietrendite',
            prompt: 'Immobilien in Istanbul und Antalya anzeigen'
          },
          {
            title: 'Sofort bezugsfertige Einheiten 🔑',
            desc: 'Schlüsselfertig mit vollständiger Ausstattung',
            prompt: 'Zeige sofort bezugsfertige Wohnungen'
          }
        ];
      case 'fr':
        return [
          {
            title: 'Opportunités à Dubaï 🌐',
            desc: 'Appartements de luxe à Dubaï Marina éligibles Golden Visa',
            prompt: 'Montre-moi les appartements à Dubaï avec plan de paiement'
          },
          {
            title: 'Espagne & Costa del Sol 🇪🇸',
            desc: 'Biens immobiliers en bord de mer à Malaga et Marbella',
            prompt: 'Propriétés avec vue mer en Espagne à Malaga'
          },
          {
            title: 'Istanbul & Turquie 🇹🇷',
            desc: 'Résidences de standing éligibles à la nationalité',
            prompt: 'Appartements à Istanbul éligibles à la nationalité'
          },
          {
            title: 'Livraison immédiate 🔑',
            desc: 'Logements entièrement finis et prêts à habiter',
            prompt: 'Logements prêts à emménager immédiatement'
          }
        ];
      case 'es':
        return [
          {
            title: 'Costa del Sol y Málaga 🏖️',
            desc: 'Apartamentos con vistas al mar y amplias terrazas',
            prompt: 'Muéstrame apartamentos en Málaga con vistas al mar'
          },
          {
            title: 'Inversiones en Dubái 🌐',
            desc: 'Unidades de alto rendimiento en Dubái Marina con pagos a plazos',
            prompt: 'Oportunidades de inversión en Dubái con facilidades de pago'
          },
          {
            title: 'Turquía (Estambul y Antalya) 🇹🇷',
            desc: 'Villas y apartamentos con entrega inmediata',
            prompt: 'Propiedades en Estambul aptas para inversión'
          },
          {
            title: 'Entrega Inmediata 🔑',
            desc: 'Viviendas listas para entrar a vivir',
            prompt: 'Propiedades listas para entrega inmediata'
          }
        ];
      case 'ar':
        return [
          {
            title: 'كمبوندات التجمع الخامس والقاهرة الجديدة 🏛️',
            desc: 'ماونتن فيو، ميفيدا، زد إيست، وهايد بارك بمقدم يبدأ من 5%',
            prompt: 'عايز أفضل شقق وكمبوندات التجمع الخامس بالتقسيط'
          },
          {
            title: 'شاليهات الساحل الشمالي والعين السخنة 🏖️',
            desc: 'رأس الحكمة، مراسي، والمونت جلالة بأطول فترات سداد',
            prompt: 'عايز شاليه في الساحل الشمالي أو العين السخنة بالتقسيط'
          },
          {
            title: 'الشيخ زايد و6 أكتوبر والعاصمة الإدارية 🏢',
            desc: 'بادية بالم هيلز، أو ويست، وسوديك ويست بمقدم 10% وتقسيط 8 سنوات',
            prompt: 'شقق وفيلات في الشيخ زايد و6 أكتوبر بمقدم 10% وتقسيط مريح'
          },
          {
            title: 'استلام فوري في مصر الجديدة والمعادي ومدينتي 🔑',
            desc: 'وحدات كاملة التشطيب جاهزة للسكن الفوري أو الاستثمار',
            prompt: 'عايز شقق استلام فوري جاهزة للسكن في القاهرة'
          }
        ];
      default:
        return [
          {
            title: 'New Cairo & Fifth Settlement Compounds 🏛️',
            desc: 'Mountain View, Mivida, Zed East & Hyde Park from 5% down',
            prompt: 'Show me the best developments in New Cairo and Fifth Settlement'
          },
          {
            title: 'North Coast & Ain Sokhna Chalets 🏖️',
            desc: 'Ras El Hekma, Marassi & Galala beachfront units with installments',
            prompt: 'Show me chalets in North Coast and Ain Sokhna'
          },
          {
            title: 'Sheikh Zayed, 6th October & New Capital 🏢',
            desc: 'Palm Hills, O West, and SODIC with 10% down and 8-year plans',
            prompt: 'Looking for a 3-bedroom apartment in Sheikh Zayed or October with installments'
          },
          {
            title: 'Ready-to-Move Properties in Cairo 🔑',
            desc: 'Fully finished apartments available for immediate handover',
            prompt: 'Show me ready to move properties available for immediate handover'
          }
        ];
    }
  };

  const initialWelcomePrompts = getWelcomePrompts();

  // Initialize Sessions & Favorites from LocalStorage on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('skanybot_favorites') || localStorage.getItem('aqar_ai_favorites');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }

      const savedSessions = localStorage.getItem('skanybot_sessions') || localStorage.getItem('aqar_ai_sessions');
      if (savedSessions) {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          const latestId = parsed[0].id;
          setActiveSessionId(latestId);
          loadSessionMessages(latestId);
          return;
        }
      }
      
      createNewChat();
    } catch (e) {
      console.error('Failed to init local state:', e);
      createNewChat();
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Sync quota from the server whenever the signed-in user changes
  useEffect(() => {
    try { localStorage.removeItem('skanybot_guest_msgs'); } catch (e) {}
    refreshUsage();

    // Check user persona upon login / identity change
    try {
      const savedPersona = localStorage.getItem('skanybot_user_persona') as UserPersona | null;
      if (savedPersona) {
        setCurrentPersona(savedPersona);
        setSessionContext(prev => ({ ...prev, user_persona: savedPersona }));
      } else if (user) {
        // If authenticated user hasn't chosen a persona yet, present the onboarding dialog
        setPersonaModalOpen(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session?.access_token]);

  const handleSelectPersona = (persona: UserPersona) => {
    setCurrentPersona(persona);
    try {
      localStorage.setItem('skanybot_user_persona', persona);
    } catch {}
    setSessionContext(prev => ({
      ...prev,
      user_persona: persona,
    }));
  };

  const loadSessionMessages = (sessionId: string) => {
    try {
      const stored = localStorage.getItem(`skanybot_msgs_${sessionId}`) || localStorage.getItem(`aqar_ai_msgs_${sessionId}`);
      setMessages(stored ? JSON.parse(stored) : []);
      const ctxRaw = localStorage.getItem(`skanybot_ctx_${sessionId}`);
      setSessionContext(ctxRaw ? JSON.parse(ctxRaw) : emptySessionContext());
    } catch {
      setMessages([]);
      setSessionContext(emptySessionContext());
    }
  };

  const createNewChat = () => {
    // If the active chat is already blank with 0 messages, just stay on it and focus
    if (messages.length === 0) {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: isRtl ? 'استفسار عقاري جديد' : 'New Property Inquiry',
      created_at: new Date().toISOString()
    };

    setSessions(prev => {
      const updated = [newSession, ...prev.filter(s => s.id !== newId).slice(0, 20)];
      try {
        localStorage.setItem('skanybot_sessions', JSON.stringify(updated));
        localStorage.removeItem(`skanybot_msgs_${newId}`);
      } catch (e) {
        console.error('Error saving new chat:', e);
      }
      return updated;
    });

    setActiveSessionId(newId);
    setMessages([]);
    setSessionContext(emptySessionContext());

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteSession = async (id: string) => {
    // Calculate remaining sessions strictly excluding the deleted id
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);

    try {
      localStorage.setItem('skanybot_sessions', JSON.stringify(remaining));
      localStorage.removeItem(`skanybot_msgs_${id}`);
      localStorage.removeItem(`skanybot_ctx_${id}`);
      localStorage.removeItem(`aqar_ai_msgs_${id}`);
    } catch (e) {
      console.error('Failed to clean up localStorage on delete:', e);
    }

    if (activeSessionId === id) {
      if (remaining.length > 0) {
        const nextId = remaining[0].id;
        setActiveSessionId(nextId);
        loadSessionMessages(nextId);
      } else {
        // When last session is deleted: reset view to fresh blank state without resurrecting deleted session!
        const freshId = `session_${Date.now()}`;
        setActiveSessionId(freshId);
        setMessages([]);
        setSessionContext(emptySessionContext());
      }
    }

    // Soft delete in Supabase (never permanently purged, kept for admin auditing)
    try {
      fetch('/api/chat/delete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      }).catch(() => {});
    } catch {
      // Ignore background network error
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, title: newTitle } : s);
    setSessions(updated);
    localStorage.setItem('skanybot_sessions', JSON.stringify(updated));
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    loadSessionMessages(id);
  };

  const handleToggleFavorite = (prop: Property) => {
    let updated: Property[];
    const exists = favorites.some(f => f.id === prop.id);
    if (exists) {
      updated = favorites.filter(f => f.id !== prop.id);
    } else {
      updated = [...favorites, prop];
    }
    setFavorites(updated);
    try {
      localStorage.setItem('skanybot_favorites', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  };

  const handleBookViewing = (prop: Property) => {
    setSelectedPropertyForLead(prop);
    setBookingModalOpen(true);
  };

  const handleSendMessage = async (textToSend?: string) => {
    let rawQuery = (textToSend || inputText).trim();

    // If user typed a custom query and there's a referenced unit, prepend unit context:
    if (!textToSend && referencedProperty && rawQuery) {
      const loc = referencedProperty.compound?.city || referencedProperty.compound?.area_name || referencedProperty.location_text || '';
      const prefix = isRtl
        ? `[بخصوص وحدة: "${referencedProperty.title}" في ${loc} بسعر ${referencedProperty.total_price.toLocaleString('ar-EG')} ج.م ومساحة ${referencedProperty.area_sqm}م²]: `
        : `[Regarding unit: "${referencedProperty.title}" in ${loc} priced at ${referencedProperty.total_price.toLocaleString()} EGP (${referencedProperty.area_sqm} sqm)]: `;
      rawQuery = prefix + rawQuery;
      setReferencedProperty(null);
    }

    const imagesToSend = textToSend ? [] : [...chatAttachedImages];
    const query = rawQuery || (imagesToSend.length > 0 ? (isRtl ? 'دي صور الوحدة اللي عايز أبيعها' : 'Here are the photos of my property for sale') : '');
    if ((!query && imagesToSend.length === 0) || loading) return;

    // ── Quick UI pre-check (the server is the real gatekeeper) ──
    const isAdminUser = Boolean((user?.email && isAllowedAdminEmail(user.email)) || usage.plan === 'admin');
    if (!isAdminUser && usage.remaining <= 0) {
      if (!user) {
        setAuthModalOpen(true);
        return;
      }

      // Tier 1 reached (20 queries) -> Offer +50 bonus unlock with phone for serious buyers
      if (!usage.hasUnlockedBonus) {
        setLeadUnlockModalOpen(true);
        const errorMsg: ChatMessage = {
          id: `msg_${Date.now()}_limit`,
          session_id: activeSessionId || 'limit_session',
          role: 'assistant',
          content: isRtl
            ? `🎁 **لقد بلغت حد الاستفسارات اليومية (${usage.limit} استفساراً).**\n\nلأنك مهتم بجدية وتفاضل بين أفضل العروض، يمكنك فوراً فتح **+50 استفساراً مجاناً** برقم هاتفك لربطك مع مستشارك العقاري وتنسيق معاينات حصرية!\n\n*(اضغط على الزر الذهبي بالأعلى أو عبر النافذة الظاهرة الآن لإدخال رقمك وتفعيل الـ 50 استفساراً فوراً)*.`
            : `🎁 **You reached your daily quota (${usage.limit} queries).**\n\nUnlock **+50 bonus queries for free** right now with your phone number to connect with an accredited real estate consultant!`,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      // Tier 2 reached (70 queries) -> Human advisor handover & schedule viewings
      setHandoverModalOpen(true);
      const handoverMsg: ChatMessage = {
        id: `msg_${Date.now()}_handover`,
        session_id: activeSessionId || 'handover_session',
        role: 'assistant',
        content: isRtl
          ? `🤝 **لقد أتممت 70 استفساراً عقارياً اليوم بنجاح!**\n\nوصولك لهذه المرحلة يعني أنك جاهز للمعاينات الميدانية والتفاوض على العقود. مستشارك العقاري المعتمد جاهز الآن لمرافقتك شخصياً مجاناً وترتيب زيارات المشاريع والحصول على خصومات كاش إضافية من المطورين.\n\nيتجدد رصيدك الرقمي مجاناً بالكامل عند منتصف الليل (12:00 صباحاً بتوقيت القاهرة).`
          : `🤝 **You have completed 70 property queries today!**\n\nYour accredited real estate advisor is ready right now to assist you 1-on-1 for on-site viewings and developer discounts. Your quota resets at midnight Cairo time.`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, handoverMsg]);
      return;
    }

    setInputText('');
    if (!textToSend) setChatAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let currSessionId = activeSessionId;
    if (!currSessionId) {
      currSessionId = `session_${Date.now()}`;
      setActiveSessionId(currSessionId);
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      session_id: currSessionId,
      role: 'user',
      content: query,
      attached_images: imagesToSend.length > 0 ? imagesToSend : undefined,
      created_at: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    // Auto-update session title from first user query (and insert into sidebar history if fresh)
    if (messages.length === 0) {
      const autoTitle = query.slice(0, 32) + (query.length > 32 ? '...' : '');
      setSessions(prev => {
        const exists = prev.some(s => s.id === currSessionId);
        let updated: ChatSession[];
        if (exists) {
          updated = prev.map(s => s.id === currSessionId ? { ...s, title: autoTitle } : s);
        } else {
          const freshSession: ChatSession = {
            id: currSessionId!,
            title: autoTitle,
            created_at: new Date().toISOString()
          };
          updated = [freshSession, ...prev.slice(0, 20)];
        }
        try {
          localStorage.setItem('skanybot_sessions', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          sessionId: currSessionId,
          message: query,
          locale: locale,
          history: newHistory.slice(-10),
          sessionContext,
          sellerOwnerId,
          attachedImages: imagesToSend
        })
      });

      const data = await response.json();
      if (data.usage) setUsage(data.usage);

      if (response.status === 401 || data.error === 'login_required') {
        setAuthModalOpen(true);
        throw new Error(data.message || (isRtl ? 'يرجى تسجيل الدخول مجاناً للمتابعة' : 'Please sign in to continue'));
      }

      if (response.status === 429) {
        if (data.canUnlockBonus || !usage.hasUnlockedBonus) {
          setLeadUnlockModalOpen(true);
        } else if (data.reason === 'buyer_consultant_handover') {
          setHandoverModalOpen(true);
        }
        throw new Error(data.message || (isRtl ? 'وصلت للحد الأقصى اليومي. يتجدد رصيدك تلقائياً عند منتصف الليل!' : 'Daily limit reached. Resets tomorrow!'));
      }

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_b`,
        session_id: currSessionId,
        role: 'assistant',
        content: data.content || (isRtl ? 'عذراً، حدث خطأ أثناء الاستعلام. يرجى إعادة المحاولة.' : 'Sorry, a query error occurred. Please try again.'),
        properties: data.properties || [],
        all_properties: data.allProperties || [],
        total_matches: data.totalMatches || 0,
        suggested_actions: data.suggestedActions || [],
        open_seller_modal: Boolean(data.openSellerModal),
        seller_prefill: data.sellerPrefill || null,
        duration_seconds: data.duration_seconds,
        created_at: new Date().toISOString()
      };

      const finalMessages = [...newHistory, botMsg];
      setMessages(finalMessages);
      if (data.sessionContext) {
        setSessionContext(data.sessionContext);
        try { localStorage.setItem(`skanybot_ctx_${currSessionId}`, JSON.stringify(data.sessionContext)); } catch {}
      }
      if (data.sellerUpdated) {
        if (Array.isArray(data.myListings)) {
          setMyListings(data.myListings);
        } else {
          refreshMyListings();
        }
      }
      // Automatically open SellerPropertiesModal in 'create' mode when the chatbot triggers it!
      if (data.openSellerModal) {
        setSellerEditingProp(null);
        setSellerPrefill(data.sellerPrefill || null);
        setSellerModalMode(data.sellerModalMode || 'create');
        setSellerModalOpen(true);
      }

      try {
        // Only the latest 3 replies keep their full results table in storage (keeps localStorage small)
        const lastIdx = finalMessages.length;
        const lean = finalMessages.map((m, i) => (i < lastIdx - 6 && m.all_properties ? { ...m, all_properties: undefined } : m));
        localStorage.setItem(`skanybot_msgs_${currSessionId}`, JSON.stringify(lean));
      } catch (e) {
        console.error('Failed to cache messages:', e);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        session_id: currSessionId,
        role: 'assistant',
        content: isRtl 
          ? `⚠️ عذراً، تعذر الاتصال بقاعدة بيانات العقارات: ${err.message || 'خطأ غير معروف'}`
          : `⚠️ Sorry, unable to query property database: ${err.message || 'Unknown error'}`,
        created_at: new Date().toISOString()
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // Smart Bridge from Off-Agent Direct Search to AI Broker Chat
  const handleSendToChat = (property: Property, customQuery?: string) => {
    // 1. Injected focus unit into session context
    setSessionContext((prev) => {
      const next = { ...prev, focus: toShownUnit(property) };
      if (activeSessionId) {
        try { localStorage.setItem(`skanybot_ctx_${activeSessionId}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });

    // 2. Switch mode to chat & set referenced unit
    setAppMode('chat');
    setReferencedProperty(property);
    setIsReferencedCollapsed(false);

    // 3. Scroll smoothly to chat input, focus, and scroll chat above the dock
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      scrollToBottom();
    }, 150);

    // 4. If explicit custom query was provided, send it
    if (customQuery) {
      setTimeout(() => {
        handleSendMessage(customQuery);
      }, 150);
    }
  };

  const handleTriggerReferencedAction = (actionKey: 'score' | 'pros_cons' | 'valuation' | 'installments') => {
    if (!referencedProperty) return;
    const p = referencedProperty;
    const loc = p.compound?.city || p.compound?.area_name || p.location_text || '';
    let q = '';

    if (actionKey === 'score') {
      q = isRtl
        ? `عايزك تقيّم لي الصفقة دي بدقة وسكورها من 0 لـ 100 وهل سعرها عادل ومناسب للشراء مقارنة بالسوق: "${p.title}" في ${loc} بسعر ${p.total_price.toLocaleString('ar-EG')} ج.م ومساحة ${p.area_sqm}م².`
        : `Please evaluate this property deal score (0-100) and tell me if it is fairly priced: "${p.title}" in ${loc} priced at ${p.total_price.toLocaleString()} EGP (${p.area_sqm} sqm).`;
    } else if (actionKey === 'pros_cons') {
      q = isRtl
        ? `بصراحة وبدون مجاملة، إيه مميزات وعيوب هذه الوحدة وموقعها والمطور والخدمات: "${p.title}" في ${loc} بسعر ${p.total_price.toLocaleString('ar-EG')} ج.م؟`
        : `Frankly, what are the pros and cons of this unit, its location, and developer: "${p.title}" in ${loc} at ${p.total_price.toLocaleString()} EGP?`;
    } else if (actionKey === 'valuation') {
      q = isRtl
        ? `سعّر لي الوحدة دي بالذكاء الاصطناعي والموديل الكمي (AVM) وقولي نطاق السعر العادل وسرعة البيع المتوقعة: "${p.title}" مساحة ${p.area_sqm}م² في ${loc} بسعر مطلوب ${p.total_price.toLocaleString('ar-EG')} ج.م.`
        : `Please run AI Automated Valuation (AVM) for: "${p.title}" (${p.area_sqm} sqm in ${loc}) asking price ${p.total_price.toLocaleString()} EGP.`;
    } else if (actionKey === 'installments') {
      q = isRtl
        ? `احسب لي أفضل خطة أقساط ومقدم تفصيلية لوحدة: "${p.title}" بسعر إجمالي ${p.total_price.toLocaleString('ar-EG')} ج.م وتقسيط ${p.installment_years} سنوات ومقدم ${p.down_payment_pct}%.`
        : `Calculate the best installment plan and schedule for: "${p.title}" at ${p.total_price.toLocaleString()} EGP over ${p.installment_years} years.`;
    }

    setReferencedProperty(null);
    handleSendMessage(q);
  };

  const handleCompareWithChat = (properties: Property[]) => {
    if (properties.length === 0) return;
    setAppMode('chat');

    const names = properties.map((p, idx) => 
      `${idx + 1}. ${p.title} في ${p.compound?.name || p.location_text || ''} (السعر: ${p.total_price.toLocaleString('ar-EG')} ${p.currency || 'ج.م'})`
    ).join('\n');

    const prompt = isRtl
      ? `أريد منك مقارنة تفصيلية واستشارية دقيقة بين الوحدات التالية من حيث الموقع، السعر، خطط التقسيط، سمعة المطور، وجدوى الاستثمار:\n\n${names}\n\nما هي الوحدة الأفضل وفقاً للمعايير؟`
      : `Please provide a detailed comparative analysis between these properties:\n\n${names}\n\nWhich one offers better value and investment potential?`;

    setTimeout(() => {
      handleSendMessage(prompt);
    }, 120);
  };

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-black dark:text-zinc-100" 
      dir="rtl"
    >
      {/* ChatGPT-Style Sidebar: In RTL (Arabic) it renders first at the RIGHT. In LTR (others) it renders first at the LEFT. */}
      <BrokerChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={createNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setFavoritesModalOpen(true)}
        myListings={myListings}
        onOpenSellerModal={(mode = 'list', editProp = null) => {
          setSellerModalMode(mode);
          setSellerEditingProp(editProp);
          setSellerPrefill(null);
          setSellerModalOpen(true);
        }}
        onOpenContactBroker={() => {
          setSelectedPropertyForLead(null);
          setBookingModalOpen(true);
        }}
        onOpenPricing={() => setPricingModalOpen(true)}
        onOpenWallpaperModal={() => setShowWallpaperModal(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        wallpaper={wallpaperId as any}
        onSelectWallpaper={handleSelectWallpaper}
      />

      {/* Main Chat Area */}
      <main
        className={`relative flex flex-1 flex-col h-full min-w-0 overflow-hidden transition-colors duration-300 ${
          appMode === 'chat' && (wallpaperId === 'architectural' || wallpaperId === 'whatsapp')
            ? 'chat-theme-architectural'
            : appMode === 'chat' && wallpaperId === 'watermelon'
            ? 'chat-theme-watermelon'
            : appMode === 'chat' && wallpaperId === 'arabesque'
            ? 'chat-theme-arabesque'
            : appMode === 'chat' && wallpaperId === 'blueprint_grid'
            ? 'chat-theme-blueprint_grid'
            : appMode === 'chat' && wallpaperId === 'dots'
            ? 'chat-theme-dots'
            : appMode === 'chat' && wallpaperId === 'solid_oled'
            ? 'chat-theme-solid_oled'
            : 'bg-white dark:bg-zinc-950'
        }`}
      >
        {/* Top Header Bar with Theme & Language controls */}
        <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-2 sm:px-4 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80 z-20">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {/* Show toggle button in header ONLY when sidebar is closed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-slate-50/80 text-slate-700 transition hover:bg-slate-100 hover:text-black dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                title={isRtl ? 'إظهار الشريط الجانبي' : 'Open Sidebar'}
              >
                {isRtl ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </button>
            )}

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-2xs">
                <img 
                  src="/logo.png" 
                  alt="sakanybot" 
                  className="h-full w-full object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <span className="hidden lg:inline text-base font-black tracking-tight text-slate-900 dark:text-white font-sans">
                sakany<span className="text-amber-500">bot</span>
              </span>
            </div>

            {/* Dual Mode Switcher for Desktop (>= lg) */}
            <div className="hidden lg:flex items-center rounded-xl border border-slate-200/80 bg-slate-100/90 p-0.5 dark:border-zinc-800/80 dark:bg-zinc-900/90 shadow-2xs shrink-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setAppMode('chat')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  appMode === 'chat'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-amber-400 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title={isRtl ? 'مستشار العقارات بالذكاء الاصطناعي' : 'AI Broker Chat'}
              >
                <Bot className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{isRtl ? 'مستشار الشات' : 'AI Broker'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAppMode('direct_search')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  appMode === 'direct_search'
                    ? 'bg-amber-500 text-black shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
                title={isRtl ? 'بحث وفلترة فورية لكافة العقارات مجاناً وبدون خصم رسائل' : 'Off-Agent Direct Search'}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span>{isRtl ? 'البحث المباشر ⚡' : 'Off-Agent ⚡'}</span>
              </button>
            </div>
          </div>

          {/* Quick Header Controls (Streamlined: wallpaper & contact broker moved to sidebar) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Persona Pill (Buyer / Seller / Broker) */}
            {user && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPersonaModalOpen(true)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/90 dark:border-zinc-800/80 dark:bg-zinc-900/90 px-1.5 sm:px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-zinc-200 shadow-2xs hover:border-amber-500/50 hover:bg-amber-500/10 transition cursor-pointer whitespace-nowrap"
                  title={isRtl ? 'صفتك العقارية (اضغط للتغيير: مشتري / بائع / بروكر)' : 'Your Real Estate Persona (Click to switch)'}
                >
                  <span className="sm:hidden text-xs">
                    {currentPersona === 'seller' ? '🏷️' : currentPersona === 'broker' ? '💼' : '🏠'}
                  </span>
                  <span className="hidden sm:inline">
                    {currentPersona === 'seller' ? '🏷️ بائع' : currentPersona === 'broker' ? '💼 بروكر' : '🏠 مشتري'}
                  </span>
                </button>

                {currentPersona === 'broker' && (
                  <button
                    type="button"
                    onClick={() => setPricingModalOpen(true)}
                    className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/15 px-1.5 sm:px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-300 shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer whitespace-nowrap"
                    title={isRtl ? 'عرض باقة البروكر (Pro) - 250 ج.م' : 'Broker Pro Plan (250 EGP)'}
                  >
                    <Zap className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="sm:hidden font-mono text-[11px] font-black">Pro ⚡</span>
                    <span className="hidden sm:inline">{isRtl ? 'باقة البروكر ⚡' : 'Broker Pro ⚡'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Daily Protection Quota Pill & Bonus Unlock Pill */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <div
                  className={`flex items-center gap-1 sm:gap-1.5 rounded-xl border px-1.5 sm:px-2.5 py-1 text-xs font-bold shadow-2xs whitespace-nowrap ${
                    isAllowedAdminEmail(user.email) || usage.plan === 'admin'
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-500 font-black'
                      : 'border-slate-200/80 bg-slate-50/90 text-slate-700 dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:text-zinc-200'
                  }`}
                  title={
                    isAllowedAdminEmail(user.email) || usage.plan === 'admin'
                      ? (isRtl ? 'حساب الإدارة: محادثات واستفسارات غير محدودة مدى الحياة ⚡' : 'Admin Account: Unlimited Inquiries ⚡')
                      : (isRtl ? 'استفساراتك اليومية المجانية المتبقية (تتجدد كل ليلة)' : 'Free daily inquiries left (resets nightly)')
                  }
                >
                  <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-500 shrink-0" />
                  {isAllowedAdminEmail(user.email) || usage.plan === 'admin' ? (
                    <span className="font-mono text-xs font-black">
                      ∞ <span className="hidden sm:inline">{isRtl ? 'غير محدود' : 'Unlimited'}</span>
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-xs font-bold">{usage.remaining}/{usage.limit}</span>
                      <span className="hidden sm:inline text-[11px] font-normal text-slate-500 dark:text-zinc-400">{isRtl ? 'اليوم' : 'today'}</span>
                      {usage.hasUnlockedBonus && (
                        <span className="rounded-full bg-emerald-500/20 px-1 py-0.2 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                          +50 🎁
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Lead bonus unlock pill for serious buyers when quota is low */}
                {!isAllowedAdminEmail(user.email) && usage.plan !== 'admin' && !usage.hasUnlockedBonus && usage.remaining <= 10 && (
                  <button
                    type="button"
                    onClick={() => setLeadUnlockModalOpen(true)}
                    className="flex items-center gap-1 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-1.5 sm:px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400 shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer animate-pulse whitespace-nowrap"
                    title={isRtl ? 'افتح +50 استفساراً إضافياً مجاناً برقم هاتفك' : 'Unlock +50 free queries with your phone'}
                  >
                    <span className="sm:hidden text-[11px]">🎁 +50</span>
                    <span className="hidden sm:inline">🎁 +50 مجاناً</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2 sm:px-2.5 py-1 text-xs font-bold text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400 shadow-2xs whitespace-nowrap"
                title={isRtl ? 'سجّل دخولك مجاناً لتحصل على 20 استفساراً يومياً' : 'Sign in free for 20 daily queries'}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-xs">{usage.remaining}</span>
                <span className="hidden sm:inline text-[11px] font-normal">{isRtl ? 'تجريبية' : 'trials'}</span>
              </button>
            )}

            {/* Admin Dashboard Quick Link (Strictly visible ONLY to authorized admin) */}
            {user && isAllowedAdminEmail(user.email) && (
              <Link
                href="/admin"
                className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/15 p-1 sm:px-2.5 sm:py-1 text-xs font-bold text-amber-600 transition hover:bg-amber-500/25 dark:text-amber-400 shadow-2xs whitespace-nowrap shrink-0"
                title={isRtl ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">{isRtl ? 'الإدارة' : 'Admin'}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Mobile & Tablet Sub-Header Mode Switcher (< lg) - Goes down below header, completely eliminates crowding */}
        <div className="lg:hidden flex items-center justify-center border-b border-slate-200/70 bg-slate-50/80 px-2.5 py-1.5 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80 z-10 shrink-0">
          <div className="grid grid-cols-2 w-full max-w-xs rounded-xl border border-slate-200/80 bg-slate-200/50 dark:border-zinc-800/80 dark:bg-zinc-900 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setAppMode('chat')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                appMode === 'chat'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-amber-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{isRtl ? 'مستشار الشات' : 'AI Broker'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAppMode('direct_search')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
                appMode === 'direct_search'
                  ? 'bg-amber-500 text-black shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>{isRtl ? 'البحث المباشر ⚡' : 'Off-Agent ⚡'}</span>
            </button>
          </div>
        </div>

        {appMode === 'direct_search' ? (
          <DirectSearchPanel
            onSendToChat={handleSendToChat}
            onCompareWithChat={handleCompareWithChat}
            onBookViewing={(p) => {
              setSelectedPropertyForLead(p);
              setBookingModalOpen(true);
            }}
            onToggleFavorite={handleToggleFavorite}
            onViewDetails={(p) => openPropertyDetails(p)}
            favorites={favorites}
            onSwitchToChat={() => setAppMode('chat')}
          />
        ) : (
          <div className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
            {/* Chat Wallpaper Layer with Active Style & Dynamic User Opacity */}
            {wallpaperId !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
                style={{
                  ...activeWallpaper,
                  opacity: (wallpaperOpacity ?? DEFAULT_WALLPAPER_OPACITY) / 100,
                }}
                aria-hidden="true"
              />
            )}

            {/* Scrollable Conversation Stream (Flex child, ends cleanly above dock) */}
            <div
              ref={chatScrollContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pt-4 pb-4 relative z-10 transition-all duration-200"
              dir={dir}
            >
          <div className="mx-auto max-w-3xl">
            {messages.length === 0 ? (
              /* Welcome Screen with Grounded Suggestions */
              <div className="py-8 text-center sm:py-16">
                <div className="mx-auto mb-4 relative grid h-16 w-16 place-items-center overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-gradient-to-tr from-amber-500 to-yellow-400 p-1 shadow-lg shadow-amber-500/25">
                  <img 
                    src="/logo.png" 
                    alt="Skanybot" 
                    className="h-full w-full object-cover rounded-2xl"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <span className="text-amber-500 font-sans tracking-tight">sakanybot</span>
                  <span>سكنى بوت</span>
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {t.subtitle}
                </p>
                <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <span>{t.noSpamBadge}</span>
                </div>

                {/* Quick Discovery Cards */}
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 text-left rtl:text-right">
                  {initialWelcomePrompts.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(card.prompt)}
                      className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-amber-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-amber-400/80"
                    >
                      <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                        {card.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        {card.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages Stream */
              <div className="space-y-6 pb-6">
                {/* Progressive Windowing: Load previous messages if conversation is long */}
                {messages.length > MESSAGE_CHUNK_LIMIT && !showAllMessages && (
                  <div className="text-center py-2">
                    <button
                      type="button"
                      onClick={() => setShowAllMessages(true)}
                      className="rounded-full border border-slate-300/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-xs hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-zinc-800 transition inline-flex items-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {isRtl
                          ? `تحميل الرسائل السابقة (${messages.length - MESSAGE_CHUNK_LIMIT} رسالة أقدم)`
                          : `Load previous messages (${messages.length - MESSAGE_CHUNK_LIMIT} older)`}
                      </span>
                    </button>
                  </div>
                )}

                {displayedMessages.map((msg) => {
                  const isUser = msg.role === 'user';

                  return (
                    <div
                      key={msg.id}
                      className="flex gap-3.5 justify-start"
                    >
                      {/* Avatar */}
                      <div className="shrink-0 pt-0.5">
                        {isUser ? (
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-white font-bold text-xs dark:bg-zinc-700">
                            <User className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xs">
                            <img 
                              src="/logo.png" 
                              alt="Skanybot" 
                              className="h-full w-full object-cover rounded-lg"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {isUser ? t.you : t.aqarAi}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.created_at || Date.now()).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isUser && msg.duration_seconds !== undefined && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              title={isRtl ? `سرعة إعداد الرد: ${msg.duration_seconds} ثانية` : `Response generated in ${msg.duration_seconds}s`}
                            >
                              <span>⚡</span>
                              <span>{msg.duration_seconds}s</span>
                            </span>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl p-4 sm:p-5 transition-all ${
                          isUser 
                            ? 'bg-amber-500/10 text-slate-900 dark:bg-zinc-800/90 dark:text-zinc-100 font-medium border border-amber-500/25 dark:border-zinc-700/80 shadow-2xs'
                            : 'bg-white/95 dark:bg-zinc-900/90 text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs backdrop-blur-xs'
                        }`}>
                          <MarkdownRenderer content={msg.content} />

                          {/* Direct CTA Button when the bot opened or suggested the Seller Property Listing Form */}
                          {!isUser && msg.open_seller_modal && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSellerEditingProp(null);
                                  setSellerPrefill(msg.seller_prefill || null);
                                  setSellerModalMode('create');
                                  setSellerModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black text-black shadow-md transition hover:bg-amber-400"
                              >
                                <Plus className="h-4 w-4 stroke-[3]" />
                                <span>{OPEN_FORM_BTN_LABELS[locale] || OPEN_FORM_BTN_LABELS.en}</span>
                              </button>
                            </div>
                          )}

                          {/* User Attached Photos in Chat Bubble */}
                          {msg.attached_images && msg.attached_images.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {msg.attached_images.map((imgUrl, i) => (
                                <img
                                  key={i}
                                  src={imgUrl}
                                  alt="صورة مرفقة"
                                  className="h-24 w-32 rounded-xl object-cover border border-amber-500/40 shadow-xs"
                                />
                              ))}
                            </div>
                          )}

                          {/* Grounded Property Cards – responsive grid on all screen sizes */}
                          {msg.properties && msg.properties.length > 0 && (
                            <div className={`mt-4 grid gap-3.5 sm:gap-4 ${
                              msg.properties.length === 1
                                ? 'grid-cols-1 max-w-md'
                                : 'grid-cols-1 md:grid-cols-2'
                            }`}>
                              {msg.properties.map((prop) => (
                                <PropertyCard
                                  key={prop.id}
                                  property={prop}
                                  onBookViewing={handleBookViewing}
                                  onToggleFavorite={handleToggleFavorite}
                                  onViewDetails={openPropertyDetails}
                                  onSendToChat={handleSendToChat}
                                  isFavorite={favorites.some(f => f.id === prop.id)}
                                />
                              ))}
                            </div>
                          )}

                          {/* Inline Results Table with per-row "View Details" button and "Show All" button right underneath the table */}
                          {((msg.all_properties && msg.all_properties.length > 0) || (msg.properties && msg.properties.length > 0)) && (
                            <InlinePropertiesTable
                              properties={(msg.all_properties && msg.all_properties.length > 0) ? msg.all_properties : (msg.properties || [])}
                              initialCount={4}
                              onViewDetails={openPropertyDetails}
                              onSendToChat={handleSendToChat}
                            />
                          )}

                          {/* Suggested Action Chips */}
                          {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 pt-2">
                              {msg.suggested_actions.filter((act) => !act.includes('دبي') && !act.includes('الإمارات')).map((act, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSendMessage(act)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-amber-500 hover:bg-amber-50 hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:bg-zinc-800"
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading state indicator */}
                {loading && (
                  <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 text-xs py-2">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                      <span>{t.checkingDatabase}</span>
                    </div>
                  </div>
                )}

                {/* Guest soft-wall banner — appears after 2nd message */}
                {!user && !loading && guestMsgCount >= 2 && guestMsgCount <= GUEST_MSG_LIMIT && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>
                        {isRtl
                          ? `تبقّى لك ${GUEST_MSG_LIMIT - guestMsgCount} رسائل تجريبية — يمكنك مواصلة البحث والتصفية بحرية عبر البحث المباشر مجاناً! ⚡`
                          : `${GUEST_MSG_LIMIT - guestMsgCount} trial message(s) left — You can also browse freely via Off-Agent Search! ⚡`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAppMode('direct_search')}
                        className="rounded-xl border border-amber-500/50 bg-black/80 dark:bg-zinc-900 text-amber-400 px-3 py-1.5 text-[11px] font-bold hover:bg-black transition"
                      >
                        {isRtl ? 'البحث المباشر (مجاناً) ⚡' : 'Off-Agent Search ⚡'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthModalOpen(true)}
                        className="rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black transition hover:bg-amber-400"
                      >
                        {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-24 ltr:right-6 rtl:left-6 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-zinc-900/95 text-amber-400 shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 hover:bg-black hover:text-amber-300 cursor-pointer"
            title={isRtl ? 'الانتقال لآخر رسالة' : 'Jump to latest message'}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {/* Chat Input Dock in document flow (shrink-0) - Physically never covers chat messages! */}
        <div
          className={`relative shrink-0 pt-2 pb-3 px-3 sm:px-6 md:px-8 z-20 transition-all ${
            wallpaperId === 'watermelon'
              ? 'chat-dock-watermelon'
              : wallpaperId === 'arabesque'
              ? 'chat-dock-arabesque'
              : wallpaperId === 'architectural' || wallpaperId === 'whatsapp'
              ? 'chat-dock-architectural'
              : wallpaperId === 'blueprint_grid'
              ? 'chat-dock-blueprint_grid'
              : wallpaperId === 'dots'
              ? 'chat-dock-dots'
              : wallpaperId === 'solid_oled'
              ? 'chat-dock-solid_oled'
              : 'bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95'
          }`}
        >
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-slate-300/80 bg-white shadow-lg transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900/90 dark:focus-within:border-amber-400">
              {/* Preview strip when photos are attached in chat */}
              {chatAttachedImages.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 px-4 pt-3 pb-2 dark:border-zinc-800">
                  {chatAttachedImages.map((img, i) => (
                    <div key={i} className="relative h-14 w-20 overflow-hidden rounded-xl border border-amber-500/50">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setChatAttachedImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/75 p-0.5 text-white hover:bg-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {isRtl ? `تم إرفاق ${chatAttachedImages.length} صورة للوحدة` : `${chatAttachedImages.length} photo(s) attached`}
                  </span>
                </div>
              )}

              {/* Referenced / Targeted Unit Focus Strip */}
              {referencedProperty && (
                <div className="flex flex-col gap-2 border-b border-amber-500/25 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-4 pt-3 pb-2.5 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-500 text-black font-black text-xs shadow-xs">
                        📍
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-xs text-slate-900 dark:text-white line-clamp-1">
                          {isReferencedCollapsed
                            ? (isRtl ? `تم تحديد: ${referencedProperty.title}` : `Referenced: ${referencedProperty.title}`)
                            : referencedProperty.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {referencedProperty.total_price.toLocaleString(isRtl ? 'ar-EG' : 'en-US')} {referencedProperty.currency || 'ج.م'} • {referencedProperty.area_sqm}م² {referencedProperty.deal_score ? `• ⭐ سكور: ${referencedProperty.deal_score}/100 (${referencedProperty.deal_badge || ''})` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">

                      <button
                        type="button"
                        onClick={() => setIsReferencedCollapsed(!isReferencedCollapsed)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/20 transition"
                        title={isReferencedCollapsed ? (isRtl ? 'إظهار التفاصيل والخيارات' : 'Expand details') : (isRtl ? 'تصغير لمنع تغطية الشات' : 'Collapse to save space')}
                      >
                        {isReferencedCollapsed ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{isRtl ? 'إظهار التفاصيل' : 'Expand'}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{isRtl ? 'تصغير' : 'Collapse'}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReferencedProperty(null)}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white transition"
                        title={isRtl ? 'إلغاء الإشارة للوحدة' : 'Clear unit reference'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Smart 1-Click Action Chips (Hidden when collapsed) */}
                  {!isReferencedCollapsed && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <button
                        type="button"
                        onClick={() => handleTriggerReferencedAction('score')}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs hover:bg-amber-500 hover:text-black dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-black transition"
                      >
                        <span>⭐ قيّم لي الصفقة دي وسكورها</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerReferencedAction('pros_cons')}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-amber-500 hover:text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-amber-500 dark:hover:text-black transition"
                      >
                        <span>⚖️ إيه عيوبها ومميزاتها بصراحة؟</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerReferencedAction('valuation')}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-amber-500 hover:text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-amber-500 dark:hover:text-black transition"
                      >
                        <span>💰 تسعيرها العادل وسرعة البيع</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerReferencedAction('installments')}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-amber-500 hover:text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-amber-500 dark:hover:text-black transition"
                      >
                        <span>🧮 احسب خطة أقساطها</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="relative flex items-end">
                {/* Upload Unit Photos Button inside Chat Bar */}
                <label
                  className={`mb-2.5 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:text-amber-400 ${
                    isRtl ? 'mr-2.5' : 'ml-2.5'
                  }`}
                  title={isRtl ? 'إرفاق صور وحدتك أو أرضك للبيع' : 'Attach photos of your property'}
                >
                  <ImagePlus className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleChatImageUpload}
                    className="hidden"
                  />
                </label>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputResize}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    referencedProperty
                      ? (isRtl ? `اسأل البروكر أي سؤال بخصوص "${referencedProperty.title.slice(0, 32)}..."` : `Ask any question about this property...`)
                      : t.searchPlaceholder
                  }
                  className={`max-h-44 flex-1 resize-none bg-transparent py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden dark:text-white dark:placeholder:text-zinc-500 ${
                    isRtl ? 'pr-3 pl-14 text-right' : 'pl-3 pr-14 text-left'
                  }`}
                />

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && chatAttachedImages.length === 0) || loading}
                  className={`absolute bottom-2.5 grid h-9 w-9 place-items-center rounded-2xl bg-amber-500 text-black transition hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 ${
                    isRtl ? 'left-2.5' : 'right-2.5'
                  }`}
                  title="Send"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4 stroke-[3]" />
                  )}
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-zinc-500">
              {t.disclaimer}
            </p>
          </div>
        </div>
      </div>
    )}
  </main>

      {/* Booking Lead Modal */}
      <BookingLeadModal
        property={selectedPropertyForLead}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={favoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        favorites={favorites}
        onRemoveFavorite={(id) => {
          const updated = favorites.filter(f => f.id !== id);
          setFavorites(updated);
          localStorage.setItem('skanybot_favorites', JSON.stringify(updated));
        }}
        onBookViewing={handleBookViewing}
      />
      {/* Fullscreen / Expanded Property Gallery & Details Modal */}
      <PropertiesTableModal
        isOpen={Boolean(tableProps)}
        properties={tableProps?.list || []}
        totalMatches={tableProps?.total}
        onClose={() => setTableProps(null)}
        onViewDetails={openPropertyDetails}
      />

      <PropertyDetailsModal
        property={selectedPropertyForDetails}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onBookViewing={(p) => {
          setDetailsModalOpen(false);
          setSelectedPropertyForLead(p);
          setBookingModalOpen(true);
        }}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={favorites.some(f => f.id === selectedPropertyForDetails?.id)}
        onSendToChat={handleSendToChat}
      />

      {/* Seller Listed Units Modal (إضافة / تعديل وحداتي المعروضة للبيع) */}
      <SellerPropertiesModal
        isOpen={sellerModalOpen}
        onClose={() => setSellerModalOpen(false)}
        ownerId={sellerOwnerId}
        defaultSellerName={user?.name}
        properties={myListings}
        onRefresh={() => refreshMyListings(sellerOwnerId)}
        onViewDetails={(p) => {
          setSellerModalOpen(false);
          openPropertyDetails(p);
        }}
        onAskAiToMarket={(p) => {
          handleSendMessage(
            `عندي ${p.unit_type} معروضة للبيع (${p.title}) بمساحة ${p.area_sqm} م² وسعر ${p.total_price.toLocaleString()} ${p.currency} في ${p.location_text || p.compound?.area_name || ''}. عايزك تساعدني نلاقي ليها مشتري مناسب وتقولي رأيك في تسعيرها.`
          );
        }}
        initialMode={sellerModalMode}
        initialEditingProperty={sellerEditingProp}
        initialPrefill={sellerPrefill}
      />

      {/* Supabase Authentication Modal (Google + Email) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Lead Quota Unlock Modal (+50 queries with phone number for serious buyers) */}
      <LeadQuotaUnlockModal
        isOpen={leadUnlockModalOpen}
        onClose={() => setLeadUnlockModalOpen(false)}
        onUnlocked={(newLimit, newRemaining) => {
          setUsage(prev => ({
            ...prev,
            limit: newLimit,
            remaining: newRemaining,
            hasUnlockedBonus: true,
            bonusAmount: 50,
          }));
        }}
      />

      {/* Buyer Advisor Handover Modal (When 70 queries are completed) */}
      <BuyerAdvisorHandoverModal
        isOpen={handoverModalOpen}
        onClose={() => setHandoverModalOpen(false)}
        defaultName={user?.name || ''}
        onOpenBooking={() => {
          setHandoverModalOpen(false);
          setSelectedPropertyForLead(null);
          setBookingModalOpen(true);
        }}
        onOpenPricing={() => {
          setHandoverModalOpen(false);
          setPricingModalOpen(true);
        }}
      />

      {/* Commercial Broker / Agency Pro Plan Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        currentPlan={usage.plan === 'pro' ? 'pro' : 'free'}
        usedCount={usage.used}
        limitCount={usage.limit}
        onUpgradeSuccess={(newPlan, newLimit) => {
          setUsage(prev => ({
            ...prev,
            plan: newPlan,
            limit: newLimit,
            remaining: Math.max(0, newLimit - prev.used),
          }));
          setPricingModalOpen(false);
        }}
        onOpenAuthModal={() => {
          setPricingModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      {/* Onboarding Persona Dialog (Buyer / Seller / Broker) */}
      <UserPersonaModal
        isOpen={personaModalOpen}
        onClose={() => setPersonaModalOpen(false)}
        onSelectPersona={handleSelectPersona}
        onOpenPricing={() => setPricingModalOpen(true)}
        userName={user?.name || user?.email?.split('@')[0] || null}
      />

      {/* Real Estate Blueprint / Heritage Chat Wallpaper Modal (EGX Style - Centered & Responsive) */}
      <ChatWallpaperModal
        isOpen={showWallpaperModal}
        onClose={() => setShowWallpaperModal(false)}
        currentId={wallpaperId}
        currentOpacity={wallpaperOpacity}
        currentCustomImage={customWallpaperImage}
        onApply={(id, opacity, customImg) => {
          setWallpaperId(id);
          setWallpaperOpacity(opacity);
          setCustomWallpaperImage(customImg);
        }}
        isAr={isRtl}
      />
    </div>
  );
}
