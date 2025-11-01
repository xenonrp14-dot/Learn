import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mentorMap, setMentorMap] = useState({});
  const [pendingMentors, setPendingMentors] = useState([]);
  const [showUserDeleteConfirm, setShowUserDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showCourseDeleteConfirm, setShowCourseDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Animation refs and effects for stars
  const starAnims = React.useMemo(() => STAR_DATA.map(() => new Animated.Value(0)), []);
  useEffect(() => {
    starAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: STAR_DATA[idx].duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: STAR_DATA[idx].duration, useNativeDriver: true }),
        ])
      ).start();
    });
  }, [starAnims]);

  // Animation refs and effects for particles
  const particleAnims = React.useMemo(() => PARTICLE_DATA.map(() => new Animated.Value(0)), []);
  useEffect(() => {
    particleAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: PARTICLE_DATA[idx].duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: PARTICLE_DATA[idx].duration, useNativeDriver: true }),
        ])
      ).start();
    });
  }, [particleAnims]);

  // Animation style helpers
  const starAnimatedStyle = (star, idx) => ({
    position: 'absolute',
    top: star.top,
    left: star.left,
    width: star.size,
    height: star.size,
    borderRadius: star.size / 2,
    backgroundColor: OFF_WHITE,
    opacity: Animated.add(star.opacity, starAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] })),
  });

  const particleAnimatedStyle = (p, idx) => ({
    position: 'absolute',
    top: p.top,
    left: p.left,
    width: p.size,
    height: p.size,
    borderRadius: p.size / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [
      {
        translateY: particleAnims[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -50],
        }),
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = userSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(allUsers.filter((u) => u.status !== 'waitlisted'));
  const pending = allUsers.filter((u) => u.role === 'mentor' && u.status !== 'approved' && u.status !== 'disapproved');
      setPendingMentors(pending);

      const courseSnapshot = await getDocs(collection(db, 'courses'));
      const courseList = courseSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCourses(courseList);

      // Build mentorId -> name map
      const mentorIds = Array.from(new Set(courseList.map(c => c.mentorId).filter(Boolean)));
      const mentorMapObj = {};
      mentorIds.forEach(id => {
        const user = allUsers.find(u => u.id === id);
        mentorMapObj[id] = user ? (user.fullName || user.name || user.email || id) : id;
      });
      setMentorMap(mentorMapObj);

      setLoading(false);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      Alert.alert('Error', 'Failed to load data.');
      setLoading(false);
    }
  };

  const handleTabPress = (tab) => setActiveTab(tab);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT_GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated background */}
      {STAR_DATA.map((star, idx) => (
        <Animated.View key={idx} style={starAnimatedStyle(star, idx)} />
      ))}
      {PARTICLE_DATA.map((p, idx) => (
        <Animated.View key={idx} style={particleAnimatedStyle(p, idx)} />
      ))}

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.dashboardTitle}>Admin Hub</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ marginRight: 12, padding: 5, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }}
            onPress={fetchData}
          >
            <Ionicons name="refresh" size={26} color={ACCENT_GOLD} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/adminProfile')}>
            <Ionicons name="person-circle-outline" size={30} color={ACCENT_GOLD} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs and content */}
      <Animated.View style={{ flex: 1, opacity: contentOpacity, paddingHorizontal: 20 }}>
        <View style={{ flex: 1 }}>
          {/* Tabs */}
          <View style={styles.bottomTabs}>
            <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('users')}>
              <MaterialCommunityIcons name="account-group-outline" size={28} color={activeTab === 'users' ? ACCENT_GOLD : LIGHT_GREY} />
              <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('pending')}>
              <Ionicons name="time-outline" size={28} color={activeTab === 'pending' ? ACCENT_GOLD : LIGHT_GREY} />
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending Mentors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('courses')}>
              <MaterialCommunityIcons name="book-open-variant" size={28} color={activeTab === 'courses' ? ACCENT_GOLD : LIGHT_GREY} />
              <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={handleSignOut}>
              <MaterialCommunityIcons name="logout" size={28} color={LIGHT_GREY} />
              <Text style={styles.tabText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Users */}
          {activeTab === 'users' && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                {users.length === 0 ? (
                  <Text style={styles.emptyText}>No users found.</Text>
                ) : (
                  users.map((u) => (
                    <View key={u.id} style={styles.userCard}>
                      <Text style={styles.userName}>{u.fullName || u.name || 'No Name'}</Text>
                      <Text style={styles.userRole}>Role: {u.role}</Text>
                      <Text style={styles.userStatus}>Status: {u.status || 'N/A'}</Text>
                      <Text style={styles.userStatus}>Email: {u.email || 'N/A'}</Text>
                      {u.role === 'mentor' && <Text style={styles.userStatus}>Organization: {u.organization || 'N/A'}</Text>}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          setUserToDelete(u);
                          setShowUserDeleteConfirm(true);
                        }}
                      >
                        <Text style={{ color: OFF_WHITE, fontWeight: 'bold', fontSize: 15 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Confirm delete user */}
              {showUserDeleteConfirm && userToDelete && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: OFF_WHITE, borderRadius: 16, padding: 24, width: '80%' }}>
                    <Text style={{ color: PRIMARY_GREEN, fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Delete User?</Text>
                    <Text style={{ color: '#333', fontSize: 15, marginBottom: 18 }}>
                      Are you sure you want to delete "{userToDelete.fullName || userToDelete.name || userToDelete.email}"? This action cannot be undone.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        style={{ backgroundColor: LIGHT_GREY, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18, marginRight: 8 }}
                        onPress={() => {
                          setShowUserDeleteConfirm(false);
                          setUserToDelete(null);
                        }}
                      >
                        <Text style={{ color: PRIMARY_GREEN, fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ backgroundColor: '#d63031', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18 }}
                        onPress={async () => {
                          try {
                            await deleteDoc(doc(db, 'users', userToDelete.id));
                            if (userToDelete.role === 'mentor') {
                              const coursesSnap = await getDocs(collection(db, 'courses'));
                              const mentorCourses = coursesSnap.docs.filter((c) => c.data().mentorId === userToDelete.id);
                              for (const c of mentorCourses) {
                                await deleteDoc(doc(db, 'courses', c.id));
                              }
                            }
                            setUsers((prev) => prev.filter((x) => x.id !== userToDelete.id));
                            setShowUserDeleteConfirm(false);
                            setUserToDelete(null);
                            Alert.alert('Deleted', 'User has been deleted.');
                          } catch {
                            Alert.alert('Error', 'Failed to delete user or their courses.');
                          }
                        }}
                      >
                        <Text style={{ color: OFF_WHITE, fontWeight: 'bold', fontSize: 15 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Courses */}
          {activeTab === 'courses' && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                {courses.length === 0 ? (
                  <Text style={styles.emptyText}>No courses found.</Text>
                ) : (
                  courses.map((course) => (
                    <View key={course.id} style={styles.userCard}>
                      <Text style={styles.userName}>{course.title || 'No Title'}</Text>
                      <Text style={styles.userStatus}>Description: {course.description || 'N/A'}</Text>
                      <Text style={styles.userStatus}>Mentor: {course.mentorName || mentorMap[course.mentorId] || course.mentorId || 'N/A'}</Text>
                      <Text style={styles.userStatus}>
                        Created: {course.createdAt && course.createdAt.seconds ? new Date(course.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          setCourseToDelete(course);
                          setShowCourseDeleteConfirm(true);
                        }}
                      >
                        <Text style={{ color: OFF_WHITE, fontWeight: 'bold', fontSize: 15 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Confirm delete course */}
              {showCourseDeleteConfirm && courseToDelete && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: OFF_WHITE, borderRadius: 16, padding: 24, width: '80%' }}>
                    <Text style={{ color: PRIMARY_GREEN, fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Delete Course?</Text>
                    <Text style={{ color: '#333', fontSize: 15, marginBottom: 18 }}>
                      Are you sure you want to delete "{courseToDelete.title}"? This action cannot be undone.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        style={{ backgroundColor: LIGHT_GREY, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18, marginRight: 8 }}
                        onPress={() => {
                          setShowCourseDeleteConfirm(false);
                          setCourseToDelete(null);
                        }}
                      >
                        <Text style={{ color: PRIMARY_GREEN, fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ backgroundColor: '#d63031', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18 }}
                        onPress={async () => {
                          try {
                            await deleteDoc(doc(db, 'courses', courseToDelete.id));
                            setCourses((prev) => prev.filter((x) => x.id !== courseToDelete.id));
                            setShowCourseDeleteConfirm(false);
                            setCourseToDelete(null);
                            Alert.alert('Deleted', 'Course has been deleted.');
                          } catch {
                            Alert.alert('Error', 'Failed to delete course.');
                          }
                        }}
                      >
                        <Text style={{ color: OFF_WHITE, fontWeight: 'bold', fontSize: 15 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Pending Mentors */}
          {activeTab === 'pending' && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                {pendingMentors.length === 0 ? (
                  <Text style={styles.emptyText}>No pending mentors.</Text>
                ) : (
                  pendingMentors.map((u) => (
                    <View key={u.id} style={styles.userCard}>
                      <Text style={styles.userName}>{u.name || u.fullName || 'No Name'}</Text>
                      <Text style={styles.userRole}>Role: {u.role}</Text>
                      <Text style={styles.userStatus}>Email: {u.email || 'N/A'}</Text>
                      <Text style={styles.userStatus}>Organization: {u.organization || 'N/A'}</Text>
                      <Text style={styles.userStatus}>Status: {u.status || 'Pending'}</Text>
                      <View style={{ flexDirection: 'row', marginTop: 8 }}>
                        <TouchableOpacity
                          style={[styles.deleteBtn, { backgroundColor: ACCENT_GOLD, marginRight: 8 }]}
                          onPress={async () => {
                            try {
                              await updateDoc(doc(db, 'users', u.id), { status: 'approved' });
                              setPendingMentors((prev) => prev.filter((m) => m.id !== u.id));
                              Alert.alert('Approved', 'Mentor has been approved.');
                            } catch {
                              Alert.alert('Error', 'Failed to approve mentor.');
                            }
                          }}
                        >
                          <Text style={{ color: PRIMARY_GREEN, fontWeight: 'bold', fontSize: 15 }}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deleteBtn, { backgroundColor: ACCENT_GOLD }]}
                          onPress={async () => {
                            try {
                              await updateDoc(doc(db, 'users', u.id), { status: 'disapproved' });
                              setPendingMentors((prev) => prev.filter((m) => m.id !== u.id));
                              Alert.alert('Disapproved', 'Mentor has been disapproved.');
                            } catch {
                              Alert.alert('Error', 'Failed to disapprove mentor.');
                            }
                          }}
                        >
                          <Text style={{ color: PRIMARY_GREEN, fontWeight: 'bold', fontSize: 15 }}>Disapprove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteBtn: {
    backgroundColor: '#d63031',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    paddingTop: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: OFF_WHITE,
    letterSpacing: 0.5,
  },
  profileButton: {
    padding: 5,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bottomTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: PRIMARY_GREEN,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    padding: 5,
  },
  tabText: {
    color: LIGHT_GREY,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  tabTextActive: {
    color: ACCENT_GOLD,
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: 'rgba(250,250,250,0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY_GREEN,
  },
  userRole: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  userStatus: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    color: LIGHT_GREY,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    opacity: 0.8,
  },
});
