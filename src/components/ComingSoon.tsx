/* system/src/components/ComingSoon.tsx
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as s from "./ComingSoon.css";
import {
  Construction,
  Sparkles,
  Palette,
  Zap,
  ShieldCheck,
  type LucideIcon,
  ArrowLeft,
} from "lucide-react";
import { Github } from "@/components/icons";

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  showBackButton?: boolean;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description,
  icon: IconComponent = Construction,
  showBackButton = true,
}) => {
  const pathname = usePathname();

  // Default title based on route
  const getDefaultTitle = () => {
    if (title) return title;

    const path = pathname ?? "";
    if (path.includes("/pet")) return "Pet Dashboard";
    if (path.includes("/owner")) return "Owner Features";
    if (path.includes("/admin")) return "Admin Feature";
    if (path.includes("/user")) return "User Feature";

    return "New Feature";
  };

  // Default description
  const getDefaultDescription = () => {
    if (description) return description;
    return "We're working hard to bring you this feature. Check back soon!";
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <Card className={s.cardBorder}>
          <CardHeader className={cn(s.headerCenter)}>
            {/* Animated Icon */}
            <div className={s.iconWrap}>
              <IconComponent className={s.icon} />
            </div>

            {/* Title */}
            <div className={s.titleBlock}>
              <CardTitle className={s.title}>{getDefaultTitle()}</CardTitle>
              <CardDescription className={s.subtitle}>Coming Soon</CardDescription>
            </div>
          </CardHeader>

          <CardContent className={s.content}>
            {/* Description */}
            <p className={s.description}>{getDefaultDescription()}</p>

            {/* Progress Indicator */}
            <div className={s.progressBlock}>
              <div className={s.progressLabels}>
                <span className={s.progressMuted}>Development Progress</span>
                <span className={s.progressActive}>In Progress...</span>
              </div>
              <div className={s.progressTrack}>
                <div className={s.progressBar} style={{ width: "35%" }} />
              </div>
            </div>

            {/* Feature Highlights */}
            <div className={s.featuresBox}>
              <h3 className={s.featuresTitle}>What to Expect</h3>
              <div className={s.featuresGrid}>
                <div className={s.featureItem}>
                  <Sparkles className={s.featureIcon} />
                  <span className={s.featureText}>New features and functionality</span>
                </div>
                <div className={s.featureItem}>
                  <Palette className={s.featureIcon} />
                  <span className={s.featureText}>Beautiful, intuitive design</span>
                </div>
                <div className={s.featureItem}>
                  <Zap className={s.featureIcon} />
                  <span className={s.featureText}>Fast and responsive</span>
                </div>
                <div className={s.featureItem}>
                  <ShieldCheck className={s.featureIcon} />
                  <span className={s.featureText}>Secure and reliable</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={s.actions}>
              {showBackButton && (
                <Button variant="outline" size="lg" asChild>
                  <Link href="/">
                    <ArrowLeft className={s.btnIcon} />
                    Back to Home
                  </Link>
                </Button>
              )}

              <Button size="lg" asChild>
                <a
                  href="https://codeberg.org/clove/web/src/branch/main/system"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className={s.btnIcon} />
                  Request Feature
                </a>
              </Button>
            </div>

            {/* Additional Info */}
            <div className={s.footerBlock}>
              <p className={s.footerText}>
                Want to stay updated?{" "}
                <a
                  href="https://doughmination.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.footerLink}
                >
                  Visit the Homepage
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComingSoon;
