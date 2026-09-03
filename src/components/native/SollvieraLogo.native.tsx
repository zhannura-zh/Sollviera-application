import React from 'react';
import Svg, { Path, G, Rect } from 'react-native-svg';

interface SollvieraLogoProps {
  size?: number;
  color?: string;
}

export const SollvieraLogo: React.FC<SollvieraLogoProps> = ({ 
  size = 28, 
  color = '#241E1A' 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="20" fill="#FAF7F3" />
      <G transform="translate(15, 15) scale(0.7)">
        <Path
          d="M50 5 L85 25 L85 65 L50 95 L15 65 L15 25 Z"
          stroke={color}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <Path
          d="M50 15 L50 85 M20 40 L80 40 M20 60 L80 60"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};
