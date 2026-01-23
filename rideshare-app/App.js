import { useState, useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./src/firebase";

import Register from "./screens/Register";

function HomeScreen({ user }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
    setLoggingOut(false);
  };

  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeTitle}>Welcome to UCSB Rideshare!</Text>
      <Text style={styles.homeSubtitle}>Logged in as: {user.email}</Text>
      
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#003660" />
        ) : (
          <Text style={styles.logoutButtonText}>Log Out</Text>
        )}
      </TouchableOpacity>
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmail("");
      setPassword("");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        "Enter Email",
        "Please enter your email address first, then tap 'Forgot Password'."
      );
      return;
    }
    Alert.alert(
      "Reset Password",
      `Password reset functionality coming soon for ${email.trim()}`
    );
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#febc11" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <HomeScreen user={user} />;
  }

  if (screen === "register") {
    return <Register onBack={() => setScreen("login")} />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Title Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('./assets/cs148_logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>UCSB Rideshare</Text>
          <Text style={styles.subtitle}>Your campus ride connection</Text>
        </View>

        {/* Login Form Section */}
        <View style={styles.formSection}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError("");
              }}
              editable={!loading}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#003660" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => setScreen("register")}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003660',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#febc11',
    marginTop: 12,
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#febc11',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#0ba89a',
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  errorText: {
    color: '#d11a2a',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003660',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#04859b',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#febc11',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#febc11',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#003660',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#0ba89a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Home screen styles
  homeContainer: {
    flex: 1,
    backgroundColor: '#003660',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#febc11',
    textAlign: 'center',
    marginBottom: 12,
  },
  homeSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#febc11',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  logoutButtonText: {
    color: '#003660',
    fontSize: 16,
    fontWeight: 'bold',
  },
});