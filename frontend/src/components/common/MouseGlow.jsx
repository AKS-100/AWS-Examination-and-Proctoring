import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * MouseGlow - Minimalist, subtle interactive cursor glow
 * Features:
 * 1. Single small, soft ambient glow (~240px) that trails gently behind the pointer
 * 2. Low opacity so text, exam options, and inputs remain 100% clear and legible
 * 3. Softens even further when hovering over inputs/text fields to never interfere with typing
 * 4. Pure subtle accent without blinding hotspots or harsh white cores
 */
export const MouseGlow = () => {
  const { isDark } = useTheme();
  const glowRef = useRef(null);

  const targetPos = useRef({ x: -200, y: -200 });
  const currentPos = useRef({ x: -200, y: -200 });
  const animFrameId = useRef(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isOverInput, setIsOverInput] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Only activate on fine pointer devices (mouse/trackpad), skip touchscreens
    if (typeof window !== 'undefined') {
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      if (!finePointer) {
        setIsSupported(false);
        return;
      }
    }

    const handleMouseMove = (e) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      const target = e.target;
      if (target) {
        // Soften even further when typing in inputs or reading/clicking exam options
        const isInteractive = Boolean(
          target.closest('input, textarea, select, [contenteditable="true"], .input-warm-pill, button, [role="button"], [role="radio"], [role="option"], label')
        );
        setIsOverInput(isInteractive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Smooth animation loop using lerp (linear interpolation)
    const render = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.16;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.16;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isVisible]);

  if (!isSupported) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden transition-opacity duration-300"
      style={{ opacity: isVisible ? (isOverInput ? 0.2 : 0.65) : 0 }}
    >
      {/* Single Small, Soft Ambient Glow (Whisper-thin, zero blinding hotspot) */}
      <div
        ref={glowRef}
        className="absolute rounded-full pointer-events-none will-change-transform transition-all duration-300 ease-out"
        style={{
          width: isOverInput ? '150px' : '210px',
          height: isOverInput ? '150px' : '210px',
          background: isDark
            ? `radial-gradient(
                circle,
                rgba(59, 130, 246, 0.12) 0%,
                rgba(99, 102, 241, 0.06) 40%,
                rgba(147, 51, 234, 0.02) 60%,
                transparent 75%
              )`
            : `radial-gradient(
                circle,
                rgba(37, 99, 235, 0.07) 0%,
                rgba(59, 130, 246, 0.03) 40%,
                transparent 70%
              )`,
          filter: isDark ? 'blur(24px)' : 'blur(20px)',
        }}
      />
    </div>
  );
};

export default MouseGlow;
