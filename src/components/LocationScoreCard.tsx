'use client';

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Bus,
  Globe2,
  Loader2,
} from 'lucide-react';
import type { OsmLocationScoreResult } from '@/lib/osm-location-intelligence';

interface LocationScoreCardProps {
  location: string;
  compoundName?: string;
}

export default function LocationScoreCard({
  location,
  compoundName,
}: LocationScoreCardProps) {
  const [data, setData] = useState<OsmLocationScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({
      location: location || '',
      compound: compoundName || '',
    });
    fetch(`/api/location-score?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (active && res && typeof res.score === 'number') {
          setData(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [location, compoundName]);

  if (loading) {
    return (
      <div className="my-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-center gap-2.5 text-xs text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        <span>جاري تحليل الخدمات والمحاور المحيطة عبر خرائط OpenStreetMap...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="my-6 rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-white">
              سكور الموقع والخدمات القريبة (نطاق 4.5 كم)
            </h3>
            <p className="text-[11px] text-zinc-400">{data.gradeAr}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold text-zinc-300">
            <Globe2 className="h-3 w-3 text-emerald-400" />
            <span>
              {data.source === 'openstreetmap_live'
                ? 'OpenStreetMap Live'
                : 'Egypt GIS Index'}
            </span>
          </span>
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-center">
            <span className="text-lg font-black text-emerald-400 font-mono">
              {data.score}
            </span>
            <span className="text-[10px] text-zinc-400">/100</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 flex items-center gap-2.5">
          <GraduationCap className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-400">مدارس وجامعات</div>
            <div className="font-black text-white">{data.schoolsCount}</div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 flex items-center gap-2.5">
          <HeartPulse className="h-4 w-4 text-rose-400 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-400">مستشفيات ومراكز طبية</div>
            <div className="font-black text-white">{data.hospitalsCount}</div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 flex items-center gap-2.5">
          <ShoppingBag className="h-4 w-4 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-400">مولات وسوبرماركت</div>
            <div className="font-black text-white">{data.mallsCount}</div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 flex items-center gap-2.5">
          <Bus className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-400">نقاط مواصلات ومحاور</div>
            <div className="font-black text-white">{data.transitCount}</div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 mt-3">{data.summaryAr}</p>
    </div>
  );
}
