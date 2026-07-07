import type { ComponentType } from "react";
import Hero from "./hero";
import Trailer from "./trailer";
import HowToPlay from "./how-to-play";
import Gallery from "./gallery";
import AdditionalInfo from "./additional-info";
import Versions from "./versions";
import Faq from "./faq";

// Maps a section "type" from a game JSON to its component. New custom
// sections only need a file here plus an entry in this map.
export const SECTIONS: Record<string, ComponentType<any>> = {
  hero: Hero,
  trailer: Trailer,
  "how-to-play": HowToPlay,
  gallery: Gallery,
  "additional-info": AdditionalInfo,
  versions: Versions,
  faq: Faq,
};
