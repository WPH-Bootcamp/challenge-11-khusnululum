"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import VolumeIcon from "@/assets/svg/VolumeIcon.svg";

type PlayerState = "playing" | "paused" | "loading";
type Song = {
  src: string;
  title: string;
  artist: string;
};

const containerVariants = {
  paused: {
    backgroundColor: "#0b0b0f",
    boxShadow: "0 0 0 rgba(0,0,0,0)",
  },
  loading: {
    backgroundColor: "#0b0b0f",
    boxShadow: "0 0 20px rgba(139,92,246,0.15)",
  },
  playing: {
    backgroundColor: "#0b0614",
    boxShadow: "0 0 60px rgba(139,92,246,0.6)",
  },
};

const albumVariants = {
  paused: { scale: 0.95 },
  loading: { scale: 0.9 },
  playing: { scale: 1 },
};

const equalizerVariants = {
  paused: { height: "20%", opacity: 1 },
  loading: { height: "50%", opacity: 0.5 },
};

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const songs: Song[] = [
    {
      src: "/music/Lonely.mp3",
      title: "Lonely",
      artist: "Justin Bieber",
    },
    {
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      title: "Spy vs. Spy - Chill-out Acid Squeeze Mix",
      artist: "T. Schürger",
    },
    {
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      title: "Song 1",
      artist: "T. Schürger",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [state, setState] = useState<PlayerState>("paused");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [userStarted, setUserStarted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");

  /* ================= AUDIO SYNC ================= */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const setMeta = () => setDuration(audio.duration || 0);

    const onEnd = () => {
      if (repeatMode === "one") {
        audioRef.current?.play();
        return;
      }

      if (isShuffle) {
        shuffle();
        return;
      }

      if (repeatMode === "all") {
        nextSong();
        return;
      }

      if (current < songs.length - 1) {
        nextSong();
      } else {
        setState("paused");
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [current, volume]);

  useEffect(() => {
    if (!userStarted) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.load();
    audio.play();

    setState(state);
  }, [current]);

  /* ================= CONTROLS ================= */

  async function togglePlay() {
    if (!audioRef.current || state === "loading") return;

    setUserStarted(true);

    const next = state === "playing" ? "paused" : "playing";
    setState("loading");

    await new Promise((r) => setTimeout(r, 400));

    if (next === "playing") {
      await audioRef.current.play();
    } else {
      audioRef.current.pause();
    }

    setState(next);
  }

  function toggleShuffle() {
    setIsShuffle((s) => !s);
  }

  function toggleRepeat() {
    setRepeatMode((mode) =>
      mode === "off" ? "one" : mode === "one" ? "all" : "off",
    );
  }

  function shuffle() {
    if (songs.length <= 1) return;

    let next;
    do {
      next = Math.floor(Math.random() * songs.length);
    } while (next === current);

    setCurrent(next);
  }

  function nextSong() {
    if (isShuffle) {
      shuffle();
      return;
    }

    setCurrent((prev) => (prev + 1) % songs.length);
  }

  function prevSong() {
    setCurrent((prev) => (prev === 0 ? songs.length - 1 : prev - 1));
  }

  function formatTime(sec: number) {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        animate={state}
        transition={{ duration: 0.3 }}
        className="w-125 p-4 text-white rounded-4xl relative"
      >
        {/* Header */}
        <div className="flex gap-4 items-center">
          <motion.div
            variants={albumVariants}
            animate={state}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="w-30 h-30 rounded-2xl bg-linear-to-br from-primary-300 to-[#DB2777] flex items-center justify-center"
          >
            <motion.div
              animate={state === "playing" ? { rotate: 360 } : { rotate: 0 }}
              transition={
                state === "playing"
                  ? { repeat: Infinity, duration: 20, ease: "linear" }
                  : { duration: 0.3 }
              }
              className="text-3xl"
            >
              <p className="text-black">&#x266B;</p>
            </motion.div>
          </motion.div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{songs[current].title}</h3>
            <p className="text-sm text-neutral-400">{songs[current].artist}</p>
          </div>
        </div>

        {/* Equalizer */}
        <div className="flex gap-2 mt-8 h-10 items-end absolute left-47.5 -translate-x-1/2 bottom-45">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 bg-primary-200"
              variants={equalizerVariants}
              animate={
                state === "playing"
                  ? { height: ["20%", "100%", "20%"], opacity: 1 }
                  : state
              }
              transition={
                state === "playing"
                  ? {
                      repeat: Infinity,
                      duration: 0.5,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }
                  : { duration: 0.3 }
              }
            />
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-6 mt-8">
          <div
            className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden cursor-pointer"
            onMouseDown={(e) => {
              const bar = e.currentTarget;

              const update = (clientX: number) => {
                if (!audioRef.current || !duration) return;

                const rect = bar.getBoundingClientRect();
                const percent = (clientX - rect.left) / rect.width;
                const clamped = Math.min(1, Math.max(0, percent));

                audioRef.current.currentTime = duration * clamped;
              };

              update(e.clientX);

              const move = (ev: MouseEvent) => update(ev.clientX);
              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            onTouchStart={(e) => {
              const bar = e.currentTarget;

              const update = (x: number) => {
                if (!audioRef.current || !duration) return;

                const rect = bar.getBoundingClientRect();
                const percent = (x - rect.left) / rect.width;
                const clamped = Math.min(1, Math.max(0, percent));

                audioRef.current.currentTime = duration * clamped;
              };

              update(e.touches[0].clientX);

              const move = (ev: TouchEvent) => update(ev.touches[0].clientX);

              window.addEventListener("touchmove", move);
              window.addEventListener(
                "touchend",
                () => window.removeEventListener("touchmove", move),
                { once: true },
              );
            }}
          >
            <motion.div
              className="h-full"
              animate={{
                width: `${progress}%`,
                backgroundColor: state === "playing" ? "#8b5cf6" : "#9ca3af",
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex justify-between text-xs text-neutral-400">
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
            {duration ? formatTime(duration) : "--:--"}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 px-10">
          {/* Shuffle */}
          <motion.button
            onClick={toggleShuffle}
            whileTap={{ scale: 0.9 }}
            className={`transition-colors ${
              isShuffle ? "text-primary-200" : "text-neutral-300"
            }`}
          >
            <Shuffle size={20} />
          </motion.button>
          {/* Previous */}
          <motion.button
            onClick={prevSong}
            whileHover={{ color: "#fff" }}
            whileTap={{ scale: 0.9 }}
            className="text-neutral-300 transition-colors"
          >
            <SkipBack size={20} />
          </motion.button>
          {/* Play/Pause */}
          <motion.button
            onClick={togglePlay}
            disabled={state === "loading"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4
          ${
            state === "loading"
              ? "bg-neutral-500"
              : state === "playing"
                ? "bg-primary-200 shadow-lg shadow-purple-500/50"
                : "bg-primary-300"
          }`}
          >
            <AnimatePresence mode="wait">
              {state === "playing" ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                >
                  <Pause />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                >
                  <Play />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          {/* Next */}
          <motion.button
            onClick={nextSong}
            whileHover={{ color: "#fff" }}
            whileTap={{ scale: 0.9 }}
            className="text-neutral-300 transition-colors"
          >
            <SkipForward size={20} />
          </motion.button>
          {/* Repeat */}
          <motion.button
            onClick={toggleRepeat}
            whileTap={{ scale: 0.9 }}
            className={`transition-colors ${
              repeatMode !== "off" ? "text-primary-200" : "text-neutral-300"
            }`}
          >
            <Repeat size={20} />
          </motion.button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mt-4">
          <Image
            alt="Vlume Icon"
            src={VolumeIcon}
            className="w-4 h-4 opacity-70"
          />

          <div
            className="relative w-full h-2 bg-neutral-800 rounded-full cursor-pointer"
            onMouseDown={(e) => {
              const bar = e.currentTarget;

              const update = (clientX: number) => {
                const rect = bar.getBoundingClientRect();
                const percent = (clientX - rect.left) / rect.width;
                setVolume(Math.min(1, Math.max(0, percent)));
              };

              update(e.clientX);

              const move = (ev: MouseEvent) => update(ev.clientX);
              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            onTouchStart={(e) => {
              const bar = e.currentTarget;

              const update = (x: number) => {
                const rect = bar.getBoundingClientRect();
                const percent = (x - rect.left) / rect.width;
                setVolume(Math.min(1, Math.max(0, percent)));
              };

              update(e.touches[0].clientX);

              const move = (ev: TouchEvent) => update(ev.touches[0].clientX);

              window.addEventListener("touchmove", move);
              window.addEventListener(
                "touchend",
                () => window.removeEventListener("touchmove", move),
                { once: true },
              );
            }}
          >
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full bg-neutral-400"
              animate={{
                width: `${volume * 100}%`,
                backgroundColor: "#717680",
              }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>
      </motion.div>

      <audio ref={audioRef} src={songs[current].src} />
    </>
  );
}
