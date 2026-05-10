import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

type UserRole = 'Cliente' | 'Empresario' | 'Administrador' | string;

type ProfileForm = {
  nombre: string;
  username: string;
  biografia: string;
  ubicacion: string;
  avatar_url: string;
  banner_url: string;
  rol: UserRole;
};

type ImageSelection = {
  uri: string;
  filename: string;
  mimetype: string;
};

const DEFAULT_LOCATIONS = [
  'Lebrija, Sevilla',
  'Las Cabezas de San Juan',
  'El Cuervo',
  'Trebujena',
  'Jerez de la Frontera',
  'Sevilla Capital',
];

export default function ProfileEditScreen() {
  const router = useRouter();

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSupportCard, setShowSupportCard] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<ImageSelection | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<ImageSelection | null>(null);
  const [formData, setFormData] = useState<ProfileForm>({
    nombre: '',
    username: '',
    biografia: '',
    ubicacion: 'Lebrija, Sevilla',
    avatar_url: '',
    banner_url: '',
    rol: 'Cliente',
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (authError || !session) {
          router.replace('/login');
          return;
        }

        const response = await fetch(`${API_URL}/api/perfil`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userProfile = (await response.json()) as Record<string, string>;
          setFormData({
            nombre: userProfile.nombre || '',
            username: userProfile.username || '',
            biografia: userProfile.biografia || '',
            ubicacion: userProfile.ubicacion || 'Lebrija, Sevilla',
            avatar_url: userProfile.avatar_url || '',
            banner_url: userProfile.banner_url || '',
            rol: (userProfile.rol as UserRole) || 'Cliente',
          });
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        Alert.alert('Error', 'No se pudo cargar la informacion del perfil.');
      } finally {
        setIsFetching(false);
      }
    }

    loadUserProfile();
  }, [router]);

  const roleMeta = useMemo(() => {
    if (formData.rol === 'Administrador') {
      return {
        title: 'Editar Perfil de Administrador',
        badge: 'Administrador',
        subtitle: 'Gestiona tu identidad visible y los datos de soporte.',
      };
    }

    if (formData.rol === 'Empresario') {
      return {
        title: 'Editar Perfil de Organizador',
        badge: 'Organizador',
        subtitle: 'Ajusta tu presencia publica y la informacion de tus eventos.',
      };
    }

    return {
      title: 'Editar Perfil',
      badge: 'Usuario',
      subtitle: 'Actualiza tu informacion personal y como te ven los demas.',
    };
  }, [formData.rol]);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nombre || 'Usuario')}&background=F6EBC8&color=1e293b`;
  const defaultBanner = 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070';

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async (type: 'avatar' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const filename = asset.fileName || `${type}_${Date.now()}.jpg`;
        const imageSelection: ImageSelection = {
          uri: asset.uri,
          filename,
          mimetype: asset.mimeType || 'image/jpeg',
        };

        if (type === 'avatar') {
          setSelectedAvatar(imageSelection);
        } else {
          setSelectedBanner(imageSelection);
        }
      }
    } catch (error) {
      console.error(`Error selecting ${type}:`, error);
      Alert.alert('Error', `No se pudo seleccionar la imagen de ${type}.`);
    }
  };

  const uploadImage = async (imageSelection: ImageSelection, token: string): Promise<string> => {
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // En web, convertir URI a blob usando fetch
        const response = await fetch(imageSelection.uri);
        const blob = await response.blob();
        formData.append('file', blob, imageSelection.filename);
      } else {
        // En nativo (Android/iOS), usar el URI directamente
        formData.append('file', {
          uri: imageSelection.uri,
          name: imageSelection.filename,
          type: imageSelection.mimetype,
        } as any);
      }

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json().catch(() => ({}))) as { detail?: string };
        throw new Error(errorData.detail || 'Error al subir la imagen');
      }

      const result = (await uploadResponse.json()) as { url?: string; file_url?: string };
      return result.url || result.file_url || imageSelection.uri;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSelectLocation = () => {
    Alert.alert(
      'Ubicacion',
      'Selecciona una ubicacion',
      DEFAULT_LOCATIONS.map((location) => ({
        text: location,
        onPress: () => handleChange('ubicacion', location),
      })),
    );
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      let avatarUrl = formData.avatar_url;
      let bannerUrl = formData.banner_url;

      // Upload selected images
      if (selectedAvatar) {
        avatarUrl = await uploadImage(selectedAvatar, session.access_token);
      }

      if (selectedBanner) {
        bannerUrl = await uploadImage(selectedBanner, session.access_token);
      }

      const response = await fetch(`${API_URL}/api/perfil`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          username: formData.username,
          biografia: formData.biografia,
          ubicacion: formData.ubicacion,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(errorData.detail || 'No se ha podido guardar el perfil.');
      }

      const responseData = (await response.json()) as { data?: Record<string, string> };
      const updated = responseData.data;

      if (updated) {
        setFormData((prev) => ({
          ...prev,
          nombre: updated.nombre || prev.nombre,
          username: updated.username || prev.username,
          biografia: updated.biografia || prev.biografia,
          ubicacion: updated.ubicacion || prev.ubicacion,
          avatar_url: updated.avatar_url || prev.avatar_url,
          banner_url: updated.banner_url || prev.banner_url,
        }));
      }

      setSelectedAvatar(null);
      setSelectedBanner(null);
      Alert.alert('Perfil actualizado', 'Los cambios se han guardado correctamente.');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleChangePassword = useCallback(async () => {
    // Navega a la pantalla de cambio/restablecimiento de contraseña
    router.push('/reset-password');
  }, [router]);

  const handleSupport = async () => {
    const url =
      'mailto:acorher2911@g.educaand.es?subject=Soporte LebriJaleo&body=Hola, necesito ayuda con mi perfil en LebriJaleo.';
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert('Soporte', 'No se pudo abrir el correo en este dispositivo.');
      return;
    }

    await Linking.openURL(url);
  };

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.midnightBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <MaterialIcons name="arrow-back" size={24} color={COLORS.midnightBlue} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{roleMeta.title}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.bannerSection}>
            <Image source={{ uri: formData.banner_url || defaultBanner }} style={styles.bannerImage} />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>{roleMeta.badge}</Text>
            </View>
            <View style={styles.bannerContent}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: formData.avatar_url || defaultAvatar }} style={styles.avatarImage} />
              </View>
              <View style={styles.bannerTextBlock}>
                <Text style={styles.bannerName}>{formData.nombre || 'Usuario'}</Text>
                <Text style={styles.bannerSubtitle}>{roleMeta.subtitle}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuracion de Perfil</Text>
            <Text style={styles.cardDescription}>
              Puedes editar los mismos datos clave de la version web, adaptados a movil.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(value) => handleChange('nombre', value)}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.slate400}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de usuario</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(value) => handleChange('username', value)}
                placeholder="@usuario"
                autoCapitalize="none"
                placeholderTextColor={COLORS.slate400}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Biografia</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={formData.biografia}
                onChangeText={(value) => handleChange('biografia', value.slice(0, 160))}
                placeholder="Cuéntale a la comunidad quien eres"
                placeholderTextColor={COLORS.slate400}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{formData.biografia.length}/160</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ubicacion</Text>
              <TouchableOpacity style={styles.selectInput} onPress={handleSelectLocation}>
                <Text style={styles.selectText}>{formData.ubicacion}</Text>
                <MaterialIcons name="expand-more" size={22} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Foto de perfil</Text>
              <View style={styles.imagePreviewWrapper}>
                <Image
                  source={{ uri: selectedAvatar?.uri || formData.avatar_url || defaultAvatar }}
                  style={styles.imagePreview}
                />
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('avatar')}>
                <MaterialIcons name="cloud-upload" size={20} color={COLORS.midnightBlue} />
                <Text style={styles.uploadButtonText}>
                  {selectedAvatar ? 'Cambiar foto' : 'Seleccionar foto'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Foto de portada</Text>
              <View style={styles.bannerPreviewWrapper}>
                <Image
                  source={{ uri: selectedBanner?.uri || formData.banner_url || defaultBanner }}
                  style={styles.bannerPreview}
                />
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('banner')}>
                <MaterialIcons name="cloud-upload" size={20} color={COLORS.midnightBlue} />
                <Text style={styles.uploadButtonText}>
                  {selectedBanner ? 'Cambiar portada' : 'Seleccionar portada'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.midnightBlue} />
                ) : (
                  <>
                    <MaterialIcons name="save" size={18} color={COLORS.midnightBlue} />
                    <Text style={styles.primaryButtonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {showSupportCard ? (
            <View style={styles.supportCard}>
              <View style={styles.supportHeader}>
                <View style={styles.supportIcon}>
                  <MaterialIcons name="support-agent" size={22} color={COLORS.midnightBlue} />
                </View>
                <TouchableOpacity onPress={() => setShowSupportCard(false)}>
                  <MaterialIcons name="close" size={20} color={COLORS.slate500} />
                </TouchableOpacity>
              </View>
              <Text style={styles.supportTitle}>Necesitas ayuda?</Text>
              <Text style={styles.supportText}>
                {formData.rol === 'Administrador'
                  ? 'Contacta con soporte si necesitas revisar permisos o incidencias de moderacion.'
                  : formData.rol === 'Empresario'
                    ? 'Contacta con soporte si tienes problemas con tu perfil o la publicacion de eventos.'
                    : 'Contacta con soporte si tienes problemas con tu perfil o con tus favoritos.'}
              </Text>
              <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
                <Text style={styles.supportButtonText}>Contactar soporte</Text>
                <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.accountCard}>
            <Text style={styles.accountTitle}>Ajustes de Cuenta</Text>
            <TouchableOpacity style={styles.accountRow} onPress={handleChangePassword}>
              <MaterialIcons name="lock-reset" size={20} color={COLORS.slate500} />
              <Text style={styles.accountRowText}>Cambiar contrasena</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={COLORS.red500} />
              <Text style={styles.logoutText}>Cerrar Sesion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.formBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.formBg,
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213,213,216,0.45)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightBlue,
    flexShrink: 1,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  bannerSection: {
    height: 290,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  bannerBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bannerBadgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  avatarWrapper: {
    width: 102,
    height: 102,
    borderRadius: 51,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.white,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  bannerTextBlock: {
    flex: 1,
    paddingBottom: 6,
  },
  bannerName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.35)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.slate500,
    lineHeight: 20,
  },
  fieldGroup: {
    marginTop: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightBlue,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.midnightBlue,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 14,
  },
  counter: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.slate400,
  },
  selectInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: COLORS.midnightBlue,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: COLORS.slate600,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.lemonIcing,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.midnightBlue,
    fontWeight: '700',
  },
  supportCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.nimbusCloud,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.7)',
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  supportText: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.slate600,
    lineHeight: 20,
  },
  supportButton: {
    marginTop: 16,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  supportButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  accountCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.35)',
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightBlue,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  accountRowText: {
    fontSize: 15,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: COLORS.red500,
    fontWeight: '700',
  },
  imagePreviewWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(213,213,216,0.5)',
    backgroundColor: '#f8fafc',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  bannerPreviewWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.5)',
    backgroundColor: '#f8fafc',
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.lemonIcing,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: COLORS.midnightBlue,
    fontWeight: '600',
    fontSize: 15,
  },
});
