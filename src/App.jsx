import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Crosshair, ArrowRight, Terminal, Eye, EyeOff, Volume2, VolumeX, Search } from 'lucide-react';
import Dashboard from './Dashboard';
import { useAccessibility } from './AccessibilityContext';
import MagnifierLens from './MagnifierLens';

gsap.registerPlugin(ScrollTrigger);

// --- Custom Cursor ---
const Cursor = () => {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    
    gsap.set([cursor, follower], { x: -100, y: -100 });

    const moveCursor = (e) => {
      // Use pageX/pageY instead of clientX/clientY for absolute positioning unaffected by filter containing blocks
      gsap.to(cursor, { x: e.pageX, y: e.pageY, duration: 0 });
      gsap.to(follower, { x: e.pageX, y: e.pageY, duration: 0.8, ease: 'power3.out' });
    };

    const handleHoverIn = () => {
      gsap.to(cursor, { scale: 0, duration: 0.2 });
      gsap.to(follower, { scale: 1.5, backgroundColor: 'rgba(204, 88, 51, 0.1)', borderColor: '#CC5833', duration: 0.3 });
    };
    
    const handleHoverOut = () => {
      gsap.to(cursor, { scale: 1, duration: 0.2 });
      gsap.to(follower, { scale: 1, backgroundColor: 'transparent', borderColor: '#2E4036', duration: 0.3 });
    };

    window.addEventListener('mousemove', moveCursor);
    
    const interactables = document.querySelectorAll('a, button, .magnetic-btn');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', handleHoverIn);
      el.addEventListener('mouseleave', handleHoverOut);
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      interactables.forEach(el => {
        el.removeEventListener('mouseenter', handleHoverIn);
        el.removeEventListener('mouseleave', handleHoverOut);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="absolute top-0 left-0 w-2 h-2 bg-accent rounded-full pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 mix-blend-difference" />
      <div ref={followerRef} className="absolute top-0 left-0 w-10 h-10 border border-primary rounded-full pointer-events-none z-[99] -translate-x-1/2 -translate-y-1/2 transition-colors" />
    </>
  );
};

// --- Navbar ---
const Navbar = ({ onBoot }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isColorblindMode, isNarratorMode, isMagnifierMode, toggleColorblindMode, toggleNarratorMode, toggleMagnifierMode } = useAccessibility();

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{ transform: isColorblindMode ? `translate(-50%, ${scrollY}px)` : undefined }} className={`fixed top-4 left-1/2 z-40 px-8 py-4 flex items-center justify-between gap-12 rounded-full transition-all duration-500 origin-center ${
      !isColorblindMode ? '-translate-x-1/2 ' : ''
    }${
      isScrolled 
        ? 'bg-background/60 backdrop-blur-xl border border-primary/10 text-primary shadow-xl w-[90vw] md:w-auto md:min-w-[50vw]' 
        : 'bg-transparent text-primary w-full max-w-[100vw] border-transparent'
    }`}>
      <div className="font-sans font-bold text-2xl tracking-tighter flex items-center gap-3">
        <Crosshair size={24} className="text-accent animate-[spin_10s_linear_infinite]" />
        WorldMonitor
      </div>
      
      <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest [&>a]:hover-lift">
        <a href="#features">Artifacts</a>
        <a href="#manifesto">Manifesto</a>
        <a href="#protocol">Protocol</a>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggleColorblindMode} className="hover:text-accent transition-colors" aria-label="Toggle Colorblind Mode" title="Toggle Colorblind Mode">
          {isColorblindMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button onClick={toggleNarratorMode} className="hover:text-accent transition-colors" aria-label="Toggle Narrator Mode" title="Toggle Narrator Mode">
          {isNarratorMode ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button onClick={toggleMagnifierMode} className={`hover:text-accent transition-colors ${isMagnifierMode ? 'text-accent' : ''}`} aria-label="Toggle Magnifier Mode" title="Toggle Magnifier Mode">
          <Search size={18} />
        </button>

        <button onClick={onBoot} className="magnetic-btn font-mono text-xs uppercase tracking-widest border border-primary/20 px-6 py-3 rounded-full hover:bg-primary hover:text-background transition-colors duration-500 ml-4">
          <span className="relative z-10">Initialize</span>
        </button>
      </div>
    </nav>
  );
};

