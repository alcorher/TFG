import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { formatDateES } from '@/lib/utils';
import { COLORS } from '@/constants/theme'; // Tu nuevo archivo centralizado

export default function EventCard({ evento }) {
  const navigation = useNavigation();
  const isFree = evento.precio === 'Gratis' || Number(evento.precio) === 0;
  const eventoId = evento.id_evento;

  const handleCardPress = () => {
    navigation.navigate('EventDetail', { id: eventoId }); 
  };

  const handleLikePress = () => {
    // Aquí irá tu lógica de Supabase para los likes
    console.log(`Diste like al evento: ${eventoId}`);
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {/* Categoría */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{evento.categoria || 'Evento'}</Text>
        </View>
        
        {/* Precio */}
        <View style={[styles.priceBadge, isFree ? styles.priceFree : styles.pricePaid]}>
          <Text style={styles.priceText}>{isFree ? 'Gratis' : `${evento.precio}€`}</Text>
        </View>

        {/* Imagen del Cartel */}
        <Image 
          source={{ uri: evento.imagen_url || evento.cartel_url || 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070' }} 
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.contentContainer}>
        {/* Fecha */}
        <View style={styles.dateRow}>
          <MaterialIcons name="calendar-today" size={16} color={COLORS.slate500} />
          <Text style={styles.dateText}>{formatDateES(evento.fecha_formateada || evento.fecha)}</Text>
        </View>
        
        {/* Título */}
        <Text style={styles.title} numberOfLines={2}>
          {evento.titulo || evento.nombre}
        </Text>
        
        {/* Lugar */}
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={18} color={COLORS.nimbusCloud} />
          <Text style={styles.locationText} numberOfLines={1}>{evento.lugar}</Text>
        </View>
        
        {/* Footer de la tarjeta (Likes) */}
        <View style={styles.footer}>
          {/* El TouchableOpacity anidado captura su propio toque sin propagarse */}
          <TouchableOpacity 
            style={styles.likeContainer}
            onPress={handleLikePress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="favorite" size={20} color={COLORS.slate400} />
            <Text style={styles.likeText}>{evento.likes || '0'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.3)', // border-nimbus-cloud/30
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // Para sombra en Android
    marginBottom: 16,
  },
  imageContainer: {
    height: 192, // Equivalente a h-48
    width: '100%',
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: COLORS.midnightBlue,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceFree: {
    backgroundColor: '#16a34a', // green-600
  },
  pricePaid: {
    backgroundColor: COLORS.midnightBlue,
  },
  priceText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20, // p-5
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
    marginBottom: 8,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.slate500,
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(213, 213, 216, 0.2)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cloudDancer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  likeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate600,
  }
});