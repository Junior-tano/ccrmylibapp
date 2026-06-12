"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { PodcastCard } from "@/components/library/podcast-card";
import { VideoCard } from "@/components/library/video-card";
import { BookCard } from "@/components/library/book-card";
import { HeroSlider } from "@/components/library/hero-slider";
import { Mic, Video, BookOpen, Book, ArrowRight } from "lucide-react";

export default function HomePage() {
  // ✅ Lecture depuis le store (réactif aux changements du back-office)
  const podcasts = useStore((state) => state.podcasts);
  const videos = useStore((state) => state.videos);
  const ebooks = useStore((state) => state.ebooks);
  const physicalBooks = useStore((state) => state.physicalBooks);

  const featuredPodcasts = podcasts.slice(0, 6);
  const featuredVideos = videos.slice(0, 6);
  const featuredEbooks = ebooks.slice(0, 6);
  const featuredBooks = physicalBooks.slice(0, 6);

  return (
    <div>
      <HeroSlider />

      <section className="py-14 border-b bg-background -mt-6 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/podcasts" className="group">
              <Card className="h-full border border-border bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Podcasts</h3>
                  <p className="text-sm text-muted-foreground mt-1">{podcasts.length} audios disponibles</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/videos" className="group">
              <Card className="h-full border border-border bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition">
                    <Video className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">Videos</h3>
                  <p className="text-sm text-muted-foreground mt-1">{videos.length} videos disponibles</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/ebooks" className="group">
              <Card className="h-full border border-border bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">E-books</h3>
                  <p className="text-sm text-muted-foreground mt-1">{ebooks.length} e-books disponibles</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/livres" className="group">
              <Card className="h-full border border-border bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition">
                    <Book className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">Livres</h3>
                  <p className="text-sm text-muted-foreground mt-1">{physicalBooks.length} livres disponibles</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Derniers Podcasts</h2>
              <p className="text-muted-foreground">Enseignements et temoignages audio</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex" asChild>
              <Link href="/podcasts">Voir tout <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featuredPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Enseignements</h2>
              <p className="text-muted-foreground">Predications et formations</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex" asChild>
              <Link href="/videos">Voir tout <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featuredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">E-books</h2>
              <p className="text-muted-foreground">Livres numeriques a telecharger</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex" asChild>
              <Link href="/ebooks">Voir tout <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featuredEbooks.map((ebook) => (
              <BookCard key={ebook.id} book={ebook} type="ebook" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Livres Physiques</h2>
              <p className="text-muted-foreground">A commander et recevoir chez vous</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex" asChild>
              <Link href="/livres">Voir tout <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} type="physical" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Besoin d&apos;aide spirituelle ?</h2>
            <p className="text-primary-foreground/80 mb-4 text-sm">Notre equipe pastorale est disponible pour vous accompagner.</p>
            <Button size="sm" variant="secondary" className="px-5 py-2 shadow-sm hover:shadow-md transition-all" asChild>
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
