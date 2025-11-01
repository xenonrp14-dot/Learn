import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

// Example admin data (replace with Firebase data fetch)
const admin = {
  name: 'Admin User',
  email: 'xenonrp14@gmail.com',
  role: 'admin',
  profilePic: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
};

export default function AdminProfile() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }} style={styles.avatar} />
        <Text style={styles.name}>{admin.name}</Text>
        <Text style={styles.role}>{admin.role.toUpperCase()}</Text>
        <Text style={styles.email}>{admin.email}</Text>
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
  role: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 2,
  },
  editButton: {
    backgroundColor: '#0984e3',
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
