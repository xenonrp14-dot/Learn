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
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

// --- COLORS ---
const DARK_BG = '#0A0E12';
const DARK_CARD = '#121820';
const PRIMARY = '#0D9488';
const ACCENT = '#14B8A6';
const TEXT_LIGHT = '#F1F5F9';
const TEXT_FAINT = '#9CA3AF';
const GRADIENT = ['#000000', '#0A0E12', '#0F1A1F'];

export default function Home() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bgFade = useRef(new Animated.Value(0)).current;

  // Twinkling stars
  const starCount = 25;
  const stars = useRef(
    [...Array(starCount)].map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      opacity: new Animated.Value(Math.random()),
    }))
  ).current;

  // Shooting stars (two at a time)
  const shootingStars = useRef([
    { x: new Animated.Value(width + 100), y: new Animated.Value(-100), opacity: new Animated.Value(0) },
    { x: new Animated.Value(width + 100), y: new Animated.Value(-100), opacity: new Animated.Value(0) },
  ]).current;

  useEffect(() => {
    // Fade & content animations
    Animated.sequence([
      Animated.timing(bgFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Star flicker animation
    stars.forEach((star) => {
      const flicker = () => {
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 0.1 + Math.random() * 0.9,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]).start(() => flicker());
      };
      flicker();
    });

    // Shooting star diagonal movement with trail
    const loopShootingStar = (starObj, delay) => {
      const run = () => {
        const startY = Math.random() * height * 0.4; // random top section
        starObj.x.setValue(width + 100);
        starObj.y.setValue(startY);
        starObj.opacity.setValue(1);

        Animated.parallel([
          Animated.timing(starObj.x, {
            toValue: -150,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(starObj.y, {
            toValue: startY + 250,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(starObj.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(starObj.opacity, {
              toValue: 0,
              duration: 1700,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          const nextDelay = 3000 + Math.random() * 5000;
          setTimeout(run, nextDelay);
        });
      };
      setTimeout(run, delay);
    };

    loopShootingStar(shootingStars[0], 1500);
    loopShootingStar(shootingStars[1], 4000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Static Stars */}
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: star.y,
            left: star.x,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#E0F2FE',
            opacity: star.opacity,
          }}
        />
      ))}

      {/* Shooting stars with trail */}
      {shootingStars.map((star, i) => (
        <Animated.View
          key={`shooting-${i}`}
          style={{
            position: 'absolute',
            width: 120,
            height: 2,
            backgroundColor: 'white',
            borderRadius: 2,
            shadowColor: '#14B8A6',
            shadowOpacity: 0.8,
            shadowRadius: 6,
            transform: [
              { translateX: star.x },
              { translateY: star.y },
              { rotateZ: '-25deg' },
            ],
            opacity: star.opacity,
          }}
        >
          {/* Fading white trail */}
          <LinearGradient
            colors={['white', 'rgba(255,255,255,0)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, borderRadius: 2 }}
          />
        </Animated.View>
      ))}

      {/* Glow */}
      <Animated.View
        style={[styles.glowCircle, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      />

      {/* Header */}
      <Animated.View
        style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <MaterialCommunityIcons name="school-outline" size={65} color={ACCENT} style={styles.icon} />
        <Text style={styles.title}>Unlock Your Potential</Text>
        <Text style={styles.subtitle}>Learn. Grow. Achieve Excellence.</Text>
      </Animated.View>

      {/* Card Section */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.cardTitle}>Ready to begin your learning journey?</Text>

        <Link href="/login" asChild>
          <TouchableOpacity style={styles.buttonPrimary} activeOpacity={0.85}>
            <Text style={styles.buttonTextPrimary}>Login</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.buttonSecondary} activeOpacity={0.85}>
            <Text style={styles.buttonTextSecondary}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  glowCircle: {
    position: 'absolute',
    width: 550,
    height: 550,
    borderRadius: 275,
    backgroundColor: 'rgba(20,184,166,0.08)',
    top: height * 0.1,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 40 },
  icon: { marginBottom: 15 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TEXT_LIGHT,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_FAINT,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    width: width * 0.88,
    backgroundColor: DARK_CARD,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: TEXT_LIGHT,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonPrimary: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonTextPrimary: { color: TEXT_LIGHT, fontSize: 17, fontWeight: '700' },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  buttonTextSecondary: { color: ACCENT, fontSize: 17, fontWeight: '700' },
});
