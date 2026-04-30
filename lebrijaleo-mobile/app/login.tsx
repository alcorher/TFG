import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { LebrijaColors } from '@/constants/lebrijaleo-theme';
import { supabase } from '@/lib/supabase';
import { authStyles } from '@/styles/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const loginErrorMessages: Record<string, string> = {
        'Invalid login credentials': 'El correo electronico o la contrasena no son correctos.',
        'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesion.',
      };
      setErrorMessage(loginErrorMessages[error.message] || error.message || 'No se pudo iniciar sesion.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={authStyles.container}>
      <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={authStyles.topBrandCentered}>
          <Image source={require('../assets/images/logo.png')} style={authStyles.logo} resizeMode="contain" />
          <Text style={authStyles.topBrandText}>LEBRIJALEO</Text>
        </View>

        <View style={authStyles.card}>
          <Text style={authStyles.title}>Bienvenido de nuevo</Text>
          <Text style={authStyles.subtitle}>Ingresa tus datos para acceder a tu cuenta.</Text>
          {errorMessage ? <Text style={authStyles.messageError}>{errorMessage}</Text> : null}

          <View style={authStyles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electronico"
              placeholderTextColor={LebrijaColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              style={authStyles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contrasena"
              placeholderTextColor={LebrijaColors.textMuted}
              secureTextEntry
              editable={!isLoading}
              style={authStyles.input}
            />
          </View>

          <Pressable
            style={[authStyles.primaryButton, isLoading ? authStyles.buttonDisabled : null]}
            onPress={onLogin}
            disabled={isLoading}
          >
            <Text style={authStyles.primaryButtonText}>
              {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
            </Text>
          </Pressable>

          <Text style={authStyles.footerText}>
            No tienes cuenta?{' '}
            <Link href="/register" style={authStyles.linkText}>
              Registrate
            </Link>
          </Text>
        </View>
      </ScrollView>
      <View style={authStyles.bottomAccentBar} />
    </View>
  );
}
