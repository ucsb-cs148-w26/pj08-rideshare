import { memo } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const AVATAR_ICONS = {
  default: require('../../assets/defaulticon_grs (1).png'),
  safari: require('../../assets/safari_pfp (1).png'),
  spacesuit: require('../../assets/spacesuit_pfp (1).png'),
  sporty: require('../../assets/sporty.png'),
  scuba: require('../../assets/scuba.png'),
};

const AVATAR_SCALE = {
  default: 1.05,
  safari: 1.25,
  spacesuit: 1.4,
  sporty: 1.45,
  scuba: 1.3,
};

export default memo(function DefaultAvatar({ size = 64, bgColor = '#FFFFFF', avatarType = 'default' }) {
  const radius = size / 2;
  const scale = AVATAR_SCALE[avatarType] || AVATAR_SCALE.default;
  const iconSize = size * scale;
  const source = AVATAR_ICONS[avatarType] || AVATAR_ICONS.default;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Image
        source={source}
        style={{ width: iconSize, height: iconSize }}
        resizeMode="contain"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
