import "./index.css";
import { Composition } from "remotion";
import { LoaderAd } from "./LoaderAd";

// Each <Composition> is an entry in the Remotion sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 Widescreen High Definition Ad (1920x1080) @ 60 FPS */}
      <Composition
        id="InnoverLoaderAd-Widescreen"
        component={LoaderAd}
        durationInFrames={700} // 11.66s — 6-clip text intro + logo animation
        fps={60}              // buttery smooth frame rate
        width={1920}
        height={1080}
      />

      {/* 9:16 Mobile-First Vertical Ad (1080x1920) @ 60 FPS for Reels, TikToks, Shorts */}
      <Composition
        id="InnoverLoaderAd-Vertical"
        component={LoaderAd}
        durationInFrames={700} // 11.66s — 6-clip text intro + logo animation
        fps={60}              // buttery smooth frame rate
        width={1080}
        height={1920}
      />
    </>
  );
};
