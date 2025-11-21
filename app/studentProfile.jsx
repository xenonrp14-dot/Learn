import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing
} from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DARK_BG = '#0a120eff';
const DARK_CARD = '#121820';
const PRIMARY = '#0D9488';
const TEXT_LIGHT = '#F1F5F9';
const TEXT_FAINT = '#9CA3AF';

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Simple fade animation for smooth UI integration
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  useEffect(() => {
    const fetchStudent = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setStudent(snap.data());
        setForm(snap.data());
      }

      setLoading(false);
    };

    fetchStudent();
  }, []);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(doc(db, 'users', user.uid), form);
    setStudent(form);
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

  if (!student) {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>No profile data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* PERMANENT USER ICON */}
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
            onChangeText={v => handleChange('name', v)}
            placeholder="Your Name"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.name}>{student.name || 'No Name'}</Text>
        )}

        <Text style={styles.email}>{student.email}</Text>

        {/* PHONE */}
        {editMode ? (
          <TextInput
            style={styles.input}
            value={form.phone || ''}
            onChangeText={v => handleChange('phone', v)}
            placeholder="Phone"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.phone}>{student.phone || 'No Phone'}</Text>
        )}

        {/* BIO */}
        {editMode ? (
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={form.bio || ''}
            multiline
            onChangeText={v => handleChange('bio', v)}
            placeholder="Bio"
            placeholderTextColor={TEXT_FAINT}
          />
        ) : (
          <Text style={styles.bio}>{student.bio || 'No Bio Available'}</Text>
        )}

        {/* BUTTONS */}
        {editMode ? (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.editText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 4
  },
  email: {
    fontSize: 14,
    color: TEXT_FAINT,
    marginBottom: 5
  },
  phone: {
    fontSize: 14,
    color: TEXT_FAINT,
    marginBottom: 10
  },
  bio: {
    fontSize: 15,
    color: TEXT_LIGHT,
    marginBottom: 16,
    textAlign: 'center'
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
    fontSize: 16
  },
  editButton: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 14
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 14
  },
  editText: {
    color: TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
