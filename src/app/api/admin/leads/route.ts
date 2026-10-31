import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status')?.trim() || 'all'; // 'all' | 'جديد' | 'تم التواصل' | 'تمت المعاينة' | 'ملغي'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    // 1. Build main query for leads
    let query = admin
      .from('leads_inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `user_name.ilike.%${search}%,phone.ilike.%${search}%,unit_title.ilike.%${search}%,preferred_location.ilike.%${search}%,notes.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // 2. Also calculate counts per status for quick filter badges
    const [leadsRes, newCountRes, contactedCountRes, viewedCountRes, totalCountRes] = await Promise.all([
      query,
      admin.from('leads_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'جديد'),
      admin.from('leads_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'تم التواصل'),
      admin.from('leads_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'تمت المعاينة'),
      admin.from('leads_inquiries').select('*', { count: 'exact', head: true }),
    ]);

    if (leadsRes.error) {
      throw leadsRes.error;
    }

    return NextResponse.json(
      {
        success: true,
        leads: leadsRes.data || [],
        total: leadsRes.count ?? (leadsRes.data?.length || 0),
        counts: {
          all: totalCountRes.count ?? 0,
          new: newCountRes.count ?? 0,
          contacted: contactedCountRes.count ?? 0,
          viewed: viewedCountRes.count ?? 0,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching admin leads:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await admin
      .from('leads_inquiries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error: any) {
    console.error('Error updating lead status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const { error } = await admin
      .from('leads_inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete lead' }, { status: 500 });
  }
}
