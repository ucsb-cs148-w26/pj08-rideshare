import React, { useMemo, useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';

const SEGMENT_COUNT = 90;

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function ColorWheel({
  size = 220,
  ringWidth = 28,
  onColorChange,
  children,
}) {
  const center = size / 2;
  const radius = (size - ringWidth) / 2;
  const dotSize = ringWidth + 8;
  const [thumbAngle, setThumbAngle] = useState(null);

  const onColorChangeRef = useRef(onColorChange);
  onColorChangeRef.current = onColorChange;

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        const hue = (i * 360) / SEGMENT_COUNT;
        const rad = ((hue - 90) * Math.PI) / 180;
        return {
          color: hslToHex(hue, 100, 50),
          x: center + radius * Math.cos(rad) - dotSize / 2,
          y: center + radius * Math.sin(rad) - dotSize / 2,
        };
      }),
    [center, radius, dotSize]
  );

  const handleTouchRef = useRef(null);
  handleTouchRef.current = (x, y) => {
    const dx = x - center;
    const dy = y - center;
    if (dx === 0 && dy === 0) return;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    angle = angle % 360;
    setThumbAngle(angle);
    onColorChangeRef.current?.(hslToHex(angle, 100, 50));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) =>
        handleTouchRef.current?.(
          e.nativeEvent.locationX,
          e.nativeEvent.locationY
        ),
      onPanResponderMove: (e) =>
        handleTouchRef.current?.(
          e.nativeEvent.locationX,
          e.nativeEvent.locationY
        ),
    })
  ).current;

  const innerPad = ringWidth + 6;
  const innerRadius = (size - innerPad * 2) / 2;
  const thumbSize = ringWidth + 10;

  let thumbX = 0;
  let thumbY = 0;
  let thumbColor = '#FF0000';
  if (thumbAngle !== null) {
    const thumbRad = ((thumbAngle - 90) * Math.PI) / 180;
    thumbX = center + radius * Math.cos(thumbRad) - thumbSize / 2;
    thumbY = center + radius * Math.sin(thumbRad) - thumbSize / 2;
    thumbColor = hslToHex(thumbAngle, 100, 50);
  }

  return (
    <View style={{ width: size, height: size }} {...panResponder.panHandlers}>
      {/* Color ring segments */}
      {segments.map((seg, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: seg.color,
            left: seg.x,
            top: seg.y,
          }}
        />
      ))}

      {/* Inner white circle + children */}
      <View
        style={{
          position: 'absolute',
          left: innerPad,
          top: innerPad,
          width: innerRadius * 2,
          height: innerRadius * 2,
          borderRadius: innerRadius,
          backgroundColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        pointerEvents="none"
      >
        {children}
      </View>

      {/* Draggable thumb indicator */}
      {thumbAngle !== null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: '#fff',
            borderWidth: 3,
            borderColor: thumbColor,
            left: thumbX,
            top: thumbY,
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 5,
          }}
        />
      )}
    </View>
  );
}
