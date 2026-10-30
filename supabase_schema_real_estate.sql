-- ==============================================================================
-- AI Real Estate Broker Platform (عقار AI) - Supabase Database Schema
-- Strict Data-Grounding, Lead Qualification & ChatGPT Interface Backbone
-- ==============================================================================

-- 1. Create developers table
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    phone TEXT,
    whatsapp TEXT,
    reputation_score NUMERIC(3, 1) DEFAULT 4.8,
    established_year INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create compounds_projects table
CREATE TABLE IF NOT EXISTS public.compounds_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    area_name TEXT NOT NULL,
    description TEXT,
    amenities TEXT[] DEFAULT '{}',
    delivery_year INT,
    master_plan_url TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for searching projects by area or city
CREATE INDEX IF NOT EXISTS idx_compounds_area ON public.compounds_projects(area_name);
CREATE INDEX IF NOT EXISTS idx_compounds_city ON public.compounds_projects(city);
CREATE INDEX IF NOT EXISTS idx_compounds_developer ON public.compounds_projects(developer_id);

-- 3. Create properties table (units inventory)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.compounds_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    unit_type TEXT NOT NULL, -- 'شقة', 'دوبلكس', 'بنتهاوس', 'تاون هاوس', 'فيلا مستقلة', 'استوديو'
    bedrooms INT NOT NULL DEFAULT 1,
    bathrooms INT NOT NULL DEFAULT 1,
    area_sqm NUMERIC(10, 2) NOT NULL,
    finishing_type TEXT DEFAULT 'تشطيب كامل',
    total_price NUMERIC(14, 2) NOT NULL,
    currency TEXT DEFAULT 'EGP',
    down_payment_pct NUMERIC(5, 2) DEFAULT 10.00,
    down_payment_amount NUMERIC(14, 2) NOT NULL,
    installment_years INT DEFAULT 7,
    monthly_installment NUMERIC(14, 2) NOT NULL,
    quarterly_installment NUMERIC(14, 2),
    maintenance_fee NUMERIC(14, 2),
    delivery_date TEXT NOT NULL,
    status TEXT DEFAULT 'متاح', -- 'متاح', 'محجوز', 'مباع'
    images TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    roi_expected_pct NUMERIC(5, 2) DEFAULT 14.50,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for property searches and anti-hallucination querying
CREATE INDEX IF NOT EXISTS idx_properties_project ON public.properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(total_price);
CREATE INDEX IF NOT EXISTS idx_properties_unit_type ON public.properties(unit_type);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON public.properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_down_payment ON public.properties(down_payment_amount);

-- 4. Create leads_inquiries table (Monetization & Broker Leads)
CREATE TABLE IF NOT EXISTS public.leads_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    preferred_location TEXT,
    preferred_unit_type TEXT,
    budget_max NUMERIC(14, 2),
    payment_method TEXT DEFAULT 'تقسيط',
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    notes TEXT,
    source TEXT DEFAULT 'chatbot',
    status TEXT DEFAULT 'جديد',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads_inquiries(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads_inquiries(status);

-- 5. Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'محادثة عقارية جديدة',
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON public.chat_sessions(session_token);

-- 6. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compounds_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Read policies: public can view developers, projects, and properties
DROP POLICY IF EXISTS "Public developers are viewable by everyone" ON public.developers;
CREATE POLICY "Public developers are viewable by everyone" ON public.developers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public compounds are viewable by everyone" ON public.compounds_projects;
CREATE POLICY "Public compounds are viewable by everyone" ON public.compounds_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
CREATE POLICY "Public properties are viewable by everyone" ON public.properties FOR SELECT USING (true);

-- Insert policy for leads (anyone can submit an inquiry)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads_inquiries;
CREATE POLICY "Anyone can insert leads" ON public.leads_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on leads" ON public.leads_inquiries;
CREATE POLICY "Service role full access on leads" ON public.leads_inquiries FOR ALL USING (true);

-- Chat sessions & messages policies
DROP POLICY IF EXISTS "Anyone can create and read chat sessions" ON public.chat_sessions;
CREATE POLICY "Anyone can create and read chat sessions" ON public.chat_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can create and read chat messages" ON public.chat_messages;
CREATE POLICY "Anyone can create and read chat messages" ON public.chat_messages FOR ALL USING (true);
