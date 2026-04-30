import { useState } from 'react';
import { LebrijaColors } from '@/constants/lebrijaleo-theme';
import { Link, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { authStyles } from '@/styles/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onRegister = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre: name.trim(),
          username: username.trim(),
        },
      },
    });

    if (error) {
      setErrorMessage(error.message || 'No se pudo crear la cuenta.');
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Cuenta creada con exito. Revisa tu correo o inicia sesion.');
    setIsLoading(false);
    setTimeout(() => {
      router.replace('/login');
    }, 1500);
  };

  return (
    <View style={authStyles.container}>
      <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={authStyles.topBrandCentered}>
          <Image source={require('../assets/images/logo.png')} style={authStyles.logo} resizeMode="contain" />
          <Text style={authStyles.topBrandText}>LEBRIJALEO</Text>
        </View>
        <View style={authStyles.card}>
          <Text style={authStyles.title}>Crea tu cuenta</Text>
          <Text style={authStyles.subtitle}>Registrate para comenzar a explorar</Text>
          {errorMessage ? <Text style={authStyles.messageError}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={authStyles.messageSuccess}>{successMessage}</Text> : null}

          <View style={authStyles.form}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre completo"
              placeholderTextColor={LebrijaColors.textMuted}
              autoCapitalize="words"
              editable={!isLoading}
              style={authStyles.input}
            />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Nombre de usuario"
              placeholderTextColor={LebrijaColors.textMuted}
              autoCapitalize="none"
              editable={!isLoading}
              style={authStyles.input}
            />
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
            onPress={onRegister}
            disabled={isLoading}
          >
            <Text style={authStyles.primaryButtonText}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </Pressable>

          <Text style={authStyles.footerText}>
            Ya tienes cuenta?{' '}
            <Link href="/login" style={authStyles.linkText}>
              Inicia sesion
            </Link>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
