import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AddCourse() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title || !description || !duration || !organisation) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const { Timestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'courses'), {
        title,
        description,
        duration,
        organisation,
        status,
        mentorId: user.uid,
        createdAt: Timestamp.now(),
      });
      Alert.alert('Success', 'Course added!');
      router.replace('/mentor');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Course</Text>
      <TextInput
        style={styles.input}
        placeholder="Course Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Duration (e.g. 6 weeks)"
        value={duration}
        onChangeText={setDuration}
      />
      <TextInput
        style={styles.input}
        placeholder="Organisation"
        value={organisation}
        onChangeText={setOrganisation}
      />
      <TextInput
        style={styles.input}
        placeholder="Status (active/waitlisted)"
        value={status}
        onChangeText={setStatus}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading}>
        <Text style={styles.addText}>{loading ? 'Adding...' : 'Add Course'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/mentor')}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf6ff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#0984e3',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#636e72',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#f5f6fa',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#00b894',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  addText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#636e72',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
