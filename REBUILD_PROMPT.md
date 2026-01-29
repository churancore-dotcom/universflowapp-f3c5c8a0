# UniversFlow - Complete Technical Specification for Full App Rebuild

**Version:** 2.0 - Comprehensive Edition
**Last Updated:** January 2026
**By:** SHASHANK YADAV

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Complete Database Schema](#3-complete-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Player Engine Architecture](#5-player-engine-architecture)
6. [Core Contexts & Providers](#6-core-contexts--providers)
7. [Component Specifications](#7-component-specifications)
8. [All Pages & Routes](#8-all-pages--routes)
9. [Admin Panel (28 Modules)](#9-admin-panel-28-modules)
10. [Custom Hooks](#10-custom-hooks)
11. [Edge Functions](#11-edge-functions)
12. [CSS Design System](#12-css-design-system)
13. [Animation System](#13-animation-system)
14. [PWA Configuration](#14-pwa-configuration)
15. [Capacitor Mobile Build](#15-capacitor-mobile-build)
16. [File Structure](#16-file-structure)

---

## 1. Project Overview

**UniversFlow** is a premium mobile-first music streaming application with:
- Apple Music-inspired dark theme UI
- Offline playback via IndexedDB
- Social features (dedications, friend referrals)
- Premium subscription via promo codes
- Admin panel for content management
- YouTube audio extraction for uploads
- PWA + Native Android build support

### Key Features
- Music streaming with crossfade transitions
- Download queue with progress tracking
- Real-time song notifications
- Pull-to-refresh with haptic feedback
- Pre-roll audio ads for free users (every 3 songs)
- MediaSession API for lock screen controls
- Scroll-responsive navigation (hide on scroll down)

---

## 2. Technology Stack

### Frontend
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "framer-motion": "^12.26.1",
  "@tanstack/react-query": "^5.83.0",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4",
  "recharts": "^2.15.4",
  "vaul": "^0.9.9",
  "date-fns": "^3.6.0",
  "zod": "^3.25.76"
}
```

### Backend
```json
{
  "@supabase/supabase-js": "^2.90.1",
  "supabase-edge-functions": "Deno runtime"
}
```

### Mobile
```json
{
  "@capacitor/core": "^8.0.1",
  "@capacitor/android": "^8.0.1",
  "@capacitor/cli": "^8.0.1",
  "median-js-bridge": "^2.12.0",
  "vite-plugin-pwa": "^1.2.0"
}
```

### UI Components
```json
{
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-scroll-area": "^1.2.9",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "class-variance-authority": "^0.7.1",
  "tailwind-merge": "^2.6.0"
}
```

---

## 3. Complete Database Schema

### Enums
```sql
CREATE TYPE public.subscription_platform AS ENUM ('android', 'ios', 'web', 'donation');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE public.subscription_type AS ENUM ('free', 'premium_monthly', 'premium_yearly');
```

### Core Tables

#### profiles
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  share_code TEXT UNIQUE, -- For friend referrals
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view basic profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
```

#### songs
```sql
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id),
  album TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration INTEGER DEFAULT 0,
  genre TEXT,
  mood TEXT,
  bpm INTEGER,
  bitrate INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  cover_size BIGINT DEFAULT 0,
  play_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_premium_only BOOLEAN NOT NULL DEFAULT false,
  show_in_new_releases BOOLEAN NOT NULL DEFAULT false,
  show_in_trending BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible songs" 
ON public.songs FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can do everything with songs" 
ON public.songs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);
```

#### artists
```sql
CREATE TABLE public.artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  genre TEXT,
  is_premium_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### user_subscriptions
```sql
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  platform subscription_platform NOT NULL DEFAULT 'web',
  expires_at TIMESTAMPTZ,
  transaction_id TEXT,
  purchase_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### promo_codes
```sql
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### playlists & playlist_songs
```sql
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id),
  song_id UUID NOT NULL REFERENCES public.songs(id),
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### user_library
```sql
CREATE TABLE public.user_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, song_id)
);
```

#### recently_played
```sql
CREATE TABLE public.recently_played (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id),
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### friends
```sql
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### song_dedications
```sql
CREATE TABLE public.song_dedications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  song_id UUID NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### song_reactions
```sql
CREATE TABLE public.song_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES public.songs(id),
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(song_id, user_id, emoji)
);
```

#### donations
```sql
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  platform TEXT NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### announcements
```sql
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_audience TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### app_settings
```sql
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Database Functions

```sql
-- Handle new user signup - create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE WHEN NEW.email = 'shashankyadavk12@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### Storage Buckets

```sql
-- Music files bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true);

-- Cover images bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
```

---

## 4. Authentication System

### AuthContext.tsx
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    
    setIsAdmin(data?.is_admin ?? false);
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });

    // Create profile with share_code
    if (!error && data.user) {
      const shareCode = Math.random().toString(36).substring(2, 10);
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        email: email,
        share_code: shareCode,
      }, { onConflict: 'user_id' });
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { error: error as Error };

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, share_code')
        .eq('user_id', data.user.id)
        .single();
      
      // Generate share_code for existing users
      if (profile && !profile.share_code) {
        const newShareCode = Math.random().toString(36).substring(2, 10);
        await supabase.from('profiles').update({ share_code: newShareCode })
          .eq('user_id', data.user.id);
      }
      
      const adminStatus = profile?.is_admin ?? false;
      setIsAdmin(adminStatus);
      return { error: null, isAdmin: adminStatus };
    }

    return { error: null, isAdmin: false };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Key Authentication Features
- Email/password signup and login
- Google OAuth support
- Admin role detection via profiles table
- Share code generation for friend referrals
- Auto-redirect after login (admins → /admin, users → /home)

---

## 5. Player Engine Architecture

### Song Interface
```typescript
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  audio_url: string;
  duration?: number;
  artist_id?: string;
  artist_photo_url?: string;
  play_count?: number;
}
```

### PlayerContext Key Features

1. **Dual Audio Element System**
   - Primary audio for current playback
   - Secondary audio for crossfade transitions
   - Seamless gapless playback

2. **Queue Management**
   - Dynamic queue from section songs
   - Shuffle mode (random selection)
   - Repeat modes: off, all, one

3. **Crossfade Implementation**
   - Configurable duration (1-12 seconds)
   - Smooth volume transition (30 steps)
   - Audio element swap after crossfade

4. **Pre-roll Ads**
   - Every 3rd song for free users
   - Pending song queue while ad plays
   - Skip after countdown

5. **Progress Tracking**
   - requestAnimationFrame for smooth updates
   - Non-blocking progress state

6. **MediaSession Integration**
   - Lock screen controls
   - Now Playing metadata with artwork
   - Seek support

### Core Player Methods
```typescript
interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: Song[];
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  isExpanded: boolean;
  crossfade: boolean;
  crossfadeDuration: number;
  showPrerollAd: boolean;
  
  playSong: (song: Song, offlineUrl?: string | null, songsQueue?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  stopSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setExpanded: (expanded: boolean) => void;
  toggleCrossfade: () => void;
  setCrossfadeDuration: (seconds: number) => void;
  onPrerollAdComplete: () => void;
}
```

---

## 6. Core Contexts & Providers

### Provider Hierarchy (App.tsx)
```tsx
<QueryClientProvider>
  <BrowserRouter>
    <AuthProvider>
      <PlayerProvider>
        <DownloadProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </DownloadProvider>
      </PlayerProvider>
    </AuthProvider>
  </BrowserRouter>
</QueryClientProvider>
```

### DownloadContext Features
- IndexedDB storage for offline audio
- Download progress tracking
- Queue management for batch downloads
- Blob URL management
- Storage size calculation

---

## 7. Component Specifications

### MobileShell.tsx
```typescript
// Full-screen mobile app container - no desktop responsive
const MobileShell = ({ children }: { children: ReactNode }) => {
  return (
    <div 
      className="fixed inset-0 w-full h-full bg-background overflow-y-auto overflow-x-hidden"
      style={{
        touchAction: 'manipulation',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </div>
  );
};
```

### BottomNav.tsx
- 4 items: Listen Now, Search, Library, Profile
- Scroll-responsive (hide on scroll down, show on scroll up)
- Glassmorphism background
- Rose accent for active state
- Spring animation (stiffness: 400, damping: 30)

### MiniPlayer.tsx
- Fixed position above BottomNav
- Swipe gestures:
  - Swipe up → Expand to fullscreen
  - Swipe left → Next song
  - Swipe right → Previous song
- Play/Pause, Next, Close buttons
- Progress bar at top
- Syncs visibility with BottomNav scroll

### FullscreenPlayer.tsx
- Full-screen modal with drag-to-close
- Blurred album art background (blur: 60px, saturate: 1.3)
- Album art: 85vw, max 340px
- Controls: Shuffle, Prev, Play/Pause, Next, Repeat
- Volume slider
- Progress scrubber
- Action buttons: Dedicate, Share, Add to Playlist
- Song reactions component

### SongCard.tsx
- Fixed width: 150px
- Aspect-square album art
- Like, Download, Add to Playlist buttons
- Audio wave indicator when playing
- Artist photo and name link
- Play count display

---

## 8. All Pages & Routes

### Public Routes
- `/auth` - Login/Signup page

### Protected Routes (require authentication)
- `/home` - Main music feed
- `/search` - Search songs, artists, genres
- `/library` - Liked songs, playlists, artists, downloads
- `/profile` - User profile, settings, premium status
- `/settings` - App settings
- `/support` - Help and donation links
- `/offline` - Offline-only playback page
- `/playlist/:id` - Playlist detail
- `/artist/:artistId` - Artist detail
- `/add-friend/:shareCode` - Friend referral link

### Admin Routes (require admin role)
- `/admin` - Dashboard
- `/admin/upload` - Upload music (YouTube + direct)
- `/admin/songs` - Manage songs
- `/admin/artists` - Manage artists
- `/admin/albums` - Manage albums
- `/admin/playlists` - Manage playlists
- `/admin/users` - Manage users
- `/admin/subscriptions` - Manage subscriptions
- `/admin/donations` - Donation history
- `/admin/app-settings` - App configuration
- `/admin/features` - Feature flags
- `/admin/announcements` - System announcements
- `/admin/moderation` - Content reports
- `/admin/analytics` - Usage analytics
- `/admin/logs` - Activity logs
- `/admin/bulk` - Bulk actions
- `/admin/health` - System health
- `/admin/scheduler` - Content scheduler
- `/admin/backup` - Backup & export
- `/admin/promo-codes` - Promo code management
- `/admin/settings` - Admin settings
- `/admin/api` - API key management
- `/admin/notifications` - Push notifications
- `/admin/revenue` - Revenue analytics
- `/admin/engagement` - User engagement metrics
- `/admin/ab-testing` - A/B testing
- `/admin/security` - Security center

---

## 9. Admin Panel (28 Modules)

### AdminLayout.tsx
- Sidebar navigation with icons
- Nested routes using React Router Outlet
- Mobile hamburger menu

### Key Admin Features

1. **UploadMusic** - YouTube URL extraction, direct file upload, AI metadata extraction
2. **ManageSongs** - CRUD, premium flags, section placement toggles
3. **ManageArtists** - Artist profiles with photos and bios
4. **ManageSubscriptions** - Manual premium assignment
5. **PromoCodes** - Generate codes for lifetime premium
6. **RevenueAnalytics** - Recharts-based financial tracking
7. **UserEngagement** - DAU/WAU metrics, feature usage
8. **ABTesting** - Experiment management with statistical significance
9. **SecurityCenter** - Security event logs, hardening settings
10. **APIManagement** - API key generation and usage tracking
11. **PushNotifications** - Targeted messaging with CTR analytics

---

## 10. Custom Hooks

### useMediaSession
```typescript
// Lock screen / notification controls
export const useMediaSession = ({
  song, isPlaying, onPlay, onPause, onNext, onPrev, onSeek, duration, progress
}: UseMediaSessionOptions) => {
  // Update metadata when song changes
  // Set playback state
  // Register action handlers: play, pause, previoustrack, nexttrack, seekto
  // Update position state with throttling
};
```

### useOfflineAudio
```typescript
// IndexedDB-based offline storage
export const useOfflineAudio = () => {
  const [cachedSongs, setCachedSongs] = useState<CachedAudioMeta[]>([]);
  
  return {
    cachedSongs,
    totalSize,
    formattedSize,
    isLoading,
    isCached: (songId: string) => boolean,
    getPlayableUrl: (songId: string) => Promise<string | null>,
    cacheSong: (song: Song, onProgress?) => Promise<boolean>,
    removeCached: (songId: string) => Promise<void>,
    clearAll: () => Promise<void>,
  };
};
```

### useHaptics
```typescript
// Cross-platform haptic feedback
export const useHaptics = () => {
  return {
    trigger: (style: HapticStyle) => void,
    light, medium, heavy, selection, success, warning, error,
    isEnabled,
    setEnabled,
  };
};

// Standalone function
export const triggerHaptic = (style: HapticStyle) => {
  // Uses Median bridge for native apps
  // Falls back to Web Vibration API
};
```

### usePremium
```typescript
export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(false);
  
  // Check user_subscriptions table
  // Premium if subscription_type != 'free' AND status = 'active' AND not expired
  
  return { isPremium, isLoading, subscription, refetch };
};
```

### usePullToRefresh
```typescript
export const usePullToRefresh = ({ onRefresh, threshold = 80, maxPull = 120 }) => {
  return {
    pullDistance,
    isRefreshing,
    progress: pullDistance / threshold,
    isTriggered: pullDistance >= threshold,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
};
```

### useSongCache
```typescript
// LocalStorage-based song metadata caching
export const useSongCache = () => {
  const [cachedSongs, setCachedSongs] = useState<Song[]>([]);
  
  return {
    cachedSongs,
    updateCache: (songs: Song[]) => void,
  };
};
```

### useNewSongNotification
```typescript
// Real-time new song notifications via Supabase
export const useNewSongNotification = () => {
  // Listen for INSERT on songs table
  // Show toast + browser notification
  
  return { requestPermission };
};
```

---

## 11. Edge Functions

### extract-audio/index.ts

**Purpose:** Extract audio streams from YouTube URLs using Piped and Invidious proxy networks.

**Key Features:**
- Video ID extraction from various URL formats
- Parallel requests to multiple proxy instances
- Fallback chain: Piped → Invidious
- Best audio stream selection (prefer M4A, highest bitrate)

**Piped Instances:**
```typescript
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
  'https://pipedapi.syncpundit.io',
  'https://api-piped.mha.fi',
  'https://pipedapi.leptons.xyz',
  'https://piped-api.lunar.icu',
  'https://pipedapi.r4fo.com',
  'https://pipedapi.adminforge.de',
  'https://api.piped.yt',
  'https://pipedapi.drgns.space',
];
```

**Invidious Instances:**
```typescript
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.private.coffee',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch',
  'https://invidious.slipfox.xyz',
  'https://invidious.jing.rocks',
  'https://iv.nboez.cc',
  'https://invidious.protokolla.fi',
];
```

**Response Format:**
```typescript
interface ExtractionResult {
  success: boolean;
  audioUrl?: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  platform?: string;
  error?: string;
  hint?: string;
}
```

### ai-metadata/index.ts
**Purpose:** Extract metadata from audio files using AI (Gemini).

---

## 12. CSS Design System

### Color Palette (HSL)
```css
:root {
  /* Apple Music Dark Theme */
  --background: 0 0% 0%;              /* Pure black */
  --foreground: 0 0% 98%;             /* Near white */
  
  --card: 0 0% 7%;
  --card-foreground: 0 0% 98%;
  
  --primary: 350 100% 60%;            /* Rose/Red - signature color */
  --primary-foreground: 0 0% 100%;
  
  --secondary: 0 0% 12%;
  --secondary-foreground: 0 0% 98%;
  
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 55%;
  
  --accent: 330 100% 65%;             /* Pink/Magenta */
  --accent-foreground: 0 0% 100%;
  
  --destructive: 0 85% 60%;
  
  --border: 0 0% 15%;
  --input: 0 0% 12%;
  --ring: 350 100% 60%;
  
  --radius: 0.75rem;
  
  /* Glass Effect */
  --glass-bg: 0 0% 8% / 0.85;
  --glass-border: 0 0% 100% / 0.08;
  --glass-blur: 40px;
}
```

### Glassmorphism Classes
```css
.glass {
  @apply backdrop-blur-xl border border-white/[0.08];
  background: rgba(18, 18, 18, 0.75);
}

.glass-strong {
  @apply backdrop-blur-2xl border border-white/[0.12];
  background: rgba(28, 28, 30, 0.85);
}
```

### Mobile-Only Constraints
```css
html {
  background: #000;
  overflow: hidden;
  height: 100%;
  width: 100%;
  -webkit-text-size-adjust: 100%;
  touch-action: manipulation;
}

body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: fixed;
  inset: 0;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
}
```

### Tailwind Breakpoints (Mobile Only)
```typescript
// tailwind.config.ts
screens: {
  'xs': '375px',  // Only breakpoint - disable all larger ones
},
```

---

## 13. Animation System

### Spring Configurations
```typescript
// iOS-optimized springs
export const iosSpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

export const iosBounce: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 25,
  mass: 0.3,
};

// Origin OS 6 style
export const originOS6Spring: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 28,
  mass: 0.8,
  restDelta: 0.001,
};
```

### Animation Variants
```typescript
// Page transitions
export const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: iosSpring },
  exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } },
};

