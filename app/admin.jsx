import { collection, getDocs } from 'firebase/firestore';
  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    const fetchAllUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      querySnapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllUsers(users);
    };
    fetchAllUsers();
  }, []);
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function AdminDashboard() {
  const router = useRouter();
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaitlist = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'mentor'), where('status', '==', 'waitlisted'));
      const querySnapshot = await getDocs(q);
      const mentors = [];
      querySnapshot.forEach((docSnap) => {
        mentors.push({ id: docSnap.id, ...docSnap.data() });
      });
      setWaitlist(mentors);
      setLoading(false);
    };
    fetchWaitlist();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const approveMentor = async (mentorId) => {
    await updateDoc(doc(db, 'users', mentorId), { status: 'approved' });
    setWaitlist(waitlist.filter((mentor) => mentor.id !== mentorId));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, Admin!</Text>
      <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
        <Text style={styles.signoutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Mentor Waitlist</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6c5ce7" />
      ) : waitlist.length === 0 ? (
        <Text style={styles.emptyText}>No waitlisted mentors.</Text>
      ) : (
        waitlist.map((mentor) => (
          <View key={mentor.id} style={styles.mentorCard}>
            <Text style={styles.mentorEmail}>{mentor.email}</Text>
            <TouchableOpacity style={styles.approveButton} onPress={() => approveMentor(mentor.id)}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Debug output: List all users and their fields */}
      <Text style={styles.sectionTitle}>All Users (Debug)</Text>
      {allUsers.map((user) => (
        <View key={user.id} style={styles.mentorCard}>
          <Text>Email: {user.email}</Text>
          <Text>Role: {user.role}</Text>
          <Text>Status: {user.status}</Text>
          <Text>ID: {user.id}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6c5ce7',
  },
  subtitle: {
    fontSize: 18,
    color: '#636e72',
    marginBottom: 24,
  },
  signoutButton: {
    backgroundColor: '#d63031',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  signoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6c5ce7',
    marginBottom: 10,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 16,
  },
  mentorCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mentorEmail: {
    fontSize: 16,
    color: '#2d3436',
    marginBottom: 8,
  },
  approveButton: {
    backgroundColor: '#00b894',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  approveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});