import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');
const PRIMARY_GREEN = '#1D4A3D';
const LIGHT_GREY = '#F0F4F7';
const OFF_WHITE = '#FFFFFF';
const ACCENT_YELLOW = '#FBBF24';

// --- Background Animation ---
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
          {
            width: width * 1.8,
            height: width * 1.8,
            opacity: 0.08,
            transform: [{ rotate: rotate1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.animatedSquare,
          {
            width: width * 1.2,
            height: width * 1.2,
            opacity: 0.15,
            transform: [{ rotate: rotate2 }],
          },
        ]}
      />
    </View>
  );
}

// --- Main Component ---
export default function CourseRequests() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const reqs = [];
      usersSnap.forEach((userDoc) => {
        const data = userDoc.data();
        if (Array.isArray(data.enrolled)) {
          data.enrolled.forEach((enroll) => {
            if (enroll.id === id && enroll.status === 'requested') {
              reqs.push({
                userId: userDoc.id,
                name: data.name,
                email: data.email,
                phone: data.phone || '',
                bio: data.bio || '',
                organization: data.organization || '',
                role: data.role || '',
              });
            }
          });
        }
      });
      setRequests(reqs);
      setLoading(false);
    };
    fetchRequests();
  }, [id]);

  const handleApprove = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocs(collection(db, 'users'));
    let userData;
    userSnap.forEach((docu) => {
      if (docu.id === userId) userData = docu.data();
    });
    if (userData && Array.isArray(userData.enrolled)) {
      const updatedEnrolled = userData.enrolled.map((enroll) =>
        enroll.id === id ? { ...enroll, status: 'enrolled' } : enroll
      );
      await updateDoc(userRef, { enrolled: updatedEnrolled });
      Alert.alert('Approved', `User ${userData.name} approved for course.`);
      setRequests((r) => r.filter((x) => x.userId !== userId));
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <View style={styles.header}>
        <MaterialCommunityIcons name="account-clock" size={42} color={ACCENT_YELLOW} />
        <Text style={styles.title}>Course Requests</Text>
      </View>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color={ACCENT_YELLOW} />
        ) : requests.length === 0 ? (
          <Text style={[styles.subtitle, { color: ACCENT_YELLOW, fontWeight: 'bold' }]}>No requests found for this course.</Text>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {requests.map((req) => (
              <View key={req.userId} style={styles.itemCard}>
                <Text style={styles.name}>{req.name}</Text>
                <Text style={styles.email}>{req.email}</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: ACCENT_YELLOW }]}
                  onPress={() => handleApprove(req.userId)}
                >
                  <Text style={[styles.buttonText, { color: PRIMARY_GREEN }]}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setSelectedStudent(req)}
                >
                  <Text style={styles.buttonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.button, { marginTop: 20, backgroundColor: PRIMARY_GREEN }]}
          onPress={() => router.replace('/mentor')}
        >
          <Text style={[styles.buttonText, { color: OFF_WHITE }]}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {selectedStudent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Student Details</Text>
            <Text style={styles.modalText}><Text style={{ fontWeight: 'bold' }}>Name:</Text> {selectedStudent.name}</Text>
            <Text style={styles.modalText}><Text style={{ fontWeight: 'bold' }}>Email:</Text> {selectedStudent.email}</Text>
            {selectedStudent.phone ? <Text style={styles.modalText}><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {selectedStudent.phone}</Text> : null}
            {selectedStudent.organization ? <Text style={styles.modalText}><Text style={{ fontWeight: 'bold' }}>Organization:</Text> {selectedStudent.organization}</Text> : null}
            {selectedStudent.role ? <Text style={styles.modalText}><Text style={{ fontWeight: 'bold' }}>Role:</Text> {selectedStudent.role}</Text> : null}
            {selectedStudent.bio ? <Text style={styles.modalText}><Text style={{ fontWeight: 'bold' }}>Bio:</Text> {selectedStudent.bio}</Text> : null}
            <TouchableOpacity style={[styles.button, { marginTop: 16, backgroundColor: PRIMARY_GREEN }]} onPress={() => setSelectedStudent(null)}>
              <Text style={[styles.buttonText, { color: OFF_WHITE }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  email: { fontSize: 14, color: '#555', marginBottom: 8 },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: PRIMARY_GREEN,
  },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: OFF_WHITE },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(29,74,61,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: OFF_WHITE, borderRadius: 18, padding: 20, width: '85%', maxWidth: 360 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: PRIMARY_GREEN, marginBottom: 10 },
  modalText: { fontSize: 16, color: '#555', marginBottom: 5 },
});
