import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import tryAgainImg from "../assets/IMG/try.png";

const Scene2 = ({ onRetryDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1250);

    const dismissTimer = setTimeout(() => {
      onRetryDismiss?.();
    }, 1600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [onRetryDismiss]);

  return (
    <div className="z-30 w-full h-full flex flex-col justify-center items-center pointer-events-none">
      <motion.div
        className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center py-7 bg-transparent transform-gpu"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: isExiting ? 0.85 : 1,
          opacity: isExiting ? 0 : 1,
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <img
          src={tryAgainImg}
          alt="Try Again"
          className="w-[780px] object-contain drop-shadow-xl"
        />
      </motion.div>
    </div>
  );
};

export default Scene2;
