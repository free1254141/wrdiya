import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userName, 
      phone, 
      email, 
      preferredLocation, 
      preferredUnitType, 
      budgetMax, 
      paymentMethod = 'تقسيط',
      propertyId, 
      notes,
      source = 'chatbot'
    } = body;

    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'رقم الهاتف غير صالح للتواصل' }, { status: 400 });
    }

    // Insert lead into Supabase
    const { data, error } = await supabaseAdmin
      .from('leads_inquiries')
      .insert([
        {
          user_name: userName.trim(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          preferred_location: preferredLocation || null,
          preferred_unit_type: preferredUnitType || null,
          budget_max: budgetMax ? Number(budgetMax) : null,
          payment_method: paymentMethod,
          property_id: propertyId || null,
          notes: notes || null,
          source,
          status: 'جديد'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Lead Insert Error:', error);
      return NextResponse.json({ error: 'تعذر حفظ بيانات طلبك. يرجى المحاولة لاحقاً.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم استلام طلب المعاينة بنجاح! سيتواصل معك مستشارك العقاري المعتمد خلال دقائق لتنسيق الزيارة وموافاتك بالتفاصيل.',
      lead: data
    });

  } catch (error: any) {
    console.error('Lead submission error:', error);
    return NextResponse.json({ error: 'حدث خطأ في النظام', details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('leads_inquiries')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, totalLeads: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