// Sheet/Modal slide up
export const sheetVariants = {
  initial: { y: "100%", opacity: 0.5 },
  animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.25 } },
};

// Stagger children
export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
```

### CSS Keyframes
```css
@keyframes audio-wave {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes ios-bounce {
  0% { transform: scale(0.9) translateY(10px); opacity: 0; }
  60% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
```

---

## 14. PWA Configuration

### manifest.json
```json
{
  "name": "UniversFlow",
  "short_name": "UniversFlow",
  "description": "Premium Music Experience",
  "theme_color": "#000000",
  "background_color": "#000000",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/pwa-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/pwa-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### vite.config.ts PWA Plugin
```typescript
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    // as above
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
  }
})
```

---

## 15. Capacitor Mobile Build

### capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.universflow',
  appName: 'UniversFlow',
  webDir: 'dist',
  server: {
    url: 'https://YOUR_PROJECT_ID.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
```

### GitHub Actions Workflow
```yaml
name: Build Android APK

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
          
      - name: Install dependencies
        run: npm install --legacy-peer-deps
        
      - name: Build web app
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
        run: npm run build
        
      - name: Add Android platform
        run: npx cap add android
        
      - name: Sync Capacitor
        run: npx cap sync android
        
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
          
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug.apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 16. File Structure

```
src/
├── App.tsx                          # Main app with providers and routes
├── main.tsx                         # Entry point with polyfills
├── index.css                        # Global styles and design tokens
├── vite-env.d.ts
│
├── components/
│   ├── MobileShell.tsx              # Full-screen mobile container
│   ├── BottomNav.tsx                # Bottom navigation bar
│   ├── MiniPlayer.tsx               # Collapsed player bar
│   ├── FullscreenPlayer.tsx         # Expanded player view
│   ├── SongCard.tsx                 # Song display card
│   ├── SplashScreen.tsx             # App loading screen
│   ├── PWAInstallBanner.tsx         # PWA install prompt
│   ├── OfflineIndicator.tsx         # Offline status badge
│   ├── OfflineSection.tsx           # Offline content section
│   ├── PullToRefresh.tsx            # Pull-to-refresh indicator
│   ├── QueueDrawer.tsx              # Playback queue drawer
│   ├── EqualizerModal.tsx           # Audio equalizer
│   ├── LockScreenPlayer.tsx         # Simulated lock screen
│   ├── SleepTimerModal.tsx          # Sleep timer
│   ├── AudioVisualizer.tsx          # Audio visualization
│   ├── LyricsDisplay.tsx            # Lyrics view
│   ├── SongReactions.tsx            # Emoji reactions
│   ├── LikeButton.tsx               # Heart button
│   ├── DownloadButton.tsx           # Download button
│   ├── DownloadAllButton.tsx        # Batch download
│   ├── DownloadQueuePanel.tsx       # Download progress panel
│   ├── ShareSongModal.tsx           # Share options
│   ├── SocialShareModal.tsx         # Social sharing
│   ├── AddToPlaylistModal.tsx       # Add to playlist
│   ├── CreatePlaylistModal.tsx      # New playlist
│   ├── AddSongsToPlaylistModal.tsx  # Bulk add songs
│   ├── SendDedicationModal.tsx      # Dedicate song
│   ├── DedicationsInbox.tsx         # Received dedications
│   ├── RedeemCodeModal.tsx          # Promo code entry
│   ├── PremiumGate.tsx              # Premium content block
│   ├── FriendsManager.tsx           # Friend connections
│   ├── FriendActivity.tsx           # Friend activity feed
│   ├── HorizontalSection.tsx        # Horizontal scroll section
│   ├── FeaturedArtistsSection.tsx   # Featured artists
│   ├── GenreSection.tsx             # Genre browser
│   ├── MoodSection.tsx              # Mood-based music
│   ├── AIPlaylistGenerator.tsx      # AI playlist creation
│   ├── Footer.tsx                   # App footer
│   ├── NavLink.tsx                  # Navigation link
│   ├── OptimizedImage.tsx           # Lazy-loaded image
│   ├── PageTransition.tsx           # Page animation wrapper
│   ├── Crossfade.tsx                # Crossfade controls
│   ├── AdvancedAudioSettings.tsx    # Audio settings
│   ├── ListeningStats.tsx           # User stats
│   ├── FavoritesWidget.tsx          # Favorites display
│   ├── WebViewFallback.tsx          # WebView error handler
│   │
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── input.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   └── ... (all Radix-based components)
│   │
│   └── ads/
│       ├── BannerAd.tsx             # Banner ad placeholder
│       ├── InterstitialAd.tsx       # Full-screen ad
│       └── PrerollAd.tsx            # Pre-song audio ad
│
├── contexts/
│   ├── AuthContext.tsx              # Authentication state
│   ├── PlayerContext.tsx            # Audio player state
│   └── DownloadContext.tsx          # Download manager
│
├── hooks/
│   ├── use-mobile.tsx               # Mobile detection
│   ├── use-toast.ts                 # Toast notifications
│   ├── useAppSettings.ts            # App settings
│   ├── useAudioSettings.ts          # Audio preferences
│   ├── useAudioVisualizer.ts        # Web Audio API
│   ├── useHaptics.ts                # Haptic feedback
│   ├── useImageCache.ts             # Image caching
│   ├── useLike.ts                   # Like functionality
│   ├── useMedian.ts                 # Median.co bridge
│   ├── useMediaSession.ts           # Lock screen controls
│   ├── useNewSongNotification.ts    # Real-time notifications
│   ├── useOfflineAudio.ts           # Offline playback
│   ├── usePremium.ts                # Premium status
│   ├── usePullToRefresh.ts          # Pull gesture
│   └── useSongCache.ts              # Song metadata cache
│
├── pages/
│   ├── Auth.tsx                     # Login/Signup
│   ├── Home.tsx                     # Main feed
│   ├── Search.tsx                   # Search page
│   ├── Library.tsx                  # User library
│   ├── Profile.tsx                  # User profile
│   ├── Settings.tsx                 # App settings
│   ├── Support.tsx                  # Help/Donations
│   ├── Offline.tsx                  # Offline mode
│   ├── PlaylistDetail.tsx           # Playlist view
│   ├── ArtistDetail.tsx             # Artist view
│   ├── AddFriend.tsx                # Friend referral
│   ├── NotFound.tsx                 # 404 page
│   ├── Index.tsx                    # Root redirect
│   │
│   └── admin/
│       ├── AdminLayout.tsx          # Admin shell
│       ├── AdminDashboard.tsx       # Dashboard
│       ├── UploadMusic.tsx          # Music upload
│       ├── ManageSongs.tsx          # Song management
│       ├── ManageArtists.tsx        # Artist management
│       ├── ManageAlbums.tsx         # Album management
│       ├── ManagePlaylists.tsx      # Playlist management
│       ├── ManageUsers.tsx          # User management
│       ├── ManageSubscriptions.tsx  # Subscription management
│       ├── DonationHistory.tsx      # Donations
│       ├── PromoCodes.tsx           # Promo codes
│       ├── AppSettings.tsx          # App config
│       ├── FeatureFlags.tsx         # Feature toggles
│       ├── Announcements.tsx        # System messages
│       ├── ContentModeration.tsx    # Reports
│       ├── Analytics.tsx            # Usage analytics
│       ├── ActivityLogs.tsx         # Audit logs
│       ├── BulkActions.tsx          # Batch operations
│       ├── SystemHealth.tsx         # System status
│       ├── ContentScheduler.tsx     # Scheduled content
│       ├── BackupExport.tsx         # Data export
│       ├── Settings.tsx             # Admin settings
│       ├── APIManagement.tsx        # API keys
│       ├── PushNotifications.tsx    # Notifications
│       ├── RevenueAnalytics.tsx     # Revenue
│       ├── UserEngagement.tsx       # Engagement
│       ├── ABTesting.tsx            # Experiments
│       └── SecurityCenter.tsx       # Security
│
├── lib/
│   ├── utils.ts                     # Utility functions (cn)
│   ├── animations.ts                # Framer Motion configs
│   ├── errorMessages.ts             # Error message mappings
│   ├── imageCompression.ts          # Image processing
│   └── median.ts                    # Median.co SDK loader
│
└── integrations/
    └── supabase/
        ├── client.ts                # Supabase client (auto-generated)
        └── types.ts                 # Database types (auto-generated)

supabase/
├── config.toml                      # Supabase configuration
└── functions/
    ├── extract-audio/
    │   └── index.ts                 # YouTube audio extraction
    └── ai-metadata/
        └── index.ts                 # AI metadata extraction

public/
├── favicon.ico
├── manifest.json
├── robots.txt
├── placeholder.svg
├── pwa-192x192.png
├── pwa-512x512.png
├── pwa-maskable-192x192.png
└── pwa-maskable-512x512.png
```

---

## Summary

This document provides a complete technical specification for rebuilding the **UniversFlow** music streaming application. It includes:

- ✅ Complete database schema with 16+ tables and RLS policies
- ✅ Full authentication system with admin roles
- ✅ Dual-audio player engine with crossfade
- ✅ 28 admin panel modules
- ✅ Offline playback via IndexedDB
- ✅ Social features (dedications, friend referrals)
- ✅ Premium subscription via promo codes
- ✅ YouTube audio extraction edge function
- ✅ Apple Music-inspired dark theme
- ✅ iOS-style animations with Framer Motion
- ✅ PWA + Capacitor Android build support

**Use this document to:**
1. Rebuild the entire app from scratch
2. Hand off to developers
3. Document for maintenance
4. Reference for feature implementation

---

*Created by SHASHANK YADAV • UniversFlow v2.0*
