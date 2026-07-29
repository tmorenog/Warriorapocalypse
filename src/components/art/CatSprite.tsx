import React from "react";
import { DoodleCat, type DoodleCatProps, type DoodleAction } from "./DoodleCat";

// Cat sprites use the hand-drawn "doodle" style (see DoodleCat).
export type SpriteAction = DoodleAction;

export function CatSprite(props: DoodleCatProps) {
  return <DoodleCat {...props} />;
}
