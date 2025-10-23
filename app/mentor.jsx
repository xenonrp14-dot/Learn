import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const tabAnim = useState(new Animated.Value(0))[0];
  const [courseStats, setCourseStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const router = useRouter();

  const handleDeleteCourse = async (courseId) => {
    await deleteDoc(doc(db, 'courses', courseId));
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditDesc(course.description);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    await updateDoc(doc(db, 'courses', editingCourseId), {
      title: editTitle,
      description: editDesc,
    });
    setCourses(courses.map(c => c.id === editingCourseId ? { ...c, title: editTitle, description: editDesc } : c));
    setEditingCourseId(null);
    setSavingEdit(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const handleAddCourse = () => {
    router.push('/addCourse');
  };

  useEffect(() => {
    const fetchStatsAndNotifications = async () => {
      const stats = {};
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data());

      for (const course of courses) {
        let requestsCount = 0;
        let enrolledCount = 0;
        users.forEach(user => {
          if (Array.isArray(user.enrolled)) {
            user.enrolled.forEach(enroll => {
              if (enroll.id === course.id) {
                if (enroll.status === 'requested') requestsCount++;
                if (enroll.status === 'enrolled') enrolledCount++;
              }
            });
          }
        });
        stats[course.id] = { requests: requestsCount, enrolled: enrolledCount };
      }

      setCourseStats(stats);

      const notificationsArr = [];
      for (const course of courses) {
        if (stats[course.id]?.requests > 0) {
          notificationsArr.push({
            id: course.id,
            text: `You have ${stats[course.id].requests} new request(s) for "${course.title}".`
          });
        }
      }
      setNotifications(notificationsArr);
    };

    const fetchStatusAndCourses = async () => {
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

      const q = query(collection(db, 'courses'), where('mentorId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
      setCoursesLoading(false);
    };

    fetchStatusAndCourses();
    if (courses.length > 0) fetchStatsAndNotifications();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  return (
    <View style={[styles.glassContainer, { flex: 1 }]}>
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {auth.currentUser?.displayName?.[0]?.toUpperCase() ||
              auth.currentUser?.email?.[0]?.toUpperCase() || 'M'}
          </Text>
        </View>
        <TouchableOpacity style={styles.avatarEditBtn} onPress={() => router.push('/mentorProfile')}>
          <Text style={styles.avatarEditText}>Edit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mentor Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, Mentor!</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'courses' && styles.tabActive]}
          onPress={() => {
            setActiveTab('courses');
            Animated.spring(tabAnim, { toValue: 0, useNativeDriver: true }).start();
          }}>
          <MaterialCommunityIcons name="book-open-variant" size={28} color={activeTab === 'courses' ? '#27ae60' : '#b2bec3'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => {
            setActiveTab('notifications');
            Animated.spring(tabAnim, { toValue: 1, useNativeDriver: true }).start();
          }}>
          <Ionicons name="notifications" size={28} color={activeTab === 'notifications' ? '#27ae60' : '#b2bec3'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => {
            setActiveTab('analytics');
            Animated.spring(tabAnim, { toValue: 2, useNativeDriver: true }).start();
          }}>
          <MaterialCommunityIcons name="chart-bar" size={28} color={activeTab === 'analytics' ? '#27ae60' : '#b2bec3'} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, width: '100%' }}>
        {activeTab === 'courses' && (
          <View style={styles.glassCard}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
              <Text style={styles.addText}>Add Course</Text>
            </TouchableOpacity>

            {coursesLoading ? (
              <ActivityIndicator size="large" color="#27ae60" />
            ) : courses.length === 0 ? (
              <Text style={styles.subtitle}>No courses found.</Text>
            ) : (
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 32 }}>
                {courses.map(item => (
                  <View key={item.id} style={styles.courseCard}>
                    {editingCourseId === item.id ? (
                      <>
                        <Text style={styles.courseTitle}>Edit Course</Text>
                        <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Title" />
                        <TextInput style={styles.input} value={editDesc} onChangeText={setEditDesc} placeholder="Description" />
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={savingEdit}>
                          <Text style={styles.editText}>{savingEdit ? 'Saving...' : 'Save'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingCourseId(null)}>
                          <Text style={styles.editText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <Text style={styles.courseTitle}>{item.title}</Text>
                        <Text style={styles.courseDesc}>{item.description}</Text>
                        <Text style={styles.courseStatus}>{item.status || 'Active'}</Text>
                        <Text style={styles.analyticsText}>Requests: {courseStats[item.id]?.requests || 0} | Enrolled: {courseStats[item.id]?.enrolled || 0}</Text>
                        <View style={styles.rowBtns}>
                          <TouchableOpacity style={styles.editButton} onPress={() => handleEditCourse(item)}>
                            <Text style={styles.editText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCourse(item.id)}>
                            <Text style={styles.deleteText}>Delete</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.requestButton} onPress={() => router.push(`/courseRequests/${item.id}`)}>
                            <Text style={styles.requestText}>Requests</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {activeTab === 'notifications' && (
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.length === 0 ? (
              <Text style={styles.subtitle}>No notifications.</Text>
            ) : (
              notifications.map((note, idx) => (
                <Text key={idx} style={styles.notificationText}>{note.text}</Text>
              ))
            )}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            {Object.keys(courseStats).length === 0 ? (
              <Text style={styles.subtitle}>No analytics data.</Text>
            ) : (
              Object.entries(courseStats).map(([cid, stat]) => (
                <Text key={cid} style={styles.analyticsText}>{`Course ${cid}: Requests ${stat.requests}, Enrolled ${stat.enrolled}`}</Text>
              ))
            )}
          </View>
        )}
      </Animated.View>

      <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
        <Text style={styles.signoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaf6ff' },
  glassContainer: { alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#eaf6ff' },
  headerCard: { alignItems: 'center', paddingTop: 40 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#74b9ff', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  avatarEditBtn: { marginTop: 8, backgroundColor: '#0984e3', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 },
  avatarEditText: { color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#0984e3' },
  subtitle: { fontSize: 18, color: '#636e72', marginBottom: 16 },
  tabBar: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  tabBtn: { padding: 12, marginHorizontal: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)' },
  tabActive: { backgroundColor: '#dff9fb' },
  glassCard: { width: '90%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  courseCard: { backgroundColor: '#f5f6fa', borderRadius: 16, padding: 16, marginBottom: 12 },
  addButton: { backgroundColor: '#00b894', padding: 10, borderRadius: 8, marginBottom: 8 },
  addText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#0984e3' },
  courseDesc: { fontSize: 14, color: '#636e72', marginTop: 4 },
  courseStatus: { fontSize: 12, color: '#00b894', marginTop: 4 },
  analyticsText: { fontSize: 13, color: '#636e72', marginTop: 4 },
  editButton: { backgroundColor: '#0984e3', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20, marginRight: 8 },
  editText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#d63031', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20 },
  deleteText: { color: '#fff', fontWeight: 'bold' },
  requestButton: { backgroundColor: '#fdcb6e', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20 },
  requestText: { color: '#636e72', fontWeight: 'bold' },
  rowBtns: { flexDirection: 'row', marginTop: 8 },
  signoutButton: { backgroundColor: '#d63031', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, marginTop: 16 },
  signoutText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#636e72', marginBottom: 8 },
  notificationText: { color: '#0984e3', fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#636e72', borderRadius: 8, padding: 8, marginVertical: 4 },
  saveButton: { backgroundColor: '#00b894', borderRadius: 8, padding: 8, marginTop: 4 },
  cancelButton: { backgroundColor: '#636e72', borderRadius: 8, padding: 8, marginTop: 4 }
});
