import React from "react";
import type { Appearance, RoleId } from "@/engine/types";
import { DoodleCat } from "./DoodleCat";
import { ClanCat } from "./ClanCat";

interface Props {
  appearance: Appearance;
  cosmetics?: string[];
  size?: number;
  role?: RoleId;
  dimmed?: boolean;
  turned?: boolean;
}

// When a role is supplied, render Aina's hand-drawn art for that role, recoloured
// by the player's chosen colour/pattern. Otherwise fall back to the generic cat.
export function CatPortrait({ appearance, cosmetics = [], size = 72, role, dimmed, turned }: Props) {
  if (role) {
    return <ClanCat role={role} appearance={appearance} cosmetics={cosmetics} size={size} dimmed={dimmed} turned={turned} />;
  }
  return <DoodleCat appearance={appearance} cosmetics={cosmetics} size={size} action="idle" dimmed={dimmed} turned={turned} />;
}
