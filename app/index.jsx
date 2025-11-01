import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

// --- COLORS ---
const PRIMARY_GREEN = '#1D4A3D';
const LIGHT_GREY = '#F0F4F7';
const OFF_WHITE = '#FFFFFF';
const DARK_OVERLAY = 'rgba(255,255,255,0.08)';
const SPIRAL_COLOR = 'rgba(107,107,107,0.35)';

// Background sizes
const ORNAMENT_SIZE = Math.max(height, width) * 1.5;

// Animation counts
const NUM_FLOW_LINES = 12;
const NUM_SPARKS = 25;
const NUM_ORBS = 6;
const NUM_TWINKLES = 20;

// ---- Spiral Component ----
const SpiralAnimation = () => {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 4000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.7, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 4000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 15,
        right: 15,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: 'rgba(255,255,255,0.15)',
          transform: [{ scale: pulse }],
        }}
      />
      <Animated.View
        style={{
          width: 60,
          height: 60,
          borderWidth: 2,
          borderColor: SPIRAL_COLOR,
          borderRadius: 8,
          transform: [{ rotate: rotateInterpolate }, { scale }],
        }}
      >
        <View style={styles.innerSpiral} />
        <View style={[styles.innerSpiral, { width: 40, height: 40, top: 10, left: 10 }]} />
        <View style={[styles.innerSpiral, { width: 20, height: 20, top: 20, left: 20 }]} />
      </Animated.View>
    </Animated.View>
  );
};

