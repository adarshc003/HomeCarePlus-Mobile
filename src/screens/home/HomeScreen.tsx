import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, View, RefreshControl } from 'react-native';
import HomeHeader from './HomeHeader';
import SearchBar from './SearchBar';
import CategorySection from './CategorySection';
import HeroSection from './HeroSection';
import FeaturedSection from './FeaturedSection';
import { startBackgroundLoading } from '../../init/backgroundLoader';
import { useCategoryStore } from '../../store/categoryStore';
import { useServiceStore } from '../../store/serviceStore';
import { useTheme } from '../../hooks/useTheme';

const DOCK_HEIGHT = 150;

// Categories and Services are independent — Promise.allSettled (not
// Promise.all) so a failure in one never blocks or delays the other from
// populating. The package/add-on background preload must never start
// before Services actually has data, so it's gated on the store's own
// `services` array afterwards rather than on the settle resolving —
// serviceStore.loadServices() swallows its own fetch errors internally, so
// a "fulfilled" settle result alone doesn't guarantee the request succeeded.
const loadCategoriesAndServices = async () => {
  await Promise.allSettled([
    useCategoryStore.getState().loadCategories(),
    useServiceStore.getState().loadServices(),
  ]);

  if (useServiceStore.getState().services.length > 0) {
    // Already a one-shot per app session (backgroundLoader.ts's own
    // `initialized` guard) — calling it again here (e.g. from a
    // pull-to-refresh) is a safe no-op, which is exactly what keeps this to
    // a single background preload rather than repeating the 2×N package/
    // add-on fetch on every refresh.
    startBackgroundLoading();
  }
};

const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [refreshing, setRefreshing] = useState(false);

  // Home owns loading its own sections' data — this used to be prefetched
  // blocking the Splash screen. Each store's own `loading` flag (already
  // present) drives the section's skeleton state, and neither store ever
  // clears its data before a fetch resolves, so previously-loaded content
  // stays visible the whole time a request is in flight.
  useEffect(() => {
    const categoryState = useCategoryStore.getState();
    const serviceState = useServiceStore.getState();

    const categoriesNeeded = !categoryState.categories.length && !categoryState.loading;
    const servicesNeeded = !serviceState.services.length && !serviceState.loading;

    if (!categoriesNeeded && !servicesNeeded) {
      // Both already loaded/in flight from an earlier mount this session —
      // avoid firing a duplicate request, but still make sure the one-shot
      // background preload has run at least once.
      if (serviceState.services.length > 0) {
        startBackgroundLoading();
      }
      return;
    }

    Promise.allSettled([
      categoriesNeeded ? categoryState.loadCategories() : Promise.resolve(),
      servicesNeeded ? serviceState.loadServices() : Promise.resolve(),
    ]).then(() => {
      if (useServiceStore.getState().services.length > 0) {
        startBackgroundLoading();
      }
    });
  }, []);

  // Pull-to-refresh: always fetches fresh data for both sections (unlike
  // the mount effect above, a refresh should never skip on the grounds that
  // data already exists). Guarded so a second pull gesture while one is
  // already in flight is ignored rather than starting a second, overlapping
  // refresh.
  const onRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await loadCategoriesAndServices();
    } finally {
      setRefreshing(false);
    }
  };

  const scrollRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [searchText, setSearchText] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const [showDock, setShowDock] = useState(false);

  const [featuredOffsetY, setFeaturedOffsetY] = useState(0);

  const scrollToServices = () => {
    const target =
      featuredOffsetY > 0
        ? Math.max(featuredOffsetY - DOCK_HEIGHT, 0)
        : 650;

    scrollRef.current?.scrollTo({ y: target, animated: true });

setTimeout(() => {

  setSearchMode(true);

  setTimeout(() => {

    setSearchMode(false);

  }, 400);

}, 300);
  };


  // The dock fades in/out over a 24px scroll range. It used to mount at the
  // END of that range (dockRange), by which point the interpolation had
  // already reached full opacity — so it popped in fully-visible instead of
  // fading, and popped out instantly when scrolling back up. Mounting at
  // the START of the same range (where opacity is ~0) lets the fade/
  // translate actually play before/after the view exists.
  const DOCK_FADE_ZONE = 24;
  const dockRange = Math.max(featuredOffsetY - DOCK_HEIGHT, 1);
  const dockMountThreshold = Math.max(dockRange - DOCK_FADE_ZONE, 1);

  const dockOpacity = scrollY.interpolate({
    inputRange: [dockMountThreshold, dockRange],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dockTranslateY = scrollY.interpolate({
    inputRange: [dockMountThreshold, dockRange],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });



  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4757E7"
            colors={['#4757E7']}
          />
        }
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {
            // scrollY itself now updates entirely on the native side (no
            // bridge crossing per frame) — everything derived from it via
            // .interpolate() (HeroSection's opacity/scale/translate, the
            // dock's opacity/translateY) rides along on the native driver
            // too. The listener only handles the one thing that genuinely
            // needs JS: flipping the `showDock` boolean that mounts/
            // unmounts the floating dock.
            useNativeDriver: true,
            listener: (event: any) => {
              const y = event.nativeEvent.contentOffset.y;
              setShowDock(y >= dockMountThreshold);
            },
          },
        )}
        scrollEventThrottle={16}>
        <HomeHeader navigation={navigation} />

        <SearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          onSearch={scrollToServices}
        />

        {!searchText.trim() && (
          <>
            <HeroSection
              onExplore={scrollToServices}
              scrollY={scrollY}
            />

            {/* Wrapper exists only to measure where this section sits on
                screen — CategorySection itself is untouched. */}
            <View>
              <CategorySection
                onCategorySelect={scrollToServices}
              />
            </View>
          </>
        )}

        {/* Wrapper exists only to measure where Featured cards start,
            so selecting a category lands the first card below the dock. */}
        <View
          onLayout={e =>
            setFeaturedOffsetY(e.nativeEvent.layout.y)
          }>
          <FeaturedSection navigation={navigation} />
        </View>
      </Animated.ScrollView>

      {/* ── Floating dock: appears only once measured & needed ── */}
     {showDock && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.dockShell,
            {
              opacity: dockOpacity,
              transform: [{ translateY: dockTranslateY }],
            },
          ]}>
          <View style={styles.dockSolid}>
            <SearchBar
              searchText={searchText}
              setSearchText={setSearchText}
              onSearch={scrollToServices}
              autoFocus={searchMode}
            />

            {!searchText.trim() && (
              <CategorySection
                onCategorySelect={scrollToServices}
              />
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default HomeScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors'], isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
    // '#F0F4FF' is the approved Light Theme backdrop and must stay exactly
    // as-is; Dark Mode falls back to the shared page background instead of
    // extending the theme system for this one decorative tint.
    backgroundColor: isDark ? colors.background : '#F0F4FF',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  dockShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // Straight top (flush with status bar), curved bottom corners only —
  // premium floating-panel look with a soft diffused shadow,
  // no hard line, no gradient fade needed.
  dockSolid: {
    backgroundColor: isDark ? 'rgba(30,41,59,0.92)' : '#ffffffe0',
    paddingTop: 40, // clears status bar/notch — tune to your device
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    // Hairline edge so the translucent panel reads as a distinct surface
    // rather than blending into whatever's scrolling underneath it —
    // same premium-glass cue iOS translucent bars use.
    borderBottomWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
    shadowColor: '#0F172A',
    shadowOpacity: isDark ? 0.32 : 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
