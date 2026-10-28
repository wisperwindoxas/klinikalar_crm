import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavEffect {
  id: string;
  name: string;
  icon: string;
  colorGradient: string;
  borderColor: string;
  glowColor: string;
  springConfig: {
    stiffness: number;
    damping: number;
    mass?: number;
    velocity?: number;
  };
}

export const NAV_EFFECTS: NavEffect[] = [
  // 1. Suv tomchisi (Water Droplet & Splash)
  {
    id: 'water_droplet',
    name: 'Suv Tomchisi & Chayqalish',
    icon: '💧',
    colorGradient: 'from-cyan-600 via-teal-700 to-emerald-800',
    borderColor: 'border-cyan-400/50',
    glowColor: 'shadow-cyan-500/30',
    springConfig: { stiffness: 320, damping: 22, mass: 1.1 },
  },
  // 2. Kauchuk to‘p sakrashi (Rubber Ricochet & Bounce)
  {
    id: 'rubber_bounce',
    name: 'Kauchuk Sakrash & Urilish',
    icon: '⚡',
    colorGradient: 'from-teal-700 via-emerald-600 to-teal-800',
    borderColor: 'border-emerald-400/60',
    glowColor: 'shadow-emerald-500/35',
    springConfig: { stiffness: 550, damping: 15, mass: 0.6 },
  },
  // 3. Koinot girdobi (Cosmic Portal Vortex)
  {
    id: 'cosmic_vortex',
    name: 'Koinot Girdobi & Portal',
    icon: '🌀',
    colorGradient: 'from-indigo-700 via-purple-700 to-teal-800',
    borderColor: 'border-purple-400/60',
    glowColor: 'shadow-purple-500/35',
    springConfig: { stiffness: 380, damping: 26, mass: 0.9 },
  },
  // 4. Sehrli yulduzlar portlashi (Magic Starlight Burst)
  {
    id: 'magic_stars',
    name: 'Sehrli Yulduzlar Portlashi',
    icon: '✨',
    colorGradient: 'from-amber-600 via-teal-700 to-cyan-800',
    borderColor: 'border-amber-300/60',
    glowColor: 'shadow-amber-400/35',
    springConfig: { stiffness: 420, damping: 25, mass: 0.8 },
  },
  // 5. Tsunami to‘lqini (Tsunami Ocean Wave)
  {
    id: 'tsunami_wave',
    name: 'Tsunami To‘lqin Oqimi',
    icon: '🌊',
    colorGradient: 'from-blue-600 via-teal-700 to-teal-900',
    borderColor: 'border-blue-400/60',
    glowColor: 'shadow-blue-500/30',
    springConfig: { stiffness: 280, damping: 20, mass: 1.4 },
  },
  // 6. Magnitli Slime / Jele (Magnetic Gooey Slime)
  {
    id: 'magnetic_slime',
    name: 'Magnitli Slime & Jele',
    icon: '🧲',
    colorGradient: 'from-emerald-700 via-teal-800 to-green-900',
    borderColor: 'border-emerald-400/50',
    glowColor: 'shadow-emerald-600/30',
    springConfig: { stiffness: 220, damping: 14, mass: 2.0 },
  },
  // 7. Raketa reaktiv alanga (Rocket Thrust Flame)
  {
    id: 'rocket_thrust',
    name: 'Raketa Reaktiv Alanga',
    icon: '🚀',
    colorGradient: 'from-orange-600 via-amber-700 to-teal-900',
    borderColor: 'border-orange-400/60',
    glowColor: 'shadow-orange-500/35',
    springConfig: { stiffness: 500, damping: 22, mass: 0.7 },
  },
  // 8. Qirov & Muzlash (Ice Frost Crystal)
  {
    id: 'ice_frost',
    name: 'Qirov & Muz Kristallari',
    icon: '🧊',
    colorGradient: 'from-sky-500 via-teal-700 to-blue-900',
    borderColor: 'border-sky-300/70',
    glowColor: 'shadow-sky-400/35',
    springConfig: { stiffness: 450, damping: 30, mass: 0.8 },
  },
  // 9. Kiberpank Gologramma Glitch (Cyber Glitch)
  {
    id: 'cyber_glitch',
    name: 'Kiberpank Gologramma Glitch',
    icon: '🔮',
    colorGradient: 'from-fuchsia-700 via-teal-800 to-cyan-900',
    borderColor: 'border-fuchsia-400/60',
    glowColor: 'shadow-fuchsia-500/35',
    springConfig: { stiffness: 600, damping: 28, mass: 0.5 },
  },
  // 10. Sovun pufagi (Iridescent Bubble Pop)
  {
    id: 'bubble_pop',
    name: 'Kamalak Pufak Shishishi',
    icon: '🫧',
    colorGradient: 'from-pink-600 via-teal-700 to-violet-900',
    borderColor: 'border-pink-300/60',
    glowColor: 'shadow-pink-400/30',
    springConfig: { stiffness: 340, damping: 16, mass: 0.9 },
  },
  // 11. Mayin shabada va yaproqlar (Breeze Leaf Swirl)
  {
    id: 'leaf_breeze',
    name: 'Mayin Shabada & Yaproqlar',
    icon: '🍃',
    colorGradient: 'from-green-600 via-teal-700 to-emerald-900',
    borderColor: 'border-green-300/60',
    glowColor: 'shadow-green-500/30',
    springConfig: { stiffness: 300, damping: 24, mass: 1.0 },
  },
  // 12. Tesla Plazma Zaryadi (Tesla Plasma Spark)
  {
    id: 'tesla_plasma',
    name: 'Tesla Plazma & Elektr Yoyi',
    icon: '⚡',
    colorGradient: 'from-amber-500 via-teal-800 to-indigo-950',
    borderColor: 'border-amber-400/70',
    glowColor: 'shadow-amber-400/40',
    springConfig: { stiffness: 580, damping: 20, mass: 0.6 },
  },
  // 13. Elastik kamon otilishi (Elastic Slingshot)
  {
    id: 'slingshot_snap',
    name: 'Kamon Otilishi & Tebranish',
    icon: '🎯',
    colorGradient: 'from-rose-600 via-teal-800 to-emerald-950',
    borderColor: 'border-rose-400/60',
    glowColor: 'shadow-rose-500/35',
    springConfig: { stiffness: 480, damping: 18, mass: 0.75 },
  },
  // 14. Vulkan magma qaynoq oqimi (Molten Lava Magma)
  {
    id: 'molten_lava',
    name: 'Vulkan Magma Qaynoq Oqimi',
    icon: '🌋',
    colorGradient: 'from-red-600 via-orange-700 to-teal-950',
    borderColor: 'border-red-400/60',
    glowColor: 'shadow-red-500/35',
    springConfig: { stiffness: 260, damping: 17, mass: 1.5 },
  },
  // 15. 3D Origami qatlam ochilishi (3D Origami Fold)
  {
    id: 'origami_3d',
    name: '3D Origami Qatlam Ochilishi',
    icon: '🪞',
    colorGradient: 'from-teal-600 via-emerald-700 to-slate-900',
    borderColor: 'border-teal-300/60',
    glowColor: 'shadow-teal-400/35',
    springConfig: { stiffness: 390, damping: 24, mass: 0.85 },
  },
];

