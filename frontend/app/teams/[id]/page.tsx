"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Appearances } from "@/components/blocks/Appearances";
import { FactList } from "@/components/blocks/FactList";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useTeam } from "@/modules/teams";
import { Users, Crown, MapPin, Calendar } from "lucide-react";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default function TeamPage({ params }: TeamPageProps) {
  const { id } = use(params);
  const { team, isLoading, error } = useTeam(id);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Skeleton className="w-full h-[60vh]" />
        </div>
        <Container className="py-16">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !team) {
    return (
      <PageWrapper>
        <Container className="py-32 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-4">Team not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load team"}</p>
        </Container>
      </PageWrapper>
    );
  }

  const facts = [
    team.headquarters && { label: "Headquarters", value: team.headquarters },
    team.founded && { label: "Founded", value: team.founded },
    team.status && { label: "Status", value: team.status },
    team.members?.length && { label: "Members", value: team.members.length.toString() },
    team.appearances?.length && { label: "Movie Appearances", value: team.appearances.length.toString() },
  ].filter(Boolean) as { label: string; value: string }[];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "disbanded":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "reformed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <PageWrapper>
      <HeroBanner
        title={team.name}
        description={team.description}
        image={team.image}
        theme={team.theme || { colorPrimary: "#2ecc71" }}
      />

      <Container className="py-16">
        {/* Status & Quick Info */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {team.status && (
            <Badge className={`${getStatusColor(team.status)} text-sm`}>
              {team.status}
            </Badge>
          )}
          {team.headquarters && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {team.headquarters}
            </span>
          )}
          {team.founded && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Founded: {team.founded}
            </span>
          )}
        </div>

        {/* Facts */}
        {facts.length > 0 && <FactList facts={facts} columns={4} />}

        {/* Leaders Section */}
        {team.leaders && team.leaders.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Leaders
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {team.leaders.map((leader) => (
                <Link key={leader._id} href={`/characters/${leader._id}`}>
                  <Card className="group overflow-hidden hover:border-yellow-500/50 transition-colors">
                    <div className="relative aspect-square overflow-hidden">
                      {leader.image ? (
                        <Image
                          src={leader.image}
                          alt={leader.name}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-3xl font-bold text-muted-foreground">
                            {leader.name[0]}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Crown className="w-5 h-5 text-yellow-500 drop-shadow-lg" />
                      </div>
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold group-hover:text-yellow-500 transition-colors line-clamp-1">
                        {leader.name}
                      </h3>
                      {leader.alias && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {leader.alias}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Members Section */}
        {team.members && team.members.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" />
              Members
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {team.members.map((member) => (
                <Link key={member._id} href={`/characters/${member._id}`}>
                  <Card className="group overflow-hidden hover:border-green-500/50 transition-colors">
                    <div className="relative aspect-square overflow-hidden">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {member.name[0]}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm group-hover:text-green-500 transition-colors line-clamp-1">
                        {member.name}
                      </h3>
                      {member.alias && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {member.alias}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Movie Appearances */}
        {team.appearances && team.appearances.length > 0 && (
          <Appearances
            movies={team.appearances.map((movie) => ({
              _id: movie._id,
              id: movie._id,
              title: movie.title,
              releaseYear: movie.releaseYear,
              phase: movie.phase,
              poster: movie.poster,
            }))}
          />
        )}
      </Container>
    </PageWrapper>
  );
}
