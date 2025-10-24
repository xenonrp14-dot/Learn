import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Animation setup
const NUM_STARS = 20;
const STAR_DATA = Array.from({ length: NUM_STARS }).map(() => ({
  top: Math.random() * height,
  left: Math.random() * width,
  opacity: 0.2 + Math.random() * 0.4,
  size: 2 + Math.random() * 3,
  duration: 15000 + Math.random() * 15000,
}));

const NUM_PARTICLES = 12;
const PARTICLE_DATA = Array.from({ length: NUM_PARTICLES }).map(() => ({
  top: Math.random() * height,
  left: Math.random() * width,
  size: 20 + Math.random() * 40,
  duration: 20000 + Math.random() * 20000,
}));

const PRIMARY_GREEN = '#1D4A3D';
const OFF_WHITE = '#FAFAFA';
const ACCENT_GOLD = '#FBBF24';
const LIGHT_GREY = '#F0F4F7';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pendingMentors, setPendingMentors] = useState([]);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const starAnims = useRef(STAR_DATA.map(() => new Animated.Value(Math.random()))).current;
  const particleAnims = useRef(PARTICLE_DATA.map(() => new Animated.Value(0))).current;

  // Animate stars
  useEffect(() => {
    starAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: STAR_DATA[idx].duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: STAR_DATA[idx].duration, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  // Animate particles
  useEffect(() => {
    particleAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: PARTICLE_DATA[idx].duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: PARTICLE_DATA[idx].duration, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  // Fetch all users and pending mentors
  useEffect(() => {
    const fetchData = async () => {
      const userSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(allUsers);

      const pending = allUsers.filter(u => u.role === 'mentor' && u.status !== 'approved');
      setPendingMentors(pending);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const handleTabPress = (newTab) => {
    if (newTab === activeTab) return;
    Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setActiveTab(newTab);
      Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const starAnimatedStyle = (star, idx) => ({
    position: 'absolute',
    top: star.top,
    left: star.left,
    width: star.size,
    height: star.size,
    borderRadius: star.size / 2,
    backgroundColor: OFF_WHITE,
    opacity: starAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0.1, star.opacity] }),
    transform: [{ translateX: starAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() > 0.5 ? 80 : -80] }) }]
  });

  const particleAnimatedStyle = (particle, idx) => ({
    position: 'absolute',
    top: particle.top,
    left: particle.left,
    width: particle.size,
    height: particle.size,
    borderRadius: particle.size / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    opacity: particleAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.25] }),
    transform: [
      { translateX: particleAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() > 0.5 ? 60 : -60] }) },
      { translateY: particleAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() > 0.5 ? 60 : -60] }) }
    ]
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={ACCENT_GOLD} /></View>;

  return (
    <View style={styles.container}>
      {STAR_DATA.map((star, idx) => <Animated.View key={idx} style={starAnimatedStyle(star, idx)} />)}
      {PARTICLE_DATA.map((p, idx) => <Animated.View key={idx} style={particleAnimatedStyle(p, idx)} />)}

      <View style={styles.topBar}>
        <Text style={styles.dashboardTitle}>Admin Hub</Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/adminProfile')}>
          <Ionicons name="person-circle-outline" size={30} color={ACCENT_GOLD} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity, paddingHorizontal: 20 }}>
        <View style={styles.bottomTabs}>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('users')}>
            <MaterialCommunityIcons name="account-group-outline" size={28} color={activeTab === 'users' ? ACCENT_GOLD : LIGHT_GREY} />
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('pending')}>
            <Ionicons name="time-outline" size={28} color={activeTab === 'pending' ? ACCENT_GOLD : LIGHT_GREY} />
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending Mentors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={handleSignOut}>
            <MaterialCommunityIcons name="logout" size={28} color={LIGHT_GREY} />
            <Text style={styles.tabText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'users' && (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {users.length === 0 ? <Text style={styles.emptyText}>No users found.</Text> :
              users.map(u => (
                <View key={u.id} style={styles.userCard}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userRole}>{u.role}</Text>
                  <Text style={styles.userStatus}>{u.status || 'N/A'}</Text>
                </View>
              ))
            }
          </ScrollView>
        )}

        {activeTab === 'pending' && (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {pendingMentors.length === 0 ? <Text style={styles.emptyText}>No pending mentors.</Text> :
              pendingMentors.map(u => (
                <View key={u.id} style={styles.userCard}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userRole}>{u.role}</Text>
                  <Text style={styles.userStatus}>{u.status || 'Pending'}</Text>
                </View>
              ))
            }
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN, paddingTop: 48 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  dashboardTitle: { fontSize: 26, fontWeight: '800', color: OFF_WHITE, letterSpacing: 0.5 },
  profileButton: { padding: 5, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  bottomTabs: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, backgroundColor: PRIMARY_GREEN, borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: 1 },
  tabItem: { alignItems: 'center', padding: 5 },
  tabText: { color: LIGHT_GREY, fontSize: 11, marginTop: 4, fontWeight: '600' },
  tabTextActive: { color: ACCENT_GOLD, fontWeight: '700' },
  userCard: { backgroundColor: 'rgba(250,250,250,0.95)', borderRadius: 16, padding: 16, marginBottom: 12 },
  userName: { fontSize: 17, fontWeight: '700', color: PRIMARY_GREEN },
  userRole: { fontSize: 14, color: '#333', marginTop: 2 },
  userStatus: { fontSize: 13, color: '#666', marginTop: 2 },
  emptyText: { color: LIGHT_GREY, textAlign: 'center', marginTop: 40, fontSize: 16, opacity: 0.8 },
});
