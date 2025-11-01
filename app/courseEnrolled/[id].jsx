import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const PRIMARY_GREEN = '#1D4A3D';
const LIGHT_GREY = '#F0F4F7';
const OFF_WHITE = '#FFFFFF';
const ACCENT_YELLOW = '#FBBF24';

// Reusable animated background
function AnimatedBackground() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 45000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate1 = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.animatedSquare,
          { width: width * 1.8, height: width * 1.8, opacity: 0.08, transform: [{ rotate: rotate1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.animatedSquare,
          { width: width * 1.2, height: width * 1.2, opacity: 0.15, transform: [{ rotate: rotate2 }] },
        ]}
      />
    </View>
  );
}

export default function CourseEnrolled() {
  const { id } = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolled = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const enrolled = [];
      usersSnap.forEach((docu) => {
        const data = docu.data();
        if (Array.isArray(data.enrolled)) {
          data.enrolled.forEach((e) => {
            if (e.id === id && e.status === 'enrolled') {
              enrolled.push({
                userId: docu.id,
                name: data.name || data.fullName || '',
                email: data.email || '',
                phone: data.phone || '',
                bio: data.bio || '',
              });
            }
          });
        }
      });
      setStudents(enrolled);
      setLoading(false);
    };
    fetchEnrolled();
  }, [id]);

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <View style={styles.header}>
        <MaterialCommunityIcons name="account-group" size={42} color={ACCENT_YELLOW} />
        <Text style={styles.title}>Enrolled Students</Text>
      </View>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color={ACCENT_YELLOW} />
        ) : students.length === 0 ? (
          <Text style={[styles.subtitle, { color: ACCENT_YELLOW, fontWeight: 'bold' }]}>No enrolled student(s) found.</Text>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {students.map((s) => (
              <View key={s.userId} style={styles.itemCard}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.email}>{s.email}</Text>
                {s.phone ? <Text style={styles.email}>{s.phone}</Text> : null}
                {s.bio ? <Text style={styles.email}>{s.bio}</Text> : null}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN, alignItems: 'center', justifyContent: 'center', padding: 16 },
  animatedSquare: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 5 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: ACCENT_YELLOW, marginLeft: 8 },
  subtitle: { fontSize: 18, color: LIGHT_GREY, textAlign: 'center', marginVertical: 20 },
  card: {
    width: '100%',
    backgroundColor: OFF_WHITE,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: 420,
  },
  itemCard: {
    backgroundColor: LIGHT_GREY,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_GREEN },
  email: { fontSize: 14, color: '#555', marginBottom: 4 },
});
