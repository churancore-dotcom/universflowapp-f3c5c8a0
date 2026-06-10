import { Link } from "react-router-dom";
import { Download, Music, WifiOff, Sparkles, Shield, Star } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const APK_URL = "/UniversFlow.apk";

const features = [
  { icon: Music, title: "Millions of songs", desc: "Stream unlimited music — pop, hip-hop, Bollywood, lo-fi, rock & more." },
  { icon: WifiOff, title: "Listen offline", desc: "Download playlists and play with zero internet — flights, metro, anywhere." },
  { icon: Sparkles, title: "Apple Music–style player", desc: "Premium, gorgeous UI built for Android phones." },
  { icon: Shield, title: "Safe APK", desc: "Signed Android package, hosted directly on universflow.in." },
];

const GetApp = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Universflow",
    operatingSystem: "ANDROID",
    applicationCategory: "MusicApplication",
    url: "https://universflow.in/get",
    installUrl: "https://universflow.in/UniversFlow.apk",
    downloadUrl: "https://universflow.in/UniversFlow.apk",
    softwareVersion: "1.0",
    fileSize: "24MB",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1280" },
  };

  return (
    <>
      <SEOHead
        title="Download Universflow APK — Free Music App for Android"
        description="Download the Universflow Android APK. Stream millions of songs free, build playlists, follow artists, and listen offline. No ads on Premium."
        path="/get"
        jsonLd={jsonLd}
        jsonLdId="getapp-jsonld"
      />

      <main className="min-h-[100dvh] w-full bg-black text-white overflow-y-auto">
        {/* Hero */}
        <section className="relative px-6 pt-12 pb-10 text-center">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(255,45,85,0.35) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
          <img
            src="/pwa-192x192.png"
            alt="Universflow app icon"
            width={96}
            height={96}
            className="mx-auto rounded-3xl shadow-2xl shadow-[#FF2D55]/40"
          />
          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight">
            Universflow
          </h1>
          <p className="mt-2 text-base text-white/70 max-w-md mx-auto">
            Free music streaming app for Android. Millions of songs. Offline downloads. Zero clutter.
          </p>

          <a
            href={APK_URL}
            download
            className="mt-8 inline-flex items-center justify-center gap-2 w-full max-w-sm px-6 py-4 rounded-2xl bg-[#FF2D55] text-white font-semibold text-lg shadow-xl shadow-[#FF2D55]/30 active:scale-[0.98] transition-transform"
          >
            <Download className="w-5 h-5" />
            Download APK (Android)
          </a>

          <div className="mt-3 text-xs text-white/50">
            Free • ~24 MB • Android 5.1+ • Direct download
          </div>

          <Link
            to="/auth"
            className="mt-5 inline-block text-sm text-white/80 underline underline-offset-4 decoration-white/30"
          >
            Or open the web app
          </Link>

          {/* Trust strip */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-white/60">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#FF2D55]" fill="currentColor" /> 4.8
            </span>
            <span>•</span>
            <span>Ad-free on Premium</span>
            <span>•</span>
            <span>Offline ready</span>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur"
              >
                <Icon className="w-5 h-5 text-[#FF2D55]" />
                <h2 className="mt-3 text-base font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-white/65">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Install steps */}
        <section className="px-6 pb-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">How to install on Android</h2>
          <ol className="space-y-3 text-sm text-white/75">
            <li><span className="text-[#FF2D55] font-semibold">1.</span> Tap “Download APK” above.</li>
            <li><span className="text-[#FF2D55] font-semibold">2.</span> Open the file from your Downloads notification.</li>
            <li><span className="text-[#FF2D55] font-semibold">3.</span> If prompted, allow installs from this source.</li>
            <li><span className="text-[#FF2D55] font-semibold">4.</span> Tap Install → Open → enjoy 🎧</li>
          </ol>

          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold">On iPhone?</h3>
            <p className="mt-1 text-sm text-white/65">
              iOS doesn’t allow APKs. Open <Link to="/auth" className="text-[#FF2D55] underline">the web player</Link> and tap Share → “Add to Home Screen”.
            </p>
          </div>
        </section>

        <footer className="px-6 py-8 text-center text-xs text-white/40 border-t border-white/5">
          <div className="space-x-3">
            <Link to="/premium" className="hover:text-white/70">Premium</Link>
            <Link to="/support" className="hover:text-white/70">Support</Link>
            <Link to="/auth" className="hover:text-white/70">Sign in</Link>
          </div>
          <div className="mt-3">© Universflow</div>
        </footer>
      </main>
    </>
  );
};

export default GetApp;
