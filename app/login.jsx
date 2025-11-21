import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

// --- COLORS & THEME ---
const DARK_BG = '#0a120eff';
const DARK_CARD = '#121820';
const PRIMARY = '#0D9488';
const ACCENT = '#14B8A6';
const TEXT_LIGHT = '#F1F5F9';
const TEXT_FAINT = '#9CA3AF';
const GRADIENT = ['#000000', '#0A0E12', '#0F1A1F'];
const LIGHT_GREY = '#1A1F28';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bgFade = useRef(new Animated.Value(0)).current;

  // --- Stars ---
  const starCount = 25;
  const stars = useRef(
    [...Array(starCount)].map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      opacity: new Animated.Value(Math.random()),
    }))
  ).current;

  const shootingStars = useRef([
    { x: new Animated.Value(width + 100), y: new Animated.Value(-100), opacity: new Animated.Value(0) },
    { x: new Animated.Value(width + 100), y: new Animated.Value(-100), opacity: new Animated.Value(0) },
  ]).current;

  useEffect(() => {
    // Fade & content animation
    Animated.sequence([
      Animated.timing(bgFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      ]),
    ]).start();

    // Star flicker
    stars.forEach((star) => {
      const flicker = () => {
        Animated.sequence([
          Animated.timing(star.opacity, { toValue: 0.1 + Math.random() * 0.9, duration: 1000 + Math.random() * 1000, useNativeDriver: true }),
          Animated.timing(star.opacity, { toValue: 0.3 + Math.random() * 0.7, duration: 1000 + Math.random() * 1000, useNativeDriver: true }),
        ]).start(() => flicker());
      };
      flicker();
    });

    // Shooting stars
    const loopShootingStar = (starObj, delay) => {
      const run = () => {
        const startY = Math.random() * height * 0.4;
        starObj.x.setValue(width + 100);
        starObj.y.setValue(startY);
        starObj.opacity.setValue(1);

        Animated.parallel([
          Animated.timing(starObj.x, { toValue: -150, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(starObj.y, { toValue: startY + 250, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(starObj.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(starObj.opacity, { toValue: 0, duration: 1700, useNativeDriver: true }),
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

  // --- Login Logic ---
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role = 'student';
      if (email === 'xenonrp14@gmail.com') role = 'admin';
      else if (userDoc.exists()) role = userDoc.data().role;
      router.replace(`/${role}`);
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Reset Password', 'Please enter your email address above first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Reset Password', 'A password reset link has been sent to your email.');
    } catch (error) {
      Alert.alert('Reset Password Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Stars */}
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
      {shootingStars.map((star, i) => (
        <Animated.View
          key={`shooting-${i}`}
          style={{
            position: 'absolute',
            width: 120,
            height: 2,
            backgroundColor: 'white',
            borderRadius: 2,
            shadowColor: ACCENT,
            shadowOpacity: 0.8,
            shadowRadius: 6,
            transform: [{ translateX: star.x }, { translateY: star.y }, { rotateZ: '-25deg' }],
            opacity: star.opacity,
          }}
        >
          <LinearGradient
            colors={['white', 'rgba(255,255,255,0)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, borderRadius: 2 }}
          />
        </Animated.View>
      ))}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Glow Circle */}
        <Animated.View style={[styles.glowCircle, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]} />

        {/* Header Section */}
        <Animated.View style={[styles.topSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={ACCENT} />
          </TouchableOpacity>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue your journey</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View style={[styles.bottomCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="modi@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={TEXT_FAINT}
          />

          <Text style={styles.label}>Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={TEXT_FAINT}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 16, top: 12 }}
              onPress={() => setShowPassword(prev => !prev)}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={ACCENT}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => router.replace('/signup')}>
            <Text style={styles.switchText}>
              Need an account? <Text style={styles.signUpText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  glowCircle: {
    position: 'absolute',
    width: 550,
    height: 550,
    borderRadius: 275,
    backgroundColor: 'rgba(20,184,166,0.08)',
    top: height * 0.05,
    alignSelf: 'center',
  },
  topSection: {
    height: height * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: DARK_CARD,
    borderRadius: 50,
    padding: 8,
    zIndex: 10,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: TEXT_LIGHT, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: TEXT_FAINT, textAlign: 'center' },
  bottomCard: {
    width: width * 0.92,
    backgroundColor: DARK_CARD,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: { fontSize: 14, color: TEXT_LIGHT, marginBottom: 6, fontWeight: '600' },
  input: { width: '100%', height: 50, backgroundColor: LIGHT_GREY, borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, fontSize: 16, color: TEXT_LIGHT, borderWidth: 1, borderColor: '#2c2c2c' },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotPasswordText: { color: TEXT_FAINT, fontSize: 14, fontWeight: '600' },
  button: { width: '100%', height: 55, backgroundColor: ACCENT, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  buttonText: { color: TEXT_LIGHT, fontSize: 18, fontWeight: 'bold' },
  switchButton: { alignItems: 'center' },
  switchText: { color: TEXT_FAINT, fontSize: 15 },
  signUpText: { color: ACCENT, fontWeight: 'bold' },
});
