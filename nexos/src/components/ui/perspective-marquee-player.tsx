"use client";

import { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { PerspectiveMarquee, type PerspectiveMarqueeProps } from './remocn-perspective-marquee';

export interface PerspectiveMarqueePlayerProps {
  width: number;
  height: number;
  playing: boolean;
  inputProps: PerspectiveMarqueeProps;
}

export default function PerspectiveMarqueePlayer({ width, height, playing, inputProps }: PerspectiveMarqueePlayerProps) {
  const ref = useRef<PlayerRef>(null);
  const logoSize = inputProps.logoSize ?? 76;
  const pixelsPerFrame = (inputProps.pixelsPerFrame ?? 2) * (inputProps.speed ?? 1);
  const cycleWidth = (logoSize + Math.round(logoSize * .9)) * (inputProps.logos?.length ?? 0);
  const loopFrames = cycleWidth && pixelsPerFrame > 0 && Number.isInteger(cycleWidth / pixelsPerFrame)
    ? cycleWidth / pixelsPerFrame : 100000;
  useEffect(() => {
    if (playing) ref.current?.play();
    else ref.current?.pause();
  }, [playing]);

  return <Player
    ref={ref}
    component={PerspectiveMarquee}
    inputProps={inputProps}
    durationInFrames={Math.max(1, loopFrames)}
    compositionWidth={Math.max(1, Math.round(width))}
    compositionHeight={Math.max(1, Math.round(height))}
    fps={30}
    autoPlay={playing}
    loop
    controls={false}
    clickToPlay={false}
    doubleClickToFullscreen={false}
    spaceKeyToPlayOrPause={false}
    numberOfSharedAudioTags={0}
    style={{ width: '100%', height: '100%' }}
  />;
}
