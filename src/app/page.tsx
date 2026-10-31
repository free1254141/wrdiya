'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  X
} from 'lucide-react';
import { Property, ChatSession, ChatMessage, SessionContext } from '@/lib/types';
import { emptySessionContext, toShownUnit } from '@/lib/ai/session-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import BrokerChatSidebar from '@/components/BrokerChatSidebar';
import PropertyCard from '@/components/PropertyCard';
import BookingLeadModal from '@/components/BookingLeadModal';
import FavoritesModal from '@/components/FavoritesModal';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import LanguageSelector from '@/components/LanguageSelector';
import UsagePill from '@/components/UsagePill';
import PricingModal from '@/components/PricingModal';
import AuthModal from '@/components/AuthModal';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import PropertiesTableModal from '@/components/PropertiesTableModal';
import InlinePropertiesTable from '@/components/InlinePropertiesTable';
import SellerPropertiesModal from '@/components/SellerPropertiesModal';

export default function SkanybotChatPage() {
  const { locale, t, dir, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // open by default on md+, closed on mobile
    }
    return true;
  });

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Guest message counter — after 3 messages, prompt login
  const GUEST_MSG_LIMIT = 3;
  const [guestMsgCount, setGuestMsgCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('skanybot_guest_msgs') || '0', 10);
    }
    return 0;
  });

  // Daily Quota State: 10 queries per day for registered users
  const DAILY_LIMIT = 10;
  const [dailyUsage, setDailyUsage] = useState<{ used: number; limit: number; remaining: number }>({
    used: 0,
    limit: DAILY_LIMIT,
    remaining: DAILY_LIMIT,
  });

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            title: 'مشاريع معارض عقارماب الرسمية 🏛️',
            desc: 'أحدث المشاريع والكمبوندات بخصومات المعرض المعتمدة',
            prompt: 'عايز أفضل عروض معارض عقارماب في التجمع والشيخ زايد'
          },
          {
            title: 'استثمار دولي في دبي وتركيا 🌐',
            desc: 'وحدات فندقية وسكنية مؤهلة للإقامة الذهبية والجنسية',
            prompt: 'عايز فرص استثمار عقاري في دبي وإسطنبول للإقامة الذهبية والجنسية'
          },
          {
            title: 'شقق التجمع والشيخ زايد تقسيط 🏢',
            desc: 'ماونتن فيو، بادية بالم هيلز، وسوديك بمقدم 10% وتقسيط 8 سنوات',
            prompt: 'شقق 3 غرف في التجمع والشيخ زايد بمقدم 10% وتقسيط مريح'
          },
          {
            title: 'استلام فوري جاهز للسكن 🔑',
            desc: 'وحدات كاملة التشطيب في مدينتي وميفيدا إعمار',
            prompt: 'عايز شقق استلام فوري جاهزة للسكن الآن'
          }
        ];
      default:
        return [
          {
            title: 'Accredited Expo Developments 🏛️',
            desc: 'Prime developments with exclusive expo terms and discounts',
            prompt: 'Show me the best accredited developments in New Cairo and Sheikh Zayed'
          },
          {
            title: 'International Units (Dubai & Turkey) 🌐',
            desc: 'High USD/EUR yield properties eligible for Golden Visa & Citizenship',
            prompt: 'Show me international property opportunities in Dubai and Istanbul'
          },
          {
            title: 'New Cairo & Zayed with Installments 🏢',
            desc: 'Mountain View, Palm Hills, and SODIC with 10% down and 8-year plans',
            prompt: 'Looking for a 3-bedroom apartment with 10% down and flexible installments'
          },
          {
            title: 'Ready-to-Move Properties 🔑',
            desc: 'Fully finished apartments available for immediate delivery',
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

      // Restore daily usage count
      const todayKey = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('skanybot_usage_date');
      const savedUsed = (savedDate === todayKey) ? parseInt(localStorage.getItem('skanybot_daily_used') || '0', 10) : 0;
      setDailyUsage({
        used: isNaN(savedUsed) ? 0 : savedUsed,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - (isNaN(savedUsed) ? 0 : savedUsed)),
      });

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

  // Reset guest counter when user logs in
  useEffect(() => {
    if (user) {
      setGuestMsgCount(0);
      try { localStorage.removeItem('skanybot_guest_msgs'); } catch (e) {}
    }
  }, [user]);

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
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: isRtl ? 'استفسار عقاري جديد' : 'New Property Inquiry',
      created_at: new Date().toISOString()
    };

    const updatedSessions = [newSession, ...sessions.slice(0, 20)];
    setSessions(updatedSessions);
    setActiveSessionId(newId);
    setMessages([]);
    setSessionContext(emptySessionContext());

    try {
      localStorage.setItem('skanybot_sessions', JSON.stringify(updatedSessions));
      localStorage.removeItem(`skanybot_msgs_${newId}`);
    } catch (e) {
      console.error('Error saving new chat:', e);
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteSession = async (id: string) => {
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    localStorage.setItem('skanybot_sessions', JSON.stringify(remaining));
    localStorage.removeItem(`skanybot_msgs_${id}`);
    localStorage.removeItem(`skanybot_ctx_${id}`);
    localStorage.removeItem(`aqar_ai_msgs_${id}`);

    if (activeSessionId === id) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        loadSessionMessages(remaining[0].id);
      } else {
        createNewChat();
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
      // When added to Watchlist: open lead booking modal so they can connect with the owner/developer
      setSelectedPropertyForLead(prop);
      setBookingModalOpen(true);
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
    const rawQuery = (textToSend || inputText).trim();
    const imagesToSend = textToSend ? [] : [...chatAttachedImages];
    const query = rawQuery || (imagesToSend.length > 0 ? (isRtl ? 'دي صور الوحدة اللي عايز أبيعها' : 'Here are the photos of my property for sale') : '');
    if ((!query && imagesToSend.length === 0) || loading) return;

    // ── 1. Guest Check: Must login after 3 messages ──
    if (!user) {
      if (guestMsgCount >= GUEST_MSG_LIMIT) {
        setAuthModalOpen(true);
        return;
      }
      const nextCount = guestMsgCount + 1;
      setGuestMsgCount(nextCount);
      try { localStorage.setItem('skanybot_guest_msgs', String(nextCount)); } catch (e) {}
    } else {
      // ── 2. Authenticated Daily Limit Check: 10 queries/day ──
      if (dailyUsage.used >= DAILY_LIMIT) {
        const errorMsg: ChatMessage = {
          id: `msg_${Date.now()}_limit`,
          session_id: activeSessionId || 'limit_session',
          role: 'assistant',
          content: isRtl 
            ? '⚠️ **لقد استهلكت رصيدك اليومي المتاح (10 استفسارات).**\n\nيتجدد رصيدك تلقائياً عند منتصف الليل لضمان تقديم أعلى جودة وتحليل دقيق لجميع المستخدمين. يسعدنا استكمال بحثك غداً!'
            : '⚠️ **You have reached your daily limit of 10 queries.**\n\nYour quota will reset automatically tomorrow!',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }
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

    // Auto-update session title from first user query
    if (messages.length === 0) {
      const autoTitle = query.slice(0, 32) + (query.length > 32 ? '...' : '');
      handleRenameSession(currSessionId, autoTitle);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currSessionId,
          clientId: user?.id || currSessionId,
          userId: user?.id || null,
          userEmail: user?.email || null,
          plan: 'free',
          message: query,
          locale: locale,
          history: newHistory.slice(-10),
          sessionContext,
          sellerOwnerId,
          attachedImages: imagesToSend
        })
      });

      const data = await response.json();

      if (response.status === 401 || data.error === 'login_required') {
        setAuthModalOpen(true);
        throw new Error(data.message || (isRtl ? 'يرجى تسجيل الدخول مجاناً للمتابعة' : 'Please sign in to continue'));
      }

      if (response.status === 429 || data.error === 'daily_limit_reached') {
        throw new Error(data.message || (isRtl ? 'وصلت للحد الأقصى اليومي (10 استفسارات). يتجدد رصيدك تلقائياً غداً!' : 'Daily limit of 10 queries reached. Resets tomorrow!'));
      }

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      // Update daily usage state
      if (data.usage) {
        setDailyUsage({
          used: data.usage.used,
          limit: data.usage.limit || DAILY_LIMIT,
          remaining: data.usage.remaining !== undefined ? data.usage.remaining : Math.max(0, DAILY_LIMIT - data.usage.used),
        });
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
          setSellerModalOpen(true);
        }}
      />

      {/* Main Chat Area */}
      <main className="relative flex flex-1 flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Top Header Bar with Theme & Language controls */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95 z-10">
          <div className="flex items-center gap-3">
            {/* Show toggle button in header ONLY when sidebar is closed (eliminates duplicate icons) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                title={isRtl ? 'إظهار الشريط الجانبي' : 'Open Sidebar'}
              >
                {isRtl ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xs">
                <img 
                  src="/logo.png" 
                  alt="sakanybot" 
                  className="h-full w-full object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black tracking-tight text-amber-500 font-sans">sakanybot</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">سكنى بوت</span>
              </div>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2">
            {/* Contact Broker CTA */}
            <button
              onClick={() => {
                setSelectedPropertyForLead(null);
                setBookingModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1.5 text-xs font-black text-black shadow-xs transition hover:brightness-105 active:scale-[0.98]"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>{t.contactAdvisor}</span>
            </button>

            {/* Daily Quota Counter & Account */}
            {user ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{dailyUsage.remaining} / 10 {isRtl ? 'متبقية اليوم' : 'left today'}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>{Math.max(0, GUEST_MSG_LIMIT - guestMsgCount)} {isRtl ? 'رسائل تجريبية' : 'trials'}</span>
              </div>
            )}

            {/* User Account / Auth Button */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1 px-2 text-xs font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-[11px] font-black text-black">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  title={isRtl ? 'تسجيل الخروج' : 'Sign Out'}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pt-4 pb-36 sm:pb-32" dir={dir}>
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
                {messages.map((msg) => {
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
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl p-4 ${
                          isUser 
                            ? 'bg-slate-100 text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 font-medium'
                            : 'bg-transparent text-slate-800 dark:text-zinc-200'
                        }`}>
                          <MarkdownRenderer content={msg.content} />

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

                          {/* Grounded Property Cards – horizontal scroll on mobile, 2-col grid on sm+ */}
                          {msg.properties && msg.properties.length > 0 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto pb-2.5 pt-1 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:pt-0 sm:gap-4">
                              {msg.properties.map((prop) => (
                                <div key={prop.id} className="w-[280px] shrink-0 snap-center sm:w-auto sm:shrink">
                                  <PropertyCard
                                    property={prop}
                                    onBookViewing={handleBookViewing}
                                    onToggleFavorite={handleToggleFavorite}
                                    onViewDetails={openPropertyDetails}
                                    isFavorite={favorites.some(f => f.id === prop.id)}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Results Table with per-row "View Details" button and "Show All" button right underneath the table */}
                          {((msg.all_properties && msg.all_properties.length > 0) || (msg.properties && msg.properties.length > 0)) && (
                            <InlinePropertiesTable
                              properties={(msg.all_properties && msg.all_properties.length > 0) ? msg.all_properties : (msg.properties || [])}
                              initialCount={4}
                              onViewDetails={openPropertyDetails}
                            />
                          )}

                          {/* Suggested Action Chips */}
                          {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 pt-2">
                              {msg.suggested_actions.map((act, idx) => (
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
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>
                        {isRtl
                          ? `تبقّى لك ${GUEST_MSG_LIMIT - guestMsgCount} رسيلة — سجّل دخول عشان توصل لكل الميزات وتحفظ بحثك 🔓`
                          : `${GUEST_MSG_LIMIT - guestMsgCount} free message${GUEST_MSG_LIMIT - guestMsgCount > 1 ? 's' : ''} left — Sign in to unlock full access 🔓`}
                      </span>
                    </div>
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black transition hover:bg-amber-400"
                    >
                      {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Area (ChatGPT Style) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-4 px-4 sm:px-6 md:px-8 dark:from-zinc-950 dark:via-zinc-950/95">
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
                  placeholder={t.searchPlaceholder}
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
      />

      {/* Supabase Authentication Modal (Google + Email) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
