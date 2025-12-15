"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteItem {
  text: string;
  source?: string;
  movie?: string;
}

interface QuotesProps {
  quotes: QuoteItem[];
  title?: string;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  };
  className?: string;
}

export function Quotes({ quotes, title, theme, className }: QuotesProps) {
  const primaryColor = theme?.colorPrimary || "hsl(var(--primary))";

  return (
    <section className={cn("py-12", className)}>
      {title && <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>}

      <div className="space-y-8 max-w-3xl mx-auto">
        {quotes.map((quote, index) => (
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-8 border-l-4"
            style={{ borderColor: primaryColor }}
          >
            <Quote
              className="absolute -left-3 -top-2 w-6 h-6"
              style={{ color: primaryColor }}
            />
            <p className="text-lg italic mb-2">&ldquo;{quote.text}&rdquo;</p>
            {(quote.source || quote.movie) && (
              <footer className="text-sm text-muted-foreground">
                {quote.source && <span className="font-medium">{quote.source}</span>}
                {quote.source && quote.movie && " — "}
                {quote.movie && <cite>{quote.movie}</cite>}
              </footer>
            )}
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
