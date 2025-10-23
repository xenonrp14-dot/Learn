import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function CourseRequests() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      // For demo: fetch all users and filter those who requested this course
      // In production, use a requests collection or subcollection
      const usersSnap = await getDoc(doc(db, 'users', id));
      // This is a placeholder: you should fetch all users and filter by enrolled/requested course
      // Here, we just simulate with empty array
      setRequests([]);
      setLoading(false);
    };
    fetchRequests();
  }, [id]);

  const handleApprove = async (userId) => {
    // Update user's enrolled status for this course to 'enrolled'
    // This is a placeholder: you should update the user's enrolled array
    Alert.alert('Approved', `User ${userId} approved for course.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Course Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" />
      ) : requests.length === 0 ? (
        <Text style={styles.subtitle}>No requests found for this course.</Text>
      ) : (
        requests.map(req => (
          <View key={req.userId} style={styles.requestCard}>
            <Text style={styles.requestText}>{req.name} ({req.email})</Text>
            <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(req.userId)}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/mentor')}>
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
