import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  Flame,
  Instagram,
  Mail,
  Menu,
  Shield,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { GameTile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useListOpenGames } from "../hooks/useQueries";

const GAME_GRADIENTS = [
  "from-orange-900 via-red-950 to-black",
  "from-purple-900 via-indigo-950 to-black",
  "from-green-900 via-emerald-950 to-black",
  "from-yellow-900 via-orange-950 to-black",
  "from-cyan-900 via-blue-950 to-black",
  "from-pink-900 via-red-950 to-black",
];

const CACHE_KEY = "cvr_games_cache";

// Floating battlefield element SVGs
const FLOAT_ELEMENTS = [
  {
    id: "crosshair-1",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="8" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="0" x2="20" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="30" x2="20" y2="40" stroke="currentColor" stroke-width="1.5"/><line x1="0" y1="20" x2="10" y2="20" stroke="currentColor" stroke-width="1.5"/><line x1="30" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg>`,
    size: 36,
    top: "12%",
    left: "8%",
    animClass: "float-drift-1",
    opacity: 0.1,
  },
  {
    id: "grenade-1",
    svg: `<svg viewBox="0 0 30 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="11" y="0" width="8" height="6" rx="2"/><rect x="13" y="4" width="4" height="4"/><ellipse cx="15" cy="26" rx="11" ry="14"/><rect x="12" y="8" width="6" height="4" rx="1"/></svg>`,
    size: 28,
    top: "65%",
    left: "5%",
    animClass: "float-drift-2",
    opacity: 0.09,
  },
  {
    id: "bullet-1",
    svg: `<svg viewBox="0 0 16 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0 C4 6 2 10 2 14 L2 36 Q2 40 8 40 Q14 40 14 36 L14 14 C14 10 12 6 8 0Z"/></svg>`,
    size: 22,
    top: "30%",
    right: "6%",
    animClass: "float-drift-3",
    opacity: 0.12,
  },
  {
    id: "dogtag-1",
    svg: `<svg viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="8" width="32" height="38" rx="6" stroke="currentColor" stroke-width="2"/><rect x="14" y="0" width="8" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="20" x2="26" y2="20" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="27" x2="26" y2="27" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="34" x2="20" y2="34" stroke="currentColor" stroke-width="1.5"/></svg>`,
    size: 32,
    top: "75%",
    right: "7%",
    animClass: "float-drift-1",
    opacity: 0.1,
  },
  {
    id: "crosshair-2",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="8" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="0" x2="20" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="30" x2="20" y2="40" stroke="currentColor" stroke-width="1.5"/><line x1="0" y1="20" x2="10" y2="20" stroke="currentColor" stroke-width="1.5"/><line x1="30" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="1.5"/></svg>`,
    size: 48,
    top: "45%",
    left: "88%",
    animClass: "float-drift-4",
    opacity: 0.08,
  },
  {
    id: "star-1",
    svg: `<svg viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 24,15 38,15 27,23 31,37 20,29 9,37 13,23 2,15 16,15"/></svg>`,
    size: 24,
    top: "20%",
    left: "78%",
    animClass: "float-drift-2",
    opacity: 0.1,
  },
  {
    id: "shield-1",
    svg: `<svg viewBox="0 0 36 44" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18 2 L34 8 L34 22 C34 33 26 40 18 43 C10 40 2 33 2 22 L2 8 Z"/></svg>`,
    size: 30,
    top: "55%",
    left: "50%",
    animClass: "float-drift-3",
    opacity: 0.06,
  },
];

