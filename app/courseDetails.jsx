import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Easing, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';

const PRIMARY_GREEN = '#1D4A3D';
const OFF_WHITE = '#FAFAFA';
const ACCENT_GOLD = '#FBBF24';
const LIGHT_GREY = '#F0F4F7';
const SCHOLAR_COLOR = '#3B82F6'; // Rich blue for scholar icon
const { width } = Dimensions.get('window');

export default function CourseDetails() {
  // Animation for scholar icon
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const { courseId } = useLocalSearchParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      const docRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(docRef);
      if (courseDoc.exists()) {
        setCourse(courseDoc.data());
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <View style={styles.container}><ActivityIndicator size="large" color={ACCENT_GOLD} /></View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}><Text style={styles.emptyText}>Course not found.</Text></View>
    );
  }

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] });
  const spiralRotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={styles.card}>
        {/* Animated spiral at bottom right */}
        <Animated.View style={[styles.spiral, { transform: [{ rotate: spiralRotate }] }]} />
        {/* Floating particles - now at top right */}
        <View style={styles.particleContainer}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Animated.View
              key={`particle-${i}`}
              style={[
                styles.particle,
                {
                  top: 2 + Math.sin(i) * 10 + i * 4,
                  right: 2 + Math.cos(i) * 18 + i * 8,
                  opacity: 0.12 + (i % 3) * 0.08,
                  backgroundColor: i % 2 === 0 ? '#FBBF24' : '#1D4A3D',
                  transform: [{ scale: 1 + Math.sin(i) * 0.2 }],
                },
              ]}
            />
          ))}
        </View>
        {/* Corner accent */}
        <View style={styles.cornerAccent} />
        <View style={styles.headerRow}>
          <Animated.View style={{ marginRight: 10, transform: [{ rotate }] }}>
            <Ionicons name="school" size={38} color={SCHOLAR_COLOR} />
          </Animated.View>
          <Text style={styles.title}>{course.title}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.mentorRow}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color={ACCENT_GOLD} style={{ marginRight: 6 }} />
          <Text style={styles.mentor}>Mentor: {course.mentorName || 'Unknown'}</Text>
        </View>
        {course.mentorContact && (
          <View style={styles.mentorRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={ACCENT_GOLD} style={{ marginRight: 6 }} />
            <Text style={styles.contact}>Contact: {course.mentorContact}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <Text style={styles.label}>Description</Text>
        <Text style={styles.text}>{course.description || 'No description provided.'}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Prerequisites</Text>
        <Text style={styles.text}>{course.prerequisites || 'None'}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Duration</Text>
        <Text style={styles.text}>{course.duration || 'N/A'}</Text>
        {course.additional && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Additional Info</Text>
            <Text style={styles.text}>{course.additional}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  card: { backgroundColor: 'rgba(250,250,250,0.97)', borderRadius: 22, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8, width: '90%', maxWidth: 500, position: 'relative', overflow: 'visible' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mentorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  divider: { height: 1, backgroundColor: LIGHT_GREY, marginVertical: 12, borderRadius: 2 },
  title: { fontSize: 26, fontWeight: 'bold', color: PRIMARY_GREEN, marginBottom: 2 },
  mentor: { fontSize: 15, color: PRIMARY_GREEN, fontWeight: '600' },
  contact: { fontSize: 14, color: ACCENT_GOLD, fontWeight: '500' },
  label: { fontSize: 15, color: ACCENT_GOLD, marginBottom: 4, fontWeight: '700', marginTop: 2 },
  text: { fontSize: 15, color: PRIMARY_GREEN, marginBottom: 8 },
  emptyText: { color: LIGHT_GREY, textAlign: 'center', marginTop: 40, fontSize: 18 },
  spiral: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#e0e0e0',
    opacity: 0.18,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 60,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  particle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FBBF24',
    opacity: 0.15,
    zIndex: 2,
  },
  cornerAccent: {
    position: 'absolute',
    top: -18,
    left: -18,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    opacity: 0.13,
    zIndex: 1,
  },
});
