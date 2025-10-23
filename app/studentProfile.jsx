import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setStudent(userDoc.data());
        setForm(userDoc.data());
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
        <ActivityIndicator size="large" color="#0984e3" />
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
      <View style={styles.card}>
        <Image source={{ uri: form.profilePic || 'https://randomuser.me/api/portraits/women/44.jpg' }} style={styles.avatar} />
        {editMode ? (
          <TextInput style={styles.input} value={form.name || ''} onChangeText={v => handleChange('name', v)} placeholder="Name" />
        ) : (
          <Text style={styles.name}>{student.name || 'No Name'}</Text>
        )}
        <Text style={styles.email}>{student.email}</Text>
        {editMode ? (
          <TextInput style={styles.input} value={form.phone || ''} onChangeText={v => handleChange('phone', v)} placeholder="Phone" />
        ) : (
          <Text style={styles.phone}>{student.phone || 'No Phone'}</Text>
        )}
        {editMode ? (
          <TextInput style={styles.input} value={form.bio || ''} onChangeText={v => handleChange('bio', v)} placeholder="Bio" />
        ) : (
          <Text style={styles.bio}>{student.bio || 'No Bio'}</Text>
        )}
        <Text style={styles.sectionTitle}>My Programs</Text>
        {(student.enrolled || []).map((course, idx) => (
          <View key={idx} style={styles.courseCard}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseStatus}>{course.status === 'enrolled' ? 'Enrolled' : 'Requested'}</Text>
          </View>
        ))}
        {editMode ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.editText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf6ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0984e3',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#2d3436',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0984e3',
    marginBottom: 8,
    marginTop: 8,
  },
  courseCard: {
    backgroundColor: '#eaf6ff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    width: '100%',
    alignItems: 'flex-start',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#636e72',
  },
  courseStatus: {
    fontSize: 14,
    color: '#636e72',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#636e72',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f5f6fa',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#0984e3',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#00b894',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  editText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
