import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList } from 'react-native';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const tabAnim = useState(new Animated.Value(0))[0];
  const [allCourses, setAllCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllCourses = async () => {
      const snapshot = await getDocs(collection(db, 'courses'));
      setAllCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchAllCourses();
    const fetchPrograms = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setPrograms(userDoc.data().enrolled || []);
      }
      setLoading(false);
    };
    fetchPrograms();
  }, []);

  const handleEnroll = async (course) => {
    setEnrollingId(course.id);
    const user = auth.currentUser;
    if (!user) return;
    // Check if already requested/enrolled
    const already = programs.find(p => p.id === course.id);
    if (already) {
      if (already.status === 'rejected') {
        // Check if 2 days passed since rejection
        const now = Date.now();
        const rejectedAt = already.rejectedAt ? new Date(already.rejectedAt).getTime() : 0;
        if (now - rejectedAt < 2 * 24 * 60 * 60 * 1000) {
          Alert.alert('Wait', 'You can reapply after 2 days from rejection.');
          setEnrollingId(null);
          return;
        }
      } else {
        Alert.alert('Already Requested', 'You have already requested or enrolled in this program.');
        setEnrollingId(null);
        return;
      }
    }
    await updateDoc(doc(db, 'users', user.uid), {
      enrolled: arrayUnion({ title: course.title, status: 'requested', id: course.id })
    });
    setPrograms([...programs, { title: course.title, status: 'requested', id: course.id }]);
    setEnrollingId(null);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
  <View style={[styles.container, { flex: 1 }] }>
    <Text style={styles.title}>Student Dashboard</Text>
    <View style={styles.tabBar}>
      <TouchableOpacity style={[styles.tabBtn, activeTab === 'courses' && styles.tabActive]} onPress={() => {
        setActiveTab('courses');
        Animated.spring(tabAnim, { toValue: 0, useNativeDriver: true }).start();
      }}>
        <MaterialCommunityIcons name="book-open-variant" size={28} color={activeTab === 'courses' ? '#27ae60' : '#b2bec3'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tabBtn, activeTab === 'programs' && styles.tabActive]} onPress={() => {
        setActiveTab('programs');
        Animated.spring(tabAnim, { toValue: 1, useNativeDriver: true }).start();
      }}>
        <Ionicons name="school" size={28} color={activeTab === 'programs' ? '#27ae60' : '#b2bec3'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tabBtn, activeTab === 'profile' && styles.tabActive]} onPress={() => {
        setActiveTab('profile');
        Animated.spring(tabAnim, { toValue: 2, useNativeDriver: true }).start();
      }}>
        <MaterialCommunityIcons name="account" size={28} color={activeTab === 'profile' ? '#27ae60' : '#b2bec3'} />
      </TouchableOpacity>
    </View>
    <Animated.View style={{ flex: 1, width: '100%', transform: [{ translateX: tabAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, -20, -40] }) }] }}>
      {activeTab === 'courses' && (
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Search Courses</Text>
          <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Search by title..." />
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 32 }}>
            {allCourses.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(item => (
              <View key={item.id} style={styles.programCard}>
                <Text style={styles.programTitle}>{item.title}</Text>
                <Text style={styles.programStatus}>{item.status || 'Active'}</Text>
                <TouchableOpacity
                  style={styles.enrollButton}
                  onPress={() => handleEnroll(item)}
                  disabled={enrollingId === item.id || programs.some(p => p.id === item.id && p.status !== 'rejected')}
                >
                  <Text style={styles.enrollText}>
                    {enrollingId === item.id
                      ? 'Requesting...'
                      : programs.some(p => p.id === item.id && p.status === 'requested')
                      ? 'Requested'
                      : programs.some(p => p.id === item.id && p.status === 'enrolled')
                      ? 'Enrolled'
                      : programs.some(p => p.id === item.id && p.status === 'rejected')
                      ? 'Rejected (Reapply in 2 days)'
                      : 'Request/Enroll'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      {activeTab === 'programs' && (
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>My Programs</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#fdcb6e" />
          ) : (
            programs.length === 0 ? (
              <Text style={styles.subtitle}>No programs found.</Text>
            ) : (
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 32 }}>
                {programs.map((item, idx) => (
                  <View key={idx} style={styles.programCard}>
                    <Text style={styles.programTitle}>{item.title}</Text>
                    <Text style={styles.programStatus}>{item.status === 'enrolled' ? 'Enrolled' : 'Requested'}</Text>
                  </View>
                ))}
              </ScrollView>
            )
          )}
        </View>
      )}
      {activeTab === 'profile' && (
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/studentProfile')}>
            <Text style={styles.profileText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
            <Text style={styles.signoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
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
  input: {
    width: '100%',
    height: 40,
    borderColor: '#636e72',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f5f6fa',
    fontSize: 16,
  },
  enrollButton: {
    backgroundColor: '#0984e3',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  enrollText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#636e72',
  },
  programCard: {
    backgroundColor: '#f5f6fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#636e72',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fdcb6e',
  },
  programStatus: {
    fontSize: 12,
    color: '#00b894',
    marginTop: 4,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fdcb6e',
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
});