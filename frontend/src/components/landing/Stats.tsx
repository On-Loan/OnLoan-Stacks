"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui";

const stats = [
  { label: "Total Value Locked", value: "$0.00" },
  { label: "Total Borrowed", value: "$0.00" },
  { label: "Active Lenders", value: "0" },
  { label: "Supported Assets", value: "3" },
];

export function Stats() {
  return (
    <section id="stats" className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="group transition-all hover:border-onloan-orange/30 hover:shadow-lg hover:shadow-onloan-orange/5">
              <CardContent className="flex flex-col items-center gap-2 px-8 py-8 text-center">
                <span className="text-3xl font-bold text-white group-hover:text-onloan-orange transition-colors">
                  {s.value}
                </span>
                <span className="text-sm text-zinc-500">{s.label}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
