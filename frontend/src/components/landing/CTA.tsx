"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-card border border-onloan-orange/20 bg-gradient-to-br from-onloan-orange/5 via-surface-card to-transparent p-12 sm:p-16 text-center"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-onloan-orange/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-onloan-deep/8 blur-[80px]" />
        <h2 className="relative text-3xl font-bold sm:text-4xl lg:text-5xl">
          Ready to earn yield on{" "}
          <span className="text-onloan-orange">Bitcoin</span>?
        </h2>
        <p className="relative mt-4 text-zinc-400 max-w-lg mx-auto text-lg">
          Join the lending protocol built for Bitcoin. No minimum deposits, no
          lockups, fully transparent on-chain rates.
        </p>
        <div className="relative mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <a href="#roadmap">View Roadmap</a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
