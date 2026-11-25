import { useState, useRef, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import platformImg from "../assets/IMG/platform.png";
import stack1Img from "../assets/IMG/stack1.png";
import stack2Img from "../assets/IMG/stack2.png";
import stack3Img from "../assets/IMG/stack3.png";
import stack4Img from "../assets/IMG/stack4.png";
import sfx4 from "../assets/sounds/sfx4.mp3";


const STACK_WIDTH = 240;
const CANVAS_WIDTH = 1080;
const DURATION = 2.8; // seconds for half trip (slower, smoother movement)
const START_BOTTOM = 1100; // starting drop height above container bottom

// 3 droppable pieces in order: stack2, stack3, stack4
const PIECES = [
  { id: "stack2", image: stack2Img, heightRatio: 261 / 252 },
  { id: "stack3", image: stack3Img, heightRatio: 259 / 248 },
  { id: "stack4", image: stack4Img, heightRatio: 251 / 244 },
];

const Scene1 = ({ blur, isWinningScene, onSpinEnd, resetToken, hasStarted, onStartGame }) => {
  // Current index in PIECES that needs to drop (0 = stack2, 1 = stack3, 2 = stack4)
  const [currentPieceIdx, setCurrentPieceIdx] = useState(0);

  // Array of already stacked blocks: [{ id, image, x, bottom, height }]
  const [stackedBlocks, setStackedBlocks] = useState([]);

  // Active falling piece state
  // 'moving' | 'falling' | 'missed'
  const [dropState, setDropState] = useState("moving");
  const [fallingX, setFallingX] = useState(0);
  const [fallingBottom, setFallingBottom] = useState(START_BOTTOM);
  const [fallingRotate, setFallingRotate] = useState(0);
  const [fallingOpacity, setFallingOpacity] = useState(1);

  const movingRef = useRef(null);
  const containerRef = useRef(null);
  const stack1Ref = useRef(null);
  const stackedRefs = useRef([]);

  // When resetToken changes (e.g. Try Again dismissed), reset to try the CURRENT failed piece again
  useEffect(() => {
    if (resetToken > 0) {
      setDropState("moving");
      setFallingBottom(START_BOTTOM);
      setFallingX(0);
      setFallingRotate(0);
      setFallingOpacity(1);
    }
  }, [resetToken]);

  // Handle tap / click
  const handleTap = () => {
    if (blur) return;
    if (!hasStarted) {
      onStartGame?.();
      return;
    }
    if (dropState !== "moving") return;

    let frozenX = (CANVAS_WIDTH - STACK_WIDTH) / 2;
    let targetBottom = 380;

    if (containerRef.current) {
      const contRect = containerRef.current.getBoundingClientRect();
      const scale = contRect.width / CANVAS_WIDTH;

      if (movingRef.current) {
        const imgRect = movingRef.current.getBoundingClientRect();
        frozenX = (imgRect.left - contRect.left) / scale;
      }

      // If no blocks stacked yet, target is top of stack1
      if (stackedBlocks.length === 0) {
        if (stack1Ref.current) {
          const s1Rect = stack1Ref.current.getBoundingClientRect();
          targetBottom = (contRect.bottom - s1Rect.top) / scale;
        }
      } else {
        // Target is top of the last stacked block
        const lastIdx = stackedBlocks.length - 1;
        const lastBlock = stackedBlocks[lastIdx];
        const lastEl = stackedRefs.current[lastIdx];
        if (lastEl) {
          const lastRect = lastEl.getBoundingClientRect();
          targetBottom = (contRect.bottom - lastRect.top) / scale;
        } else {
          targetBottom = lastBlock.bottom + lastBlock.height;
        }
      }
    }

    setFallingX(frozenX);
    setDropState("falling");

    // Check hit against the top-most support block
    let supportX = (CANVAS_WIDTH - STACK_WIDTH) / 2; // stack1 X position
    if (stackedBlocks.length > 0) {
      supportX = stackedBlocks[stackedBlocks.length - 1].x;
    }

    const rawOffset = frozenX - supportX;
    const offset = Math.abs(rawOffset);

    // Overlap center alignment requirement (max 85px offset to balance securely)
    const isHit = offset <= 85;

    // Slight magnetic snap if within safe hit range so it aligns cleanly
    const finalStackedX = isHit ? supportX + rawOffset * 0.45 : frozenX;

    const activePiece = PIECES[currentPieceIdx];
    const pieceHeight = STACK_WIDTH * activePiece.heightRatio;

    // Fall animation
    const dropDuration = 340; // ms
    const dropStart = performance.now();

    const dropLoop = (now) => {
      const elapsed = now - dropStart;
      const t = Math.min(elapsed / dropDuration, 1);
      const easeT = t * t; // gravity acceleration
      const currentDropY = START_BOTTOM - easeT * (START_BOTTOM - targetBottom);
      setFallingBottom(currentDropY);

      if (t < 1) {
        requestAnimationFrame(dropLoop);
      } else {
        if (isHit) {
          // Success: land securely on top
          try {
            const audio = new Audio(sfx4);
            audio.currentTime = 0;
            audio.play().catch(() => { });
          } catch (e) { }

          const newStacked = [
            ...stackedBlocks,
            {
              id: activePiece.id,
              image: activePiece.image,
              x: finalStackedX,
              bottom: targetBottom,
              height: pieceHeight,
            },
          ];

          setStackedBlocks(newStacked);

          if (currentPieceIdx + 1 >= PIECES.length) {
            setDropState("stacked_all");
            if (onSpinEnd) {
              onSpinEnd({ id: 2, label: "Prize", shouldRetry: false });
            }
          } else {
            setCurrentPieceIdx((prev) => prev + 1);
            setDropState("moving");
            setFallingBottom(START_BOTTOM);
            setFallingRotate(0);
            setFallingOpacity(1);
          }
        } else {
          // Physics effect: The block glances/hits the edge, tilts and tumbles off the platform
          setDropState("missed");

          // Direction of tumble depends on which side it was hanging off (left or right)
          const tiltDirection = rawOffset >= 0 ? 1 : -1;
          const bounceStartX = frozenX;
          const bounceTargetX = bounceStartX + tiltDirection * 180;
          const tumbleStartY = targetBottom;
          const tumbleTargetY = -280;

          const tumbleStart = performance.now();
          const tumbleDuration = 520; // ms

          const tumbleLoop = (tNow) => {
            const tElapsed = tNow - tumbleStart;
            const progress = Math.min(tElapsed / tumbleDuration, 1);

            // X arc movement away from the stack
            setFallingX(bounceStartX + progress * (bounceTargetX - bounceStartX));

            // Y accelerated drop off-screen
            const yProgress = progress * progress;
            setFallingBottom(tumbleStartY - yProgress * (tumbleStartY - tumbleTargetY));

            // Realistic rotation flip as it falls off
            setFallingRotate(progress * 55 * tiltDirection);

            // Fade out as it leaves the platform
            if (progress > 0.65) {
              setFallingOpacity(1 - (progress - 0.65) / 0.35);
            }

            if (progress < 1) {
              requestAnimationFrame(tumbleLoop);
            } else {
              if (onSpinEnd) {
                onSpinEnd({ id: 2, label: "Try Again", shouldRetry: true });
              }
            }
          };

          requestAnimationFrame(tumbleLoop);
        }
      }
    };

    requestAnimationFrame(dropLoop);
  };

  const currentPiece = PIECES[currentPieceIdx];

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className={`h-full w-full relative cursor-pointer select-none transition-all duration-700 ${blur || !hasStarted ? "blur-none" : "opacity-100"
        }`}
    >
      {/* Moving current stack piece (only when in moving state and game not yet finished) */}
      {hasStarted && dropState === "moving" && currentPiece && (
        <div
          className="absolute left-0 w-full h-[260px] pointer-events-none z-20"
          style={{ bottom: `${START_BOTTOM}px` }}
        >
          <Motion.img
            ref={movingRef}
            key={currentPiece.id}
            src={currentPiece.image}
            alt={currentPiece.id}
            className="absolute bottom-0 w-[240px] object-contain"
            initial={{ left: 0 }}
            animate={{
              left: [0, 840, 0],
            }}
            transition={{
              duration: DURATION,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Active falling / dropping piece with physics tumble */}
      {(dropState === "falling" || dropState === "missed") && currentPiece && (
        <div
          className="absolute w-[240px] pointer-events-none z-20"
          style={{
            left: `${fallingX}px`,
            bottom: `${fallingBottom}px`,
            transform: `rotate(${fallingRotate}deg)`,
            transformOrigin: fallingRotate >= 0 ? "bottom right" : "bottom left",
            opacity: fallingOpacity,
            transition: dropState === "falling" ? "none" : "opacity 0.1s",
          }}
        >
          <img
            src={currentPiece.image}
            alt={currentPiece.id}
            className="w-full object-contain"
          />
        </div>
      )}

      {/* Render all permanently stacked pieces so far */}
      {stackedBlocks.map((block, idx) => (
        <div
          key={block.id}
          ref={(el) => (stackedRefs.current[idx] = el)}
          className="absolute w-[240px] pointer-events-none z-20"
          style={{
            left: `${block.x}px`,
            bottom: `${block.bottom}px`,
          }}
        >
          <Motion.img
            src={block.image}
            alt={block.id}
            className="w-full object-contain"
            initial={{ scale: 1.06 }}
            animate={
              isWinningScene
                ? { scale: [1, 1.05, 0], opacity: 0 }
                : { scale: 1 }
            }
            transition={{ duration: 0.2 }}
          />
        </div>
      ))}

      {/* Platform & Stack 1 base */}
      <div className="absolute bottom-[-22%] left-1/2 -translate-x-1/2 w-[1800px] pointer-events-none">
        <Motion.img
          src={platformImg}
          alt="platform"
          className="w-full object-contain"
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={
            isWinningScene
              ? { scale: [1, 1.05, 0], opacity: 0 }
              : { y: 0, opacity: 1, scale: 1 }
          }
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 18,
          }}
        />

        {/* stack1 positioned in the middle on top of the platform */}
        <Motion.img
          ref={stack1Ref}
          src={stack1Img}
          alt="stack1"
          className="absolute left-1/2 bottom-[75%] -translate-x-1/2 w-[240px] object-contain"
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={
            isWinningScene
              ? { scale: [1, 1.05, 0], opacity: 0 }
              : { y: 0, opacity: 1, scale: 1 }
          }
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 18,
            delay: 0.1,
          }}
        />
      </div>

    </div>
  );
};

export default Scene1;
