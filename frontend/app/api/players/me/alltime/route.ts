import { NextResponse } from 'next/server';
import { requireAuth, getPlayerByClerkId, err } from '@/lib/api-helpers';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const player = await getPlayerByClerkId(auth.userId);
  if (!player) return err('Player not found', 404);

  const { data, error } = await supabase
    .from('player_season_stats')
    .select('wins, losses, elo, peak_elo, season_id')
    .eq('player_id', player.id);

  if (error) return err(error.message);

  const rows = data ?? [];
  const totalWins   = rows.reduce((s, r) => s + (r.wins   ?? 0), 0);
  const totalLosses = rows.reduce((s, r) => s + (r.losses ?? 0), 0);
  const totalMatches = totalWins + totalLosses;
  const peakElo     = rows.length ? Math.max(...rows.map(r => r.peak_elo ?? r.elo ?? 0)) : player.current_elo ?? 1200;
  const seasonsPlayed = rows.length;
  const winRate     = totalMatches > 0 ? totalWins / totalMatches : 0;

  return NextResponse.json({
    totalWins,
    totalLosses,
    totalMatches,
    peakElo,
    seasonsPlayed,
    winRate,
  });
}
