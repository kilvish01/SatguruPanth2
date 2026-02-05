import React, { useState } from 'react';
import { Image, ImageProps, View, LayoutChangeEvent, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { decode as base64Decode } from 'base-64';

interface SvgImageProps extends Omit<ImageProps, 'source'> {
  source: { uri?: string } | number;
}

/**
 * Component that handles both regular images and SVG data URIs
 * Falls back to regular Image component for non-SVG sources
 */
const SvgImage: React.FC<SvgImageProps> = ({ source, style, ...props }) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  };

  // Check if source is a data URI with SVG
  if (typeof source === 'object' && source.uri) {
    if (source.uri.startsWith('data:image/svg+xml;base64,')) {
      try {
        // Extract base64 SVG and decode it
        const base64Data = source.uri.replace('data:image/svg+xml;base64,', '');
        const svgString = base64Decode(base64Data);

        return (
          <View style={[style, styles.svgContainer]} onLayout={onLayout}>
            {dimensions && (
              <SvgXml
                xml={svgString}
                width={dimensions.width}
                height={dimensions.height}
                preserveAspectRatio="xMidYMid slice"
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        );
      } catch (error) {
        console.error('Error rendering SVG:', error);
        return <Image source={require('../../assets/images/icon.png')} style={style} {...props} />;
      }
    }
  }

  // Fall back to regular Image for non-SVG sources
  return <Image source={source as any} style={style} {...props} />;
};

const styles = StyleSheet.create({
  svgContainer: {
    overflow: 'hidden',
  },
});

export default SvgImage;
