import React from "react";
import type { RoleId } from "@/engine/types";
import { DoodleCat, type DoodleCatProps, type DoodleAction } from "./DoodleCat";
import { ClanCat } from "./ClanCat";

export type SpriteAction = DoodleAction;

// When a role is supplied, render Aina's hand-drawn art for that role, recoloured
// by the player's chosen colour/pattern. Otherwise fall back to the generic cat.
export function CatSprite({ role, ...props }: DoodleCatProps & { role?: RoleId }) {
  if (role) {
    return (
      <ClanCat
        role={role}
        appearance={props.appearance}
        cosmetics={props.cosmetics}
        size={props.size}
        dimmed={props.dimmed}
        turned={props.turned}
        facing={props.facing}
      />
    );
  }
  return <DoodleCat {...props} />;
}
