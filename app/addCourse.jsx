// app/addCourse.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const COLORS = {
  PRIMARY_GREEN: '#0B3B2E',
  ACCENT: '#14B8A6',
  GOLD: '#FBBF24',
  OFF_WHITE: '#FAFAFA',
  STAR: '#E6F7FF',
  BG: '#07110D',
};

const STAR_COUNT = 26;
const PARTICLE_COUNT = 12;

export default function AddCourse() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [status, setStatus] = useState('active'); // fixed, display only
  const [loading, setLoading] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;

  // Stars & particles
  const stars = useRef(
    Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width,
      yBase: Math.random() * (height * 0.6),
      size: 0.8 + Math.random() * 2.4,
      twinkle: new Animated.Value(Math.random()),
      drift: new Animated.Value(Math.random() * 2 - 1),
      speed: 8000 + Math.random() * 9000,
    }))
  ).current;

  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.8,
      size: 12 + Math.random() * 36,
      anim: new Animated.Value(Math.random()),
      duration: 9000 + Math.random() * 9000,
    }))
  ).current;

  useEffect(() => {
    // Animate card on mount
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    // Stars & particles animation
    stars.forEach((s) => {
      const twinkleLoop = () => {
        Animated.sequence([
          Animated.timing(s.twinkle, { toValue: 0.2 + Math.random() * 0.8, duration: 600 + Math.random() * 1400, useNativeDriver: true }),
          Animated.timing(s.twinkle, { toValue: 0.2 + Math.random() * 0.8, duration: 600 + Math.random() * 1400, useNativeDriver: true }),
        ]).start(twinkleLoop);
      };
      twinkleLoop();

      const driftLoop = () => {
        s.drift.setValue(-1);
        Animated.timing(s.drift, { toValue: 1, duration: s.speed, useNativeDriver: true }).start(driftLoop);
      };
      driftLoop();
    });

    particles.forEach((p) => {
      const float = () => {
        Animated.sequence([
          Animated.timing(p.anim, { toValue: 1, duration: p.duration, useNativeDriver: true }),
          Animated.timing(p.anim, { toValue: 0, duration: p.duration, useNativeDriver: true }),
        ]).start(float);
      };
      float();
    });
  }, []);

  const handleAdd = async () => {
    if (!title || !description || !duration || !organisation) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const { Timestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'courses'), {
        title,
        description,
        duration,
        organisation,
        status,
        mentorId: user.uid,
        createdAt: Timestamp.now(),
      });
      Alert.alert('Success', 'Course added!');
      router.replace('/mentor');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[COLORS.BG, COLORS.BG]} style={StyleSheet.absoluteFill} />
        {particles.map((p, i) => {
          const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });
          const translateX = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
          return <Animated.View key={`p-${i}`} style={{
            position: 'absolute', top: p.y, left: p.x, width: p.size, height: p.size,
            borderRadius: p.size / 2, backgroundColor: 'rgba(20,184,166,0.06)', transform: [{ translateY }, { translateX }]
          }} />;
        })}
        {stars.map((s, i) => {
          const opacity = s.twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.95] });
          const driftX = s.drift.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
          return <Animated.View key={`star-${i}`} style={{
            position: 'absolute', top: s.yBase, left: s.x, width: s.size, height: s.size,
            borderRadius: s.size / 2, backgroundColor: COLORS.STAR, opacity, transform: [{ translateX: driftX }]
          }} />;
        })}
      </View>

      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: contentOpacity }}>
        <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1, paddingHorizontal: 20 }}>
          <Animated.View style={{ transform: [{ scale: cardScale }], width: '100%', maxWidth: 480, borderRadius: 18, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={styles.title}>Add New Course</Text>
            <TextInput style={styles.input} placeholder="Course Title" placeholderTextColor="rgba(255,255,255,0.6)" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="rgba(255,255,255,0.6)" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Duration (e.g. 6 weeks)" placeholderTextColor="rgba(255,255,255,0.6)" value={duration} onChangeText={setDuration} />
            <TextInput style={styles.input} placeholder="Organisation" placeholderTextColor="rgba(255,255,255,0.6)" value={organisation} onChangeText={setOrganisation} />
            <TextInput style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.04)' }]} placeholder="Status" placeholderTextColor="rgba(255,255,255,0.6)" value={status} editable={false} />

            <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading}>
              <Text style={styles.addText}>{loading ? 'Adding...' : 'Add Course'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/mentor')}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.GOLD, textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 12, marginVertical: 6, color: '#fff' },
  addButton: { backgroundColor: COLORS.GOLD, borderRadius: 12, paddingVertical: 12, marginTop: 14, alignItems: 'center' },
  addText: { color: COLORS.PRIMARY_GREEN, fontWeight: 'bold', fontSize: 16 },
  cancelButton: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingVertical: 12, marginTop: 8, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
