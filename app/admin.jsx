const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
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
  profileButton: {
    backgroundColor: '#00b894',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  profileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#636e72',
  },
  emptyText: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 12,
    textAlign: 'center',
  },
  mentorCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#636e72',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mentorEmail: {
    fontSize: 16,
    color: '#0984e3',
    marginBottom: 8,
  },
  approveButton: {
    backgroundColor: '#00b894',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  approveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tabBtn: {
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tabActive: {
    backgroundColor: '#dff9fb',
  },
  glassCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  refreshButton: {
    backgroundColor: '#0984e3',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const router = useRouter();
  const [waitlist, setWaitlist] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('waitlist');
  const tabAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchWaitlist = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'mentor'), where('status', '==', 'waitlisted'));
      const querySnapshot = await getDocs(q);
      const mentors = [];
      querySnapshot.forEach((docSnap) => {
        mentors.push({ id: docSnap.id, ...docSnap.data() });
      });
      setWaitlist(mentors);
    };
    const fetchAllUsers = async () => {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllUsers(users);
    };
    Promise.all([fetchWaitlist(), fetchAllUsers()]).then(() => setLoading(false));
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
    <View style={[styles.container, { flex: 1 }] }>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, Admin!</Text>
      <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/adminProfile')}>
        <Text style={styles.profileText}>Profile</Text>
      </TouchableOpacity>
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

  {/* ...existing code... */}
      <View style={[styles.container, { flex: 1 }] }>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'waitlist' && styles.tabActive]} onPress={() => {
            setActiveTab('waitlist');
            Animated.spring(tabAnim, { toValue: 0, useNativeDriver: true }).start();
          }}>
            <MaterialCommunityIcons name="account-clock" size={28} color={activeTab === 'waitlist' ? '#27ae60' : '#b2bec3'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'users' && styles.tabActive]} onPress={() => {
            setActiveTab('users');
            Animated.spring(tabAnim, { toValue: 1, useNativeDriver: true }).start();
          }}>
            <Ionicons name="people" size={28} color={activeTab === 'users' ? '#27ae60' : '#b2bec3'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'profile' && styles.tabActive]} onPress={() => {
            setActiveTab('profile');
            Animated.spring(tabAnim, { toValue: 2, useNativeDriver: true }).start();
          }}>
            <MaterialCommunityIcons name="account" size={28} color={activeTab === 'profile' ? '#27ae60' : '#b2bec3'} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ flex: 1, width: '100%', transform: [{ translateX: tabAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, -20, -40] }) }] }}>
          {activeTab === 'waitlist' && (
            <View style={styles.glassCard}>
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
            </View>
          )}
          {activeTab === 'users' && (
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>All Users</Text>
              {allUsers.map((user) => (
                <View key={user.id} style={styles.mentorCard}>
                  <Text>Email: {user.email}</Text>
                  <Text>Role: {user.role}</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={() => { setLoading(true); setTimeout(() => { window.location.reload(); }, 100); }}>
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
                  <Text>ID: {user.id}</Text>
                </View>
              ))}
            </View>
          )}
          {activeTab === 'profile' && (
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/adminProfile')}>
                <Text style={styles.profileText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
                <Text style={styles.signoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}
