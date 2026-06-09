'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/modern-side-bar';
import {
  Trophy,
  ChevronDown,
  Settings,
  Edit3,
  Camera,
  LogOut,
  X,
  Check,
  Info,
  Zap,
  TrendingUp,
  Award,
  Bell,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  display_name: string;
  current_elo: number;
  wins: number;
  losses: number;
  total_matches: number;
  win_rate: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'tournament' | 'update' | 'event' | 'general';
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  player_id: 'p1',  display_name: 'Alex Thunder',   current_elo: 1842, wins: 34, losses: 8,  total_matches: 42, win_rate: 81 },
  { rank: 2,  player_id: 'p2',  display_name: 'Jordan Spike',   current_elo: 1790, wins: 29, losses: 11, total_matches: 40, win_rate: 72 },
  { rank: 3,  player_id: 'p3',  display_name: 'Casey Serve',    current_elo: 1755, wins: 27, losses: 13, total_matches: 40, win_rate: 67 },
  { rank: 4,  player_id: 'p4',  display_name: 'Morgan Volley',  current_elo: 1698, wins: 22, losses: 16, total_matches: 38, win_rate: 58 },
  { rank: 5,  player_id: 'p5',  display_name: 'Riley Net',      current_elo: 1645, wins: 20, losses: 18, total_matches: 38, win_rate: 53 },
  { rank: 6,  player_id: 'p6',  display_name: 'Sam Roundnet',   current_elo: 1610, wins: 18, losses: 20, total_matches: 38, win_rate: 47 },
  { rank: 7,  player_id: 'p7',  display_name: 'Taylor Drop',    current_elo: 1580, wins: 16, losses: 21, total_matches: 37, win_rate: 43 },
  { rank: 8,  player_id: 'p8',  display_name: 'Drew Slam',      current_elo: 1522, wins: 14, losses: 24, total_matches: 38, win_rate: 37 },
  { rank: 9,  player_id: 'p9',  display_name: 'Quinn Bounce',   current_elo: 1488, wins: 12, losses: 26, total_matches: 38, win_rate: 32 },
  { rank: 10, player_id: 'p10', display_name: 'Blake Spiker',   current_elo: 1445, wins: 10, losses: 28, total_matches: 38, win_rate: 26 },
];

// Announcements — newest first (index 0 = most recent)
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: '🏆 Spring Tournament 2025',
    content: 'Registration is now open for the Spring Tournament! Sign up by March 15. Teams of 2, round-robin format. Prize: custom OU Roundnet jerseys for the champions.',
    date: '2025-03-01',
    type: 'tournament',
  },
  {
    id: '2',
    title: '📅 New Practice Schedule',
    content: 'Tuesdays & Thursdays 5–7 PM at the Rec Center outdoor courts starting this week. All skill levels welcome. Bring water!',
    date: '2025-02-22',
    type: 'event',
  },
  {
    id: '3',
    title: '🆕 ELO System Updated',
    content: 'K-factor is now 60 for placement matches (first 10) and 24 after. Check the ELO guide below for the full breakdown.',
    date: '2025-02-15',
    type: 'update',
  },
  {
    id: '4',
    title: '👋 Welcome New Members!',
    content: '12 new players joined this semester. Complete your 10 placement matches to appear on the official leaderboard.',
    date: '2025-01-20',
    type: 'general',
  },
];

const MEDALS = ['🥇', '🥈', '🥉'];

