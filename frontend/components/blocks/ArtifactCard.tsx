import Link from "next/link";
import Image from "next/image";
import { Gem } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ArtifactStatus } from "@/types";

/**
 * One artifact, as it appears on the antiques listing and on a character's
 * page.
 *
 * Extracted from app/antiques/page.tsx so the two surfaces cannot drift. The
 * character page previously rendered artifacts as small bordered links, which
 * made the same entity look like two different things depending on where you
 * met it.
 *
 * Note that no artifact currently carries an `image`, so the Gem fallback is
 * what actually renders - on both pages, which is the point.
 */

const STATUS_STYLES: Record<ArtifactStatus, string> = {
  active: "bg-green-500/20 text-green-400",
  destroyed: "bg-red-500/20 text-red-400",
  lost: "bg-yellow-500/20 text-yellow-400",
  unknown: "bg-gray-500/20 text-gray-400",
};

export interface ArtifactCardItem {
  _id: string;
  name: string;
  image?: string;
  status?: ArtifactStatus;
}

interface ArtifactCardProps {
  artifact: ArtifactCardItem;
  /** Passed to next/image; the listing prioritises its first row. */
  priority?: boolean;
  sizes?: string;
}

export function ArtifactCard({
  artifact,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: ArtifactCardProps) {
  return (
    <Link href={`/antiques/${artifact._id}`}>
      <Card interactive className="group h-full overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          {artifact.image ? (
            <Image
              src={artifact.image}
              alt={artifact.name}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-red-500/20 to-orange-500/20">
              <Gem className="h-16 w-16 text-red-400/50" />
            </div>
          )}
          {artifact.status && (
            <div className="absolute top-2 right-2">
              <Badge className={STATUS_STYLES[artifact.status] ?? ""}>
                {artifact.status}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="group-hover:text-primary line-clamp-1 text-lg font-semibold transition-colors">
            {artifact.name}
          </h3>
        </div>
      </Card>
    </Link>
  );
}
