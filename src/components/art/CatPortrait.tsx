import React from "react";
import type { Appearance } from "@/engine/types";
import { DoodleCat } from "./DoodleCat";

interface Props {
  appearance: Appearance;
  cosmetics?: string[];
  size?: number;
  dimmed?: boolean;
  turned?: boolean;
}

// Portraits now use the same hand-drawn doodle cat as the sprites, so the whole
// game shares one consistent, sketch-style look.
export function CatPortrait({ appearance, cosmetics = [], size = 72, dimmed, turned }: Props) {
  return (
    <DoodleCat
      appearance={appearance}
      cosmetics={cosmetics}
      size={size}
      action="idle"
      dimmed={dimmed}
      turned={turned}
    />
  );
}
