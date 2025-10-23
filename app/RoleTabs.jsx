
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Placeholder screens for each tab
const GradientScreen = ({ children }) => (
  <LinearGradient colors={['#27ae60', '#636e72']} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
      {children}
    </SafeAreaView>
  </LinearGradient>
);

const StudentHome = () => <GradientScreen>{/* FlatList for mentor courses */}</GradientScreen>;
const StudentCourses = () => <GradientScreen>{/* FlatList for enrolled courses */}</GradientScreen>;
const StudentProfile = () => <GradientScreen>{/* Profile info */}</GradientScreen>;

const MentorCourses = () => <GradientScreen>{/* FlatList for mentor's courses */}</GradientScreen>;
const MentorRequests = () => <GradientScreen>{/* FlatList for requests */}</GradientScreen>;
const MentorProfile = () => <GradientScreen>{/* Profile info */}</GradientScreen>;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 60)}>
      <BlurView intensity={60} tint="light" style={styles.glassCard}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
        <Text style={styles.userId}>ID: {item.id}</Text>
      </BlurView>
    </Animated.View>
  );

  return (
    <GradientScreen>
      <Text style={styles.sectionTitle}>All Users</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#27ae60" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </GradientScreen>
  );
};
const AdminCourses = () => <GradientScreen>{/* FlatList for all courses */}</GradientScreen>;
const AdminProfile = () => <GradientScreen>{/* Admin details */}</GradientScreen>;

const Tab = createBottomTabNavigator();

export function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.7)', position: 'absolute', margin: 16, height: 70 },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 14 },
        tabBarActiveTintColor: '#27ae60',
        tabBarInactiveTintColor: '#636e72',
      }}
    >
      <Tab.Screen name="Home" component={StudentHome} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} /> }} />
      <Tab.Screen name="My Courses" component={StudentCourses} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={StudentProfile} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export function MentorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.7)', position: 'absolute', margin: 16, height: 70 },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 14 },
        tabBarActiveTintColor: '#27ae60',
        tabBarInactiveTintColor: '#636e72',
      }}
    >
      <Tab.Screen name="My Courses" component={MentorCourses} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-open" color={color} size={size} /> }} />
      <Tab.Screen name="Requests" component={MentorRequests} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-clock" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={MentorProfile} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.7)', position: 'absolute', margin: 16, height: 70 },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 14 },
        tabBarActiveTintColor: '#27ae60',
        tabBarInactiveTintColor: '#636e72',
      }}
    >
      <Tab.Screen name="All Users" component={AdminUsers} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
      <Tab.Screen name="All Courses" component={AdminCourses} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-multiple" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={AdminProfile} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 35,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#636e72',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#b2bec3',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#636e72',
    marginBottom: 16,
    textAlign: 'center',
  },
});
