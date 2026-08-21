"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

export default function AdminHomePage() {
  return (
    <Container className="py-12">
      <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
      <p className="mb-8 text-muted-foreground">Manage the MCU content library.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/characters">
          <Card interactive className="p-6">
            <Users className="text-primary mb-3 h-6 w-6" />
            <h2 className="font-semibold">Characters</h2>
            <p className="text-sm text-muted-foreground">Create, edit and remove characters</p>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
