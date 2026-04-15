import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAccessibility } from './AccessibilityContext';

export default function MagnifierLens() {
  const { isMagnifierMode, magnifiedText } = useAccessibility();
  const lensRef = useRef(null);
  const [position, setPosition] = useState({ x: -1000, y: -1000 }); // Store position for initial render off-screen

  useEffect(() => {
    if (!isMagnifierMode) return;

    const moveLens = (e) => {
      // Offset by 20px so it doesn't overlap perfectly with the cursor (allows clicking)
      const x = e.pageX + 20;
      const y = e.pageY + 20;

      setPosition({ x, y });

      if (lensRef.current) {
        gsap.to(lensRef.current, { x, y, duration: 0.2, ease: 'power2.out' });
      }
    };

    window.addEventListener('mousemove', moveLens);
    return () => window.removeEventListener('mousemove', moveLens);
  }, [isMagnifierMode]);

  if (!isMagnifierMode || !magnifiedText) return null;

  return (
    <div 
      ref={lensRef}
      className="absolute top-0 left-0 bg-dark text-background border border-primary z-[99999] pointer-events-none rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-sans font-bold text-4xl p-6 max-w-lg leading-tight break-words"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      {magnifiedText}
    </div>
  );
}
