"use client";

import { motion } from "framer-motion";
import {
  Rocket,
  Shield,
  Vote,
  Coins,
  Globe,
  Layers,
  CheckCircle2,
  Clock,
  Lock,
} from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    title: "MVP Launch",
    status: "in-progress" as const,
    color: "text-onloan-orange",
    borderColor: "border-onloan-orange/40",
    bgColor: "bg-onloan-orange/5",
    glowColor: "shadow-onloan-orange/10",
    icon: Rocket,
    items: [
      "Core lending pool smart contracts",
      "sBTC, STX, and USDCx markets",
      "Pyth oracle integration for real-time pricing",
      "Supply, borrow, repay, and withdraw flows",
      "Health factor monitoring and liquidations",
      "Web dashboard with wallet connect",
    ],
  },
  {
    phase: "Phase 2",
    title: "Protocol Expansion",
    status: "upcoming" as const,
    color: "text-zinc-400",
    borderColor: "border-zinc-700",
    bgColor: "bg-surface-card",
    glowColor: "",
    icon: Layers,
    items: [
      "Variable and fixed rate lending modes",
      "Flash loan support",
      "Multi-collateral position management",
      "Advanced liquidation engine with bonus incentives",
      "Analytics dashboard with historical charts",
      "Mobile-responsive progressive web app",
    ],
  },
  {
    phase: "Phase 3",
    title: "Cross-Chain & DeFi",
    status: "upcoming" as const,
    color: "text-zinc-400",
    borderColor: "border-zinc-700",
    bgColor: "bg-surface-card",
    glowColor: "",
    icon: Globe,
    items: [
      "Cross-chain lending via bridge integrations",
      "Yield aggregation strategies",
      "Institutional API and SDK",
      "Insurance fund for protocol-level protection",
      "Partner integrations with Stacks DEXs",
      "Protocol revenue sharing with lenders",
    ],
  },
  {
    phase: "Phase 4",
    title: "Governance Token",
    status: "upcoming" as const,
    color: "text-zinc-400",
    borderColor: "border-zinc-700",
    bgColor: "bg-surface-card",
    glowColor: "",
    icon: Vote,
    items: [
      "LOAN governance token launch (SIP-010)",
      "DAO-controlled protocol parameters",
      "Community voting on new markets and risk params",
      "Staking rewards for LOAN holders",
      "Treasury management via governance proposals",
      "Fee distribution to token stakers",
    ],
  },
];

const statusIcons = {
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  "in-progress": <Clock className="h-4 w-4 text-onloan-orange animate-pulse" />,
  upcoming: <Lock className="h-4 w-4 text-zinc-600" />,
};

const statusLabels = {
  completed: "Completed",
  "in-progress": "In Progress",
  upcoming: "Upcoming",
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function Roadmap() {
  return (
    <section id="roadmap" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-onloan-orange/30 bg-onloan-orange/10 px-4 py-1.5 text-xs font-medium text-onloan-orange mb-4">
          <Coins className="h-3.5 w-3.5" />
          Roadmap
        </span>
        <h2 className="text-3xl font-bold sm:text-4xl">
          Building the Future of{" "}
          <span className="text-onloan-orange">Bitcoin Lending</span>
        </h2>
        <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
          From MVP lending markets to a fully governed DeFi protocol with its own
          governance token — here&apos;s where we&apos;re headed.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-onloan-orange/40 via-zinc-700 to-zinc-800 hidden lg:block" />

        <div className="grid gap-8 lg:gap-12">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.phase}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              className={`relative lg:grid lg:grid-cols-2 lg:gap-12 ${
                i % 2 === 0 ? "" : "lg:direction-rtl"
              }`}
            >
              <div
                className={`${i % 2 === 0 ? "lg:text-right" : "lg:col-start-2"}`}
              >
                <div
                  className={`rounded-card border ${phase.borderColor} ${phase.bgColor} p-6 transition-all hover:border-zinc-600 ${phase.glowColor ? `shadow-lg ${phase.glowColor}` : ""}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        phase.status === "in-progress"
                          ? "bg-onloan-orange/15"
                          : "bg-surface-hover"
                      }`}
                    >
                      <phase.icon
                        className={`h-5 w-5 ${
                          phase.status === "in-progress"
                            ? "text-onloan-orange"
                            : "text-zinc-500"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold tracking-widest uppercase ${phase.color}`}
                        >
                          {phase.phase}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs">
                          {statusIcons[phase.status]}
                          <span className="text-zinc-500">
                            {statusLabels[phase.status]}
                          </span>
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {phase.title}
                      </h3>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-zinc-400"
                      >
                        <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-zinc-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden lg:block">
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    phase.status === "in-progress"
                      ? "border-onloan-orange bg-onloan-orange/30"
                      : "border-zinc-600 bg-surface-primary"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
