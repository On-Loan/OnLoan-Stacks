"use client";

import { motion } from "framer-motion";
import { Wallet, ArrowDownUp, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    step: "01",
    title: "Connect Wallet",
    description:
      "Link your Stacks wallet to access the protocol. Your keys, your assets.",
  },
  {
    icon: ArrowDownUp,
    step: "02",
    title: "Supply or Borrow",
    description:
      "Deposit sBTC, STX, or USDCx to earn yield — or borrow against your collateral instantly.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Earn & Manage",
    description:
      "Track your positions, monitor health factors, and withdraw anytime with no lockups.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative mx-auto max-w-6xl px-6 py-24"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-onloan-orange/[0.03] blur-[100px]" />
      </div>

      <div className="mb-14 text-center">
        <span className="inline-flex items-center rounded-full border border-zinc-700 bg-surface-card px-4 py-1.5 text-xs font-medium text-zinc-400 mb-4">
          Get Started
        </span>
        <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
        <p className="mt-3 text-zinc-400">
          Three simple steps to start lending or borrowing on Bitcoin.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="group relative flex flex-col items-center text-center rounded-card border border-zinc-800 bg-surface-card/50 p-8 transition-all hover:border-onloan-orange/20 hover:bg-surface-card"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-onloan-orange/10 group-hover:bg-onloan-orange/20 transition-colors mb-5">
              <s.icon className="h-6 w-6 text-onloan-orange" />
            </div>
            <span className="text-xs font-bold text-onloan-orange/60 tracking-widest uppercase mb-2">
              Step {s.step}
            </span>
            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 max-w-xs">
              {s.description}
            </p>

            {i < steps.length - 1 && (
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block z-10">
                <ArrowRight className="h-4 w-4 text-zinc-600" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
