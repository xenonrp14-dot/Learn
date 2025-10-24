import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

// Get screen height for dynamic styling
const { height } = Dimensions.get('window');

// --- NEW COLOR PALETTE ---
const PRIMARY_GREEN = '#1D4A3D'; // Deep Forest Green
const ACCENT_GREY = '#6B7280';  // Rich Grey for secondary text/icons
const LIGHT_GREY = '#F0F4F7';   // Input/light background color
const OFF_WHITE = '#FFFFFF';    // Card background

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role = 'student';
      if (email === 'xenonrp14@gmail.com') {
        role = 'admin';
      } else if (userDoc.exists()) {
        role = userDoc.data().role;
      }
      router.replace(`/${role}`);
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          {/* Back Arrow */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={PRIMARY_GREEN} />
          </TouchableOpacity>
          {/* Illustration and Text */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue your journey</Text>
          </View>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="modi@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={ACCENT_GREY}
          />

          <Text style={styles.label}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={ACCENT_GREY}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 16, top: 12 }}
                onPress={() => setShowPassword(prev => !prev)}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={PRIMARY_GREEN}
                />
              </TouchableOpacity>
            </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          {/* Sign Up Navigation Link */}
          <TouchableOpacity style={styles.switchButton} onPress={() => router.replace('/signup')}>
              <Text style={styles.switchText}>
                Need an account? <Text style={styles.signUpText}>Sign Up</Text>
              </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  topSection: {
    height: height * 0.40,
    backgroundColor: PRIMARY_GREEN, // Deep Green Top
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: OFF_WHITE,
    borderRadius: 50,
    padding: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  illustrationContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: OFF_WHITE, // White text on Deep Green
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: LIGHT_GREY, // Light grey text for contrast
    opacity: 0.8,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.65,
    backgroundColor: OFF_WHITE,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 30,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: PRIMARY_GREEN,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: LIGHT_GREY, // Light Grey Input
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: PRIMARY_GREEN,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: ACCENT_GREY, // Grey link
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: PRIMARY_GREEN, // Deep Green Button
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: OFF_WHITE, // White text on Deep Green button
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  switchButton: {
    marginTop: 10,
    padding: 4,
    width: '100%',
    alignItems: 'center',
  },
  switchText: {
    color: ACCENT_GREY, // Grey normal text
    fontSize: 15,
    textAlign: 'center',
  },
  signUpText: {
    color: PRIMARY_GREEN, // Deep Green link
    fontWeight: 'bold',
  },
});