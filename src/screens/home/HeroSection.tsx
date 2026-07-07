import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';

// ─────────────────────────────────────────────────────────────────────────────
// Slide definitions — all text comes from i18n keys (en.ts / ar.ts)
// imageFocus: true  → image-dominant layout (tag pill + one headline)
// imageFocus: false → full content layout (eyebrow + title + subtitle + CTA)
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'hero',
    image: {
      uri: 'https://i.pinimg.com/1200x/93/3d/43/933d434af1e480fbf0efaf13cedfe190.jpg',
    },
    eyebrowKey:  'heroEyebrow',
    titleKey:    'heroTitle1',
    accentKey:   'heroTitle2',
    subtitleKey: 'heroSlide1Sub',
    tagKey:      null,
    showCta:     true,
    imageFocus:  false,
  },
  {
    id: 'cleaning',
    image: {
      uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85&fit=crop',
    },
    eyebrowKey:  null,
    titleKey:    'slide2Title',
    accentKey:   'slide2Accent',
    subtitleKey: null,
    tagKey:      'slide2Tag',
    showCta:     false,
    imageFocus:  true,
  },
  {
    id: 'repair',
    image: {
      uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85&fit=crop',
    },
    eyebrowKey:  null,
    titleKey:    'slide3Title',
    accentKey:   'slide3Accent',
    subtitleKey: null,
    tagKey:      'slide3Tag',
    showCta:     false,
    imageFocus:  true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
const HeroSection = ({onExplore, scrollY}: any) => {
  const language = useLanguageStore(state => state.language);
  const isRTL = language === 'ar';

  // ── Scroll animations ──────────────────────────────────────────────────────
  const heroOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 320],
        outputRange: [1, 0.55],
        extrapolate: 'clamp',
      })
    : 1;

  const heroScale = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 320],
        outputRange: [1, 0.88],
        extrapolate: 'clamp',
      })
    : 1;

  const heroTranslateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 320],
        outputRange: [0, -28],
        extrapolate: 'clamp',
      })
    : 0;

  // ── Slider state ───────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const crossfadeTo = (next: number) => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex(next);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  };

  const startAutoPlay = () => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % SLIDES.length;
        crossfadeTo(next);
        return prev;
      });
    }, 3800);
  };

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, []);

  const handleDotPress = (i: number) => {
    if (i === activeIndex) return;
    if (autoTimer.current) clearInterval(autoTimer.current);
    crossfadeTo(i);
    startAutoPlay();
  };

  const slide = SLIDES[activeIndex];

  return (
    <Animated.View
      style={[
        styles.animWrapper,
        {
          opacity: heroOpacity,
          transform: [{scale: heroScale}, {translateY: heroTranslateY}],
        },
      ]}>

      <ImageBackground
        source={slide.image}
        style={styles.container}
        imageStyle={styles.bgImage}>

        {/* ── Bottom scrim — always on, ensures text legibility ── */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(4,8,20,0.40)',
            'rgba(4,8,20,0.80)',
            'rgba(4,8,20,0.96)',
          ]}
          locations={[0, 0.38, 0.68, 1]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={StyleSheet.absoluteFill}
        />

        {/* ── Top scrim — for badge readability ── */}
        <LinearGradient
          colors={['rgba(4,8,20,0.48)', 'transparent']}
          locations={[0, 0.5]}
          style={StyleSheet.absoluteFill}
        />

        {/* ── Ambient glow orb ── */}
        <View style={styles.glowOrb} />

        {/* ── Top row: live badge + dot indicators ── */}
        <View style={[styles.topRow, isRTL && styles.rowRTL]}>
          <View style={styles.badge}>
            <View style={styles.liveDot} />
            <Text style={styles.badgeText}>
              {t('trustedHomeServices', language)}
            </Text>
          </View>

          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleDotPress(i)}
                activeOpacity={0.7}
                hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}>
                <View
                  style={[
                    styles.dot,
                    i === activeIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Content block ── */}
        <Animated.View
          style={[styles.content, {opacity: contentOpacity}]}>

          {/* ── SLIDE 1: full layout ── */}
          {!slide.imageFocus && (
            <>
              <Text
                style={[styles.eyebrow, isRTL && styles.textRTL]}
                numberOfLines={1}>
                {t(slide.eyebrowKey!, language)}
              </Text>

              <Text
                style={[styles.title, isRTL && styles.textRTL]}
                numberOfLines={2}>
                {t(slide.titleKey, language)}{' '}
                <Text style={styles.accent}>
                  {t(slide.accentKey, language)}
                </Text>
              </Text>

              <Text
                style={[styles.subtitle, isRTL && styles.textRTL]}
                numberOfLines={2}>
                {t(slide.subtitleKey!, language)}
              </Text>

              <TouchableOpacity
                style={[styles.ghostCta, isRTL && styles.rowRTL]}
                onPress={onExplore}
                activeOpacity={0.65}>
                <View>
                  <Text style={styles.ghostLabel}>
                    {t('exploreServices', language)}
                  </Text>
                  <View style={styles.ghostUnderline} />
                </View>
                <View style={styles.arrowPill}>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={13}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* ── SLIDES 2 & 3: image-dominant layout ── */}
          {slide.imageFocus && (
            <View style={[styles.imageFocusBlock, isRTL && styles.imageFocusBlockRTL]}>
              {/* Service category pill */}
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>
                  {t(slide.tagKey!, language)}
                </Text>
              </View>

              {/* Single bold headline — left aligned, large */}
<Text style={styles.titleLarge}>
  {t(slide.titleKey, language)}
</Text>

<Text style={styles.slideDescription}>
  {t(slide.accentKey, language)}
</Text>

        
            </View>
          )}

        </Animated.View>

      </ImageBackground>
    </Animated.View>
  );
};

