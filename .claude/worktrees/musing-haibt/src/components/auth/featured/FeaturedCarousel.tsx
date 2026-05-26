"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingCart,
  Home,
  UserCircle,
  Briefcase,
  Truck,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Variants } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Find Trusted Service Providers",
    description:
      "Connect with qualified individuals for a wide range of services—from personal support to tutoring, errands, and more.",
    icon: <UserCircle className="h-10 w-10 text-sky-500 dark:text-sky-400" />,
    badge: "Popular",
    color: "from-sky-400/30 to-sky-600/30",
    darkColor: "dark:from-sky-500/40 dark:to-sky-700/40",
    badgeColor: "bg-sky-500 dark:bg-sky-600",
    accentColor: "bg-sky-400 dark:bg-sky-500",
  },
  {
    title: "Home Cleaning and Renovation",
    description:
      "Find trusted professionals to help with house cleaning, repairs, and renovation projects for a refreshed living space.",
    icon: (
      <ShoppingCart className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
    ),
    badge: "New",
    color: "from-emerald-400/30 to-emerald-600/30",
    darkColor: "dark:from-emerald-500/40 dark:to-emerald-700/40",
    badgeColor: "bg-emerald-500 dark:bg-emerald-600",
    accentColor: "bg-emerald-400 dark:bg-emerald-500",
  },

  {
    title: "Relocation & Setup Support",
    description:
      "Get assistance with moving, unpacking, home setup, and organizing your space—whether personal or professional.",
    icon: <Home className="h-10 w-10 text-amber-500 dark:text-amber-400" />,
    badge: "",
    color: "from-amber-400/30 to-amber-600/30",
    darkColor: "dark:from-amber-500/40 dark:to-amber-700/40",
    badgeColor: "bg-amber-500 dark:bg-amber-600",
    accentColor: "bg-amber-400 dark:bg-amber-500",
  },
  {
    title: "On-Demand Task Support",
    description:
      "Book assistants or service providers for professional, academic, administrative, or personal tasks quickly and easily.",
    icon: (
      <Briefcase className="h-10 w-10 text-violet-500 dark:text-violet-400" />
    ),
    badge: "Top Rated",
    color: "from-violet-400/30 to-violet-600/30",
    darkColor: "dark:from-violet-500/40 dark:to-violet-700/40",
    badgeColor: "bg-violet-500 dark:bg-violet-600",
    accentColor: "bg-violet-400 dark:bg-violet-500",
  },
  {
    title: "Quick Pickup & Delivery",
    description:
      "Effortlessly arrange pickups and deliveries for documents, items, or equipment—ideal for personal or business use.",
    icon: <Truck className="h-10 w-10 text-rose-500 dark:text-rose-400" />,
    badge: "Fast",
    color: "from-rose-400/30 to-rose-600/30",
    darkColor: "dark:from-rose-500/40 dark:to-rose-700/40",
    badgeColor: "bg-rose-500 dark:bg-rose-600",
    accentColor: "bg-rose-400 dark:bg-rose-500",
  },
  {
    title: "Doorstep Essentials Delivery",
    description:
      "Request delivery of groceries, tools, work materials, or supplies—whatever your profession or lifestyle needs.",
    icon: <Package className="h-10 w-10 text-amber-500 dark:text-amber-400" />,
    badge: "",
    color: "from-amber-400/30 to-amber-600/30",
    darkColor: "dark:from-amber-500/40 dark:to-amber-700/40",
    badgeColor: "bg-amber-500 dark:bg-amber-600",
    accentColor: "bg-amber-400 dark:bg-amber-500",
  },
];

const FeaturedCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
  }, []);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + features.length) % features.length
    );
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoPlay) {
      interval = setInterval(handleNext, 5000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, handleNext]);

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const variants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const currentFeature = features[currentIndex];

  return (
    <div className="flex flex-col h-full overflow-y-scroll justify-between relative p-4 hide-scrollbar w-full">
      {/* Header section */}
      <div className="text-center mb-4">
        <div className="mb-4 flex justify-center">
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 inline-flex items-center space-x-2 shadow-sm dark:shadow-md">
            <span className="h-2 w-2 rounded-full animate-pulse bg-teal-500 dark:bg-teal-400"></span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              Welcome to Errands mate
            </span>
          </div>
        </div>
        <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          Connect with{" "}
          <span className="text-teal-600 dark:text-teal-400">
            Essential Services
          </span>
        </h1>
        <p className="text-gray-700 dark:text-white/80 lg:text-lg max-w-2xl mx-auto font-light">
          Find reliable service providers in your community with just a few
          taps. Get help exactly when you need it.
        </p>
      </div>

      {/* Carousel section */}
      <div className="grow flex flex-col justify-center relative mb-4">
        <div className="relative h-64 sm:h-72 md:h-80 w-full max-w-3xl lg:max-w-4xl mx-auto">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
              }}
              className="absolute w-full h-full"
            >
              <Card className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white h-full overflow-hidden shadow-lg dark:shadow-2xl rounded-2xl">
                <div className="absolute inset-0 bg-linear-to-br from-black/5 to-transparent dark:from-black/30 dark:to-transparent z-0"></div>
                <div
                  className={`absolute top-0 right-0 w-full h-full bg-linear-to-br ${currentFeature.color} ${currentFeature.darkColor} opacity-70 backdrop-blur-3xl z-0`}
                ></div>

                <CardHeader className="pb-2 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md p-3 lg:p-4 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/20">
                      {currentFeature.icon}
                    </div>
                    {currentFeature.badge && (
                      <Badge
                        className={`${currentFeature.badgeColor} text-white px-2 py-0.5 lg:px-3 lg:py-1`}
                      >
                        {currentFeature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl lg:text-2xl mt-4 lg:mt-6 font-bold text-gray-900 dark:text-white">
                    {currentFeature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-700 dark:text-white/90 text-base lg:text-lg font-light">
                    {currentFeature.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex justify-between py-2 relative z-10">
                  <Button
                    variant="ghost"
                    className="text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm lg:text-base"
                  >
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="absolute -left-2 lg:-left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-lg hover:bg-white/90 dark:hover:bg-white/20 text-gray-700 dark:text-white shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/20 w-8 h-8 lg:w-10 lg:h-10"
              onClick={() => {
                handlePrev();
                setAutoPlay(false);
              }}
            >
              <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>
          <div className="absolute -right-2 lg:-right-4 top-1/2 transform -translate-y-1/2 z-10">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-lg hover:bg-white/90 dark:hover:bg-white/20 text-gray-700 dark:text-white shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/20 w-8 h-8 lg:w-10 lg:h-10"
              onClick={() => {
                handleNext();
                setAutoPlay(false);
              }}
            >
              <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="absolute top-0 right-0 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 text-gray-700 dark:text-white shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/20 z-20 w-6 h-6 lg:w-8 lg:h-8"
            onClick={toggleAutoPlay}
          >
            {autoPlay ? (
              <Pause className="h-3 w-3 lg:h-4 lg:w-4" />
            ) : (
              <Play className="h-3 w-3 lg:h-4 lg:w-4" />
            )}
          </Button>
        </div>

        <div className="flex justify-center mt-6 lg:mt-8 space-x-2">
          {features.map((_, index) => (
            <Button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? `w-6 lg:w-8 ${features[index].accentColor}`
                  : "w-2 bg-gray-300 dark:bg-white/20"
              }`}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
                setAutoPlay(false);
              }}
            />
          ))}
        </div>
      </div>

      {/* About section */}
      <div className="backdrop-blur-lg bg-linear-to-br from-white/80 to-white/90 dark:from-white/5 dark:to-white/10 p-4 lg:p-6 xl:p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold mb-3 lg:mb-4 text-gray-900 dark:text-white">
              Discover{" "}
              <span className="text-teal-600 dark:text-teal-400">
                Errands mate
              </span>
            </h2>
            <p className="text-gray-700 dark:text-white/80 text-sm leading-relaxed font-light">
              Errands Mate connects communities with professional and essential
              service workers. We create economic opportunities for providers
              while making everyday tasks easier and more convenient for
              clients.
            </p>

            <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-3">
              <Badge className="bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-white/90 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full backdrop-blur-md text-xs lg:text-sm">
                150+ Services
              </Badge>
              <Badge className="bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-white/90 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full backdrop-blur-md text-xs lg:text-sm">
                24/7 Availability
              </Badge>
              <Badge className="bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-white/90 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full backdrop-blur-md text-xs lg:text-sm">
                Fast Response
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 dark:text-white/60 text-xs lg:text-sm mt-3">
        © 2025 Errands mates. All rights reserved.
      </div>
    </div>
  );
};

export default FeaturedCarousel;
