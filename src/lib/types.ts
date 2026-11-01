// ==============================================================================
// Real Estate Broker AI (Skanybot) - Core Types
// ==============================================================================

export type SupportedLocale = 'ar' | 'en' | 'tr' | 'ru' | 'de' | 'fr' | 'es';

export interface Developer {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  reputation_score: number;
  established_year?: number;
  created_at?: string;
}

export interface CompoundProject {
  id: string;
  developer_id: string;
  name: string;
  slug: string;
  country?: string;
  city: string;
  area_name: string;
  platform?: 'Aqarmap' | 'TEKCE' | string;
  description?: string;
  amenities: string[];
  delivery_year: number;
  master_plan_url?: string;
  cover_image?: string;
  created_at?: string;
  developer?: Developer;
}

export interface Property {
  id: string;
  project_id: string;
  title: string;
  unit_type: 'شقة' | 'دوبلكس' | 'بنتهاوس' | 'تاون هاوس' | 'فيلا مستقلة' | 'استوديو' | string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  finishing_type: string;
  total_price: number;
  currency: string;
  down_payment_pct: number;
  down_payment_amount: number;
  installment_years: number;
  monthly_installment: number;
  quarterly_installment?: number;
  maintenance_fee?: number;
  delivery_date: string;
  status: 'متاح' | 'محجوز' | 'مباع' | string;
  images: string[];
  featured: boolean;
  roi_expected_pct?: number;
  deal_score?: number;
  deal_badge?: string;
  deal_color?: string;
  platform?: 'Aqarmap' | 'TEKCE' | string;
  partner_code?: string; // Stored securely on backend, not displayed to customer
  affiliate_url?: string; // Direct URL containing tracking params
  seller_user_id?: string;
  seller_name?: string;
  seller_phone?: string;
  location_text?: string;
  sale_circumstances?: string;
  created_at?: string;
  compound?: CompoundProject;
}

export interface LeadInquiry {
  id?: string;
  user_name: string;
  phone: string;
  email?: string;
  preferred_location?: string;
  preferred_unit_type?: string;
  budget_max?: number;
  payment_method?: 'تقسيط' | 'كاش' | string;
  property_id?: string;
  notes?: string;
  source?: string;
  status?: 'جديد' | 'تم التواصل' | 'معاينة مجدولة' | 'تم الإغلاق' | 'غير جاد';
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  session_token?: string;
  created_at: string;
  updated_at?: string;
}

export interface PropertyFilter {
  location?: string;
  country?: string;
  platform?: 'Aqarmap' | 'TEKCE' | string;
  min_price?: number;
  max_price?: number;
  target_price?: number;
  currency?: string;
  bedrooms?: number;
  max_down_payment?: number;
  installment_years?: number;
  delivery_year?: number | string;
  unit_type?: string;
  developer_name?: string;
  compound_name?: string;
}

export interface SellerFormPrefill {
  unit_type?: string;
  title?: string;
  city?: string;
  location_text?: string;
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  finishing_type?: string;
  total_price?: number;
  currency?: string;
  payment_mode?: 'cash' | 'installment';
  down_payment_pct?: number;
  installment_years?: number;
  delivery_date?: string;
  sale_circumstances?: string;
  seller_name?: string;
  seller_phone?: string;
}

export interface ChatMessage {
  id: string;
  session_id?: string;
  role?: 'user' | 'assistant' | 'system';
  content: string;
  properties?: Property[];
  all_properties?: Property[];
  attached_images?: string[];
  total_matches?: number;
  session_context?: SessionContext;
  suggested_actions?: string[];
  open_seller_modal?: boolean;
  seller_prefill?: SellerFormPrefill | null;
  duration_seconds?: number;
  created_at: string;
}

/** Compact snapshot of a unit, used for conversation memory (never shown as a card). */
export interface ShownUnit {
  id: string;
  title: string;
  unit_type?: string;
  price?: number;
  currency?: string;
  compound?: string;
  location?: string;
  area_sqm?: number;
  bedrooms?: number;
  down_payment_pct?: number;
  down_payment_amount?: number;
  monthly_installment?: number;
  installment_years?: number;
  sale_circumstances?: string;
}

/** Per-session conversation memory returned by /api/chat and echoed back by the client. */
export interface SessionContext {
  last_search: Record<string, string | number> | null;
  shown: ShownUnit[];
  total_matches: number;
  focus: ShownUnit | null;
  profile: {
    budget?: number;
    currency?: string;
    locations?: string[];
    unit_types?: string[];
    bedrooms?: number;
    phone_shared?: boolean;
  };
  pending_images?: string[];
  pending_seller_form_offer?: boolean;
  seller_prefill?: SellerFormPrefill | null;
  user_persona?: 'buyer' | 'seller' | 'broker' | null;
  turns: number;
}

/** Quota/plan info returned by /api/usage and /api/chat (server-enforced). */
export interface UsageInfo {
  plan: 'guest' | 'free' | 'pro' | 'admin';
  used: number;
  limit: number;
  remaining: number;
  window: 'day' | 'period';
  resetDate: string;
  proUntil?: string | null;
  hasUnlockedBonus?: boolean;
  bonusAmount?: number;
}
