import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// DARK THEME (matching Student Profile)
const DARK_BG = '#0a120eff';
const DARK_CARD = '#121820';
const PRIMARY = '#0D9488';
const TEXT_LIGHT = '#F1F5F9';
const TEXT_FAINT = '#9CA3AF';
const ORNAMENT_COLOR = 'rgba(255,255,255,0.05)';

export default function MentorProfile() {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // MATCHING ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        setMentor(snap.data());
        setForm(snap.data());
      }
      setLoading(false);
    });

    // Same fade + slide animation as student profile
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PRIMARY} />
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
      {/* DARK ORNAMENTS (subtle) */}
      <Animated.View
        style={[
          styles.ornament,
          {
            width: width * 1.5,
            height: width * 1.5,
            borderColor: ORNAMENT_COLOR,
            opacity: 0.07,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ornament,
          {
            width: width * 1.1,
            height: width * 1.1,
            borderColor: ORNAMENT_COLOR,
            opacity: 0.12,
          },
        ]}
      />

      {/* CARD */}
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Permanent User Icon */}
        <MaterialCommunityIcons
          name="account-circle"
          size={110}
          color={PRIMARY}
          style={{ marginBottom: 10 }}
        />

        {/* NAME */}
        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.name || ''}
            onChangeText={(v) => handleChange('name', v)}
            placeholder="Name"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.name}>{mentor.name || 'No Name'}</Text>
        )}

        {/* ORGANIZATION */}
        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.organization || ''}
            onChangeText={(v) => handleChange('organization', v)}
            placeholder="Organization"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.org}>{mentor.organization || 'No Organization'}</Text>
        )}

        {/* STATUS */}
        <Text
          style={[
            styles.status,
            { color: mentor.status === 'approved' ? PRIMARY : '#ef4444' },
          ]}
        >
          {mentor.status === 'approved' ? 'Approved Mentor' : 'Waitlisted'}
        </Text>

        {/* EMAIL */}
        <Text style={styles.email}>{mentor.email}</Text>

        {/* PHONE */}
        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.phone || ''}
            onChangeText={(v) => handleChange('phone', v)}
            placeholder="Phone"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.phone}>{mentor.phone || 'No Phone'}</Text>
        )}

        {/* BIO */}
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 70 }]}
            multiline
            value={form.bio || ''}
            onChangeText={(v) => handleChange('bio', v)}
            placeholder="Bio"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.bio}>{mentor.bio || 'No Bio'}</Text>
        )}

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={editMode ? handleSave : () => setEditMode(true)}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  ornament: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 500,
  },

  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: width * 0.88,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 12,
  },

  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },

  org: {
    fontSize: 16,
    color: TEXT_FAINT,
    marginBottom: 4,
  },

  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  email: {
    fontSize: 14,
    color: TEXT_FAINT,
    marginBottom: 5,
  },

  phone: {
    fontSize: 14,
    color: TEXT_FAINT,
    marginBottom: 10,
  },

  bio: {
    fontSize: 15,
    color: TEXT_LIGHT,
    marginBottom: 16,
    textAlign: 'center',
  },

  input: {
    width: '100%',
    height: 42,
    borderColor: TEXT_FAINT,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#162028',
    color: TEXT_LIGHT,
    fontSize: 16,
  },

  button: {
    backgroundColor: PRIMARY,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },

  buttonText: {
    color: TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
  },

  noData: {
    color: TEXT_LIGHT,
    fontSize: 18,
  },
});
