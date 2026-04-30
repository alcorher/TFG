import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LebrijaColors, LebrijaRadius, LebrijaSpacing } from '@/constants/lebrijaleo-theme';

type SectionScreenProps = {
  title: string;
  description: string;
};

export function SectionScreen({ title, description }: SectionScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Lebrijaleo</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <Link href="/(tabs)" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Volver a la cartelera</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LebrijaColors.cloudDancer,
    padding: LebrijaSpacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: LebrijaColors.white,
    borderRadius: LebrijaRadius.xl,
    borderWidth: 1,
    borderColor: LebrijaColors.border,
    padding: LebrijaSpacing.xl,
    gap: LebrijaSpacing.md,
  },
  kicker: {
    color: LebrijaColors.lemonIcingAccent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: LebrijaColors.midnightBlue,
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    color: LebrijaColors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: LebrijaColors.midnightBlue,
    paddingHorizontal: LebrijaSpacing.lg,
    paddingVertical: LebrijaSpacing.sm,
    borderRadius: LebrijaRadius.pill,
    marginTop: LebrijaSpacing.sm,
  },
  buttonText: {
    color: LebrijaColors.white,
    fontWeight: '700',
  },
});