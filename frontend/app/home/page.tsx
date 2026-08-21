"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Film, UsersRound, Swords, HelpCircle, Gem, Mail, Route } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

const categories = [
  {
    href: "/explore",
    label: "Explore",
    description: "Trace how any two characters connect",
    icon: Route,
    color: "#e23636",
    gradient: "from-red-500/20 to-orange-900/20",
  },
  {
    href: "/characters",
    label: "Characters",
    description: "Heroes, villains, and everyone in between",
    icon: Users,
    color: "#e23636",
    gradient: "from-red-500/20 to-red-900/20",
  },
  {
    href: "/movies",
    label: "Movies",
    description: "The complete MCU film saga",
    icon: Film,
    color: "#518cca",
    gradient: "from-blue-500/20 to-blue-900/20",
  },
  {
    href: "/teams",
    label: "Teams",
    description: "Avengers, Guardians, and more",
    icon: UsersRound,
    color: "#2ecc71",
    gradient: "from-green-500/20 to-green-900/20",
  },
  {
    href: "/battles",
    label: "Battles",
    description: "Epic confrontations that shaped the universe",
    icon: Swords,
    color: "#f0a500",
    gradient: "from-yellow-500/20 to-orange-900/20",
  },
  {
    href: "/quiz",
    label: "Know Your Hero",
    description: "Find out which hero you are",
    icon: HelpCircle,
    color: "#9b59b6",
    gradient: "from-purple-500/20 to-purple-900/20",
  },
  {
    href: "/antiques",
    label: "Antiques",
    description: "Powerful artifacts and relics",
    icon: Gem,
    color: "#e74c3c",
    gradient: "from-pink-500/20 to-red-900/20",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Get in touch with us",
    icon: Mail,
    color: "#3498db",
    gradient: "from-cyan-500/20 to-blue-900/20",
  },
];

export default function HomePage() {
  return (
    <PageWrapper>
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-4">
              <span className="text-[#e23636]">MARVEL</span>
              <span className="text-white/80"> MCU</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Your ultimate guide to the Marvel Cinematic Universe
            </p>
          </motion.div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link href={category.href}>
                  <div
                    className={`group relative h-48 rounded-2xl border border-border overflow-hidden bg-linear-to-br ${category.gradient} hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                  >
                    {/* Icon Background */}
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <category.icon
                        className="w-32 h-32"
                        style={{ color: category.color }}
                      />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}30` }}
                      >
                        <category.icon
                          className="w-7 h-7"
                          style={{ color: category.color }}
                        />
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-1 group-hover:text-white transition-colors">
                          {category.label}
                        </h2>
                        <p className="text-sm text-muted-foreground group-hover:text-white/70 transition-colors">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    {/* Hover Glow Effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${category.color}10 0%, transparent 70%)`,
                      }}
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
