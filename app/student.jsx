import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, arrayUnion, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Theme colors
const PRIMARY_GREEN = '#1D4A3D';
const LIGHT_GREY = '#F0F4F7';
const OFF_WHITE = '#FAFAFA';
const ACCENT_GOLD = '#FBBF24';

// Stars & particles
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

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [allCourses, setAllCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [search, setSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const router = useRouter();
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

  // Animate gradient particles
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
    const fetchCourses = async () => {
      const snapshot = await getDocs(collection(db, 'courses'));
      setAllCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchPrograms = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setPrograms(userDoc.data().enrolled || []);
      setLoading(false);
    };

    fetchCourses();
    fetchPrograms();
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEnroll = async (course) => {
    setEnrollingId(course.id);
    const user = auth.currentUser;
    if (!user) return;

    const already = programs.find(p => p.id === course.id);
    if (already) {
      if (already.status === 'rejected') {
        const now = Date.now();
        const rejectedAt = already.rejectedAt ? new Date(already.rejectedAt).getTime() : 0;
        if (now - rejectedAt < 2 * 24 * 60 * 60 * 1000) {
          showMessage('Request rejected recently. Wait 2 days to reapply.');
          setEnrollingId(null);
          return;
        }
      } else {
        showMessage(`Already ${already.status}.`);
        setEnrollingId(null);
        return;
      }
    }

    await updateDoc(doc(db, 'users', user.uid), {
      enrolled: arrayUnion({ title: course.title, status: 'requested', id: course.id })
    });

    setPrograms([...programs, { title: course.title, status: 'requested', id: course.id }]);
    setEnrollingId(null);
    showMessage(`Request sent for ${course.title}!`);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const getStatusDisplay = (courseId) => {
    const p = programs.find(p => p.id === courseId);
    if (!p) return 'Request';
    switch (p.status) {
      case 'requested': return 'Requested';
      case 'enrolled': return 'Enrolled';
      case 'rejected': return 'Re-Apply';
      default: return 'Request';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled': return '#10B981';
      case 'requested': return ACCENT_GOLD;
      case 'rejected': return '#EF4444';
      default: return PRIMARY_GREEN;
    }
  };

  const renderCourseCard = (item, isProgramView = false) => {
    const status = isProgramView ? item.status : getStatusDisplay(item.id);
    const isEnrolled = status === 'Enrolled';
    const isRejected = status === 'Re-Apply';
    const isRequested = status === 'Requested';
    const isDisabled = enrollingId === item.id || isEnrolled || isRequested;

    let buttonText = status;
    if (enrollingId === item.id) buttonText = 'Processing...';
    if (isProgramView && status === 'requested') buttonText = 'Requested';
    if (isProgramView && status === 'enrolled') buttonText = 'View Course';
    if (isProgramView && status === 'rejected') buttonText = 'Re-Apply';

    return (
      <Animated.View key={item.id || item.title} style={{ opacity: contentOpacity, marginBottom: 12 }}>
        <View style={styles.courseCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            {!isProgramView && <Text style={[styles.courseStatusBadge, { color: getStatusColor(item.status || 'Active'), borderColor: getStatusColor(item.status || 'Active') }]}>{item.status || 'Active'}</Text>}
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.enrollButton, isEnrolled && styles.enrolledButton, isRequested && styles.requestedButton]}
            disabled={isDisabled && !isRejected}
            onPress={() => isProgramView && isEnrolled ? showMessage('Navigating to course...') : handleEnroll(item)}
          >
            <Text style={[styles.enrollText, isEnrolled && styles.enrolledText, isRequested && styles.requestedText]}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const starAnimatedStyle = (star, idx) => ({
    position: 'absolute',
    top: star.top,
    left: star.left,
    width: star.size,
    height: star.size,
    borderRadius: star.size > 4 ? 3 : 2,
    backgroundColor: OFF_WHITE,
    opacity: starAnims[idx].interpolate({ inputRange: [0,1], outputRange: [0.1, star.opacity] }),
    transform: [{ translateX: starAnims[idx].interpolate({ inputRange: [0,1], outputRange: [0, Math.random() > 0.5 ? 80 : -80] }) }]
  });

  const particleAnimatedStyle = (particle, idx) => ({
    position: 'absolute',
    top: particle.top,
    left: particle.left,
    width: particle.size,
    height: particle.size,
    borderRadius: particle.size / 2,
    backgroundColor: `rgba(255,255,255,0.05)`,
    opacity: particleAnims[idx].interpolate({ inputRange: [0,1], outputRange: [0.05, 0.25] }),
    transform: [
      { translateX: particleAnims[idx].interpolate({ inputRange: [0,1], outputRange: [0, Math.random() > 0.5 ? 60 : -60] }) },
      { translateY: particleAnims[idx].interpolate({ inputRange: [0,1], outputRange: [0, Math.random() > 0.5 ? 60 : -60] }) }
    ]
  });

  const handleTabPress = (newTab) => {
    if (newTab === activeTab) return;
    Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setActiveTab(newTab);
      Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.container}>
      {/* Stars */}
      {STAR_DATA.map((star, idx) => (<Animated.View key={idx} style={[starAnimatedStyle(star, idx), { zIndex: 0 }]} />))}
      {/* Floating particles */}
      {PARTICLE_DATA.map((particle, idx) => (<Animated.View key={idx} style={[particleAnimatedStyle(particle, idx), { zIndex: 0 }]} />))}

      <View style={styles.topBar}>
        <Text style={styles.dashboardTitle}>Student Hub</Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/studentProfile')}>
          <Ionicons name="person-circle-outline" size={30} color={ACCENT_GOLD} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.sectionWrapper, { opacity: contentOpacity }]}>
        {activeTab === 'courses' && (
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={PRIMARY_GREEN} style={{ marginLeft: 10 }} />
              <TextInput style={styles.input} placeholder="Search All Courses" placeholderTextColor="#6B7280" value={search} onChangeText={setSearch} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {allCourses.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(item => renderCourseCard(item, false))}
              {allCourses.length === 0 && <Text style={styles.emptyText}>No courses found.</Text>}
            </ScrollView>
          </View>
        )}

        {activeTab === 'programs' && (
          <View style={styles.section}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {loading ? <Text style={styles.emptyText}>Loading enrolled programs...</Text> :
                programs.length === 0 ? <Text style={styles.emptyText}>You are not yet enrolled in any programs.</Text> :
                  programs.map((item) => renderCourseCard(item, true))
              }
            </ScrollView>
          </View>
        )}
      </Animated.View>

      {message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      <View style={styles.bottomTabs}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('courses')}>
          <MaterialCommunityIcons name="book-open-variant" size={28} color={activeTab === 'courses' ? ACCENT_GOLD : LIGHT_GREY} />
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('programs')}>
          <Ionicons name="school" size={28} color={activeTab === 'programs' ? ACCENT_GOLD : LIGHT_GREY} />
          <Text style={[styles.tabText, activeTab === 'programs' && styles.tabTextActive]}>My Programs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={28} color={LIGHT_GREY} />
          <Text style={styles.tabText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN, paddingTop: 48 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  dashboardTitle: { fontSize: 26, fontWeight: '800', color: OFF_WHITE, letterSpacing: 0.5 },
  profileButton: { padding: 5, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionWrapper: { flex: 1, paddingHorizontal: 20 },
  section: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: OFF_WHITE, borderRadius: 18, paddingHorizontal: 5, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 12, fontSize: 16, color: PRIMARY_GREEN, fontWeight: '500' },
  courseCard: { backgroundColor: 'rgba(250,250,250,0.95)', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  courseTitle: { fontSize: 17, fontWeight: '700', color: PRIMARY_GREEN, maxWidth: '75%' },
  courseStatusBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, opacity: 0.8 },
  divider: { height: 1, backgroundColor: LIGHT_GREY, marginVertical: 8 },
  enrollButton: { backgroundColor: PRIMARY_GREEN, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 15, marginTop: 5, alignSelf: 'flex-start' },
  enrolledButton: { backgroundColor: '#10B981' },
  requestedButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: ACCENT_GOLD },
  enrollText: { color: OFF_WHITE, fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },
  enrolledText: { color: OFF_WHITE },
  requestedText: { color: ACCENT_GOLD },
  bottomTabs: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, backgroundColor: PRIMARY_GREEN, borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 20 },
  tabItem: { alignItems: 'center', padding: 5 },
  tabText: { color: LIGHT_GREY, fontSize: 11, marginTop: 4, fontWeight: '600' },
  tabTextActive: { color: ACCENT_GOLD, fontWeight: '700' },
  emptyText: { color: LIGHT_GREY, textAlign: 'center', marginTop: 40, fontSize: 16, opacity: 0.8 },
  messageBox: { position: 'absolute', bottom: 90, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: 12, borderRadius: 10, zIndex: 100 },
  messageText: { color: OFF_WHITE, fontWeight: '500' },
});
