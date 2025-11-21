// app/mentor-dashboard.jsx
import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

/* -----------------------
   Student theme / palette
   ----------------------- */
const COLORS = {
  PRIMARY_GREEN: '#0B3B2E',
  ACCENT: '#14B8A6',
  GOLD: '#FBBF24',
  OFF_WHITE: '#FAFAFA',
  CARD_START: '#053025',
  CARD_END: '#0D9488',
  STAR: '#E6F7FF',
  BG: '#07110D',
};

const STAR_COUNT = 26;
const PARTICLE_COUNT = 12;

export default function MentorDashboard() {
  const router = useRouter();

  // ----- state & refs -----
  const [showEnrolledModal, setShowEnrolledModal] = useState(false);
  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editOrganisation, setEditOrganisation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [courseStats, setCourseStats] = useState({});
  const [notifications, setNotifications] = useState([]);

  // two-step logout (student pattern)
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutConfirmStep, setLogoutConfirmStep] = useState(false);

  // two-step delete course modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // animations
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Stars & particles (precomputed)
  const stars = useRef(
    Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width,
      yBase: Math.random() * (height * 0.6),
      size: 0.8 + Math.random() * 2.4,
      twinkle: new Animated.Value(Math.random()),
      drift: new Animated.Value(Math.random() * 2 - 1),
      speed: 8000 + Math.random() * 9000,
    }))
  ).current;

  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.8,
      size: 12 + Math.random() * 36,
      anim: new Animated.Value(Math.random()),
      duration: 9000 + Math.random() * 9000,
    }))
  ).current;

  useEffect(() => {
    // Stars: twinkle + drift
    stars.forEach((s) => {
      const twinkleLoop = () => {
        Animated.sequence([
          Animated.timing(s.twinkle, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 600 + Math.random() * 1400,
            useNativeDriver: true,
          }),
          Animated.timing(s.twinkle, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 600 + Math.random() * 1400,
            useNativeDriver: true,
          }),
        ]).start(twinkleLoop);
      };
      twinkleLoop();

      const driftLoop = () => {
        s.drift.setValue(-1);
        Animated.timing(s.drift, {
          toValue: 1,
          duration: s.speed,
          useNativeDriver: true,
        }).start(driftLoop);
      };
      driftLoop();
    });

    // Particles float
    particles.forEach((p) => {
      const float = () => {
        Animated.sequence([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: p.duration,
            useNativeDriver: true,
          }),
        ]).start(float);
      };
      float();
    });
  }, []);

  /* ------------------- Data fetch ------------------- */
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setStatus(userDoc.data().status);
      setLoading(false);

      const q = query(collection(db, 'courses'), where('mentorId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(data);
      setCoursesLoading(false);

      // Fetch all users and store in state
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(allUsers);

      // Calculate notifications & stats
      const stats = {};
      const notificationsArr = [];
      data.forEach(course => {
        let requests = 0;
        let enrolled = 0;
        allUsers.forEach(u => {
          if (Array.isArray(u.enrolled)) {
            u.enrolled.forEach(e => {
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

  /* ------------------- Auth / signout ------------------- */
  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  /* ------------------- Edit / Save / Delete / Add ------------------- */
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
    setEditDuration(course.duration || '');
    setEditOrganisation(course.organisation || '');
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    await updateDoc(doc(db, 'courses', editingCourseId), {
      title: editTitle,
      description: editDesc,
      duration: editDuration,
      organisation: editOrganisation,
    });
    setCourses(courses.map(c => (c.id === editingCourseId ? { ...c, title: editTitle, description: editDesc, duration: editDuration, organisation: editOrganisation } : c)));
    setEditingCourseId(null);
    setSavingEdit(false);
  };

  const handleDeleteCourse = async (id) => {
    await deleteDoc(doc(db, 'courses', id));
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCourse = () => router.push('/addCourse');

  /* ------------------- Course card component (shape preserved, semi-transparent glass) ------------------- */
  const CourseCard = ({ course }) => {
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.01, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, []);

    return (
      <Animated.View style={{ transform: [{ scale }], marginBottom: 14 }}>
        {/* Glass card: semi-transparent gradient overlay with inner soft border */}
        <LinearGradient
          colors={['rgba(8,30,25,0.32)', 'rgba(13,148,136,0.12)']} // subtle translucent gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumCard}
        >
          {/* Delete button (red) */}
          {editingCourseId !== course.id && (
            <TouchableOpacity
              style={styles.topRightDelete}
              onPress={() => {
                setDeleteTargetId(course.id);
                setDeleteConfirmStep(false);
                setDeleteOpen(true);
              }}
            >
              <Text style={styles.topRightDeleteText}>Delete</Text>
            </TouchableOpacity>
          )}

          {editingCourseId === course.id ? (
            <>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Course Title"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <TextInput
                style={styles.input}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Course Description"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <TextInput
                style={styles.input}
                value={editDuration}
                onChangeText={setEditDuration}
                placeholder="Duration (e.g. 6 weeks)"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <TextInput
                style={styles.input}
                value={editOrganisation}
                onChangeText={setEditOrganisation}
                placeholder="Organisation"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={savingEdit}>
                <Text style={styles.saveButtonText}>{savingEdit ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingCourseId(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.cardTop}>
                <Text numberOfLines={2} style={styles.premiumTitle}>{course.title}</Text>
                <View style={[styles.badge, { borderColor: COLORS.GOLD }]}>
                  <Text style={[styles.badgeText, { color: COLORS.GOLD }]}>Mentor</Text>
                </View>
              </View>

              <Text numberOfLines={2} style={styles.premiumDesc}>{course.description || 'No description available.'}</Text>

              {/* Requests & Enrolled badges inside card (glass badges) */}
              <View style={styles.innerStatsRow}>
                <View style={styles.glassStat}>
                  <Text style={styles.glassStatLabel}>Requests</Text>
                  <Text style={styles.glassStatValue}>{courseStats[course.id]?.requests || 0}</Text>
                </View>
                <View style={styles.glassStat}>
                  <Text style={styles.glassStatLabel}>Enrolled</Text>
                  <Text style={styles.glassStatValue}>{courseStats[course.id]?.enrolled || 0}</Text>
                </View>
              </View>

              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEditCourse(course)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={() => router.push(`/courseRequests/${course.id}`)}
                >
                  <Text style={styles.requestText}>Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.requestButton, { backgroundColor: COLORS.GOLD, marginLeft: 8 }]}
                  onPress={() => {
                    setEnrolledCourse(course);
                    setShowEnrolledModal(true);
                  }}
                >
                  <Text style={{ color: COLORS.PRIMARY_GREEN, fontWeight: 'bold', fontSize: 15 }}>Enrolled</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  /* ------------------- Render ------------------- */
  return (
    <View style={styles.container}>
      {/* Background stars & particles */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[COLORS.BG, COLORS.BG]} style={StyleSheet.absoluteFill} />
        {particles.map((p, i) => {
          const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });
          const translateX = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
          return (
            <Animated.View
              key={`p-${i}`}
              style={{
                position: 'absolute',
                top: p.y,
                left: p.x,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: 'rgba(20,184,166,0.06)',
                transform: [{ translateY }, { translateX }],
                zIndex: 0,
              }}
            />
          );
        })}

        {stars.map((s, i) => {
          const opacity = s.twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.95] });
          const driftX = s.drift.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
          return (
            <Animated.View
              key={`star-${i}`}
              style={{
                position: 'absolute',
                top: s.yBase,
                left: s.x,
                width: s.size,
                height: s.size,
                borderRadius: s.size / 2,
                backgroundColor: COLORS.STAR,
                opacity,
                transform: [{ translateX: driftX }],
                zIndex: 0,
              }}
            />
          );
        })}
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.dashboardTitle}>Mentor Hub</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/mentorProfile')}>
            <Ionicons name="person-circle-outline" size={30} color={COLORS.GOLD} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => { setLogoutOpen(true); setLogoutConfirmStep(false); }}>
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.OFF_WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs (analytics removed) */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'courses' && styles.tabActive]} onPress={() => handleTabPress('courses')}>
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'notifications' && styles.tabActive]} onPress={() => handleTabPress('notifications')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>Notifications</Text>
            {notifications.length > 0 && (
              <View style={styles.notifyBadge}>
                <Text style={styles.notifyBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </View>
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
            {activeTab === 'courses' && (
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
                  <Text style={styles.addText}>Add New Course</Text>
                </TouchableOpacity>

                {coursesLoading ? (
                  <ActivityIndicator size="large" color={COLORS.GOLD} />
                ) : courses.length === 0 ? (
                  <Text style={styles.emptyText}>No courses found.</Text>
                ) : (
                  courses.map(c => <CourseCard key={c.id} course={c} />)
                )}

                {/* Enrolled Students Modal */}
                {showEnrolledModal && enrolledCourse && (
                  <Modal transparent animationType="fade" visible={showEnrolledModal}>
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalCard}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                          <Text style={styles.modalHeader}>{enrolledCourse.title} - Enrolled Students</Text>
                          {(() => {
                            const enrolledUsers = [];
                            users.forEach(u => {
                              if (Array.isArray(u.enrolled)) {
                                u.enrolled.forEach(e => {
                                  if (e.id === enrolledCourse.id && e.status === 'enrolled') {
                                    enrolledUsers.push(u);
                                  }
                                });
                              }
                            });
                            if (enrolledUsers.length === 0) {
                              return <Text style={styles.noItemsText}>No students enrolled yet.</Text>;
                            }
                            return enrolledUsers.map((student, idx) => (
                              <View key={student.id || idx} style={styles.smallCard}>
                                <Text style={styles.smallCardTitle}>Student</Text>
                                <Text>Name: {student.name || 'N/A'}</Text>
                                <Text>Email: {student.email || 'N/A'}</Text>
                                <Text>Phone: {student.phone || 'N/A'}</Text>
                                <Text>Bio: {student.bio || 'N/A'}</Text>
                              </View>
                            ));
                          })()}
                        </ScrollView>

                        <TouchableOpacity style={styles.closePrimary} onPress={() => setShowEnrolledModal(false)}>
                          <Text style={styles.closePrimaryText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                )}
              </ScrollView>
            )}

            {activeTab === 'notifications' && (
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyText}>No notifications.</Text>
                ) : (
                  notifications.map((n, idx) => (
                    <View key={idx} style={styles.smallCard}>
                      <Text style={styles.smallCardTitle}>Notification</Text>
                      <Text>{n.text}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </>
        )}
      </Animated.View>

      {/* Logout two-step modal */}
      <Modal visible={logoutOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!logoutConfirmStep ? (
              <>
                <Text style={styles.modalTitle}>Log out</Text>
                <Text style={styles.modalSub}>Are you sure you want to log out?</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setLogoutOpen(false)}>
                    <Text style={styles.modalBtnGrayText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={() => setLogoutConfirmStep(true)}>
                    <Text style={styles.modalBtnPrimaryText}>Yes, Log out</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>One more step</Text>
                <Text style={styles.modalSub}>Tap Confirm to complete logout.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setLogoutConfirmStep(false)}>
                    <Text style={styles.modalBtnGrayText}>Back</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnDanger} onPress={() => { setLogoutOpen(false); handleSignOut(); }}>
                    <Text style={styles.modalBtnDangerText}>Confirm</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete two-step modal (fixed overlap & red confirm button) */}
      <Modal visible={deleteOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!deleteConfirmStep ? (
              <>
                <Text style={styles.modalTitle}>Delete course</Text>
                <Text style={styles.modalSub}>Are you sure you want to delete this course?</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setDeleteOpen(false)}>
                    <Text style={styles.modalBtnGrayText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={() => setDeleteConfirmStep(true)}>
                    <Text style={styles.modalBtnPrimaryText}>Yes, Delete</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                <Text style={[styles.modalSub, { marginBottom: 8 }]}>This action cannot be undone.</Text>
                <Text style={{ color: '#444', marginBottom: 12 }}>Tap Confirm to permanently delete the course.</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setDeleteConfirmStep(false)}>
                    <Text style={styles.modalBtnGrayText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtnDanger, { backgroundColor: '#d63031' }]}
                    onPress={async () => {
                      setDeleteOpen(false);
                      if (deleteTargetId) await handleDeleteCourse(deleteTargetId);
                      setDeleteTargetId(null);
                    }}
                  >
                    <Text style={styles.modalBtnDangerText}>Confirm</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------- STYLES ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: Platform.OS === 'android' ? 28 : 48 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 },
  dashboardTitle: { fontSize: 26, fontWeight: '800', color: COLORS.OFF_WHITE, letterSpacing: 0.5 },
  profileButton: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: 6 },

  tabRow: { flexDirection: 'row', marginHorizontal: 14, backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 6, gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(20,184,166,0.12)' },
  tabText: { color: 'rgba(250,250,250,0.7)', fontWeight: '700' },
  tabTextActive: { color: COLORS.ACCENT },

  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginLeft: 6,
  },

  pendingContainer: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.GOLD },
  pendingText: { color: COLORS.GOLD, fontWeight: 'bold', textAlign: 'center', fontSize: 15 },

  addButton: { backgroundColor: COLORS.GOLD, borderRadius: 8, padding: 10, marginBottom: 12 },
  addText: { textAlign: 'center', fontWeight: 'bold', color: COLORS.PRIMARY_GREEN },

  emptyText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 28, fontSize: 15 },

  premiumCard: {
    borderRadius: 18,
    padding: 16,
    paddingBottom: 14,
    // glass effect: semi-transparent background with subtle inner border and soft shadow
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },

  /* Top-right delete button style — red */
  topRightDelete: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#d63031',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topRightDeleteText: { color: '#fff', fontWeight: '700' },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  premiumTitle: {
    color: 'rgba(255,255,255,0.98)',
    fontSize: 18,
    fontWeight: '800',
    maxWidth: '70%',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '800' },

  premiumDesc: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    marginTop: 2,
    opacity: 0.95,
  },

  /* inner stats row (glass badges) */
  innerStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  glassStat: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    minWidth: 86,
  },
  glassStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  glassStatValue: { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '800' },

  statsRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 28, marginTop: 6, alignItems: 'center' },
  statItem: { flexDirection: 'column' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  statValue: { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '700' },

  analyticsText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  rowBtns: { flexDirection: 'row', marginTop: 8 },
  editButton: { backgroundColor: COLORS.PRIMARY_GREEN, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 20, marginRight: 8 },
  editText: { color: '#fff', fontWeight: 'bold' },
  requestButton: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 16 },
  requestText: { color: 'rgba(255,255,255,0.96)', fontWeight: 'bold' },

  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    color: 'rgba(255,255,255,0.95)',
  },

  saveButton: { backgroundColor: COLORS.ACCENT, borderRadius: 8, padding: 10, marginTop: 6, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800' },
  cancelButton: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, marginTop: 6, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: '700' },

  smallCard: {
    backgroundColor: COLORS.OFF_WHITE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  smallCardTitle: { color: COLORS.PRIMARY_GREEN, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },

  noItemsText: { color: '#333', fontSize: 16, textAlign: 'center', marginTop: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
  },
  modalHeader: { fontSize: 20, fontWeight: '800', color: COLORS.PRIMARY_GREEN, marginBottom: 12, textAlign: 'center' },

  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalSub: { color: '#444', marginBottom: 6 },

  modalBtnGray: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  modalBtnGrayText: { color: '#111', fontWeight: '700' },

  modalBtnPrimary: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '800' },

  modalBtnDanger: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  modalBtnDangerText: { color: '#fff', fontWeight: '800' },

  closePrimary: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 18,
    alignItems: 'center',
  },
  closePrimaryText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  notifyBadge: {
    backgroundColor: COLORS.GOLD,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadgeText: { color: COLORS.PRIMARY_GREEN, fontWeight: '800' },
});
