import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Store role in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role,
        status: role === 'mentor' ? 'waitlisted' : 'approved',
      });
      Alert.alert('Registration Successful', 'Your account has been created. Please login.');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Signup Error', error.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#14532d", "#a8e6cf", "#f4f4f4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.centeredContainer}>
        <BlurView intensity={60} tint="light" style={styles.glassCard}>
          <MaterialCommunityIcons name="account-plus" size={44} color="#00b894" style={styles.icon} />
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Create your account to start learning</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#6c7a6e"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#6c7a6e"
          />
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Role:</Text>
            <Picker
              selectedValue={role}
              style={styles.picker}
              onValueChange={(itemValue) => setRole(itemValue)}
            >
              <Picker.Item label="Student" value="student" />
              <Picker.Item label="Mentor" value="mentor" />
            </Picker>
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={handleSignup} disabled={loading}>
            <LinearGradient
              colors={["#43ea7a", "#14532d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchButton} onPress={() => router.replace('/login')}>
            <Text style={styles.switchText}>Already have an account? <Text style={styles.loginText}>Login</Text></Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  glassCard: {
    width: 400,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 32,
    paddingVertical: 38,
    paddingHorizontal: 34,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 36,
    elevation: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#14532d',
    marginBottom: 2,
    fontFamily: 'Poppins',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#388e3c',
    marginBottom: 18,
    fontFamily: 'Inter',
    textAlign: 'center',
    opacity: 0.85,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#43ea7a',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    backgroundColor: 'rgba(232,245,233,0.95)',
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#14532d',
    shadowColor: '#43ea7a',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 4,
    color: '#388e3c',
    fontFamily: 'Inter',
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#e8f5e9',
    borderRadius: 18,
    borderColor: '#43ea7a',
    borderWidth: 1,
    fontFamily: 'Inter',
    color: '#14532d',
  },
  button: {
    width: '100%',
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#14532d',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'Poppins',
    textShadowColor: 'rgba(20,83,45,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  switchButton: {
    marginTop: 2,
    padding: 4,
    width: '100%',
  },
  switchText: {
    color: '#22223b',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  loginText: {
    color: '#43ea7a',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
});