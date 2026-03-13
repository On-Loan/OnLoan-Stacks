"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-onloan-orange/8 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-onloan-deep/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <span className="inline-flex items-center rounded-full border border-onloan-orange/30 bg-onloan-orange/10 px-4 py-1.5 text-xs font-medium text-onloan-orange">
          Built on Bitcoin via Stacks
        </span>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Lend &amp; Borrow
          <br />
          <span className="text-onloan-orange">on Bitcoin</span>
        </h1>

        <p className="max-w-xl text-lg text-zinc-400">
          Earn yield on sBTC, STX, and USDCx. Borrow against your Bitcoin
          holdings with real-time oracle pricing and transparent on-chain rates.
        </p>

        <div className="flex items-center gap-4">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <a href="#how-it-works">How It Works</a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
