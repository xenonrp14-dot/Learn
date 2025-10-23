import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function CourseRequests() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      // Fetch all users and filter those who requested this course
      const usersSnap = await getDocs(collection(db, 'users'));
      const reqs = [];
      usersSnap.forEach(userDoc => {
        const data = userDoc.data();
        if (Array.isArray(data.enrolled)) {
          data.enrolled.forEach(enroll => {
            if (enroll.id === id && enroll.status === 'requested') {
              reqs.push({
                userId: userDoc.id,
                name: data.name,
                email: data.email,
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
    // Update user's enrolled status for this course to 'enrolled'
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocs(collection(db, 'users'));
    let userData;
    userSnap.forEach(docu => {
      if (docu.id === userId) userData = docu.data();
    });
    if (userData && Array.isArray(userData.enrolled)) {
      const updatedEnrolled = userData.enrolled.map(enroll =>
        enroll.id === id ? { ...enroll, status: 'enrolled' } : enroll
      );
      await updateDoc(userRef, { enrolled: updatedEnrolled });
      Alert.alert('Approved', `User ${userData.name} approved for course.`);
      setRequests(requests.filter(r => r.userId !== userId));
    }
  };

  return (
    <View style={[styles.container, { flex: 1 }] }>
      <Text style={styles.title}>Course Requests</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={() => { setLoading(true); setTimeout(() => { window.location.reload(); }, 100); }}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" />
      ) : requests.length === 0 ? (
        <Text style={styles.subtitle}>No requests found for this course.</Text>
      ) : (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 32 }}>
          {requests.map(req => (
            <View key={req.userId} style={styles.requestCard}>
              <Text style={styles.requestText}>{req.name} ({req.email})</Text>
              <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(req.userId)}>
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/mentor')}>
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    backgroundColor: '#636e72',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf6ff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#0984e3',
  },
  subtitle: {
    fontSize: 18,
    color: '#636e72',
    marginBottom: 24,
  },
  requestCard: {
    backgroundColor: '#f5f6fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#636e72',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  requestText: {
    fontSize: 16,
    color: '#0984e3',
    marginBottom: 8,
  },
  approveButton: {
    backgroundColor: '#00b894',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  approveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#636e72',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
