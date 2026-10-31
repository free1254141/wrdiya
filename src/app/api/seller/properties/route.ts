import { NextRequest, NextResponse } from 'next/server';
import {
  createSellerProperty,
  updateSellerProperty,
  deleteSellerProperty,
  getSellerProperties,
} from '@/lib/seller-listings';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId') || searchParams.get('userId') || '';
    if (!ownerId) {
      return NextResponse.json({ properties: [] });
    }
    const properties = await getSellerProperties(ownerId);
    return NextResponse.json({ success: true, properties });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load seller properties' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ownerId = body.owner_id || body.ownerId || body.userId || 'guest_seller';
    const created = await createSellerProperty({
      ...body,
      owner_id: ownerId,
    });
    if (!created) {
      return NextResponse.json({ error: 'تعذر حفظ الوحدة في قاعدة البيانات' }, { status: 500 });
    }
    return NextResponse.json({ success: true, property: created });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create property' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || body.property_id;
    const ownerId = body.owner_id || body.ownerId || body.userId || 'guest_seller';
    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
    }
    const updated = await updateSellerProperty(id, ownerId, body);
    if (!updated) {
      return NextResponse.json({ error: 'تعذر تحديث بيانات الوحدة' }, { status: 500 });
    }
    return NextResponse.json({ success: true, property: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
    }
    const ok = await deleteSellerProperty(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete property' }, { status: 500 });
  }
}
