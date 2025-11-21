// app/student-dashboard.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../firebase';
import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

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
const PARTICLE_COUNT = 10;

export default function StudentDashboard() {
  const router = useRouter();

  const [allCourses, setAllCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Withdraw two-step
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawConfirmStep, setWithdrawConfirmStep] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  const contentOpacity = useRef(new Animated.Value(1)).current;

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

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    stars.forEach((s) => {
      const twinkleLoop = () => {
        Animated.sequence([
          Animated.timing(s.twinkle, { toValue: 0.2 + Math.random() * 0.8, duration: 600 + Math.random() * 1400, useNativeDriver: true }),
          Animated.timing(s.twinkle, { toValue: 0.2 + Math.random() * 0.8, duration: 600 + Math.random() * 1400, useNativeDriver: true }),
        ]).start(twinkleLoop);
      };
      twinkleLoop();

      const driftLoop = () => {
        s.drift.setValue(-1);
        Animated.timing(s.drift, { toValue: 1, duration: s.speed, useNativeDriver: true }).start(driftLoop);
      };
      driftLoop();
    });

    particles.forEach((p) => {
      const float = () => {
        Animated.sequence([
          Animated.timing(p.anim, { toValue: 1, duration: p.duration, useNativeDriver: true }),
          Animated.timing(p.anim, { toValue: 0, duration: p.duration, useNativeDriver: true }),
        ]).start(float);
      };
      float();
    });
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllCourses(courses);

        const user = auth.currentUser;
        if (user) {
          const udoc = await getDoc(doc(db, 'users', user.uid));
          if (udoc.exists()) setPrograms(udoc.data().enrolled || []);
        } else {
          setPrograms([]);
        }
      } catch (err) {
        console.warn('fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const showMessage = (t) => {
    setMessage(t);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEnroll = async (course) => {
    const user = auth.currentUser;
    if (!user) return showMessage('Please log in again.');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        enrolled: arrayUnion({ title: course.title, status: 'requested', id: course.id, requestedAt: Date.now() })
      });
      setPrograms(prev => [...prev, { title: course.title, status: 'requested', id: course.id }]);
      showMessage(`Request sent for ${course.title}`);
    } catch (err) {
      console.warn(err);
      showMessage('Failed to request enrollment.');
    }
  };

  const withdrawRequest = async (item) => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const udoc = await getDoc(userRef);
    if (!udoc.exists()) return;
    const enrolledArr = udoc.data().enrolled || [];
    const filtered = enrolledArr.filter(e => !(e.id === item.id && e.status === 'requested'));
    await updateDoc(userRef, { enrolled: filtered });
    setPrograms(filtered);
    showMessage('Request withdrawn.');
  };

  const openWithdrawConfirm = (item) => {
    setWithdrawTarget(item);
    setWithdrawConfirmStep(false);
    setWithdrawConfirmOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return;
    try {
      await withdrawRequest(withdrawTarget);
    } catch (e) {
      console.warn(e);
      showMessage('Failed to withdraw.');
    } finally {
      setWithdrawConfirmOpen(false);
      setWithdrawTarget(null);
      setWithdrawConfirmStep(false);
    }
  };

  const openLogout = () => {
    setLogoutOpen(true);
    setConfirmStep(false);
  };

  const doLogout = async () => {
    try {
      await signOut(auth);
      setLogoutOpen(false);
      router.replace('/login');
    } catch (err) {
      console.warn(err);
      showMessage('Logout failed.');
      setLogoutOpen(false);
    }
  };

  const handleTab = (tab) => {
    if (tab === activeTab) return;
    Animated.timing(contentOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentOpacity, { toValue: 1, duration: 210, useNativeDriver: true }).start();
    });
  };

  const getStatus = (courseId) => {
    const p = programs.find(x => x.id === courseId);
    if (!p) return 'Request';
    return p.status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled': return '#10B981';
      case 'requested': return COLORS.GOLD;
      case 'rejected': return '#EF4444';
      default: return COLORS.ACCENT;
    }
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      // Firestore Timestamp object
      if (val.toDate && typeof val.toDate === 'function') return val.toDate().toLocaleString();
      // Firestore Timestamp-like { seconds }
      if (val.seconds) return new Date(val.seconds * 1000).toLocaleString();
      // JS Date or number
      if (val instanceof Date) return val.toLocaleString();
      if (typeof val === 'number') return new Date(val).toLocaleString();
      return String(val);
    } catch (e) {
      return 'N/A';
    }
  };

  const CourseCard = ({ item, isProgramView = false }) => {
    const status = isProgramView ? item.status : getStatus(item.id);
    const isRequested = status === 'requested';
    const isEnrolled = status === 'enrolled';
    const isDisabled = isEnrolled || (status !== 'Request' && !isProgramView);

    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.01, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, []);

    return (
      <Animated.View style={{ transform: [{ scale }], marginBottom: 14 }}>
        <LinearGradient
          colors={['rgba(8,30,25,0.32)', 'rgba(13,148,136,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumCard}
        >
          <View style={styles.cardTop}>
            <Text numberOfLines={2} style={styles.premiumTitle}>{item.title}</Text>
            {/* top-right small badge removed to avoid duplicate status display */}
            <View style={{ width: 0 }} />
          </View>

          {/* DESCRIPTION REMOVED in card as requested */}

          {/* Compact footer: Status (glassStat style) -> Request/Withdraw -> Details */}
          <View style={[styles.premiumFooter, { justifyContent: 'flex-start', gap: 10 }]}>
            {/* Status box (using existing glassStat style) */}
            <View style={[styles.glassStat, { borderColor: getStatusColor(status), marginRight: 8 }]}>
              <Text style={styles.glassStatLabel}>Status</Text>
              <Text style={[styles.glassStatValue, { color: getStatusColor(status) }]}>{status}</Text>
            </View>

            {/* Request / Withdraw Button */}
            {isProgramView && isRequested ? (
              <TouchableOpacity style={styles.withdrawBtn} onPress={() => openWithdrawConfirm(item)}>
                <Text style={styles.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.enrollBtn, isDisabled && styles.enrollDisabled]}
                onPress={() => isProgramView && isEnrolled ? showMessage('Open course...') : handleEnroll(item)}
                disabled={isDisabled}
              >
                <Text style={styles.enrollBtnText}>
                  {isProgramView ? (isEnrolled ? 'Enrolled' : (isRequested ? 'Requested' : 'View')) : (isDisabled ? 'Requested' : 'Request')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Details Button */}
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => {
                setSelectedCourse(item);
                setDetailsModalOpen(true);
              }}
            >
              <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const coursesList = allCourses.filter(c => c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()));
  const programsList = programs.filter(p => allCourses.some(c => c.id === p.id));

  return (
    <View style={styles.screen}>
      {/* Background */}
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
        <Text style={styles.title}>Student Hub</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/studentProfile')}>
            <Ionicons name="person-circle-outline" size={30} color={COLORS.GOLD} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={openLogout}>
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.OFF_WHITE || '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'courses' && styles.tabActive]} onPress={() => handleTab('courses')}>
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'programs' && styles.tabActive]} onPress={() => handleTab('programs')}>
          <Text style={[styles.tabText, activeTab === 'programs' && styles.tabTextActive]}>My Programs</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.ACCENT} style={{ marginLeft: 12 }} />
        <TextInput
          placeholder="Search courses..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'courses' && (
            <>
              {coursesList.length === 0 && <Text style={styles.emptyText}>No courses found.</Text>}
              {coursesList.map(c => <CourseCard key={c.id} item={c} />)}
            </>
          )}

          {activeTab === 'programs' && (
            <>
              {programsList.length === 0 && <Text style={styles.emptyText}>You are not enrolled in any programs.</Text>}
              {programsList.map(p => {
                const course = allCourses.find(c => c.id === p.id) || { title: p.title, description: p.description, duration: p.duration };
                return <CourseCard key={p.id} item={{ ...course, status: p.status, id: p.id }} isProgramView />;
              })}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* Details Modal (enhanced) */}
      <Modal visible={detailsModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedCourse?.title}</Text>

            {/* Important mentor-uploaded details */}
            <Text style={styles.modalSub}>{selectedCourse?.description || 'No description.'}</Text>

            <View style={{ marginTop: 6, marginBottom: 6 }}>
              <Text style={[styles.modalSub, { fontWeight: '700' }]}>Details</Text>
              <Text style={styles.modalSub}>Duration: {selectedCourse?.duration || 'N/A'}</Text>
              <Text style={styles.modalSub}>Organisation: {selectedCourse?.organisation || selectedCourse?.organisation || 'N/A'}</Text>
              <Text style={styles.modalSub}>Course status: {selectedCourse?.status || 'active'}</Text>
              <Text style={styles.modalSub}>Created: {formatDate(selectedCourse?.createdAt)}</Text>
              <Text style={[styles.modalSub, { marginTop: 8 }]}>Your enrollment status: {getStatus(selectedCourse?.id)}</Text>
            </View>

            <Pressable style={styles.modalBtnPrimary} onPress={() => setDetailsModalOpen(false)}>
              <Text style={styles.modalBtnPrimaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Withdraw two-step modal */}
      <Modal visible={withdrawConfirmOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!withdrawConfirmStep ? (
              <>
                <Text style={styles.modalTitle}>Withdraw request</Text>
                <Text style={styles.modalSub}>Are you sure you want to withdraw your request for "{withdrawTarget?.title}"?</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => { setWithdrawConfirmOpen(false); setWithdrawTarget(null); }}>
                    <Text style={styles.modalBtnGrayText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={() => setWithdrawConfirmStep(true)}>
                    <Text style={styles.modalBtnPrimaryText}>Yes, Withdraw</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>One more step</Text>
                <Text style={styles.modalSub}>Confirm to complete withdrawal.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setWithdrawConfirmStep(false)}>
                    <Text style={styles.modalBtnGrayText}>Back</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={confirmWithdraw}>
                    <Text style={styles.modalBtnPrimaryText}>Confirm</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {message && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{message}</Text>
        </View>
      )}

      {/* Logout modal */}
      <Modal visible={logoutOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!confirmStep ? (
              <>
                <Text style={styles.modalTitle}>Log out</Text>
                <Text style={styles.modalSub}>Are you sure you want to log out?</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setLogoutOpen(false)}>
                    <Text style={styles.modalBtnGrayText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={() => setConfirmStep(true)}>
                    <Text style={styles.modalBtnPrimaryText}>Yes, Log out</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>One more step</Text>
                <Text style={styles.modalSub}>Tap Confirm to complete logout.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <Pressable style={styles.modalBtnGray} onPress={() => setConfirmStep(false)}>
                    <Text style={styles.modalBtnGrayText}>Back</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={doLogout}>
                    <Text style={styles.modalBtnPrimaryText}>Confirm</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.BG, paddingTop: Platform.OS === 'android' ? 35 : 50, paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 22, color: COLORS.GOLD, fontWeight: 'bold' },
  iconBtn: { padding: 6 },
  tabRow: { flexDirection: 'row', marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center' },
  tabActive: { borderBottomColor: COLORS.GOLD },
  tabText: { color: COLORS.OFF_WHITE },
  tabTextActive: { color: COLORS.GOLD, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: COLORS.OFF_WHITE, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14 },
  scrollContent: { paddingBottom: 100 },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20 },
  premiumCard: { borderRadius: 14, paddingVertical: 30, paddingHorizontal: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  premiumTitle: { fontSize: 18, color: COLORS.OFF_WHITE, fontWeight: 'bold', flex: 1 },
  premiumDesc: { color: 'rgba(255,255,255,0.7)', marginVertical: 8 }, // removed from layout but kept style
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }, // unused top badge removed in markup
  badgeText: { fontSize: 10 },
  innerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 }, // removed from layout
  glassStat: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 6, flex: 1, marginRight: 6 },
  glassStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  glassStatValue: { fontSize: 12, color: COLORS.OFF_WHITE, fontWeight: 'bold' },
  premiumFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.ACCENT },
  durationText: { color: COLORS.OFF_WHITE, fontSize: 12 },
  enrollBtn: { backgroundColor: COLORS.ACCENT, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  enrollDisabled: { backgroundColor: 'rgba(20,184,166,0.5)' },
  enrollBtnText: { color: COLORS.OFF_WHITE, fontWeight: 'bold', fontSize: 12 },
  detailsBtn: { borderWidth: 1, borderColor: COLORS.OFF_WHITE, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  detailsBtnText: { color: COLORS.OFF_WHITE, fontWeight: 'bold', fontSize: 12 },
  withdrawBtn: { backgroundColor: COLORS.GOLD, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  withdrawText: { color: COLORS.BG, fontWeight: 'bold', fontSize: 12 },
  toast: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: COLORS.ACCENT, padding: 10, borderRadius: 8 },
  toastText: { color: COLORS.OFF_WHITE, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: COLORS.BG, padding: 20, borderRadius: 12, width: width * 0.85 },
  modalTitle: { color: COLORS.GOLD, fontWeight: 'bold', fontSize: 18, marginBottom: 6 },
  modalSub: { color: COLORS.OFF_WHITE, marginBottom: 6 },
  modalBtnPrimary: { backgroundColor: COLORS.ACCENT, padding: 10, borderRadius: 8 },
  modalBtnPrimaryText: { color: COLORS.OFF_WHITE, fontWeight: 'bold' },
  modalBtnGray: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8 },
  modalBtnGrayText: { color: COLORS.OFF_WHITE, fontWeight: 'bold' },
});
