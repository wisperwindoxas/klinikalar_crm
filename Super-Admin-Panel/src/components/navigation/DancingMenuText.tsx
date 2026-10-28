import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DancingMenuTextProps {
  text: string;
  isActive: boolean;
  isIdle: boolean;
  MenuIcon?: React.ElementType;
}

export const DancingMenuText: React.FC<DancingMenuTextProps> = ({
  text,
  isActive,
  isIdle,
  MenuIcon,
}) => {
  const characters = useMemo(() => text.split(''), [text]);

  // Random effect index from 0 to 7
  // 0: ✈️ Samolyotga aylanish (Paper Airplane Takeoff)
  // 1: 🪓 Sinib parchalanish (Shatter / Broken Glass Fracture)
  // 2: 🪵 3D Og'ib ketish & Domino qulashi (3D Domino Lean & Tumble)
  // 3: 🔄 Bosh harf o'rniga 3D ikonka almashinuvi (First Letter Icon Swap)
  // 4: 🎲 3D Kubik ag'darilishi (3D Matrix Cube Tumble)
  // 5: 🌀 Gravitatsiya / Qora tuynuk girdobi (Gravity Vortex)
  // 6: 🚀 Raketa bo'lib uchish & qaytish (Rocket Blast & Parachute)
  // 7: ⚡ Kiberpank Glitch & Teleportatsiya (Cyberpunk Teleport Slice)
  const [effectIndex, setEffectIndex] = useState<number>(() => Math.floor(Math.random() * 8));
  const [airplaneFlying, setAirplaneFlying] = useState<boolean>(false);
  const [iconSwapped, setIconSwapped] = useState<boolean>(false);
  const [rocketFlying, setRocketFlying] = useState<boolean>(false);

  // Cycle to a new random effect every 4 seconds while idle
  useEffect(() => {
    if (!isActive || !isIdle) {
      setAirplaneFlying(false);
      setIconSwapped(false);
      setRocketFlying(false);
      return;
    }

    // Pick new random effect
    const pickNew = () => {
      setEffectIndex((prev) => {
        let next = Math.floor(Math.random() * 8);
        return next === prev ? (next + 1) % 8 : next;
      });
    };

    pickNew();
    const interval = setInterval(pickNew, 4500);
    return () => clearInterval(interval);
  }, [isActive, isIdle]);

  // Handle airplane flight timing
  useEffect(() => {
    if (isActive && isIdle && effectIndex === 0) {
      setAirplaneFlying(true);
      const timer = setTimeout(() => setAirplaneFlying(false), 2600);
      return () => clearTimeout(timer);
    }
  }, [isActive, isIdle, effectIndex]);

  // Handle icon swap timing
  useEffect(() => {
    if (isActive && isIdle && effectIndex === 3) {
      setIconSwapped(true);
      const timer = setTimeout(() => setIconSwapped(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [isActive, isIdle, effectIndex]);

  // Handle rocket flight timing
  useEffect(() => {
    if (isActive && isIdle && effectIndex === 6) {
      setRocketFlying(true);
      const timer = setTimeout(() => setRocketFlying(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [isActive, isIdle, effectIndex]);

  // Standard non-active or non-idle display
  if (!isActive || !isIdle) {
    return (
      <span
        className={`relative z-10 tracking-tight transition-colors duration-200 leading-none ${
          isActive
            ? 'text-white font-extrabold text-[13px] drop-shadow-sm'
            : 'text-slate-600 group-hover:text-slate-900 font-semibold text-[13px]'
        }`}
      >
        {text}
      </span>
    );
  }

  // =========================================================================
  // 8 DISTINCT WILD 3D AND INTERACTIVE VISUAL EFFECTS
  // =========================================================================

  return (
    <span
      className="relative z-10 flex items-center tracking-tight leading-none text-white font-black text-[13px] select-none"
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
    >
      {characters.map((char, index) => {
        const isSpace = char === ' ';
        const isFirst = index === 0;
        const isLast = index === characters.length - 1;
        const stagger = index * 0.055;

        // -----------------------------------------------------------
        // EFFECT 0: ✈️ Samolyotga aylanish (Paper Airplane Takeoff)
        // -----------------------------------------------------------
        if (effectIndex === 0 && isLast) {
          return (
            <span key={`${index}-${char}`} className="inline-block relative">
              <AnimatePresence mode="wait">
                {airplaneFlying ? (
                  <motion.span
                    key="airplane"
                    className="inline-block text-cyan-200 text-sm filter drop-shadow-[0_2px_8px_rgba(45,212,191,0.9)]"
                    initial={{ x: 0, y: 0, rotateZ: 0, scale: 0.8 }}
                    animate={{
                      x: [0, 45, -70, 20, 0],
                      y: [0, -32, -18, -8, 0],
                      rotateZ: [0, -35, 25, -15, 0],
                      scale: [0.8, 1.4, 1.1, 0.9, 1],
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 2.4, ease: 'easeInOut' }}
                  >
                    ✈️
                  </motion.span>
                ) : (
                  <motion.span
                    key="char-airplane-landed"
                    className="inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    initial={{ scale: 0, rotateZ: 45 }}
                    animate={{ scale: 1, rotateZ: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {isSpace ? '\u00A0' : char}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          );
        }

        // -----------------------------------------------------------
        // EFFECT 3: 🔄 Bosh harf o'rniga 3D ikonka almashinuvi
        // -----------------------------------------------------------
        if (effectIndex === 3 && isFirst && MenuIcon) {
          return (
            <span key={`${index}-${char}`} className="inline-block relative mr-1">
              <AnimatePresence mode="wait">
                {iconSwapped ? (
                  <motion.span
                    key="icon-swap"
                    className="inline-flex items-center justify-center p-0.5 rounded-md bg-teal-400 text-teal-950 shadow-md shadow-teal-300"
                    initial={{ rotateY: 90, scale: 0.5, opacity: 0 }}
                    animate={{
                      rotateY: [90, 0, 360],
                      scale: [0.5, 1.25, 1],
                      opacity: 1,
                    }}
                    exit={{ rotateY: 90, scale: 0, opacity: 0 }}
                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                  >
                    <MenuIcon className="w-3.5 h-3.5" strokeWidth={2.8} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="char-swapped-back"
                    className="inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-teal-200"
                    initial={{ rotateY: -90, scale: 0.6 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                  >
                    {isSpace ? '\u00A0' : char}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          );
        }

        // -----------------------------------------------------------
        // EFFECT 6: 🚀 Raketa bo'lib uchish & qaytish
        // -----------------------------------------------------------
        if (effectIndex === 6 && isFirst) {
          return (
            <span key={`${index}-${char}`} className="inline-block relative">
              <AnimatePresence mode="wait">
                {rocketFlying ? (
                  <motion.span
                    key="rocket"
                    className="inline-block text-sm"
                    initial={{ y: 0, scale: 1, rotate: 0 }}
                    animate={{
                      y: [0, -38, -55, -20, 0],
                      x: [0, 10, -15, 5, 0],
                      rotate: [0, 15, -20, 5, 0],
                      scale: [1, 1.4, 1.2, 0.9, 1],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                  >
                    🚀
                  </motion.span>
                ) : (
                  <motion.span
                    key="char-rocket-landed"
                    className="inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    initial={{ y: -15, scale: 0.5 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  >
                    {isSpace ? '\u00A0' : char}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          );
        }

        // -----------------------------------------------------------
        // CHARACTER-BY-CHARACTER KEYFRAME ANIMATIONS
        // -----------------------------------------------------------
        let charAnimate = {};
        let transformOrigin = 'bottom center';

        // 1. 🪓 Sinib parchalanish (Shatter & Fracture)
        if (effectIndex === 1) {
          const odd = index % 2 === 0;
          charAnimate = {
            x: [0, odd ? -7 : 8, odd ? 5 : -4, 0],
            y: [0, odd ? 9 : -8, odd ? -5 : 6, 0],
            rotate: [0, odd ? 24 : -26, odd ? -12 : 15, 0],
            scale: [1, 0.9, 1.1, 1],
            opacity: [1, 0.7, 0.95, 1],
          };
          transformOrigin = odd ? 'top left' : 'bottom right';
        }
        // 2. 🪵 3D Domino Og'ib ketish & Qulash (Domino Cascade Lean)
        else if (effectIndex === 2) {
          charAnimate = {
            rotateZ: [0, 42, -15, 18, 0],
            rotateX: [0, 25, -10, 0],
            x: [0, 8, -3, 0],
            y: [0, 4, 0],
          };
          transformOrigin = 'bottom left';
        }
        // 4. 🎲 3D Kubik ag'darilishi (3D Matrix Cube Tumble)
        else if (effectIndex === 4) {
          charAnimate = {
            rotateX: [0, 360],
            rotateY: [0, 180, 360],
            scale: [1, 1.3, 0.9, 1],
            y: [0, -10, 0],
            color: ['#ffffff', '#2dd4bf', '#ffffff'],
          };
          transformOrigin = 'center center';
        }
        // 5. 🌀 Gravitatsiya / Qora tuynuk girdobi (Gravity Vortex)
        else if (effectIndex === 5) {
          const distFromCenter = index - characters.length / 2;
          charAnimate = {
            x: [0, -distFromCenter * 6, distFromCenter * 2, 0],
            y: [0, Math.sin(index) * 10, 0],
            scale: [1, 0.35, 1.25, 1],
            rotate: [0, 180, 360],
          };
          transformOrigin = 'center center';
        }
        // 7. ⚡ Kiberpank Glitch Teleportatsiya (Cyberpunk Teleport Slice)
        else if (effectIndex === 7) {
          const glitchDir = index % 3 === 0 ? -1 : 1;
          charAnimate = {
            x: [0, glitchDir * 9, -glitchDir * 7, glitchDir * 3, 0],
            skewX: [0, glitchDir * 30, -glitchDir * 20, 0],
            opacity: [1, 0.4, 1, 0.7, 1],
            color: ['#ffffff', '#f43f5e', '#06b6d4', '#ffffff'],
            scaleY: [1, 1.3, 0.8, 1],
          };
          transformOrigin = 'center center';
        }
        // Default / Airplane & Rocket follower letters: Wave bounce
        else {
          charAnimate = {
            y: [0, -8, 3, -4, 0],
            scale: [1, 1.18, 0.96, 1],
            rotate: [0, -6, 6, 0],
          };
          transformOrigin = 'bottom center';
        }

        return (
          <motion.span
            key={`${index}-${char}`}
            className="inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            style={{
              transformOrigin,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
            animate={charAnimate}
            transition={{
              duration: effectIndex === 7 ? 0.7 : effectIndex === 4 ? 1.6 : 1.3,
              repeat: Infinity,
              repeatDelay: 1.8,
              delay: stagger,
              ease: effectIndex === 2 ? 'easeOut' : 'easeInOut',
            }}
          >
            {isSpace ? '\u00A0' : char}
          </motion.span>
        );
      })}
    </span>
  );
};
