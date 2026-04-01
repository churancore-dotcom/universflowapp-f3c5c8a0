import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Invidious instances for search (reliable from servers, no API key needed)
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.perennialte.ch',
  'https://iv.datura.network',
  'https://invidious.privacyredirect.com',
  'https://invidious.protokolla.fi',
  'https://yt.artemislena.eu',
  'https://invidious.fdn.fr',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Decode HTML entities
function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

async function searchInvidious(query: string, instance: string): Promise<any[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      await resp.text();
      return null;
    }

    const items = await resp.json();
    if (!Array.isArray(items)) return null;

    return items
      .filter((item: any) => item.videoId && item.type === 'video')
      .map((item: any) => {
        // Pick best thumbnail
        const thumb = item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url
          || item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url
          || item.videoThumbnails?.[0]?.url
          || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`;
        return {
          videoId: item.videoId,
          title: decodeEntities(item.title || ''),
          channelTitle: decodeEntities(item.author || ''),
          thumbnail: thumb,
          duration: item.lengthSeconds || 0,
        };
      })
      .filter((r: any) => r.videoId);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 20 } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchQuery = query.trim();

    // Try Invidious instances (no API key needed, works from servers)
    const instances = shuffle(INVIDIOUS_INSTANCES);
    for (const instance of instances) {
      console.log(`Trying search: ${instance}`);
      const results = await searchInvidious(searchQuery, instance);
      if (results && results.length > 0) {
        const limited = results.slice(0, Math.min(maxResults, 50));
        console.log(`✓ Found ${limited.length} results via ${instance}`);
        return new Response(JSON.stringify({
          success: true,
          results: limited,
          totalResults: limited.length,
          query: searchQuery,
          source: 'invidious',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'No results found. All search providers are temporarily unavailable.',
      results: [],
    }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('youtube-search error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
