import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function StudentDashboard() {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, Student!</Text>
      <TouchableOpacity style={styles.signoutButton} onPress={handleSignOut}>
        <Text style={styles.signoutText}>Sign Out</Text>
      </TouchableOpacity>
      {/* Add student-specific features here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fdcb6e',
  },
  subtitle: {
    fontSize: 18,
    color: '#636e72',
    marginBottom: 24,
  },
  signoutButton: {
    backgroundColor: '#d63031',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  signoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});