import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// Playback is independent of accessibility visibility: decorative video and a
// visible, inert copy of a scrolling rail may still need to animate.
const MediaPlaybackSuspended = createContext(false);

export function MediaPlaybackProvider({ suspended, children }: { suspended: boolean; children: ReactNode }) {
  return <MediaPlaybackSuspended.Provider value={suspended}>{children}</MediaPlaybackSuspended.Provider>;
}

export function useMediaPlaybackSuspended(): boolean {
  return useContext(MediaPlaybackSuspended);
}
