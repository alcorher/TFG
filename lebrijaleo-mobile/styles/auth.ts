import { StyleSheet } from 'react-native';

import { LebrijaColors, LebrijaRadius } from '@/constants/lebrijaleo-theme';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LebrijaColors.cloudDancer,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: LebrijaColors.formBg,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  brandText: {
    color: LebrijaColors.midnightBlue,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  topBrandCentered: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 84,
    height: 84,
    marginBottom: 8,
  },
  logoSmall: {
    width: 42,
    height: 42,
  },
  topBrandText: {
    color: LebrijaColors.lemonIcingAccent,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brand: {
    color: LebrijaColors.lemonIcing,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroText: {
    color: LebrijaColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: LebrijaColors.formBg,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: LebrijaColors.formBg,
    borderRadius: LebrijaRadius.lg,
    paddingVertical: 8,
    gap: 14,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: LebrijaColors.midnightBlue,
  },
  subtitle: {
    fontSize: 14,
    color: LebrijaColors.textMuted,
  },
  form: {
    gap: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: LebrijaColors.nimbusCloud,
    borderRadius: LebrijaRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: LebrijaColors.midnightBlue,
    backgroundColor: LebrijaColors.white,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: LebrijaColors.lemonIcing,
    borderRadius: LebrijaRadius.md,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: LebrijaColors.midnightBlue,
    fontSize: 16,
    fontWeight: '800',
  },
  footerText: {
    marginTop: 6,
    color: LebrijaColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    color: LebrijaColors.lemonIcingAccent,
    fontWeight: '800',
  },
  messageError: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: LebrijaRadius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    fontSize: 13,
  },
  messageSuccess: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: LebrijaRadius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    color: '#166534',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  bottomAccentBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: LebrijaColors.lemonIcing,
  },
});