// --- Hero ---
const Hero = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      setTimeout(() => {
        document.querySelectorAll('.mask-reveal').forEach(el => el.classList.add('is-visible'));
      }, 100);

      gsap.to('.hero-svg', {
        yPercent: 30,
        rotation: 45,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <div className="mesh-bg" />
      
      <svg className="hero-svg absolute w-[600px] md:w-[900px] h-auto opacity-[0.03] text-primary pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.2">
        <circle cx="50" cy="50" r="48" strokeDasharray="1 2" />
        <circle cx="50" cy="50" r="35" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="20" strokeDasharray="1 4" />
        <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M15 85 L85 15" strokeWidth="0.1" />
      </svg>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="overflow-hidden mb-2">
          <h1 className="mask-reveal font-sans font-bold text-2xl md:text-4xl text-primary/80 uppercase tracking-[0.2em]">
            Intelligence is
          </h1>
        </div>
        <div className="overflow-hidden">
          <h2 className="mask-reveal font-drama italic text-7xl md:text-[11rem] leading-[0.8] text-primary">
            Sovereignty.
          </h2>
        </div>
        
        <div className="overflow-hidden mt-12">
          <p className="mask-reveal font-mono text-sm md:text-base text-primary/60 max-w-xl mx-auto leading-relaxed px-4">
            A distributed edge-native architecture parsing 30+ upstream vectors and 86 modules into a single pane of organic truth.
          </p>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Scroll to Sequence</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
};

// --- Features Interactive Functional Artifacts ---
const DiagnosticShuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, title: 'Geospatial Map', color: 'bg-primary' },
    { id: 2, title: 'Market Sentiment', color: 'bg-dark' },
    { id: 3, title: 'Cyber Threats', color: 'bg-[#1a2e23]' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCards(prev => {
        const newArr = [...prev];
        const last = newArr.pop();
        newArr.unshift(last);
        return newArr;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-64 w-full flex items-center justify-center pointer-events-none">
      {cards.map((card, idx) => {
        const transformY = idx * 15;
        const scale = 1 - (idx * 0.05);
        const zIndex = 10 - idx;
        const opacity = 1 - (idx * 0.2);
        
        return (
          <div 
            key={card.id}
            className={`absolute w-3/4 h-32 rounded-[2rem] shadow-xl flex items-center justify-center text-white font-sans font-bold text-lg border border-white/5 ${card.color}`}
            style={{
              transform: `translateY(${transformY}px) scale(${scale})`,
              zIndex,
              opacity,
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {card.title}
          </div>
        );
      })}
    </div>
  );
};

const TelemetryTypewriter = () => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const fullText = "CLUSTER_DETECTED: Coordinated event flows identified across 11 intelligence vectors. Commencing predictive simulation...";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-64 w-full flex flex-col p-6 font-mono text-sm bg-dark text-white rounded-[2rem] border border-white/10 shadow-xl overflow-hidden relative">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
        <span className="text-gray-400">Stream.io</span>
        <span className="flex items-center gap-2 text-accent uppercase text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live Feed</span>
      </div>
      <p className="leading-relaxed text-gray-300">
        {text}
        {isTyping && <span className="inline-block w-2 h-4 bg-accent ml-1 animate-pulse" />}
      </p>
    </div>
  );
};

const CursorScheduler = () => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const [activeDay, setActiveDay] = useState(null);
  const cursorRef = useRef(null);
  const saveRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      
      tl.to(cursorRef.current, { x: 120, y: 50, duration: 1, ease: 'power2.inOut' })
        .to(cursorRef.current, { scale: 0.8, duration: 0.1 })
        .call(() => setActiveDay(3))
        .to(cursorRef.current, { scale: 1, duration: 0.1 })
        .to(cursorRef.current, { x: 180, y: 150, duration: 0.8, ease: 'power2.inOut' })
        .to(cursorRef.current, { scale: 0.8, duration: 0.1 })
        .to(saveRef.current, { scale: 0.95, duration: 0.1 })
        .to(cursorRef.current, { scale: 1, duration: 0.1 })
        .to(saveRef.current, { scale: 1, duration: 0.1 })
        .to(cursorRef.current, { opacity: 0, duration: 0.3 })
        .call(() => setActiveDay(null))
        .set(cursorRef.current, { x: 0, y: 0 })
        .to(cursorRef.current, { opacity: 1, duration: 0.3 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="h-64 w-full bg-white rounded-[2rem] shadow-xl p-6 relative overflow-hidden text-left border border-black/5">
      <h4 className="font-sans font-bold text-dark mb-4 drop-shadow-sm">Signal Strategy</h4>
      <div className="flex gap-2 mb-8 relative z-10 w-max">
        {days.map((d, i) => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors duration-300 shadow-sm ${activeDay === i ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>
      <button ref={saveRef} className="absolute bottom-6 right-6 px-6 py-2 bg-primary text-white rounded-full font-mono text-[10px] uppercase tracking-widest text-center shadow-lg">Save Core</button>
      
      <svg ref={cursorRef} className="absolute top-0 left-0 w-6 h-6 text-dark drop-shadow-md z-20 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 2.69127C4 1.93067 4.81547 1.44851 5.48192 1.81506L22.4069 11.1238C23.0977 11.5037 23.089 12.5185 22.3906 12.8851L15.033 16.7483C14.8215 16.8593 14.654 17.0371 14.5574 17.2533L10.8935 25.4526C10.5517 26.2173 9.49755 26.2307 9.13621 25.4746L4.0886 14.9122C4.0308 14.7913 4 14.6586 4 14.5248V2.69127Z"/>
      </svg>
    </div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-32 px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="font-drama italic text-5xl md:text-7xl text-primary mb-4">Interactive Functional Artifacts</h2>
        <p className="font-mono text-sm text-primary/60 max-w-2xl mx-auto">Micro-UIs visualizing the intelligence pipeline.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-background rounded-[3rem] p-8 pb-0 shadow-lg border border-primary/5 flex flex-col items-center">
          <div className="text-center mb-8">
            <h3 className="font-sans font-bold text-xl text-primary">Multiplex Parse</h3>
            <p className="font-mono text-[11px] text-primary/50 mt-2 uppercase tracking-widest">30+ Upstream Vectors</p>
          </div>
          <DiagnosticShuffler />
        </div>
        <div className="bg-background rounded-[3rem] p-8 shadow-lg border border-primary/5 flex flex-col items-center">
          <div className="text-center mb-8">
            <h3 className="font-sans font-bold text-xl text-primary">Event Clustering</h3>
            <p className="font-mono text-[11px] text-primary/50 mt-2 uppercase tracking-widest">Neural Categorization</p>
          </div>
          <TelemetryTypewriter />
        </div>
        <div className="bg-background rounded-[3rem] p-8 shadow-lg border border-primary/5 flex flex-col items-center">
          <div className="text-center mb-8">
            <h3 className="font-sans font-bold text-xl text-primary">Automated Strategy</h3>
            <p className="font-mono text-[11px] text-primary/50 mt-2 uppercase tracking-widest">Signal Scheduling</p>
          </div>
          <CursorScheduler />
        </div>
      </div>
    </section>
  );
};

// --- D. Manifesto ---
const Manifesto = () => {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = [...textRef.current.children];
      gsap.from(lines, {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        ease: 'power3.out',
        duration: 1.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="manifesto" ref={sectionRef} className="relative w-full py-48 bg-dark flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-[0.08] mix-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop)' }}
      />
      
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-12" ref={textRef}>
        <h2 className="font-sans text-xl md:text-3xl text-gray-400 font-normal tracking-wide">
          Most intelligence dashboards focus on: <br className="md:hidden"/><span className="text-white italic">historical reporting.</span>
        </h2>
        <h1 className="font-drama italic text-5xl md:text-8xl text-background leading-[1.1]">
          We focus on: <br/><span className="text-accent underline decoration-1 underline-offset-[12px] md:underline-offset-[16px]">predictive simulation.</span>
        </h1>
      </div>
    </section>
  );
};

// --- E. Sticky Stacking Archive Protocol ---
const RotatingGeometric = () => (
  <svg className="w-64 h-64 animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
    <circle cx="50" cy="50" r="40" strokeDasharray="4 4" opacity="0.5"/>
    <circle cx="50" cy="50" r="25" strokeDasharray="2 6"/>
    <path d="M 50 10 L 50 90 M 10 50 L 90 50" strokeWidth="0.5" opacity="0.3"/>
  </svg>
);

const ScanningLaser = () => (
  <div className="relative w-64 h-64 border border-accent/20 flex flex-wrap gap-2 p-2">
    {Array.from({length: 36}).map((_, i) => (
      <div key={i} className="w-[14%] h-[14%] bg-accent/10 rounded-sm" />
    ))}
    <div className="absolute top-0 left-0 w-full h-[2px] bg-accent shadow-[0_0_15px_#CC5833] animate-[scan_3s_ease-in-out_infinite_alternate]" />
    <style>{`
      @keyframes scan {
        0% { top: 0; }
        100% { top: 100%; }
      }
    `}</style>
  </div>
);

const PulsingWaveform = () => (
  <svg className="w-80 h-40" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeDasharray="300" strokeDashoffset="300" d="M 0 50 Q 25 50 25 10 T 50 50 T 75 90 T 100 50 T 125 10 T 150 50 T 175 90 T 200 50" opacity="0.8">
      <animate attributeName="stroke-dashoffset" values="300;0" dur="2s" fill="freeze" repeatCount="indefinite" />
    </path>
    <path strokeDasharray="300" strokeDashoffset="300" d="M 0 50 Q 25 50 25 10 T 50 50 T 75 90 T 100 50 T 125 10 T 150 50 T 175 90 T 200 50" stroke="#CC5833" opacity="0.2">
      <animate attributeName="stroke-dashoffset" values="300;0" dur="2.1s" fill="freeze" repeatCount="indefinite" />
    </path>
  </svg>
);

const ProtocolArchive = () => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (i === cardRefs.current.length - 1) return;

        gsap.to(card, {
          scale: 0.9,
          filter: "blur(20px)",
          opacity: 0.5,
          scrollTrigger: {
            trigger: cardRefs.current[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const cards = [
    { num: '01', title: 'Data Ingestion', desc: 'Parsing 30+ upstream vectors from global databases instantly.', graphic: <RotatingGeometric /> },
    { num: '02', title: 'Neural Clustering', desc: 'Grouping events, news, and anomalies into actionable spheres.', graphic: <ScanningLaser /> },
    { num: '03', title: 'Distribution', desc: 'Deploying intelligence to operational terminals continuously.', graphic: <PulsingWaveform /> }
  ];

  return (
    <section id="protocol" ref={containerRef} className="w-full relative bg-dark pb-32 pt-16">
      {cards.map((card, i) => (
        <div 
          key={i} 
          ref={el => cardRefs.current[i] = el}
          className="sticky top-0 h-screen w-full flex items-center justify-center p-4 md:p-8 origin-top"
        >
          <div className="w-full max-w-6xl h-[70vh] bg-primary rounded-[3rem] shadow-2xl border border-white/5 flex flex-col md:flex-row overflow-hidden relative">
             <div className="flex-1 p-10 md:p-24 flex flex-col justify-center relative z-10 text-white">
                <span className="font-mono text-4xl text-accent/50 font-bold mb-6">{card.num}</span>
                <h2 className="font-sans font-bold text-4xl md:text-6xl mb-4">{card.title}</h2>
                <p className="font-mono text-sm text-white/50 leading-relaxed max-w-md">{card.desc}</p>
             </div>
             <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/20 text-accent">
                {card.graphic}
             </div>
          </div>
        </div>
      ))}
    </section>
  );
};

// --- Horizontal Data Reel ---
const HorizontalReel = () => {
  const triggerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollWidth = containerRef.current.scrollWidth - window.innerWidth;
      
      gsap.to(containerRef.current, {
        x: -scrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: `+=${scrollWidth}`,
          pin: true,
          pinType: "transform",
          scrub: 1,
        }
      });
    }, triggerRef);
    return () => ctx.revert();
  }, []);

  const slideData = [
    { num: '01', title: 'Situation Room', desc: 'Command core for macro analysis. Aggregates Top KPIs, Risk Indexes, and global event clusters in real-time.' },
    { num: '02', title: 'Geospatial Map', desc: '3D WebGL projection of 80+ distinct layers (Seismic, Thermal, ADS-B, Sub-cables, Nuclear facilities, Conflicts).' },
    { num: '03', title: 'Signal Patterns', desc: 'Identify latent trends across unstructured event data via time-series frequency and domain anomaly detection.' },
    { num: '04', title: 'World News', desc: 'Neural clustering of 435+ global RSS feeds, classifying sentiment, tracking narratives, and extracting threat vectors.' },
    { num: '05', title: 'Cascade Analysis', desc: 'Proprietary graph models revealing how regional violence triggers global economic and infrastructure dominoes.' },
  ];

  return (
    <section ref={triggerRef} className="h-screen w-full overflow-hidden bg-primary text-background border-y border-background/10">
      <div ref={containerRef} className="h-full flex items-center px-[10vw] gap-[8vw] w-max">
        
        <div className="w-[80vw] lg:w-[40vw] flex-shrink-0">
          <h2 className="font-drama italic text-6xl md:text-8xl leading-tight">
            <span className="text-accent">5</span> Operational <br/>Domains.
          </h2>
          <p className="mt-8 font-mono text-sm text-background/60 max-w-sm">
            Scroll to traverse a radically comprehensive intelligence multiplex. No blind spots.
          </p>
        </div>

        {slideData.map((s, i) => (
          <div key={i} className="w-[70vw] lg:w-[30vw] flex-shrink-0 flex flex-col gap-6">
            <span className="font-mono text-6xl text-accent/20 font-bold">{s.num}</span>
            <div className="w-full h-[1px] bg-background/20" />
            <h3 className="font-sans font-bold text-3xl tracking-tight">{s.title}</h3>
            <p className="font-mono text-background/60 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
        
      </div>
    </section>
  );
};


// --- Boot Sequence ---
const BootSequence = ({ onComplete }) => {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);

  const bootMessages = [
    { text: 'Initializing WebGL2 map engine (Deck.GL)...', delay: 0 },
    { text: 'Connecting to USGS & FIRMS telemetry...', delay: 250 },
    { text: 'Bootstrapping Market, Crypto & FX gateways...', delay: 500 },
    { text: 'Syncing Maritime AIS & ADS-B Aviation...', delay: 750 },
    { text: 'Parsing ACLED/UCDP conflict datasets...', delay: 1000 },
    { text: 'Hydrating 30+ data streams across 195 countries...', delay: 1250 },
    { text: 'Building Country Instability Index...', delay: 1550 },
    { text: 'Correlating Signals across 11 intelligence domains...', delay: 1850 },
    { text: 'Rendering panel grid (86 modules initialized)...', delay: 2200 },
    { text: 'Vercel Edge API connections verified.', delay: 2500 },
    { text: 'Boot complete. Entering intelligence nexus.', delay: 2900 },
  ];

  useEffect(() => {
    const timers = bootMessages.map((msg, i) =>
      setTimeout(() => {
        setLogs(prev => [...prev, msg.text]);
        setProgress(((i + 1) / bootMessages.length) * 100);
      }, msg.delay)
    );

    const finishTimer = setTimeout(() => {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        onComplete,
      });
    }, 3600);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-[#0a0f1a] flex items-center justify-center">
      <div className="w-full max-w-2xl px-8">
        <div className="flex items-center gap-3 mb-8">
          <Terminal size={20} className="text-accent" />
          <span className="font-mono text-sm text-accent uppercase tracking-[0.3em]">System Bootstrap</span>
        </div>
        <div className="font-mono text-xs text-white/70 space-y-1.5 mb-8 min-h-[200px]">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 animate-[fadeIn_0.3s_ease]">
              <span className="text-accent/60 select-none">&gt;</span>
              <span className={i === logs.length - 1 && progress === 100 ? 'text-accent font-bold' : ''}>
                {log}
              </span>
            </div>
          ))}
          {progress < 100 && (
            <div className="flex items-center gap-2">
              <span className="text-accent/60 select-none">&gt;</span>
              <span className="inline-block w-2 h-3.5 bg-accent animate-pulse" />
            </div>
          )}
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-[#CC5833] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 font-mono text-[10px] text-white/30 uppercase tracking-widest">
          <span>WorldMonitor v3.0 (Edge)</span>
          <span>{Math.round(progress)}% initialized</span>
        </div>
      </div>
    </div>
  );
};

// --- Outro & CTA ---
const OutroCTA = ({ onBoot }) => {
  return (
    <section className="relative py-48 bg-primary text-background overflow-hidden flex flex-col items-center justify-center text-center px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2000&auto=format&fit=crop')] opacity-10 mix-blend-overlay bg-cover bg-center" />
      
      <h2 className="font-drama italic text-6xl md:text-9xl relative z-10">Access the Core.</h2>
      
      <button 
        onClick={onBoot}
        className="magnetic-btn mt-16 px-10 py-5 bg-background text-primary rounded-full font-sans font-bold flex items-center gap-4 hover-lift shadow-2xl relative z-10"
      >
        Boot Architecture <ArrowRight size={20} />
      </button>
    </section>
  );
};

export default function App() {
  const [view, setView] = useState('landing');

  const { isColorblindMode } = useAccessibility();

  if (view === 'dashboard') {
    return (
       <div className={isColorblindMode ? 'colorblind-mode' : ''}>
         <Cursor />
         <MagnifierLens />
         <div className="noise-overlay" />
         <Dashboard onBack={() => setView('landing')} />
       </div>
    );
  }

  if (view === 'booting') {
    return (
      <>
        <Cursor />
        <MagnifierLens />
        <div className="noise-overlay" />
        <BootSequence onComplete={() => setView('dashboard')} />
      </>
    );
  }

  return (
    <div className={isColorblindMode ? 'colorblind-mode' : ''}>
      <Cursor />
      <MagnifierLens />
      <div className="noise-overlay" />
      <Navbar onBoot={() => setView('booting')} />
      
      <main>
        <Hero />
        <Features />
        <Manifesto />
        <ProtocolArchive />
        <HorizontalReel />
        <OutroCTA onBoot={() => setView('booting')} />
      </main>

      <footer className="bg-dark text-background py-6 px-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center font-mono text-xs opacity-70">
        <span>© {new Date().getFullYear()} WorldMonitor. Preset A Configuration.</span>
        <span>Secure Terminal Active</span>
      </footer>
    </div>
  )
}
