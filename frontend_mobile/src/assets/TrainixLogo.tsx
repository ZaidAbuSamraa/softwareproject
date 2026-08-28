import React from 'react';
import Svg, { Line, Circle } from 'react-native-svg';

interface TrainixLogoProps {
  size?: number;
}

// Vector "connected path" mark — replaces the old raster logo that had the
// previous product name baked into the image pixels (couldn't be text-edited).
const TrainixLogo: React.FC<TrainixLogoProps> = ({ size = 140 }) => {
  const white = '#ffffff';
  const blue = '#60a5fa';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Top chain */}
      <Line x1={18} y1={72} x2={34} y2={56} stroke={white} strokeWidth={4} strokeLinecap="round" />
      <Line x1={34} y1={56} x2={50} y2={34} stroke={white} strokeWidth={4} strokeLinecap="round" />
      <Line x1={50} y1={34} x2={62} y2={22} stroke={blue} strokeWidth={4} strokeLinecap="round" />
      <Line x1={62} y1={22} x2={72} y2={34} stroke={blue} strokeWidth={4} strokeLinecap="round" />

      {/* Bottom chain (point-mirrored) */}
      <Line x1={82} y1={28} x2={66} y2={44} stroke={white} strokeWidth={4} strokeLinecap="round" />
      <Line x1={66} y1={44} x2={50} y2={66} stroke={white} strokeWidth={4} strokeLinecap="round" />
      <Line x1={50} y1={66} x2={38} y2={78} stroke={blue} strokeWidth={4} strokeLinecap="round" />
      <Line x1={38} y1={78} x2={28} y2={66} stroke={blue} strokeWidth={4} strokeLinecap="round" />

      <Circle cx={18} cy={72} r={7} fill={white} />
      <Circle cx={34} cy={56} r={7} fill={white} />
      <Circle cx={50} cy={34} r={8} fill={white} />
      <Circle cx={62} cy={22} r={7} fill={blue} />
      <Circle cx={72} cy={34} r={6} fill={blue} />

      <Circle cx={82} cy={28} r={7} fill={white} />
      <Circle cx={66} cy={44} r={7} fill={white} />
      <Circle cx={50} cy={66} r={8} fill={white} />
      <Circle cx={38} cy={78} r={7} fill={blue} />
      <Circle cx={28} cy={66} r={6} fill={blue} />
    </Svg>
  );
};

export default TrainixLogo;
