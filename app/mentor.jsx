import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

export default function MentorDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setStatus(userDoc.data().status);
      }
      setLoading(false);
    };
    fetchStatus();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  if (status !== 'approved') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Waitlisted</Text>
        <Text style={styles.subtitle}>Your mentor account is pending admin approval.</Text>
        <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
          <Text style={styles.signoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mentor Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, Mentor!</Text>
      <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
        <Text style={styles.signoutText}>Sign Out</Text>
      </TouchableOpacity>
      {/* Add mentor-specific features here */}
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0984e3',
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
});