// Weapon image floating elements
const WEAPON_FLOAT_ELEMENTS = [
  {
    id: "ak47-1",
    depth: 0.8,
    src: "/assets/generated/ak47-float-transparent.dim_120x60.png",
    width: 80,
    height: 40,
    top: "18%",
    left: "15%",
    animClass: "float-drift-2",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "ak47-2",
    depth: 1.2,
    src: "/assets/generated/ak47-float-transparent.dim_120x60.png",
    width: 80,
    height: 40,
    top: "72%",
    right: "12%",
    animClass: "float-drift-4",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "grenade-img-1",
    depth: 1.0,
    src: "/assets/generated/grenade-float-transparent.dim_60x70.png",
    width: 34,
    height: 34,
    top: "8%",
    left: "45%",
    animClass: "float-drift-1",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "grenade-img-2",
    depth: 0.6,
    src: "/assets/generated/grenade-float-transparent.dim_60x70.png",
    width: 34,
    height: 34,
    top: "40%",
    left: "25%",
    animClass: "float-drift-3",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "grenade-img-3",
    depth: 1.1,
    src: "/assets/generated/grenade-float-transparent.dim_60x70.png",
    width: 34,
    height: 34,
    top: "60%",
    left: "70%",
    animClass: "float-drift-2",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "grenade-img-4",
    depth: 0.9,
    src: "/assets/generated/grenade-float-transparent.dim_60x70.png",
    width: 34,
    height: 34,
    top: "82%",
    left: "38%",
    animClass: "float-drift-1",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "grenade-img-5",
    depth: 0.7,
    src: "/assets/generated/grenade-float-transparent.dim_60x70.png",
    width: 34,
    height: 34,
    top: "25%",
    right: "20%",
    animClass: "float-drift-4",
    filter: "drop-shadow(0 0 4px #00f0ff) drop-shadow(0 0 8px #00f0ff88)",
  },
  {
    id: "gloowall-1",
    depth: 1.3,
    src: "/assets/generated/gloowall-float-transparent.dim_70x70.png",
    width: 40,
    height: 40,
    top: "50%",
    left: "4%",
    animClass: "float-drift-3",
    filter: "drop-shadow(0 0 4px #00cfff) drop-shadow(0 0 8px #00cfff88)",
  },
  {
    id: "gloowall-2",
    depth: 0.5,
    src: "/assets/generated/gloowall-float-transparent.dim_70x70.png",
    width: 40,
    height: 40,
    top: "35%",
    right: "3%",
    animClass: "float-drift-1",
    filter: "drop-shadow(0 0 4px #00cfff) drop-shadow(0 0 8px #00cfff88)",
  },
];

interface StoredBgElement {
  id: string;
  dataUrl: string;
  name: string;
}

