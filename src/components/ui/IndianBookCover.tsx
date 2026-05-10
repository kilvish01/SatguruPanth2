import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
} from 'react-native-svg';

interface IndianBookCoverProps {
  title: string;
  width: number;
  height: number;
  borderRadius?: number;
}

const PALETTES = [
  { bg1: '#7A1F2C', bg2: '#5C1419', accent: '#E5B53E', text: '#FFF6DA', name: 'maroon' },
  { bg1: '#D86B0E', bg2: '#A04A05', accent: '#FFE9B0', text: '#FFF6DA', name: 'saffron' },
  { bg1: '#1F3A5F', bg2: '#0F1F38', accent: '#E5B53E', text: '#FFF6DA', name: 'indigo' },
  { bg1: '#2D5742', bg2: '#173024', accent: '#F0D58A', text: '#FFF6DA', name: 'forest' },
  { bg1: '#5C1E2C', bg2: '#360F1A', accent: '#F2C580', text: '#FFE8D0', name: 'wine' },
  { bg1: '#8B5A2B', bg2: '#4F300F', accent: '#FFE9B0', text: '#FFF6DA', name: 'bronze' },
  { bg1: '#3A2218', bg2: '#1A0E08', accent: '#E5B53E', text: '#F5E6C0', name: 'sepia' },
  { bg1: '#4A2545', bg2: '#28102A', accent: '#F0C76A', text: '#FFE8DA', name: 'plum' },
  { bg1: '#2A4A4F', bg2: '#0F2226', accent: '#E5B53E', text: '#E8F5F0', name: 'teal' },
];

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const Ornament: React.FC<{ x: number; y: number; size: number; color: string; rotation?: number }> = ({
  x,
  y,
  size,
  color,
  rotation = 0,
}) => {
  const s = size;
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <Path
        d={`M 0 ${-s} Q ${s * 0.3} ${-s * 0.3} ${s} 0 Q ${s * 0.3} ${s * 0.3} 0 ${s} Q ${-s * 0.3} ${s * 0.3} ${-s} 0 Q ${-s * 0.3} ${-s * 0.3} 0 ${-s} Z`}
        fill={color}
        opacity={0.85}
      />
      <Circle cx={0} cy={0} r={s * 0.2} fill={color} />
    </G>
  );
};

const LotusMandala: React.FC<{ cx: number; cy: number; r: number; color: string }> = ({
  cx,
  cy,
  r,
  color,
}) => {
  const petals = 8;
  return (
    <G>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * 360) / petals;
        return (
          <G key={i} transform={`rotate(${angle}, ${cx}, ${cy})`}>
            <Path
              d={`M ${cx} ${cy - r * 0.3} Q ${cx + r * 0.3} ${cy - r * 0.6} ${cx} ${cy - r} Q ${cx - r * 0.3} ${cy - r * 0.6} ${cx} ${cy - r * 0.3} Z`}
              fill={color}
              opacity={0.55}
            />
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={r * 0.22} fill={color} />
    </G>
  );
};

