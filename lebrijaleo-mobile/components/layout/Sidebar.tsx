import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Modal, 
  SafeAreaView, Dimensions 
} from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Ajusta la ruta a tu cliente
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { COLORS } from '@/constants/theme'; // Ajusta la ruta a tu archivo de colores

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const { width } = Dimensions.get('window');

type ProfileResponse = {
  avatar_url?: string | null;
  nombre?: string | null;
  rol?: string | null;
};

type NavHref =
  | '/(tabs)'
  | '/(tabs)/favorites'
  | '/(tabs)/social'
  | '/(tabs)/my-organizers'
  | '/(tabs)/create-event'
  | '/(tabs)/my-events'
  | '/(tabs)/profile/edit'
  | '/(tabs)/profile';

type NavItemProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  href: NavHref;
  label: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadAvatar() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`${API_URL}/api/perfil`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const profile = (await response.json()) as ProfileResponse;
          setAvatarUrl(profile.avatar_url || null);
          setUserName(profile.nombre || '');
          setRole(profile.rol || '');
        }
      } catch (error) {
        console.error("Error cargando avatar del navbar:", error);
      }
    }
    loadAvatar();
  }, []);

  // Cierra el menú al cambiar de pantalla
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=F6EBC8&color=1e293b&size=96`;
  const isAdmin = role === 'Administrador';
  const isOrganizer = role === 'Empresario';
  const showOrganizerTools = isOrganizer || isAdmin;

  const normalizePath = (href: NavHref): string => {
    if (href === '/(tabs)') {
      return '/';
    }

    return href.replace('/(tabs)', '');
  };

  const isActive = (href: NavHref): boolean => {
    const normalizedPath = normalizePath(href);
    return pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`);
  };

  const navigateTo = (href: NavHref) => {
    setIsMobileMenuOpen(false);
    router.replace(href as Href);
  };

  const NavItem = ({ icon, href, label }: NavItemProps) => {
    const active = isActive(href);
    return (
      <TouchableOpacity 
        style={[styles.navItem, active && styles.navItemActive]}
        onPress={() => navigateTo(href)}
      >
        <MaterialIcons 
          name={icon} 
          size={28} 
          color={active ? COLORS.midnightBlue : COLORS.slate400} 
        />
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        {active && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsMobileMenuOpen(true)}
      >
        <MaterialIcons name="menu" size={28} color={COLORS.midnightBlue} />
      </TouchableOpacity>

      <Modal
        visible={isMobileMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsMobileMenuOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={() => setIsMobileMenuOpen(false)} 
          />
          
          <SafeAreaView style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <TouchableOpacity onPress={() => navigateTo('/(tabs)')}>
                <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsMobileMenuOpen(false)}>
                <MaterialIcons name="close" size={28} color={COLORS.midnightBlue} />
              </TouchableOpacity>
            </View>

            <View style={styles.navContainer}>
              <NavItem icon="dashboard" href="/(tabs)" label="Cartelera" />
              <NavItem icon="favorite" href="/(tabs)/favorites" label="Favoritos" />
              <NavItem icon="groups" href="/(tabs)/social" label="Social" />
              
              {showOrganizerTools && (
                <>
                  {isAdmin && <NavItem icon="group" href="/(tabs)/my-organizers" label="Organizadores" />}
                  <NavItem icon="add-circle" href="/(tabs)/create-event" label="Publicar" />
                  <NavItem icon="calendar-month" href="/(tabs)/my-events" label="Mis Eventos" />
                </>
              )}
            </View>

            <View style={styles.footer}>
              <NavItem icon="settings" href="/(tabs)/profile/edit" label="Ajustes" />
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={() => navigateTo('/(tabs)/profile')}
              >
                <Image source={{ uri: avatarUrl || defaultAvatar }} style={styles.avatar} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 50, // Ajustar por SafeArea
    left: 16,
    zIndex: 10,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  drawer: {
    width: width * 0.75,
    maxWidth: 300,
    height: '100%',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  logo: {
    width: 48,
    height: 48,
  },
  navContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    position: 'relative',
    gap: 12,
  },
  navItemActive: {
    backgroundColor: COLORS.lemonIcing,
  },
  navLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.slate600,
    fontWeight: '500',
  },
  navLabelActive: {
    color: COLORS.midnightBlue,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    left: -12,
    top: 12,
    bottom: 12,
    width: 4,
    backgroundColor: COLORS.midnightBlue,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    gap: 16,
  },
  avatarContainer: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  }
});
