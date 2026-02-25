import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        ar?: boolean;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        orientation?: string;
        "rotation-per-second"?: string;
        "camera-orbit"?: string;
        "camera-target"?: string;
        "field-of-view"?: string;
        "shadow-intensity"?: string;
        exposure?: string;
        loading?: "auto" | "eager" | "lazy";
        "disable-zoom"?: boolean;
        "interaction-prompt"?: "none" | "auto";
      };
    }
  }
}

export {};
