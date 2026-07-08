import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import HomeHeader from './HomeHeader';
import SearchBar from './SearchBar';
import CategorySection from './CategorySection';
import HeroSection from './HeroSection';
import FeaturedSection from './FeaturedSection';
import { startBackgroundLoading } from '../../init/backgroundLoader';
import { useTheme } from '../../hooks/useTheme';

const DOCK_HEIGHT = 150;

const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  useEffect(() => {
    startBackgroundLoading();
  }, []);

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

  
  const dockRange = Math.max(featuredOffsetY - DOCK_HEIGHT, 1);

  const dockOpacity = scrollY.interpolate({
    inputRange: [dockRange - 24, dockRange],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dockTranslateY = scrollY.interpolate({
    inputRange: [dockRange - 24, dockRange],
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
onScroll={event => {

  const y =
    event.nativeEvent.contentOffset.y;

  scrollY.setValue(y);

  setShowDock(
    y >=
      Math.max(
        featuredOffsetY -
          DOCK_HEIGHT,
        1,
      ),
  );

}}
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
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