interface LiquidNavPillProps {
  effect: NavEffect;
  triggerKey: string;
}

export const LiquidNavPill: React.FC<LiquidNavPillProps> = ({ effect, triggerKey }) => {
  // Generate random particles per trigger
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 140,
      y: (Math.random() - 0.5) * 50,
      scale: Math.random() * 0.7 + 0.4,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.1,
    }));
  }, [triggerKey]);

  return (
    <motion.div
      layoutId="liquidActiveIndicator"
      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${effect.colorGradient} shadow-lg ${effect.glowColor} border ${effect.borderColor} overflow-hidden pointer-events-none`}
      transition={{
        type: 'spring',
        stiffness: effect.springConfig.stiffness,
        damping: effect.springConfig.damping,
        mass: effect.springConfig.mass ?? 0.8,
      }}
    >
      {/* 1. EFFECT-SPECIFIC VISUAL OVERLAYS */}
      {effect.id === 'water_droplet' && (
        <WaterDropletAnimation key={triggerKey} />
      )}

      {effect.id === 'rubber_bounce' && (
        <RubberBounceAnimation key={triggerKey} />
      )}

      {effect.id === 'cosmic_vortex' && (
        <CosmicVortexAnimation key={triggerKey} />
      )}

      {effect.id === 'magic_stars' && (
        <MagicStarsAnimation key={triggerKey} />
      )}

      {effect.id === 'tsunami_wave' && (
        <TsunamiWaveAnimation key={triggerKey} />
      )}

      {effect.id === 'magnetic_slime' && (
        <MagneticSlimeAnimation key={triggerKey} />
      )}

      {effect.id === 'rocket_thrust' && (
        <RocketThrustAnimation key={triggerKey} />
      )}

      {effect.id === 'ice_frost' && (
        <IceFrostAnimation key={triggerKey} />
      )}

      {effect.id === 'cyber_glitch' && (
        <CyberGlitchAnimation key={triggerKey} />
      )}

      {effect.id === 'bubble_pop' && (
        <BubblePopAnimation key={triggerKey} />
      )}

      {effect.id === 'leaf_breeze' && (
        <LeafBreezeAnimation key={triggerKey} />
      )}

      {effect.id === 'tesla_plasma' && (
        <TeslaPlasmaAnimation key={triggerKey} />
      )}

      {effect.id === 'slingshot_snap' && (
        <SlingshotAnimation key={triggerKey} />
      )}

      {effect.id === 'molten_lava' && (
        <MoltenLavaAnimation key={triggerKey} />
      )}

      {effect.id === 'origami_3d' && (
        <Origami3DAnimation key={triggerKey} />
      )}

      {/* Floating particles burst */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={`${triggerKey}-${p.id}`}
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm shadow-white"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              scale: [0, p.scale, 0],
              opacity: [1, 0.8, 0],
              rotate: p.rotate,
            }}
            transition={{ duration: 0.7, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Continuous soft fluid water wave shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          duration: 2.6,
          ease: 'easeInOut',
          repeatDelay: 2.2,
        }}
      />

      {/* Right droplet indicator with pulse */}
      <motion.div
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-4 rounded-full bg-white/70 blur-[0.8px] shadow-sm shadow-white"
        animate={{
          scaleY: [1, 1.4, 0.9, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      />
    </motion.div>
  );
};

// -------------------------------------------------------------
// 15 INDIVIDUAL ULTRA-HIGH-QUALITY EFFECT COMPONENTS
// -------------------------------------------------------------

// 1. Water Droplet Splash
const WaterDropletAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 0.9, delay: 0.4 }}
  >
    {/* Concentric expanding ripples */}
    <motion.div
      className="absolute w-6 h-6 rounded-full border-2 border-cyan-200/90"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 6, opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
    <motion.div
      className="absolute w-6 h-6 rounded-full border border-white/80"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 4.5, opacity: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
    />
    {/* Central splash droplet */}
    <motion.div
      className="w-3 h-3 rounded-full bg-white shadow-md shadow-cyan-300"
      initial={{ scale: 0, y: -20 }}
      animate={{ scale: [0, 1.8, 0], y: [-20, 0, 5] }}
      transition={{ duration: 0.6, ease: 'backOut' }}
    />
  </motion.div>
);

// 2. Rubber Bounce & Ricochet
const RubberBounceAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none flex items-center justify-between px-4"
    initial={{ scaleY: 1.8, scaleX: 0.6 }}
    animate={{ scaleY: [1.8, 0.5, 1.2, 0.85, 1], scaleX: [0.6, 1.4, 0.9, 1.1, 1] }}
    transition={{ duration: 0.7, ease: 'easeInOut' }}
  >
    <motion.div
      className="w-2.5 h-2.5 rounded-full bg-emerald-200 shadow-md shadow-emerald-400"
      animate={{ x: [0, 180, 40, 120, 90], y: [-8, 8, -6, 6, 0] }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  </motion.div>
);

// 3. Cosmic Vortex Portal
const CosmicVortexAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none flex items-center justify-center"
    initial={{ rotate: 0, scale: 0.3, opacity: 0 }}
    animate={{ rotate: 720, scale: [0.3, 1.3, 1], opacity: [0, 1, 0] }}
    transition={{ duration: 0.9, ease: 'easeInOut' }}
  >
    <div className="w-24 h-24 rounded-full border-2 border-dashed border-purple-300/80 animate-spin" />
    <div className="absolute w-12 h-12 rounded-full border-2 border-teal-200/90 animate-ping" />
  </motion.div>
);

// 4. Magic Stars Burst
const MagicStarsAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 0.9, delay: 0.3 }}
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-amber-200 text-xs font-bold"
        style={{ left: `${15 + i * 15}%`, top: '40%' }}
        initial={{ y: 0, scale: 0, opacity: 1 }}
        animate={{
          y: (i % 2 === 0 ? -1 : 1) * (20 + Math.random() * 15),
          scale: [0, 1.4, 0],
          opacity: [1, 1, 0],
          rotate: [0, 180],
        }}
        transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
      >
        ✦
      </motion.div>
    ))}
  </motion.div>
);

// 5. Tsunami Ocean Wave
const TsunamiWaveAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    initial={{ x: '-100%' }}
    animate={{ x: '100%' }}
    transition={{ duration: 0.75, ease: 'easeInOut' }}
  >
    <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-200/40 to-white/70 skew-x-12 flex items-center justify-end pr-2">
      <div className="w-3 h-full bg-white/60 blur-[2px]" />
    </div>
  </motion.div>
);

// 6. Magnetic Slime
const MagneticSlimeAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ scaleX: 0.4, scaleY: 1.4 }}
    animate={{ scaleX: [0.4, 1.25, 0.85, 1.08, 1], scaleY: [1.4, 0.7, 1.15, 0.95, 1] }}
    transition={{ duration: 0.85, ease: 'easeOut' }}
  >
    <div className="w-full h-full rounded-xl bg-gradient-to-r from-emerald-400/20 via-white/20 to-teal-400/20" />
  </motion.div>
);

// 7. Rocket Thrust
const RocketThrustAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-start pl-2"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 0.8, delay: 0.3 }}
  >
    <motion.div
      className="h-3 rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-transparent"
      initial={{ width: 0 }}
      animate={{ width: ['0%', '100%', '0%'] }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  </motion.div>
);

// 8. Ice Frost Crystals
const IceFrostAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 0.85, delay: 0.35 }}
  >
    <motion.div
      className="absolute inset-0 bg-sky-200/30"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4 }}
    />
    <span className="text-white text-lg font-black tracking-widest opacity-40">❄ ❅ ❆</span>
  </motion.div>
);

// 9. Cyberpunk Glitch
const CyberGlitchAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    animate={{
      x: [0, -6, 6, -3, 3, 0],
      opacity: [1, 0.8, 1, 0.6, 1],
    }}
    transition={{ duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
  >
    <div className="absolute inset-x-0 top-1/4 h-1 bg-cyan-300/60 shadow-sm" />
    <div className="absolute inset-x-0 bottom-1/3 h-1 bg-fuchsia-300/60 shadow-sm" />
  </motion.div>
);

// 10. Rainbow Bubble Pop
const BubblePopAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none flex items-center justify-center"
    initial={{ scale: 0.2, opacity: 1 }}
    animate={{ scale: [0.2, 1.4, 0], opacity: [1, 0.9, 0] }}
    transition={{ duration: 0.7, ease: 'easeOut' }}
  >
    <div className="w-20 h-10 rounded-full border-2 border-pink-200/90 bg-gradient-to-tr from-pink-300/30 via-cyan-200/30 to-violet-300/30 backdrop-blur-[1px]" />
  </motion.div>
);

// 11. Leaf Breeze Swirl
const LeafBreezeAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden flex items-center"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 0.8, delay: 0.3 }}
  >
    <motion.div
      className="text-emerald-200 text-sm font-bold"
      initial={{ x: -20, y: -10, rotate: 0 }}
      animate={{ x: 220, y: [ -10, 10, -10 ], rotate: 360 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      🍃
    </motion.div>
  </motion.div>
);

// 12. Tesla Plasma Lightning
const TeslaPlasmaAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none border-2 border-amber-300/80 rounded-xl"
    animate={{
      opacity: [1, 0.2, 1, 0.3, 1, 0],
      boxShadow: [
        '0 0 10px rgba(251, 191, 36, 0.8)',
        '0 0 2px rgba(251, 191, 36, 0.2)',
        '0 0 15px rgba(251, 191, 36, 0.9)',
        '0 0 0px rgba(251, 191, 36, 0)',
      ],
    }}
    transition={{ duration: 0.6 }}
  />
);

// 13. Slingshot Snap
const SlingshotAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    animate={{
      x: [-16, 12, -8, 5, -2, 0],
    }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  />
);

// 14. Molten Lava Magma
const MoltenLavaAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-around pb-1"
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 0.85, delay: 0.3 }}
  >
    {[1, 2, 3, 4].map((n) => (
      <motion.div
        key={n}
        className="w-2.5 h-2.5 rounded-full bg-gradient-to-t from-red-400 to-amber-300 shadow-md shadow-orange-500"
        initial={{ y: 15, scale: 0.5 }}
        animate={{ y: -20, scale: [0.5, 1.3, 0] }}
        transition={{ duration: 0.7, delay: n * 0.08, ease: 'easeOut' }}
      />
    ))}
  </motion.div>
);

// 15. 3D Origami Fold
const Origami3DAnimation = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none rounded-xl bg-white/20"
    initial={{ rotateX: 90, opacity: 0 }}
    animate={{ rotateX: [90, -20, 10, 0], opacity: [0, 1, 1, 0] }}
    transition={{ duration: 0.75, ease: 'easeInOut' }}
  />
);
