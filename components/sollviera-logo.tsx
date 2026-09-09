import React from 'react';
import Svg, { Rect, Circle, ClipPath, Defs, G } from 'react-native-svg';

export function SollvieraLogo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <ClipPath id="sollviera-sun-clip">
          <Circle cx={50} cy={50} r={46} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#sollviera-sun-clip)">
        <Rect x={0} y={4} width={100} height={15} fill="#E4762B" />
        <Rect x={0} y={22} width={100} height={15} fill="#E4762B" />
        <Rect x={0} y={40} width={100} height={15} fill="#C2410C" />
        <Rect x={0} y={58} width={100} height={15} fill="#A93A0C" />
        <Rect x={0} y={76} width={100} height={20} fill="#881B04" />
      </G>
    </Svg>
  );
}
