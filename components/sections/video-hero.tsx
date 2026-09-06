"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface HeroVideoSpeaker {
  name: string;
  role: string;
}
interface Image {
  src: string;
  alt: string;
  srcDark?: string;
}
interface Button {
  text: string;
  url: string;
  icon?: React.ReactNode;
}
interface Buttons {
  primary?: Button;
  secondary?: Button;
}
interface Badge {
  text: string;
  announcement?: string;
  url?: string;
}

interface HeroVideoProps {
  className?: string;
  heading: string;
  description: string;
  buttons?: Buttons;
  badge?: Badge;
  inlineVideo?: { src: string };
  previewVideo?: { src: string };
  previewImage?: Image;
  speaker?: HeroVideoSpeaker;
  promoLine?: string;
}

interface VideoHeroProps extends HeroVideoProps {}
type Props = Partial<VideoHeroProps>;

const defaultProps: VideoHeroProps = {
  heading: "Presentation Platform for Marketing Professionals",
  description:
    "Effortlessly Create, Deliver, and Reimagine All-Hands Corporate Meetings",
  buttons: {
    primary: { text: "Try it firsthand", url: "#" },
    secondary: { text: "Schedule a demo", url: "#" },
  },
  badge: { text: "Customer Stories" },
  inlineVideo: {
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/video/1-16x9.mp4",
  },
  previewVideo: {
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/video/1-16x9.mp4",
  },
  previewImage: {
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/video/1-16x9-preview.jpg",
    alt: "Video preview",
  },
  promoLine: "Watch how we build an autonomous AI agent in only 5 minutes.",
};

const PROGRESS_RADIUS = 45;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

const VideoHero = (props: Props) => {
  const {
    badge,
    heading,
    description,
    buttons,
    previewImage,
    previewVideo,
    inlineVideo,
    speaker,
    promoLine,
    className,
  } = {
    ...defaultProps,
    ...props,
  };

  const stageSrc = previewVideo?.src ?? inlineVideo?.src;
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  const frameRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const syncProgress = () => {
    const video = videoRef.current;
    const circle = progressCircleRef.current;
    if (!video?.duration || !circle) return;
    circle.style.strokeDashoffset = `${PROGRESS_CIRCUMFERENCE * (1 - video.currentTime / video.duration)}`;
  };

  const startProgressLoop = () => {
    const tick = () => {
      syncProgress();
      frameRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  };

  const stopProgressLoop = () => {
    cancelAnimationFrame(frameRef.current);
    syncProgress();
  };

  useEffect(() => {
    if (videoRef.current && !videoRef.current.paused) {
      startProgressLoop();
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [stageSrc]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  return (
    <section className={cn("overflow-hidden bg-background", className)}>
      <div className="relative w-full">
        <div className="relative h-[60vh] min-h-[360px] w-full overflow-hidden md:h-[75vh] md:min-h-[420px]">
          {stageSrc ? (
            <video
              ref={videoRef}
              className="size-full object-cover object-center"
              src={stageSrc}
              poster={previewImage?.src}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              onPlay={() => {
                setIsPlaying(true);
                startProgressLoop();
              }}
              onPause={() => {
                setIsPlaying(false);
                stopProgressLoop();
              }}
              onLoadedMetadata={syncProgress}
            />
          ) : previewImage ? (
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="size-full object-cover object-center"
            />
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-4/5 bg-linear-to-t from-background from-30% via-background/90 via-55% to-transparent md:block"
          />
        </div>
        {stageSrc && (
          <div className="absolute top-4 right-4 z-20 size-14 md:top-6 md:right-6 md:size-16">
            <svg
              viewBox="0 0 100 100"
              aria-hidden
              className="pointer-events-none absolute inset-0 size-full -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r={PROGRESS_RADIUS}
                fill="none"
                strokeWidth="5"
                className="stroke-background/40"
              />
              <circle
                ref={progressCircleRef}
                cx="50"
                cy="50"
                r={PROGRESS_RADIUS}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={PROGRESS_CIRCUMFERENCE}
                strokeDashoffset={PROGRESS_CIRCUMFERENCE}
              />
            </svg>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={isPlaying ? "Pause video" : "Play video"}
              onClick={togglePlayback}
              className="absolute inset-1.5 size-auto rounded-full"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current md:size-6" />
              ) : (
                <Play className="size-5 fill-current md:size-6" />
              )}
            </Button>
          </div>
        )}
        <div className="relative z-10 border-t border-border bg-background py-6 md:absolute md:inset-x-0 md:bottom-0 md:border-0 md:bg-transparent md:py-8 lg:py-12">
          <div className="container mx-auto">
            <div className="grid gap-8 md:grid-cols-2 md:items-end md:gap-12">
              <div className="flex flex-col gap-4">
                {badge && (
                  <Badge variant="secondary" className="w-fit">
                    {badge.text}
                  </Badge>
                )}
                <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl lg:text-5xl">
                  {heading}
                </h1>
                {speaker && (
                  <p className="text-sm font-medium text-foreground">
                    {speaker.name}
                    <span className="text-muted-foreground md:text-foreground/80">
                      {" "}
                      · {speaker.role}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-5">
                {promoLine && (
                  <p className="text-sm font-medium text-foreground/80">
                    {promoLine}
                  </p>
                )}
                <p className="max-w-xl text-pretty text-foreground/80 md:text-lg md:font-medium">
                  {description}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {buttons?.primary && (
                    <Button asChild size="lg">
                      <a href={buttons.primary.url}>{buttons.primary.text}</a>
                    </Button>
                  )}
                  {buttons?.secondary && (
                    <Button asChild variant="outline" size="lg">
                      <a href={buttons.secondary.url}>
                        {buttons.secondary.text}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { VideoHero };