const TYPE_STYLES: Record<Announcement['type'], string> = {
  tournament: 'bg-purple-50  text-purple-700  border-purple-200',
  update:     'bg-blue-50    text-blue-700    border-blue-200',
  event:      'bg-green-50   text-green-700   border-green-200',
  general:    'bg-gray-50    text-gray-600    border-gray-200',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [leaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 text-[#FFB81C] animate-spin" />
      </div>
    );
  }

  // Derived player info
  const firstName      = user?.firstName || 'Spiker';
  const displayName    = user?.fullName || user?.username || 'Anonymous';
  const initials       = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'S';
  const avatarUrl      = user?.imageUrl;

  // In production this comes from GET /api/players/me matched against the leaderboard
  // For now we highlight rank 6 as a demo
  const MY_PLAYER_ID = 'p6';
  const myEntry = leaderboard.find(p => p.player_id === MY_PLAYER_ID);

  const handleSaveProfile = async () => {
    setSaving(true);
    // TODO: PATCH /api/players/me  { university, bio }
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setShowEditProfile(false);
  };

  return (
    <div className="flex h-screen bg-[#f5f4f0] overflow-hidden">

      {/* ── Sidebar ── */}
      <Sidebar
        playerName={displayName}
        playerInitials={initials}
        playerRole={myEntry ? `Rank #${myEntry.rank}` : 'Unranked'}
        onSignOut={() => signOut(() => router.push('/'))}
      />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          {/* Greeting — indent on mobile to clear hamburger */}
          <div className="ml-14 md:ml-0">
            <h1 className="text-xl font-bold text-[#0a0a0a]">
              What up!{' '}
              <span className="text-[#FFB81C]">Spiker</span>{' '}
              {firstName}! 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {myEntry
                ? `Rank #${myEntry.rank} · ${myEntry.current_elo} ELO · ${myEntry.wins}W ${myEntry.losses}L`
                : 'Complete 10 placement matches to appear on the leaderboard'}
            </p>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative flex-shrink-0" ref={avatarMenuRef}>
            <button
              onClick={() => setShowAvatarMenu(v => !v)}
              className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-[#FFB81C] flex items-center justify-center overflow-hidden border-2 border-[#FFB81C] shadow">
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-[#0a0a0a] font-bold text-sm">{initials}</span>}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {showAvatarMenu && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-[#0a0a0a] truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <button
                  onClick={() => { setShowEditProfile(true); setShowAvatarMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-gray-400" />
                  Edit Profile
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowAvatarMenu(false)}
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => signOut(() => router.push('/'))}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable page body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

            {/* ── Leaderboard ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-[#FFB81C]" />
                <h2 className="text-lg font-bold text-[#0a0a0a]">Season Leaderboard</h2>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="bg-[#0a0a0a] text-white text-xs uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-semibold w-16">Rank</th>
                        <th className="text-left px-5 py-3 font-semibold">Player</th>
                        <th className="text-right px-5 py-3 font-semibold">ELO</th>
                        <th className="text-right px-5 py-3 font-semibold hidden sm:table-cell">W</th>
                        <th className="text-right px-5 py-3 font-semibold hidden sm:table-cell">L</th>
                        <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Win %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((player, idx) => {
                        const isMe = player.player_id === MY_PLAYER_ID;
                        return (
                          <tr
                            key={player.player_id}
                            className={`
                              border-t transition-colors
                              ${isMe
                                ? 'bg-[#FFB81C]/10 border-[#FFB81C]/30'
                                : idx % 2 === 0 ? 'bg-white border-gray-50' : 'bg-gray-50/40 border-gray-50'}
                            `}
                          >
                            <td className="px-5 py-3.5">
                              {player.rank <= 3
                                ? <span className="text-xl">{MEDALS[player.rank - 1]}</span>
                                : <span className="text-sm font-semibold text-gray-400">#{player.rank}</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${isMe ? 'font-bold text-[#0a0a0a]' : 'font-medium text-gray-800'}`}>
                                  {player.display_name}
                                </span>
                                {isMe && (
                                  <span className="text-[10px] bg-[#FFB81C] text-[#0a0a0a] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`text-sm font-bold ${isMe ? 'text-[#0a0a0a]' : 'text-gray-700'}`}>
                                {player.current_elo}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                              <span className="text-sm font-medium text-green-600">{player.wins}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                              <span className="text-sm font-medium text-red-500">{player.losses}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right hidden md:table-cell">
                              <span className="text-sm text-gray-500">{player.win_rate}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── ELO Explainer ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-[#FFB81C]" />
                <h2 className="text-lg font-bold text-[#0a0a0a]">How ELO Rankings Work</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Zap,
                    title: 'Starting ELO',
                    desc: 'Every player begins at 1,000 ELO. The more you play, the closer your rating gets to your true skill level.',
                    bg: 'bg-amber-50 border-amber-200',
                    iconColor: 'text-amber-500',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Placement Phase',
                    desc: 'Your first 10 matches use K = 60 (high volatility). This lets your rating settle to its real level quickly.',
                    bg: 'bg-blue-50 border-blue-200',
                    iconColor: 'text-blue-500',
                  },
                  {
                    icon: Award,
                    title: 'Rated Phase',
                    desc: 'After placement, K = 24. Beating higher-ranked players earns more ELO. Losses to lower-ranked players hurt more.',
                    bg: 'bg-purple-50 border-purple-200',
                    iconColor: 'text-purple-500',
                  },
                  {
                    icon: Trophy,
                    title: '2v2 Formula',
                    desc: 'Team ELO = average of both partners. All 4 players gain/lose ELO based on expected vs actual match outcome.',
                    bg: 'bg-green-50 border-green-200',
                    iconColor: 'text-green-500',
                  },
                ].map(({ icon: Icon, title, desc, bg, iconColor }) => (
                  <div key={title} className={`rounded-2xl border p-5 ${bg}`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                      <h3 className="font-semibold text-[#0a0a0a] text-sm">{title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Announcements ── */}
            <section className="pb-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-[#FFB81C]" />
                <h2 className="text-lg font-bold text-[#0a0a0a]">Announcements</h2>
                <span className="text-xs text-gray-400 ml-1">· Latest first</span>
              </div>

              {/* Horizontal scroll — no loop, newest on the left */}
              <div
                className="flex gap-4 overflow-x-auto pb-3"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {MOCK_ANNOUNCEMENTS.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col"
                  >
                    <span className={`self-start text-xs font-medium px-2.5 py-0.5 rounded-full border mb-3 ${TYPE_STYLES[ann.type]}`}>
                      {ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                    </span>
                    <h3 className="font-semibold text-[#0a0a0a] text-sm mb-2 leading-snug">{ann.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">{ann.content}</p>
                    <p className="text-xs text-gray-300 mt-3">
                      {new Date(ann.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#0a0a0a]">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#FFB81C] flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      : <span className="text-[#0a0a0a] font-bold text-2xl">{initials}</span>}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0a0a0a] rounded-full flex items-center justify-center shadow border-2 border-white">
                    <Camera className="h-3 w-3 text-[#FFB81C]" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Profile photo is managed through your Clerk account
                </p>
              </div>

              {/* Display name (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  readOnly
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Change your name in your{' '}
                  <a href="https://accounts.clerk.dev" target="_blank" rel="noreferrer" className="text-[#FFB81C] underline">
                    Clerk account
                  </a>
                </p>
              </div>

              {/* University / School / College */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  University / School / College
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="e.g. Oakland University"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Bio <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell the club a bit about yourself…"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#FFB81C] rounded-lg text-sm font-bold text-[#0a0a0a] hover:bg-[#e6a418] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><Check className="h-4 w-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
