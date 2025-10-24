import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Animation data
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

export default function MentorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('courses');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [courseStats, setCourseStats] = useState({});
  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return router.replace('/login');

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setStatus(userDoc.data().status);
      setLoading(false);

      const q = query(collection(db, 'courses'), where('mentorId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
      setCoursesLoading(false);

      // Calculate notifications
      const stats = {};
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data());
      const notificationsArr = [];
      data.forEach(course => {
        let requests = 0;
        let enrolled = 0;
        users.forEach(user => {
          if (Array.isArray(user.enrolled)) {
            user.enrolled.forEach(e => {
              if (e.id === course.id) {
                if (e.status === 'requested') requests++;
                if (e.status === 'enrolled') enrolled++;
              }
            });
          }
        });
        stats[course.id] = { requests, enrolled };
        if (requests > 0) notificationsArr.push({ id: course.id, text: `You have ${requests} new request(s) for "${course.title}".` });
      });
      setCourseStats(stats);
      setNotifications(notificationsArr);
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const handleTabPress = newTab => {
    if (newTab === activeTab) return;
    Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setActiveTab(newTab);
      Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleEditCourse = course => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditDesc(course.description);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    await updateDoc(doc(db, 'courses', editingCourseId), { title: editTitle, description: editDesc });
    setCourses(courses.map(c => (c.id === editingCourseId ? { ...c, title: editTitle, description: editDesc } : c)));
    setEditingCourseId(null);
    setSavingEdit(false);
  };

  const handleDeleteCourse = async id => {
    await deleteDoc(doc(db, 'courses', id));
    setCourses(courses.filter(c => c.id !== id));
  };

  const handleAddCourse = () => router.push('/addCourse');

  const starAnimatedStyle = (star, idx) => ({
    position: 'absolute',
    top: star.top,
    left: star.left,
    width: star.size,
    height: star.size,
    borderRadius: star.size / 2,
    backgroundColor: OFF_WHITE,
    opacity: starAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0.1, star.opacity] }),
    transform: [{ translateX: starAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() > 0.5 ? 80 : -80] }) }],
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
      { translateY: particleAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() > 0.5 ? 60 : -60] }) },
    ],
  });

  if (loading)
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );

  return (
    <View style={styles.container}>
      {STAR_DATA.map((star, idx) => (
        <Animated.View key={idx} style={starAnimatedStyle(star, idx)} />
      ))}
      {PARTICLE_DATA.map((p, idx) => (
        <Animated.View key={idx} style={particleAnimatedStyle(p, idx)} />
      ))}

      <View style={styles.topBar}>
        <Text style={styles.dashboardTitle}>Mentor Hub</Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/mentorProfile')}>
          <Ionicons name="person-circle-outline" size={30} color={ACCENT_GOLD} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity, paddingHorizontal: 20 }}>
        {status !== 'approved' && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingText}>
              Your account is pending admin approval. You will be notified once approved.
            </Text>
          </View>
        )}

        {status === 'approved' && (
          <>
            <View style={styles.bottomTabs}>
              <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('courses')}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={28}
                  color={activeTab === 'courses' ? ACCENT_GOLD : LIGHT_GREY}
                />
                <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>Courses</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('notifications')}>
                <Ionicons
                  name="notifications"
                  size={28}
                  color={activeTab === 'notifications' ? ACCENT_GOLD : LIGHT_GREY}
                />
                <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
                  Notifications
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('analytics')}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={28}
                  color={activeTab === 'analytics' ? ACCENT_GOLD : LIGHT_GREY}
                />
                <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabItem} onPress={handleSignOut}>
                <MaterialCommunityIcons name="logout" size={28} color={LIGHT_GREY} />
                <Text style={styles.tabText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'courses' && (
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
                  <Text style={styles.addText}>Add New Course</Text>
                </TouchableOpacity>
                {coursesLoading ? (
                  <ActivityIndicator size="large" color={ACCENT_GOLD} />
                ) : courses.length === 0 ? (
                  <Text style={styles.emptyText}>No courses found.</Text>
                ) : (
                  courses.map(course => (
                    <View key={course.id} style={styles.courseCard}>
                      {editingCourseId === course.id ? (
                        <>
                          <TextInput
                            style={styles.input}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Course Title"
                          />
                          <TextInput
                            style={styles.input}
                            value={editDesc}
                            onChangeText={setEditDesc}
                            placeholder="Course Description"
                          />
                          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={savingEdit}>
                            <Text style={styles.editText}>{savingEdit ? 'Saving...' : 'Save'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingCourseId(null)}>
                            <Text style={styles.editText}>Cancel</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Text style={styles.courseTitle}>{course.title}</Text>
                          <Text style={styles.courseDesc}>{course.description}</Text>
                          <Text style={styles.analyticsText}>
                            Requests: {courseStats[course.id]?.requests || 0} | Enrolled:{' '}
                            {courseStats[course.id]?.enrolled || 0}
                          </Text>
                          <View style={styles.rowBtns}>
                            <TouchableOpacity style={styles.editButton} onPress={() => handleEditCourse(course)}>
                              <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCourse(course.id)}>
                              <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.requestButton}
                              onPress={() => router.push(`/courseRequests/${course.id}`)}
                            >
                              <Text style={styles.requestText}>Requests</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            {activeTab === 'notifications' && (
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyText}>No notifications.</Text>
                ) : (
                  notifications.map((n, idx) => <Text key={idx} style={styles.notificationText}>{n.text}</Text>)
                )}
              </ScrollView>
            )}

            {activeTab === 'analytics' && (
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                {Object.keys(courseStats).length === 0 ? (
                  <Text style={styles.emptyText}>No analytics data.</Text>
                ) : (
                  Object.entries(courseStats).map(([cid, stat]) => (
                    <Text key={cid} style={styles.analyticsText}>
                      Course {cid}: Requests {stat.requests}, Enrolled {stat.enrolled}
                    </Text>
                  ))
                )}
              </ScrollView>
            )}
          </>
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
  courseCard: { backgroundColor: 'rgba(250,250,250,0.95)', borderRadius: 16, padding: 16, marginBottom: 12 },
  courseTitle: { fontSize: 17, fontWeight: '700', color: PRIMARY_GREEN },
  courseDesc: { fontSize: 14, color: '#333', marginTop: 4 },
  analyticsText: { fontSize: 13, color: '#333', marginTop: 4 },
  emptyText: { color: LIGHT_GREY, textAlign: 'center', marginTop: 20, fontSize: 16, opacity: 0.8 },
  notificationText: { color: OFF_WHITE, marginBottom: 10 },
  pendingContainer: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: ACCENT_GOLD },
  pendingText: { color: ACCENT_GOLD, fontWeight: 'bold', textAlign: 'center', fontSize: 15 },
  addButton: { backgroundColor: ACCENT_GOLD, borderRadius: 8, padding: 10, marginBottom: 12 },
  addText: { textAlign: 'center', fontWeight: 'bold', color: PRIMARY_GREEN },
  rowBtns: { flexDirection: 'row', marginTop: 8 },
  editButton: { backgroundColor: PRIMARY_GREEN, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20, marginRight: 8 },
  editText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#d63031', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20 },
  deleteText: { color: '#fff', fontWeight: 'bold' },
  requestButton: { backgroundColor: '#fdcb6e', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20 },
  requestText: { color: '#333', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 8, marginVertical: 4 },
  saveButton: { backgroundColor: '#00b894', borderRadius: 8, padding: 8, marginTop: 4 },
  cancelButton: { backgroundColor: '#636e72', borderRadius: 8, padding: 8, marginTop: 4 },
});
