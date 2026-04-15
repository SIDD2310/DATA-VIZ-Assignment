import React, { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider = ({ children }) => {
  const [isColorblindMode, setIsColorblindMode] = useState(() => {
    return localStorage.getItem('wm_colorblind') === 'true';
  });

  const [isNarratorMode, setIsNarratorMode] = useState(() => {
    return localStorage.getItem('wm_narrator') === 'true';
  });

  const [isMagnifierMode, setIsMagnifierMode] = useState(() => {
    return localStorage.getItem('wm_magnifier') === 'true';
  });

  const [magnifiedText, setMagnifiedText] = useState('');
  useEffect(() => {
    localStorage.setItem('wm_colorblind', isColorblindMode);
  }, [isColorblindMode]);

  // Persist magnifier
  useEffect(() => {
    localStorage.setItem('wm_magnifier', isMagnifierMode);
    if (!isMagnifierMode) {
      queueMicrotask(() => setMagnifiedText(''));
    }
  }, [isMagnifierMode]);

  // Handle narrator and magnifier text capture
  useEffect(() => {
    localStorage.setItem('wm_narrator', isNarratorMode);

    if (!isNarratorMode) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    let speakingTimeout;

    const handleMouseOver = (e) => {
      const target = e.target;
      
      const validTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'SPAN', 'LI'];
      if (!validTags.includes(target.tagName) && !target.getAttribute('aria-label')) {
        setMagnifiedText('');
        return;
      }

      const text = target.getAttribute('aria-label') || target.innerText || target.textContent;
      if (!text || text.trim().length === 0) {
        setMagnifiedText('');
        return;
      }

      const cleanText = text.trim();

      if (isMagnifierMode) {
        setMagnifiedText(cleanText);
      }

      if (isNarratorMode && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        clearTimeout(speakingTimeout);

        speakingTimeout = setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 150);
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      clearTimeout(speakingTimeout);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isNarratorMode, isMagnifierMode]);

  const toggleColorblindMode = () => setIsColorblindMode(prev => !prev);
  const toggleNarratorMode = () => setIsNarratorMode(prev => !prev);
  const toggleMagnifierMode = () => setIsMagnifierMode(prev => !prev);

  return (
    <AccessibilityContext.Provider value={{
      isColorblindMode,
      isNarratorMode,
      isMagnifierMode,
      magnifiedText,
      toggleColorblindMode,
      toggleNarratorMode,
      toggleMagnifierMode
    }}>
      {/* Deuteranopia SVG Filter Definition */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="deuteranopia">
          <feColorMatrix 
            type="matrix" 
            values="
              0.625 0.375 0 0 0
              0.7 0.3 0 0 0
              0 0.3 0.7 0 0
              0 0 0 1 0" 
          />
        </filter>
      </svg>
      {children}
    </AccessibilityContext.Provider>
  );
};
