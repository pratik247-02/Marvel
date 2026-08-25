"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Github, Twitter, MessageSquare } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { APP_CONFIG } from "@/config";

/** Where Web3Forms accepts submissions. The key identifies the form. */
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

/** Message length below which a note is not worth sending. */
const MESSAGE_MIN = 30;

type FieldName = "name" | "email" | "subject" | "message";

/** Focus order, used to jump to the first invalid field on submit. */
const FIELD_ORDER: FieldName[] = ["name", "email", "subject", "message"];

/**
 * Deliberately permissive email check.
 *
 * Anything stricter rejects addresses that are perfectly valid - plus
 * addressing, new TLDs, quoted local parts - and the only way to truly know an
 * address works is to send to it. This catches the typos worth catching
 * (missing @, missing domain, trailing dot) and leaves the rest alone.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function validateField(field: FieldName, raw: string): string | undefined {
  const value = raw.trim();

  switch (field) {
    case "name":
      return value ? undefined : "Your name is required.";

    case "email":
      if (!value) {
        return "An email address is required.";
      }
      return EMAIL.test(value) ? undefined : "That does not look like an email address.";

    case "subject":
      // Optional by design - a message does not need a headline.
      return undefined;

    case "message":
      if (!value) {
        return "A message is required.";
      }
      return value.length < MESSAGE_MIN
        ? `Please write at least ${MESSAGE_MIN} characters — that is ${MESSAGE_MIN - value.length} more.`
        : undefined;
  }
}

/** Every error at once, for submit. */
function validateAll(data: Record<FieldName, string>) {
  const found: Partial<Record<FieldName, string>> = {};
  for (const field of FIELD_ORDER) {
    const error = validateField(field, data[field]);
    if (error) {
      found[field] = error;
    }
  }
  return found;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  /** Fields the user has left, so errors appear on blur rather than mid-typing. */
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "unconfigured">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Re-validate as they type, but only once the field has been blurred -
    // so a message being typed does not read as an error at 3 characters,
    // while a corrected field clears its error immediately.
    if (touched[name as FieldName]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name as FieldName, value),
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as FieldName, value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Read the honeypot from the form itself rather than assuming it is
    // empty - the whole point is that a bot may have filled it.
    const botcheck = new FormData(e.currentTarget).get("botcheck");

    const found = validateAll(formData);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setTouched({ name: true, email: true, subject: true, message: true });
      // Move focus to the first problem so the error is announced and the
      // user is not left hunting for what blocked the submit.
      const first = FIELD_ORDER.find((f) => found[f]);
      if (first) {
        document.getElementById(first)?.focus();
      }
      return;
    }

    // Without a key there is nowhere to send this. Say so rather than
    // reporting a success - a form that silently discards messages while
    // thanking you for them is worse than no form.
    if (!APP_CONFIG.web3formsKey) {
      setSubmitStatus("unconfigured");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: APP_CONFIG.web3formsKey,
          name: formData.name.trim(),
          email: formData.email.trim(),
          // Web3Forms uses `subject` as the email's subject line, so an empty
          // one would arrive blank. Fall back to something identifying.
          subject: formData.subject.trim() || `New message from ${formData.name.trim()}`,
          message: formData.message.trim(),
          // Where it came from, since this key may outlive this one site.
          from_name: "MCU Hub contact form",
          // The honeypot as actually submitted. Web3Forms rejects the message
          // when this is truthy, which is the point of sending it through
          // rather than hardcoding `false`.
          botcheck: Boolean(botcheck),
        }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json().catch(() => null);

      // Web3Forms signals failure in the body, not only the status, so a 200
      // with `success: false` still has to be treated as an error.
      if (!response.ok || !result?.success) {
        setSubmitStatus("error");
        return;
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setErrors({});
      setTouched({});
      setTimeout(() => setSubmitStatus("idle"), 6000);
    } catch {
      // Network failure, timeout, or the request being aborted.
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLength = formData.message.trim().length;

  const socialLinks = [
    { icon: Github, label: "GitHub", href: "#", color: "#333" },
    { icon: Twitter, label: "Twitter", href: "#", color: "#1DA1F2" },
    { icon: MessageSquare, label: "Discord", href: "#", color: "#5865F2" },
  ];

  return (
    <PageWrapper>
      <Container className="py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Contact
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Have questions, suggestions, or want to report an issue? I&apos;d
            love to hear from you.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-500" />
                Send me a message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                      Name <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-required="true"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={errors.name ? "border-destructive" : undefined}
                    />
                    <FieldError id="name-error" message={errors.name} />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                      Email <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-required="true"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={errors.email ? "border-destructive" : undefined}
                    />
                    <FieldError id="email-error" message={errors.email} />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-medium">
                    Subject{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What's this about?"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <label htmlFor="message" className="block text-sm font-medium">
                      Message <span className="text-primary">*</span>
                    </label>
                    {/* A live count, so the minimum is something you can see
                        yourself meeting rather than a rule you trip over on
                        submit. */}
                    <span
                      className={`text-xs tabular-nums ${
                        messageLength > 0 && messageLength < MESSAGE_MIN
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {messageLength < MESSAGE_MIN
                        ? `${messageLength} / ${MESSAGE_MIN}`
                        : `${messageLength} characters`}
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell me what's on your mind..."
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-required="true"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    className={`bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary w-full resize-none rounded-md border px-4 py-3 transition-colors focus:ring-2 focus:outline-none ${
                      errors.message ? "border-destructive" : "border-border"
                    }`}
                  />
                  <FieldError id="message-error" message={errors.message} />
                </div>

                {/* Honeypot. Hidden from people, visible to bots that fill
                    every field they find - Web3Forms rejects any submission
                    where this arrives non-empty. `tabIndex={-1}` and
                    `autoComplete="off"` keep it out of the way of keyboard
                    users and password managers. */}
                <input
                  type="checkbox"
                  name="botcheck"
                  className="hidden"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </Button>

                {/* One live region for all outcomes, so a screen reader
                    announces the result of the submit it just made. */}
                <div aria-live="polite" className="empty:hidden">
                  {submitStatus === "success" && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center font-medium text-green-500"
                    >
                      Message sent. I&apos;ll get back to you soon.
                    </motion.p>
                  )}

                  {submitStatus === "error" && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-center font-medium"
                    >
                      That didn&apos;t send. Please try again, or email me
                      directly at{" "}
                      <a
                        href="mailto:rajepratik2407@gmail.com"
                        className="underline underline-offset-2"
                      >
                        rajepratik2407@gmail.com
                      </a>
                      .
                    </motion.p>
                  )}

                  {/* Only reachable on a build with no key configured - a
                      fresh clone, or a deploy missing the env var. */}
                  {submitStatus === "unconfigured" && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-center font-medium"
                    >
                      This form is not configured to send yet. Please email me
                      at{" "}
                      <a
                        href="mailto:rajepratik2407@gmail.com"
                        className="underline underline-offset-2"
                      >
                        rajepratik2407@gmail.com
                      </a>
                      .
                    </motion.p>
                  )}
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            {/* About */}
            <Card className="p-6 md:p-8">
              <h2 className="mb-4 text-2xl font-bold">About MCU Hub</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                A full catalogue of the Marvel Cinematic Universe — every film,
                character, team, battle and artifact — with a graph engine
                underneath that connects them all.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This project is a fan-made tribute to the incredible Marvel Universe.
                All character names, images, and related content are property of Marvel Studios.
              </p>
            </Card>

            {/* Social Links */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Connect With Us</h2>
              <div className="flex flex-wrap gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors group"
                  >
                    <social.icon
                      className="w-5 h-5 transition-colors"
                      style={{ color: social.color }}
                    />
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {social.label}
                    </span>
                  </a>
                ))}
              </div>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Quick Help</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Found a bug? Let us know in the message!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Missing a character or movie? We're always adding more content.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Want to contribute? Check out our GitHub repository.</span>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </Container>
    </PageWrapper>
  );
}

/**
 * One field's validation message.
 *
 * `role="alert"` so a screen reader announces it when it appears, and the id
 * matches the input's `aria-describedby` so the message is associated with
 * the field rather than floating near it.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} role="alert" className="text-destructive mt-1.5 text-sm">
      {message}
    </p>
  );
}