export const IndianBookCover: React.FC<IndianBookCoverProps> = memo(
  ({ title, width, height, borderRadius = 0 }) => {
    const palette = useMemo(() => {
      const idx = hashString(title || 'untitled') % PALETTES.length;
      return PALETTES[idx];
    }, [title]);

    const padding = Math.max(8, width * 0.06);
    const innerBorderInset = padding * 0.85;
    const cornerOrnamentSize = Math.max(4, width * 0.045);
    const mandalaSize = Math.max(10, width * 0.16);
    const fontSize = Math.max(10, Math.min(width * 0.085, 18));
    const subFontSize = Math.max(7, width * 0.04);

    const titleLines = useMemo(() => {
      const t = (title || 'सतगुरु पंथ').trim();
      const maxLineLen = Math.max(8, Math.floor(width / (fontSize * 0.55)));
      if (t.length <= maxLineLen) return [t];
      const words = t.split(/\s+/);
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        if ((line + ' ' + w).trim().length > maxLineLen) {
          if (line) lines.push(line);
          line = w;
        } else {
          line = (line + ' ' + w).trim();
        }
        if (lines.length >= 4) break;
      }
      if (line && lines.length < 5) lines.push(line);
      return lines.slice(0, 4);
    }, [title, width, fontSize]);

    return (
      <View style={[styles.wrap, { width, height, borderRadius, overflow: 'hidden' }]}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={palette.bg1} />
              <Stop offset="1" stopColor={palette.bg2} />
            </SvgGradient>
            <RadialGradient id="vignette" cx="50%" cy="40%" r="80%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.08" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.35" />
            </RadialGradient>
            <SvgGradient id="spineShadow" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#000000" stopOpacity="0.45" />
              <Stop offset="0.08" stopColor="#000000" stopOpacity="0.18" />
              <Stop offset="0.15" stopColor="#000000" stopOpacity="0" />
            </SvgGradient>
            <SvgGradient id="pageEdge" x1="1" y1="0" x2="0.94" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </SvgGradient>
          </Defs>

          <Rect x={0} y={0} width={width} height={height} fill="url(#bgGrad)" />
          <Rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />

          <Rect x={0} y={0} width={width * 0.12} height={height} fill="url(#spineShadow)" />
          <Rect x={width * 0.94} y={0} width={width * 0.06} height={height} fill="url(#pageEdge)" />

          <Rect
            x={padding}
            y={padding}
            width={width - padding * 2}
            height={height - padding * 2}
            fill="none"
            stroke={palette.accent}
            strokeWidth={1.2}
            opacity={0.85}
          />
          <Rect
            x={innerBorderInset + padding * 0.5}
            y={innerBorderInset + padding * 0.5}
            width={width - (innerBorderInset + padding * 0.5) * 2}
            height={height - (innerBorderInset + padding * 0.5) * 2}
            fill="none"
            stroke={palette.accent}
            strokeWidth={0.6}
            opacity={0.55}
          />

          <Ornament x={padding + cornerOrnamentSize} y={padding + cornerOrnamentSize} size={cornerOrnamentSize} color={palette.accent} rotation={0} />
          <Ornament x={width - padding - cornerOrnamentSize} y={padding + cornerOrnamentSize} size={cornerOrnamentSize} color={palette.accent} rotation={90} />
          <Ornament x={padding + cornerOrnamentSize} y={height - padding - cornerOrnamentSize} size={cornerOrnamentSize} color={palette.accent} rotation={270} />
          <Ornament x={width - padding - cornerOrnamentSize} y={height - padding - cornerOrnamentSize} size={cornerOrnamentSize} color={palette.accent} rotation={180} />

          <LotusMandala cx={width / 2} cy={padding + mandalaSize + cornerOrnamentSize * 0.5} r={mandalaSize} color={palette.accent} />

          <Path
            d={`M ${padding * 1.5} ${height - padding * 2.6} L ${width - padding * 1.5} ${height - padding * 2.6}`}
            stroke={palette.accent}
            strokeWidth={0.8}
            opacity={0.6}
          />
          <Circle cx={width / 2} cy={height - padding * 2.6} r={2} fill={palette.accent} opacity={0.85} />
          <Path
            d={`M ${padding * 1.5} ${height - padding * 1.6} L ${width - padding * 1.5} ${height - padding * 1.6}`}
            stroke={palette.accent}
            strokeWidth={0.4}
            opacity={0.45}
          />
        </Svg>

        <View
          style={[
            styles.titleBlock,
            {
              top: padding + mandalaSize * 2 + cornerOrnamentSize,
              left: padding * 2,
              right: padding * 2,
            },
          ]}
        >
          {titleLines.map((line, i) => (
            <RNText
              key={i}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.title,
                {
                  color: palette.text,
                  fontSize,
                  lineHeight: fontSize * 1.35,
                  textShadowColor: 'rgba(0,0,0,0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                },
              ]}
            >
              {line}
            </RNText>
          ))}
        </View>

        <View
          style={[
            styles.publisher,
            {
              bottom: padding * 1.9,
              left: padding * 2,
              right: padding * 2,
            },
          ]}
        >
          <RNText
            style={[
              styles.publisherText,
              { color: palette.accent, fontSize: subFontSize, letterSpacing: 1.5 },
            ]}
            numberOfLines={1}
          >
            सतगुरु पंथ
          </RNText>
        </View>
      </View>
    );
  }
);

IndianBookCover.displayName = 'IndianBookCover';

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  titleBlock: {
    position: 'absolute',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik-Bold',
    fontWeight: '800',
    textAlign: 'center',
  },
  publisher: {
    position: 'absolute',
    alignItems: 'center',
  },
  publisherText: {
    fontFamily: 'Rubik-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
