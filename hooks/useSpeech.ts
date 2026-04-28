"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type SpeechState = "idle" | "playing" | "paused";

interface Verse {
  number: number;
  text: string;
}

async function waitForVoices(synth: SpeechSynthesis): Promise<void> {
  if (synth.getVoices().length > 0) return;
  await new Promise<void>((resolve) => {
    synth.addEventListener("voiceschanged", () => resolve(), { once: true });
  });
}

export function useSpeech(verses: Verse[]) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [state, setState] = useState<SpeechState>("idle");
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [rate, setRate] = useState(1);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const offsetsRef = useRef<{ number: number; start: number }[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
    return () => synthRef.current?.cancel();
  }, []);

  function buildUtterance(r: number): SpeechSynthesisUtterance {
    const offsets: { number: number; start: number }[] = [];
    let text = "";
    for (const v of verses) {
      offsets.push({ number: v.number, start: text.length });
      text += v.text.replace(/\n/g, " ").trim() + "  ";
    }
    offsetsRef.current = offsets;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = r;
    utterance.lang = "en-US";

    utterance.onboundary = (e) => {
      if (e.name !== "word") return;
      const ci = e.charIndex;
      let current = offsetsRef.current[0]?.number ?? null;
      for (const o of offsetsRef.current) {
        if (o.start <= ci) current = o.number;
        else break;
      }
      setActiveVerse(current);
    };

    utterance.onend = () => { setState("idle"); setActiveVerse(null); };
    utterance.onerror = () => { setState("idle"); setActiveVerse(null); };
    utterance.onpause = () => setState("paused");
    utterance.onresume = () => setState("playing");

    return utterance;
  }

  const play = useCallback(async () => {
    const synth = synthRef.current;
    if (!synth || !verses.length) return;

    // Update state immediately so UI switches to the player bar
    setState("playing");
    setActiveVerse(verses[0]?.number ?? null);

    await waitForVoices(synth);

    synth.cancel();

    // Chrome drops speak() called synchronously after cancel(); a short delay fixes it
    setTimeout(() => {
      synth.speak(buildUtterance(rate));
    }, 100);
  }, [verses, rate]);

  const pause = useCallback(() => {
    synthRef.current?.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    synthRef.current?.resume();
    setState("playing");
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setState("idle");
    setActiveVerse(null);
  }, []);

  const changeRate = useCallback(async (r: number) => {
    setRate(r);
    const synth = synthRef.current;
    if (!synth || state === "idle") return;
    setState("playing");
    synth.cancel();
    await waitForVoices(synth);
    setTimeout(() => {
      synth.speak(buildUtterance(r));
    }, 100);
  }, [state, verses]);

  return { supported, state, activeVerse, rate, changeRate, play, pause, resume, stop };
}
