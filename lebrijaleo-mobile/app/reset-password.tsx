import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LebrijaColors } from '@/constants/lebrijaleo-theme';
import { supabase } from '@/lib/supabase';
import { authStyles } from '@/styles/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionExists, setSessionExists] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getResetErrorMessage = (message?: string) => {
    const mappedMessages: Record<string, string> = {
      'Unable to validate email address: invalid format': 'El formato del correo no es valido.',
      'For security purposes, you can only request this once every 60 seconds': 'Espera un minuto antes de pedir otro enlace.',
      'Email rate limit exceeded': 'Has superado el limite de intentos. Intentalo mas tarde.',
      'User not found': 'No existe ninguna cuenta con ese correo.',
    };
    return mappedMessages[message || ''] || message || 'No se pudo completar la solicitud.';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSessionExists(!!session);
      if (session && session.user?.email) setEmail(session.user.email);
    })();
    return () => { mounted = false; };
  }, []);

  const onSendResetEmail = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Debes introducir un correo para recuperar tu cuenta.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMessage(getResetErrorMessage(error.message));
      } else {
        setSuccessMessage('Te hemos enviado un enlace de recuperacion. Revisa tu correo y sigue los pasos.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo enviar el correo de recuperacion. Revisa tu conexion e intentalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 8) {
      // Validación de contraseña: mínimo 8 caracteres, must contain upper and lower case
      const passwordRegex = /(?=.*[a-z])(?=.*[A-Z]).{8,}/;
      if (!newPassword || !passwordRegex.test(newPassword)) {
        setErrorMessage('La contraseña debe tener al menos 8 caracteres e incluir mayúsculas y minúsculas.');
        return;
      }
    }
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contrasenas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(getResetErrorMessage(error.message));
      } else {
        setSuccessMessage('Contrasena actualizada correctamente. Ya puedes iniciar sesion con la nueva clave.');
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo actualizar la contrasena. Intentalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={authStyles.card}>
          <Text style={authStyles.title}>Restablecer contraseña</Text>
          {errorMessage ? <Text style={authStyles.messageError}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={authStyles.messageSuccess}>{successMessage}</Text> : null}
          {sessionExists ? (
            <>
              <Text style={authStyles.subtitle}>Introduce una nueva contraseña para tu cuenta.</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nueva contraseña"
                secureTextEntry
                editable={!isLoading}
                style={authStyles.input}
                placeholderTextColor={LebrijaColors.textMuted}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar contraseña"
                secureTextEntry
                editable={!isLoading}
                style={authStyles.input}
                placeholderTextColor={LebrijaColors.textMuted}
              />

              <Pressable
                style={[authStyles.primaryButton, isLoading ? authStyles.buttonDisabled : null]}
                onPress={onChangePassword}
                disabled={isLoading}
              >
                <Text style={authStyles.primaryButtonText}>{isLoading ? 'Guardando...' : 'Guardar contraseña'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={authStyles.subtitle}>Introduce tu correo para enviarte un enlace de recuperación.</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                style={authStyles.input}
                placeholderTextColor={LebrijaColors.textMuted}
              />
              <Pressable
                style={[authStyles.primaryButton, isLoading ? authStyles.buttonDisabled : null]}
                onPress={onSendResetEmail}
                disabled={isLoading}
              >
                <Text style={authStyles.primaryButtonText}>{isLoading ? 'Enviando...' : 'Enviar enlace'}</Text>
              </Pressable>
            </>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
