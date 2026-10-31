import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { enrichSellerProperty } from '@/lib/seller-listings';
import { invalidatePropertiesCache } from '@/lib/real-estate-engine';
import { Property } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('q') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || 'all').trim();

    // 1. Fetch all seller listings from properties table
    const { data: rawRows, error } = await admin
      .from('properties')
      .select('*')
      .eq('platform', 'SellerListing')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 2. Unpack metadata (seller name, seller phone, location, circumstances)
    const enrichedList: Property[] = (rawRows || []).map(enrichSellerProperty);

    // 3. Compute status counts for toolbar chips
    const counts = {
      all: enrichedList.length,
      pending: enrichedList.filter((p) => p.status === 'قيد المراجعة').length,
      approved: enrichedList.filter((p) => p.status === 'معتمد' || p.status === 'متاح').length,
      rejected: enrichedList.filter((p) => p.status === 'مرفوض').length,
    };

    // 4. Apply status filtering
    let filtered = enrichedList;
    if (statusFilter !== 'all') {
      if (statusFilter === 'معتمد') {
        filtered = filtered.filter((p) => p.status === 'معتمد' || p.status === 'متاح');
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    // 5. Apply search filter
    if (search) {
      filtered = filtered.filter((p) => {
        const titleMatch = (p.title || '').toLowerCase().includes(search);
        const nameMatch = (p.seller_name || '').toLowerCase().includes(search);
        const phoneMatch = (p.seller_phone || '').includes(search);
        const locMatch = (p.location_text || p.compound?.city || '').toLowerCase().includes(search);
        const circMatch = (p.sale_circumstances || '').toLowerCase().includes(search);
        const typeMatch = (p.unit_type || '').toLowerCase().includes(search);
        return titleMatch || nameMatch || phoneMatch || locMatch || circMatch || typeMatch;
      });
    }

    return NextResponse.json(
      {
        success: true,
        properties: filtered,
        counts,
        total: filtered.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching seller properties for admin:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seller properties' }, { status: 500 });
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
    const { id, action, status, title, total_price } = body;

    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
    }

    let targetStatus = status;
    if (action === 'approve') {
      targetStatus = 'معتمد';
    } else if (action === 'reject') {
      targetStatus = 'مرفوض';
    }

    const updates: Record<string, any> = {};
    if (targetStatus !== undefined) updates.status = targetStatus;
    if (title !== undefined) updates.title = title;
    if (total_price !== undefined) updates.total_price = Number(total_price);

    const { data, error } = await admin
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // Invalidate real estate cache so changes immediately reflect across app and AI chat
    invalidatePropertiesCache();

    return NextResponse.json({
      success: true,
      property: enrichSellerProperty(data as Property),
    });
  } catch (error: any) {
    console.error('Error updating seller property:', error);
    return NextResponse.json({ error: error.message || 'Failed to update seller property' }, { status: 500 });
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
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
    }

    const { error } = await admin
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    invalidatePropertiesCache();
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting seller property:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete seller property' }, { status: 500 });
  }
}
