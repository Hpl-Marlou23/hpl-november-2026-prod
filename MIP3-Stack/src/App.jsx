import { useState, useEffect } from "react";
import useScaleUI from "./hooks/useScaleUI";
import { motion as Motion } from "framer-motion";

import logo from "./assets/img/Logo.png";
import cta from "./assets/img/CTA.png";
import startText from "./assets/IMG/text.png";
import handImg from "./assets/IMG/hand.png";

import end from "./assets/sounds/end.mp3";
import wrong from "./assets/sounds/wrong.mp3";

import Scene1 from "./components/Scene1";
import Scene2 from "./components/Scene2";
import EndScene from "./components/EndScene";
import { PlayableBridge } from "./utils/playableBridge";

const App = () => {
  const { appRef, wrapperRef } = useScaleUI(1080, 1920);

  // Set to true to test the "Try Again" scene immediately on load
  const TEST_FORCE_TRY_AGAIN = false;

  const [isSpinning, setIsSpinning] = useState(false);
  const [showScene2, setShowScene2] = useState(TEST_FORCE_TRY_AGAIN);
  const [showEndScene, setShowEndScene] = useState(false);
  const [endSceneReady, setEndSceneReady] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState(
    TEST_FORCE_TRY_AGAIN
      ? { id: 2, label: "Prize 2", shouldRetry: true }
      : null
  );
  const [scene1ResetToken, setScene1ResetToken] = useState(0);
  const [spinLayerEl, setSpinLayerEl] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handleSpinStart = () => {
    setIsSpinning(true);
    setShowScene2(false);
    setShowEndScene(false);
    setEndSceneReady(false);
    setSelectedSlice(null);
  };

  const handleSpinEnd = (winner) => {
    setIsSpinning(false);
    setSelectedSlice(winner);

    if (winner?.shouldRetry) {
      setTimeout(() => {
        setShowScene2(true);
      }, 700);
    } else {
      // When all images stack, proceed directly to EndScene without Scene2 (win scene)
      setTimeout(() => {
        setShowEndScene(true);
      }, 700);
    }
  };

  useEffect(() => {
    if (showScene2) {
      if (selectedSlice?.shouldRetry) {
        const audio = new Audio(wrong);
        audio.currentTime = 0;
        audio.play().catch(() => { });
        return;
      }

      const timer = setTimeout(() => {
        setShowEndScene(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showScene2, selectedSlice]);

  useEffect(() => {
    if (showEndScene) {
      const audio = new Audio(end);
      audio.currentTime = 0;
      audio.volume = 1;

      audio.play().catch((err) => {
        console.log("End sound blocked:", err);
      });
    }
  }, [showEndScene]);

  useEffect(() => {
    document.body.classList.toggle("end-active", showEndScene);

    return () => {
      document.body.classList.remove("end-active");
    };
  }, [showEndScene]);

  const handleRedirect = () => {
    PlayableBridge.click();
  };

  return (
    <main className="relative w-screen h-screen overflow-visible">
      {!endSceneReady && (
        <div key="app" ref={wrapperRef} className="appWrapper">
          <div
            ref={appRef}
            className="relative app flex flex-col justify-between overflow-visible"
          >
            <div className="relative h-[1600px] w-full overflow-visible">
              <Scene1
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
                onSpinEnd={handleSpinEnd}
                blur={showScene2}
                isWinningScene={showScene2 && !selectedSlice?.shouldRetry}
                resetToken={scene1ResetToken}
                spinLayer={spinLayerEl}
                hasStarted={hasStarted}
                onStartGame={() => setHasStarted(true)}
              />
            </div>
          </div>

          <div className="foregroundLayer pointer-events-none">
            {/* Header bar background extending 100vw across the full screen */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[160px] bg-white border-b border-[#e5e7eb] shadow-xs"
              style={{ minWidth: "100vw" }}
            />

            {/* Header bar background extending across the full screen */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-[160px] bg-white"
              style={{ width: "max(100vw, 4000px)" }}
            />

            <Motion.div
              className="absolute top-10 left-1/2 w-[250px] -translate-x-1/2 z-10"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
            >
              <img src={logo} alt="logo" className="w-full" />
            </Motion.div>
            <div className="absolute bottom-13
             left-1/2 w-[450px] -translate-x-1/2 pointer-events-auto">
              <button
                className="w-full cursor-pointer relative animate-pulsing h-full "
                onClick={handleRedirect}
              >
                <img src={cta} alt="cta" className="w-full " />

              </button>
            </div>
          </div>

          <div className="scene2Layer flex flex-col justify-between pointer-events-none">
            <div className="absolute h-[1100px] top-[21%] w-full">
              {showScene2 && (
                <Scene2
                  selectedSlice={selectedSlice}
                  onRetryDismiss={() => {
                    setShowScene2(false);
                    setSelectedSlice(null);
                    setScene1ResetToken((value) => value + 1);
                  }}
                />
              )}

              {/* Start overlay inside the exact same scene2Layer with same scale as Try Again */}
              {!hasStarted && !showScene2 && (
                <div className="z-30 w-full h-full flex flex-col justify-center items-center pointer-events-none">
                  <Motion.div
                    className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center py-7 bg-transparent transform-gpu"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  >
                    <div className="relative flex items-center justify-center">
                      <img
                        src={startText}
                        alt="Start"
                        className="w-[980px] object-contain drop-shadow-xl scale-[1.4]"
                      />
                      <Motion.img
                        src={handImg}
                        alt="hand"
                        className="absolute -bottom-60 right-14 w-[220px] object-contain drop-shadow-md"
                        animate={{
                          scale: [1, 1.14, 1],
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </Motion.div>
                </div>
              )}
            </div>
          </div>


          {/* Spin button + hand layer: sits above the bottom gradient */}
          <div
            ref={setSpinLayerEl}
            className="scene2Layer pointer-events-none"
            style={{ zIndex: 41 }}
          />
        </div>
      )}

      {/* Full-screen backdrop overlay for both START and Try Again scenes */}
      {!endSceneReady && (
        <div
          className={`fixed inset-0 w-screen h-screen z-40 bg-[#ffffff]/30 backdrop-blur-[1px] pointer-events-none transition-opacity duration-500 ${(!hasStarted || (showScene2 && selectedSlice?.shouldRetry)) && !endSceneReady
            ? "opacity-100"
            : "opacity-0"
            }`}
          aria-hidden="true"
        />
      )}

      {showEndScene && (
        <EndScene key="end" onReady={() => setEndSceneReady(true)} />
      )}
    </main>
  );
};

export default App;
