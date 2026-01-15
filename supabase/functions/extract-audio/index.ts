import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cobalt instances with different API versions
// v11 instances use root endpoint with downloadMode
// v7 instances use /api/json with isAudioOnly
const COBALT_INSTANCES = [
  // v7 instances (older API format, some don't require auth)
  { url: 'https://downloadapi.stuff.solutions/api/json', version: 7 },
  { url: 'https://capi.3kh0.net/api/json', version: 7 },
  { url: 'https://co.eepy.today/api/json', version: 7 },
  // v11 instances (newer API format)  
  { url: 'https://cobalt-api.meowing.de', version: 11 },
  { url: 'https://cobalt-backend.canine.tools', version: 11 },
  { url: 'https://blossom.imput.net', version: 11 },
  { url: 'https://sunny.imput.net', version: 11 },
];

interface CobaltV7Response {
  status: 'stream' | 'success' | 'redirect' | 'picker' | 'error';
  url?: string;
  text?: string;
  picker?: Array<{ url: string; type: string }>;
}

interface CobaltV11Response {
  status: 'tunnel' | 'redirect' | 'picker' | 'error' | 'local-processing';
  url?: string;
  filename?: string;
  error?: { code: string; context?: { service?: string; limit?: number } };
  picker?: Array<{ url: string; type: string }>;
  audio?: string;
  audioFilename?: string;
}

type CobaltResponse = CobaltV7Response | CobaltV11Response;

async function tryExtractWithInstance(
  instanceUrl: string, 
  version: number, 
  mediaUrl: string
): Promise<{ success: boolean; audioUrl?: string; filename?: string; error?: string }> {
  try {
    console.log(`Trying cobalt instance: ${instanceUrl} (v${version})`);
    
    let body: string;
    if (version === 7) {
      // v7 API format
      body = JSON.stringify({
        url: mediaUrl,
        isAudioOnly: true,
        aFormat: 'mp3',
        filenamePattern: 'basic',
      });
    } else {
      // v11 API format
      body = JSON.stringify({
        url: mediaUrl,
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '320',
        filenameStyle: 'basic',
      });
    }
    
    const response = await fetch(instanceUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'UniversFlow/1.0 (+https://universflowapp.lovable.app)',
      },
      body,
    });

    console.log(`Instance ${instanceUrl} returned status ${response.status}`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log(`Error response from ${instanceUrl}:`, JSON.stringify(errorData));
        const errorCode = errorData.error?.code || errorData.text || 'Unknown error';
        return { success: false, error: errorCode };
      } catch {
        return { success: false, error: `HTTP ${response.status}` };
      }
    }

    const data: CobaltResponse = await response.json();
    console.log(`Instance ${instanceUrl} response:`, JSON.stringify(data));
    
    // Handle v7 response format
    if (version === 7) {
      const v7Data = data as CobaltV7Response;
      if (v7Data.status === 'error') {
        return { success: false, error: v7Data.text || 'Unknown error' };
      }
      if (v7Data.status === 'stream' || v7Data.status === 'success' || v7Data.status === 'redirect') {
        if (v7Data.url) {
          return { success: true, audioUrl: v7Data.url, filename: 'audio.mp3' };
        }
      }
      if (v7Data.status === 'picker' && v7Data.picker?.length) {
        return { success: true, audioUrl: v7Data.picker[0].url, filename: 'audio.mp3' };
      }
    }
    
    // Handle v11 response format
    if (version === 11) {
      const v11Data = data as CobaltV11Response;
      if (v11Data.status === 'error') {
        return { success: false, error: v11Data.error?.code || 'Unknown error' };
      }
      if (v11Data.status === 'tunnel' || v11Data.status === 'redirect') {
        if (v11Data.url) {
          return { success: true, audioUrl: v11Data.url, filename: v11Data.filename || 'audio.mp3' };
        }
      }
      if (v11Data.status === 'picker') {
        if (v11Data.audio) {
          return { success: true, audioUrl: v11Data.audio, filename: v11Data.audioFilename || 'audio.mp3' };
        }
        if (v11Data.picker?.length) {
          return { success: true, audioUrl: v11Data.picker[0].url, filename: 'audio.mp3' };
        }
      }
      if (v11Data.status === 'local-processing') {
        return { success: false, error: 'Content requires local processing' };
      }
    }
    
    return { success: false, error: 'No audio URL in response' };
  } catch (error) {
    console.error(`Error with instance ${instanceUrl}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

function detectPlatform(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'YouTube';
  if (lowercaseUrl.includes('soundcloud.com')) return 'SoundCloud';
  if (lowercaseUrl.includes('spotify.com')) return 'Spotify';
  if (lowercaseUrl.includes('tiktok.com')) return 'TikTok';
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'Twitter/X';
  if (lowercaseUrl.includes('instagram.com')) return 'Instagram';
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.watch')) return 'Facebook';
  if (lowercaseUrl.includes('vimeo.com')) return 'Vimeo';
  if (lowercaseUrl.includes('twitch.tv')) return 'Twitch';
  if (lowercaseUrl.includes('reddit.com')) return 'Reddit';
  if (lowercaseUrl.includes('bilibili.com')) return 'Bilibili';
  return 'Unknown';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracting audio from: ${url}`);
    const platform = detectPlatform(url);
    console.log(`Detected platform: ${platform}`);

    // Check if it's a direct audio URL
    if (url.match(/\.(mp3|wav|flac|aac|ogg|m4a|opus)(\?.*)?$/i)) {
      console.log('Direct audio URL detected, returning as-is');
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl: url,
          platform: 'Direct Link',
          filename: url.split('/').pop()?.split('?')[0] || 'audio.mp3',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try each cobalt instance until one works
    let lastError = '';
    
    for (const instance of COBALT_INSTANCES) {
      const result = await tryExtractWithInstance(instance.url, instance.version, url);
      
      if (result.success && result.audioUrl) {
        console.log(`Successfully extracted audio: ${result.audioUrl}`);
        return new Response(
          JSON.stringify({
            success: true,
            audioUrl: result.audioUrl,
            platform,
            filename: result.filename,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (result.error) {
        lastError = result.error;
        // If it's an auth error, skip to next instance
        if (result.error.includes('auth') || result.error.includes('jwt')) {
          console.log(`Auth required, trying next instance...`);
          continue;
        }
      }
    }

    // All instances failed
    return new Response(
      JSON.stringify({ 
        error: `Failed to extract audio: ${lastError || 'All extraction servers are unavailable.'}`,
        platform,
        hint: 'Try using a direct audio link (MP3, WAV, etc.) instead. Most public extraction services now require authentication.',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in extract-audio function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