function useStoredBgElements() {
  const [elements, setElements] = useState<StoredBgElement[]>(() => {
    try {
      const raw = localStorage.getItem("cvr_bg_elements");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem("cvr_bg_elements");
        setElements(raw ? JSON.parse(raw) : []);
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return elements;
}

function FloatingBattlefieldElements() {
  const storedElements = useStoredBgElements();
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const rawX = (e.gamma ?? 0) * 0.3;
      const rawY = (e.beta ?? 0) * 0.15;
      setTilt({
        x: Math.max(-20, Math.min(20, rawX)),
        y: Math.max(-20, Math.min(20, rawY)),
      });
    };
    window.addEventListener("deviceorientation", handler, { passive: true });
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  return (
    <div className="floating-elements-layer" aria-hidden="true">
      {FLOAT_ELEMENTS.map((el) => {
        const posStyle: React.CSSProperties = {
          position: "absolute",
          top: el.top,
          opacity: el.opacity,
          color: "oklch(0.65 0.22 40)",
          width: el.size,
          height: el.size,
          pointerEvents: "none",
          zIndex: 1,
        };
        if ("left" in el && el.left !== undefined) posStyle.left = el.left;
        if ("right" in el && el.right !== undefined) posStyle.right = el.right;
        return (
          <div
            key={el.id}
            className={el.animClass}
            style={posStyle}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled static SVG markup
            dangerouslySetInnerHTML={{ __html: el.svg }}
          />
        );
      })}
      {WEAPON_FLOAT_ELEMENTS.map((el) => {
        const posStyle: React.CSSProperties = {
          position: "absolute",
          top: el.top,
          width: el.width,
          height: el.height,
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 1,
          objectFit: "contain",
          filter: el.filter,
        };
        if ("left" in el && el.left !== undefined) posStyle.left = el.left;
        if ("right" in el && el.right !== undefined) posStyle.right = el.right;
        const depth = (el as { depth?: number }).depth ?? 1.0;
        return (
          <img
            key={el.id}
            src={el.src}
            alt=""
            className={el.animClass}
            style={{
              ...posStyle,
              transform: `translate(${tilt.x * depth}px, ${tilt.y * depth}px)`,
              transition: "transform 0.1s linear",
            }}
          />
        );
      })}
      {storedElements.map((el, i) => (
        <img
          key={el.id}
          src={el.dataUrl}
          alt=""
          className={FLOAT_ELEMENTS[i % FLOAT_ELEMENTS.length].animClass}
          style={{
            position: "absolute",
            top: `${15 + ((i * 17) % 70)}%`,
            left: `${10 + ((i * 23) % 80)}%`,
            width: 40,
            height: 40,
            opacity: 0.12,
            pointerEvents: "none",
            zIndex: 1,
            objectFit: "contain",
          }}
        />
      ))}
    </div>
  );
}

function GameCard({ game, index }: { game: GameTile; index: number }) {
  const navigate = useNavigate();
  const gradient = GAME_GRADIENTS[index % GAME_GRADIENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      viewport={{ once: true }}
      className="card-game rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      data-ocid={`games.item.${index + 1}`}
      onClick={() =>
        navigate({ to: "/game/$id", params: { id: game.id.toString() } })
      }
    >
      <div className={`h-32 sm:h-40 bg-gradient-to-br ${gradient} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-10 h-10 text-orange-glow/30" />
        </div>
        {game.bannerUrl && (
          <img
            src={game.bannerUrl}
            alt={game.title}
            className="w-full h-full object-cover absolute inset-0"
            loading="lazy"
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary/90 text-primary-foreground text-xs font-display px-2">
            ₹{game.entryFee.toString()}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-display text-sm font-bold text-foreground leading-tight mb-1">
          {game.title}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground px-1.5 py-0"
          >
            {game.platform}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-3">
          {game.description}
        </p>
        <Button
          size="sm"
          className="w-full btn-primary text-xs h-7"
          data-ocid={`games.primary_button.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: "/game/$id", params: { id: game.id.toString() } });
          }}
        >
          REGISTER NOW
        </Button>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem("cvr_stats");
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          players: parsed.players || "-",
          tournaments: parsed.tournaments || "-",
          prizePool: parsed.prizePool || "-",
        };
      }
    } catch {
      /* ignore */
    }
    return { players: "-", tournaments: "-", prizePool: "-" };
  });

  // localStorage cache for instant display
  const [cachedGames, setCachedGames] = useState<GameTile[]>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [];
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "cvr_stats") {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : {};
          setStats({
            players: parsed.players || "-",
            tournaments: parsed.tournaments || "-",
            prizePool: parsed.prizePool || "-",
          });
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const { data: backendGames, isLoading } = useListOpenGames();
  const { login, loginStatus, identity } = useInternetIdentity();
  const navigate = useNavigate();

  // Update cache when backend data arrives
  useEffect(() => {
    if (backendGames && backendGames.length > 0) {
      setCachedGames(backendGames);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(backendGames));
      } catch {
        /* ignore */
      }
    }
  }, [backendGames]);

  const games = backendGames ?? cachedGames;
  const showSkeleton = isLoading && cachedGames.length === 0;

  const STATS_ICONS = [
    { icon: Users, label: "PLAYERS", value: stats.players, cyan: false },
    {
      icon: Trophy,
      label: "TOURNAMENTS",
      value: stats.tournaments,
      cyan: true,
    },
    { icon: Zap, label: "PRIZE POOL", value: stats.prizePool, cyan: false },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50"
        data-ocid="nav.panel"
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center" data-ocid="nav.link">
            <img
              src="/assets/uploads/file_0000000036c871fa907a38c9391d7ff1-019d2d6c-afb4-74ed-9daa-5e79002c5aee-1.png"
              alt="CVR eSports Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {["HOME", "TOURNAMENTS", "NEWS", "RANKINGS"].map((item) => (
              <button
                type="button"
                key={item}
                className="font-display text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider"
                data-ocid="nav.link"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {identity ? (
              <Button
                size="sm"
                className="btn-primary text-xs h-8 px-3"
                data-ocid="nav.button"
                onClick={() => navigate({ to: "/admin" })}
              >
                ADMIN
              </Button>
            ) : (
              <Button
                size="sm"
                className="btn-primary text-xs h-8 px-3"
                data-ocid="nav.button"
                onClick={() => login()}
                disabled={loginStatus === "logging-in"}
              >
                {loginStatus === "logging-in" ? "..." : "LOGIN"}
              </Button>
            )}
            <button
              type="button"
              className="md:hidden text-foreground p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              data-ocid="nav.toggle"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-background border-t border-border/30"
          >
            {["HOME", "TOURNAMENTS", "NEWS", "RANKINGS", "SHOP"].map((item) => (
              <button
                type="button"
                key={item}
                className="block w-full text-left px-4 py-3 font-display text-sm text-muted-foreground hover:text-foreground border-b border-border/20"
                data-ocid="nav.link"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden scanline-overlay"
        data-ocid="hero.section"
      >
        <div
          className="relative min-h-[480px] sm:min-h-[560px] flex items-center justify-center"
          style={{
            backgroundImage:
              "url(/assets/generated/hero-battlefield.dim_1920x600.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          {/* Floating battlefield elements layer */}
          <FloatingBattlefieldElements />

          <div
            className="hero-overlay absolute inset-0"
            style={{ zIndex: 2 }}
          />
          <div
            className="relative z-10 text-center px-6 max-w-2xl mx-auto"
            style={{ zIndex: 3 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-orange-glow" />
                <span className="font-display text-xs text-orange-glow tracking-[0.3em]">
                  CVRESPORTSOFF
                </span>
                <div className="h-px w-8 bg-orange-glow" />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-2 text-glow-orange">
                ENTER THE ARENA.
                <br />
                <span className="text-orange-glow">CLASH FOR GLORY.</span>
              </h1>
              <div className="w-16 h-0.5 bg-cyan-400 mx-auto mt-3 mb-6 opacity-80" />
              <p className="text-muted-foreground text-sm mb-6">
                India's premier mobile eSports organisation. Compete. Win.
                Dominate.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  className="btn-primary text-sm h-10 px-5 glow-orange-sm"
                  data-ocid="hero.primary_button"
                  onClick={() =>
                    document
                      .getElementById("tournaments")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  UPCOMING TOURNAMENTS
                </Button>
                <Button
                  variant="outline"
                  className="btn-outline-orange text-sm h-10 px-5"
                  data-ocid="hero.secondary_button"
                  onClick={() =>
                    document
                      .getElementById("games")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  EXPLORE GAMES
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-secondary border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-around">
          {STATS_ICONS.map(({ icon: Icon, label, value, cyan }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Icon
                  className={`w-3.5 h-3.5 ${cyan ? "text-cyan-400" : "text-orange-glow"}`}
                />
                <span
                  className={`font-display text-lg font-bold ${
                    cyan ? "text-cyan-400" : "text-orange-glow"
                  }`}
                >
                  {value}
                </span>
              </div>
              <div className="font-display text-[9px] text-muted-foreground tracking-widest">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Tournaments */}
      <section
        id="games"
        className="max-w-7xl mx-auto px-4 py-8 w-full"
        data-ocid="games.section"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <div className="metal-divider mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground text-glow-orange">
            FEATURED TOURNAMENTS
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            Select a game to register
          </p>
          <div className="metal-divider mt-4" />
        </motion.div>

        {showSkeleton ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            data-ocid="games.loading_state"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="games.empty_state"
          >
            <Trophy className="w-12 h-12 mx-auto mb-3 text-border" />
            <p className="font-display text-sm">NO ACTIVE TOURNAMENTS</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            data-ocid="games.list"
          >
            {games.map((game, i) => (
              <GameCard key={game.id.toString()} game={game} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-card border-t border-border/50 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Brand row */}
          <div className="flex items-center gap-2 mb-4">
            <img
              src="/assets/uploads/file_0000000036c871fa907a38c9391d7ff1-019d2d6c-afb4-74ed-9daa-5e79002c5aee-1.png"
              alt="CVR eSports Logo"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Nav links */}
          <div className="flex gap-4 mb-4 flex-wrap">
            {["About", "Rules", "FAQ", "Contact"].map((link) => (
              <a
                key={link}
                href="/"
                className="text-muted-foreground text-xs hover:text-orange-glow transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Contact + Social */}
          <div className="flex items-center gap-4 mb-4">
            <a
              href="mailto:cvr.esportsoff@gmail.com"
              className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-orange-glow transition-colors"
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              cvr.esportsoff@gmail.com
            </a>
            <a
              href="https://www.instagram.com/cvr.esportsoff?igsh=ajRpMnVwbzNwZnFw"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CVRESPORTSOFF on Instagram"
              className="flex items-center gap-1 text-muted-foreground hover:text-orange-glow transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>

          <div className="metal-divider mb-4" />

          {/* Copyright */}
          <p className="text-muted-foreground text-xs text-center mb-2">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: hidden admin path */}
            <span
              onClick={() => navigate({ to: "/admin" })}
              className="cursor-default"
            >
              ©
            </span>{" "}
            2025{" "}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: hidden admin path */}
            <span
              onClick={() => navigate({ to: "/admin" })}
              className="cursor-default"
            >
              CVRESPORTSOFF
            </span>
            . All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs text-center">
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="hover:text-orange-glow transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
