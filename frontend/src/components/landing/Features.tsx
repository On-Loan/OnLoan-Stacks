"use client";

import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

const features = [
  {
    icon: Shield,
    title: "Bitcoin-Secured",
    description:
      "All lending is settled on Bitcoin via Stacks, giving you the security of the most trusted blockchain.",
  },
  {
    icon: Zap,
    title: "Real-Time Oracle Pricing",
    description:
      "Pyth Network integration delivers sub-second price feeds for accurate collateral valuations.",
  },
  {
    icon: BarChart3,
    title: "Transparent Rates",
    description:
      "Interest rates are dynamically calculated on-chain based on pool utilization. No hidden fees.",
  },
  {
    icon: Coins,
    title: "Multi-Asset Support",
    description:
      "Supply and borrow sBTC, STX, and USDCx with independent risk parameters for each asset.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 text-center">
        <span className="inline-flex items-center rounded-full border border-zinc-700 bg-surface-card px-4 py-1.5 text-xs font-medium text-zinc-400 mb-4">
          Core Features
        </span>
        <h2 className="text-3xl font-bold sm:text-4xl">
          Why <span className="text-onloan-orange">OnLoan</span>?
        </h2>
        <p className="mt-3 text-zinc-400">
          A lending protocol designed for Bitcoin holders.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <Card className="group h-full transition-all hover:border-onloan-orange/20 hover:shadow-lg hover:shadow-onloan-orange/5">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-onloan-orange/10 group-hover:bg-onloan-orange/20 transition-colors">
                  <f.icon className="h-5 w-5 text-onloan-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {f.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
