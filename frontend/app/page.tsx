"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/home");
  };

  return (
    <div
      className="h-screen w-full bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Video Text Mask Effect using mix-blend-mode */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative w-full flex items-center justify-center"
      >
        {/* Video layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-[90vw] md:w-[70vw] h-[20vh] md:h-[25vh] object-cover"
        >
          <source src="https://cdn.magicui.design/ocean-small.webm" type="video/webm" />
        </video>

        {/* Text mask layer - black bg with white text, blended with video */}
        <div className="relative bg-black px-4 py-2 mix-blend-multiply">
          <h1 className="text-[18vw] md:text-[14vw] font-black tracking-tighter text-white select-none leading-none">
            MARVEL
          </h1>
        </div>
      </motion.div>

      {/* Click hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 text-white/50 text-sm tracking-widest uppercase"
      >
        Click to enter
      </motion.p>
    </div>
  );
}
