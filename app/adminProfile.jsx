import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DARK_BG = '#0a120eff';
const DARK_CARD = '#121820';
const PRIMARY = '#0D9488';
const TEXT_LIGHT = '#F1F5F9';
const TEXT_FAINT = '#9CA3AF';

const admin = {
  name: 'Admin User',
  email: 'xenonrp14@gmail.com',
  role: 'admin',
};

export default function AdminProfile() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* Fixed admin icon matching student theme */}
        <MaterialCommunityIcons
          name="shield-account"
          size={110}
          color={PRIMARY}
          style={{ marginBottom: 10 }}
        />

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
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
    elevation: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: PRIMARY,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: TEXT_FAINT,
    marginBottom: 2,
  },
});
