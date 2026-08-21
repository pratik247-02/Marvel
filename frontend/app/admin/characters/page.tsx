"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { characterService } from "@/modules/characters";
import type { Character } from "@/types";

/** A character as returned by the list endpoint, plus the version field. */
type AdminCharacter = Character & { __v?: number };

interface FormState {
  name: string;
  alias: string;
  description: string;
  image: string;
}

const EMPTY_FORM: FormState = { name: "", alias: "", description: "", image: "" };

export default function AdminCharactersPage() {
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCharacter | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(
    null
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await characterService.getAll({ limit: 100, sort: "name" });
      setCharacters(response.data as AdminCharacter[]);
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Could not load characters",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsCreating(true);
    setMessage(null);
  };

  const openEdit = (character: AdminCharacter) => {
    setIsCreating(false);
    setEditing(character);
    setForm({
      name: character.name ?? "",
      alias: character.alias ?? "",
      description: character.description ?? "",
      image: character.image ?? "",
    });
    setMessage(null);
  };

  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Only send fields that have a value. The API rejects an empty string for
    // `image` because it validates as a URL.
    const payload: Record<string, string> = { name: form.name.trim() };
    for (const key of ["alias", "description", "image"] as const) {
      const value = form[key].trim();
      if (value) {
        payload[key] = value;
      }
    }

    try {
      if (editing) {
        // Send the version we read. If another admin saved in the meantime the
        // API returns 409 rather than silently overwriting their edit.
        await characterService.update(editing._id, {
          ...payload,
          expectedVersion: editing.__v ?? 0,
        } as Partial<Character>);
        setMessage({ kind: "ok", text: `Updated ${payload.name}` });
      } else {
        await characterService.create(payload as Partial<Character>);
        setMessage({ kind: "ok", text: `Created ${payload.name}` });
      }
      closeForm();
      await load();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Save failed";
      setMessage({
        kind: "error",
        // The 409 message from the API already explains what to do, so it is
        // surfaced as-is rather than replaced with something generic.
        text,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (character: AdminCharacter) => {
    if (!window.confirm(`Delete ${character.name}? This cannot be undone.`)) {
      return;
    }
    try {
      await characterService.delete(character._id);
      setMessage({ kind: "ok", text: `Deleted ${character.name}` });
      await load();
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const isFormOpen = isCreating || editing !== null;

  return (
    <Container className="py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${characters.length} in the library`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New character
        </Button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role={message.kind === "error" ? "alert" : "status"}
            className={`mb-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
              message.kind === "error"
                ? "border-destructive/40 bg-destructive/10"
                : "border-border bg-card"
            }`}
          >
            {message.kind === "error" && (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message.text}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-6 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">
                  {editing ? `Edit ${editing.name}` : "New character"}
                </h2>
                <Button variant="ghost" size="sm" onClick={closeForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name *
                  </span>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Alias
                  </span>
                  <Input
                    value={form.alias}
                    onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Image URL
                  </span>
                  <Input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://…"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>

                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editing ? "Save changes" : "Create"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={closeForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-border">
          {characters.map((character) => (
            <div
              key={character._id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{character.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {character.alias || "No alias"}
                  <span className="ml-2 text-xs opacity-60">v{character.__v ?? 0}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(character)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(character)}
                  aria-label={`Delete ${character.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </Container>
  );
}