export default HeroSection;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  animWrapper: {
    marginTop: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 32,
    shadowOffset: {width: 0, height: 14},
    elevation: 18,
  },

  container: {
    borderRadius: 28,
    overflow: 'hidden',
    height: 250,
    justifyContent: 'space-between',
  },

  bgImage: {
    borderRadius: 28,
    resizeMode: 'cover',
  },

  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59,130,246,0.12)',
    top: -55,
    right: -60,
  },

  // ── Top row ──────────────────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  rowRTL: {
    flexDirection: 'row-reverse',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(4,8,20,0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 0},
  },
  badgeText: {
    color: '#E0F2FE',
    fontSize: 10.5,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.2,
  },

  // ── Dot indicators ────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    borderRadius: 4,
    height: 5,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // ── Shared bottom content container ──────────────────────────────────────
  content: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // ── Slide 1 styles ────────────────────────────────────────────────────────
  eyebrow: {
    color: '#93C5FD',
    fontSize: 9.5,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: Fonts.bold,
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 10,
  },

  accent: {
    color: '#60A5FA',
  },

  subtitle: {
    color: 'rgba(226,232,240,0.88)',
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    lineHeight: 17,
    marginBottom: 50,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6,
  },

  ghostCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ghostLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.1,
  },
  ghostUnderline: {
    marginTop: 3,
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  arrowPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Slides 2 & 3: image-dominant ─────────────────────────────────────────
  // Block is left-aligned by default, right-aligned for RTL
  imageFocusBlock: {
    alignItems: 'flex-start',
  },
  imageFocusBlockRTL: {
    alignItems: 'flex-end',
  },

  // Frosted category pill — "CLEANING" / "REPAIRS"
  serviceTag: {
    backgroundColor: 'rgba(96,165,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 7,
  },
  serviceTagText: {
    color: '#93C5FD',
    fontSize: 9.5,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  // Large two-line headline — title on line 1, accent on line 2
titleLarge: {
  fontSize: 36,
  lineHeight: 42,
  color: '#60A5FA',
  fontFamily: Fonts.bold,
  letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.60)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 10,
  },
slideDescription: {
  fontSize: 13,
  lineHeight: 20,
  color: 'rgba(255,255,255,0.88)',
  fontFamily: Fonts.medium,
  marginTop: 8,
  maxWidth: '70%',
  letterSpacing: 0.2,
}
});