// ---- Main Home Component ----
export default function Home() {
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Background animations
  const flowLines = useRef(
    Array.from({ length: NUM_FLOW_LINES }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0.2 + Math.random() * 0.3),
      rotation: Math.random() * 45 - 22.5,
      speed: 10000 + Math.random() * 7000,
      width: 2 + Math.random() * 2,
      height: 50 + Math.random() * 50,
    }))
  ).current;

  const sparks = useRef(
    Array.from({ length: NUM_SPARKS }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.7 + Math.random() * 0.8),
      speed: 5000 + Math.random() * 5000,
      size: 6 + Math.random() * 4,
    }))
  ).current;

  const orbs = useRef(
    Array.from({ length: NUM_ORBS }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0.2 + Math.random() * 0.4),
      scale: new Animated.Value(0.5 + Math.random() * 0.8),
      size: 70 + Math.random() * 100,
      speed: 15000 + Math.random() * 10000,
    }))
  ).current;

  const twinkles = useRef(
    Array.from({ length: NUM_TWINKLES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      opacity: new Animated.Value(Math.random() * 0.5),
      size: 3 + Math.random() * 2,
    }))
  ).current;

  useEffect(() => {
    // Background slow rotation
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Card entry
    Animated.stagger(150, [
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(0.8)), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Flow lines
    flowLines.forEach(line => {
      const animateLine = () => {
        line.y.setValue(-line.height);
        line.x.setValue(Math.random() * width);
        Animated.timing(line.y, { toValue: height + line.height, duration: line.speed, easing: Easing.linear, useNativeDriver: true }).start(() => animateLine());
      };
      animateLine();
    });

    // Sparks
    sparks.forEach(spark => {
      const animateSpark = () => {
        spark.y.setValue(height + Math.random() * 50);
        spark.opacity.setValue(0);
        spark.scale.setValue(0.7 + Math.random() * 0.8);
        spark.x = Math.random() * width;
        Animated.parallel([
          Animated.timing(spark.y, { toValue: -50, duration: spark.speed, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(spark.opacity, { toValue: 0.4 + Math.random() * 0.2, duration: 500, useNativeDriver: true }),
        ]).start(() => animateSpark());
      };
      animateSpark();
    });

    // Orbs floating
    orbs.forEach(orb => {
      const floatOrb = () => {
        Animated.sequence([
          Animated.timing(orb.x, { toValue: Math.random() * width, duration: orb.speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orb.y, { toValue: Math.random() * height, duration: orb.speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]).start(() => floatOrb());
      };
      floatOrb();
    });

    // Twinkling stars
    twinkles.forEach(t => {
      const blink = () => {
        Animated.sequence([
          Animated.timing(t.opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(t.opacity, { toValue: 0.1, duration: 1000, useNativeDriver: true }),
        ]).start(() => blink());
      };
      blink();
    });
  }, []);

  const rotation1 = rotationAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotation2 = rotationAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundContainer}>
        {/* Floating orbs */}
        {orbs.map((orb, idx) => (
          <Animated.View
            key={`orb-${idx}`}
            style={{
              position: 'absolute',
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: 'rgba(255,255,255,0.08)',
              opacity: orb.opacity,
              transform: [{ translateX: orb.x }, { translateY: orb.y }, { scale: orb.scale }],
            }}
          />
        ))}

        {/* Twinkling stars */}
        {twinkles.map((t, idx) => (
          <Animated.View
            key={`tw-${idx}`}
            style={{
              position: 'absolute',
              width: t.size,
              height: t.size,
              borderRadius: t.size / 2,
              backgroundColor: OFF_WHITE,
              opacity: t.opacity,
              transform: [{ translateX: t.x }, { translateY: t.y }],
            }}
          />
        ))}

        {/* Flow lines */}
        {flowLines.map((line, idx) => (
          <Animated.View
            key={`line-${idx}`}
            style={{
              position: 'absolute',
              width: line.width,
              height: line.height,
              backgroundColor: OFF_WHITE,
              opacity: line.opacity,
              borderRadius: 2,
              transform: [{ translateX: line.x }, { translateY: line.y }, { rotate: `${line.rotation}deg` }],
            }}
          />
        ))}

        {/* Rising sparks */}
        {sparks.map((spark, idx) => (
          <Animated.View
            key={`spark-${idx}`}
            style={{
              position: 'absolute',
              width: spark.size,
              height: spark.size,
              backgroundColor: OFF_WHITE,
              borderRadius: spark.size / 2,
              opacity: spark.opacity,
              transform: [{ translateX: spark.x }, { translateY: spark.y }, { scale: spark.scale }],
            }}
          />
        ))}

        {/* Rotating squares */}
        <Animated.View
          style={[styles.animatedOrnamentSquare, { width: ORNAMENT_SIZE, height: ORNAMENT_SIZE, opacity: 0.08, transform: [{ rotate: rotation1 }] }]}
        />
        <Animated.View
          style={[styles.animatedOrnamentSquare, { width: ORNAMENT_SIZE * 0.7, height: ORNAMENT_SIZE * 0.7, opacity: 0.15, transform: [{ rotate: rotation2 }] }]}
        />
      </View>

      {/* Top Content */}
      <View style={styles.topContentWrapper}>
        <Animated.View style={{ transform: [{ scale: iconScale }], zIndex: 1 }}>
          <MaterialCommunityIcons name="school-outline" size={50} color={OFF_WHITE} style={styles.appIcon} />
        </Animated.View>
        <Text style={styles.heroTitle}>Unlock Your Potential</Text>
        <Text style={styles.heroSubtitle}>Connect, Learn, and Master New Skills.</Text>
      </View>

      {/* Card */}
      <Animated.View style={[styles.floatingCard, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
        <Text style={styles.cardTitle}>Ready to begin your learning journey?</Text>

        <Link href="/login" asChild>
          <TouchableOpacity style={styles.button} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/signup" asChild>
          <TouchableOpacity style={[styles.button, styles.signupButton]} activeOpacity={0.8}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </Link>

        {/* Spiral */}
        <SpiralAnimation />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN, alignItems: 'center', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', zIndex: 1 },
  animatedOrnamentSquare: { position: 'absolute', borderWidth: 1, borderColor: DARK_OVERLAY, backgroundColor: 'transparent', borderRadius: 5 },
  topContentWrapper: { width: '100%', height: height * 0.4, justifyContent: 'center', alignItems: 'center', paddingTop: 40, zIndex: 10 },
  appIcon: { marginBottom: 10 },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: OFF_WHITE, marginBottom: 5, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: LIGHT_GREY, opacity: 0.9, textAlign: 'center' },
  floatingCard: {
    width: width * 0.88,
    backgroundColor: OFF_WHITE,
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 55,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    zIndex: 15,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_GREEN, marginBottom: 30, textAlign: 'center' },
  button: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: { color: OFF_WHITE, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  signupButton: { backgroundColor: OFF_WHITE, borderWidth: 2, borderColor: PRIMARY_GREEN, shadowColor: LIGHT_GREY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  signupButtonText: { color: PRIMARY_GREEN, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  innerSpiral: { position: 'absolute', width: 60, height: 60, borderWidth: 1, borderColor: SPIRAL_COLOR, borderRadius: 4 },
});
