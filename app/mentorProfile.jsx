import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Animated, 
  Easing, 
  Dimensions 
} from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const PRIMARY_GREEN = '#1D4A3D';
const OFF_WHITE = '#FFFFFF';
const DARK_OVERLAY = 'rgba(255,255,255,0.08)';

export default function MentorProfile() {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(userDoc => {
      if (userDoc.exists()) {
        setMentor(userDoc.data());
        setForm(userDoc.data());
      }
      setLoading(false);
    });

    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    // Rotating background ornament
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 40000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), form);
    setMentor(form);
    setEditMode(false);
    setSaving(false);
  };

  const rotate1 = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={OFF_WHITE} />
      </View>
    );
  }

  if (!mentor) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No profile data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rotating spiral ornaments */}
      <Animated.View style={[styles.ornament, { width: width * 1.6, height: width * 1.6, opacity: 0.08, transform: [{ rotate: rotate1 }] }]} />
      <Animated.View style={[styles.ornament, { width: width * 1.1, height: width * 1.1, opacity: 0.15, transform: [{ rotate: rotate2 }] }]} />

      {/* Floating white profile card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }} 
          style={styles.avatar} 
        />

        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.name || ''}
            onChangeText={v => handleChange('name', v)}
            placeholder="Name"
          />
        ) : (
          <Text style={styles.name}>{mentor.name || 'No Name'}</Text>
        )}

        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.organization || ''}
            onChangeText={v => handleChange('organization', v)}
            placeholder="Organization"
          />
        ) : (
          <Text style={styles.org}>{mentor.organization || 'No Organization'}</Text>
        )}

        <Text style={[styles.status, { color: mentor.status === 'approved' ? '#00b894' : '#ff7675' }]}>
          {mentor.status === 'approved' ? 'Approved Mentor' : 'Waitlisted'}
        </Text>

        <Text style={styles.email}>{mentor.email}</Text>

        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.phone || ''}
            onChangeText={v => handleChange('phone', v)}
            placeholder="Phone"
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.phone}>{mentor.phone || 'No Phone'}</Text>
        )}

        {editMode ? (
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={form.bio || ''}
            onChangeText={v => handleChange('bio', v)}
            placeholder="Bio"
            multiline
          />
        ) : (
          <Text style={styles.bio}>{mentor.bio || 'No Bio'}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, editMode ? styles.saveButton : styles.editButton]}
          onPress={editMode ? handleSave : () => setEditMode(true)}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Profile'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  ornament: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: DARK_OVERLAY,
    borderRadius: 10,
  },
  card: {
    backgroundColor: OFF_WHITE,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: width * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  org: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    color: '#636e72',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: '#2d3436',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  button: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: PRIMARY_GREEN,
  },
  saveButton: {
    backgroundColor: '#00b894',
  },
  buttonText: {
    color: OFF_WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noData: {
    color: OFF_WHITE,
    fontSize: 18,
  },
});
