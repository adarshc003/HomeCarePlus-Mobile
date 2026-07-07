import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';

import {useBookingStore} from '../../store/bookingStore';
import {useAuthStore} from '../../store/authStore';

import {
  addAddress,
  updateAddress,
  getAddresses,
  deleteAddress,
} from '../../services/addressService';

import {updateName} from '../../services/userService';

import {
  PHONE_COUNTRIES,
  isValidPhoneForCountry,
  parsePhoneWithCountry,
} from '../../utils/phoneValidation';

import Geolocation from '@react-native-community/geolocation';

import MapView, {Marker} from 'react-native-maps';

import {getAddressFromCoordinates} from '../../services/locationService';

import {showSuccess, showError} from '../../utils/showToast';

import Ionicons from '@react-native-vector-icons/ionicons';

import {Fonts} from '../../constants/fonts';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {promptForEnableLocationIfNeeded} from 'react-native-android-location-enabler';

import {useAppDataStore} from '../../store/appDataStore';

const AddressScreen = ({navigation}: any) => {
  const primaryPhone = useAuthStore(
    state => state.primaryPhone,
  );

  const authUser = useAuthStore(
    state => state.user,
  );

  const updateUser = useAuthStore(
    state => state.updateUser,
  );

  const language = useLanguageStore(
    state => state.language,
  );

  const cachedAddresses = useAppDataStore(
    state => state.addresses,
  );

  const setAddresses = useAppDataStore(
    state => state.setAddresses,
  );

  const setAddress = useBookingStore(
    state => state.setAddress,
  );

  const [addressSaved, setAddressSaved] = useState(false);

  const [selectedSavedAddress, setSelectedSavedAddress] =
    useState<any>(null);

  const setCustomerName = useBookingStore(
    state => state.setCustomerName,
  );

  const setSecondaryPhone = useBookingStore(
    state => state.setSecondaryPhone,
  );

  const [showMap, setShowMap] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const mapRef = useRef<MapView>(null);

  const setCoordinates = useBookingStore(
    state => state.setCoordinates,
  );

  const bookingCustomerName = useBookingStore(
    state => state.customerName,
  );

  const bookingSecondaryPhone = useBookingStore(
    state => state.secondaryPhone,
  );

  const bookingAddress = useBookingStore(
    state => state.address,
  );

  const bookingLatitude = useBookingStore(
    state => state.latitude,
  );

  const bookingLongitude = useBookingStore(
    state => state.longitude,
  );

  const [customerName, setName] = useState(bookingCustomerName || '');
  const [secondaryPhone, setSecondaryNumber] = useState(bookingSecondaryPhone || '');
  const [address, setAddressText] = useState(bookingAddress || '');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [latitude, setLatitude] = useState<number | null>(bookingLatitude);
  const [longitude, setLongitude] = useState<number | null>(bookingLongitude);
  const [currentLatitude, setCurrentLatitude] = useState<number | null>(null);
  const [currentLongitude, setCurrentLongitude] = useState<number | null>(null);

  const [region, setRegion] = useState({
    latitude: 9.9312,
    longitude: 76.2673,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [secondaryPhoneError, setSecondaryPhoneError] = useState('');
  const [addressType, setAddressType] = useState('Home');
  const [locationReady, setLocationReady] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Editing an existing saved address (as opposed to picking one for this
  // booking, or adding a brand new one) — distinct from selectedSavedAddress
  // so the form can be open at the same time a saved address remains chosen.
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Same country list/validation the login screen uses — see
  // phoneValidation.ts. Secondary phone previously had no country selector
  // at all, so a saved value is parsed back into {country, localNumber}
  // when opening an address for edit.
  const [secondaryPhoneCountry, setSecondaryPhoneCountry] = useState(
    PHONE_COUNTRIES[0],
  );
  const [showSecondaryCountryModal, setShowSecondaryCountryModal] =
    useState(false);

  useEffect(() => {
    if (cachedAddresses.length > 0) {
      setSavedAddresses(cachedAddresses);
      setLoadingAddresses(false);
    } else {
      loadAddresses();
    }
  }, []);

  useEffect(() => {
    if (!bookingAddress || savedAddresses.length === 0) {
      return;
    }

    const selected = savedAddresses.find(
      item => item.fullAddress === bookingAddress,
    );

    if (selected) {
      setSelectedSavedAddress(selected);
      setShowForm(false);
    }
  }, [savedAddresses, bookingAddress]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);

      const response = await getAddresses();

      const addresses = response.data.addresses || [];

      setSavedAddresses(addresses);
      setAddresses(addresses);
    } catch (error) {
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);

      const updatedAddresses = savedAddresses.filter(
        item => item.id !== addressId,
      );

      setSavedAddresses(updatedAddresses);
      setAddresses(updatedAddresses);

      if (selectedSavedAddress?.id === addressId) {
        setSelectedSavedAddress(null);
      }

      showSuccess(t('addressRemovedSuccessfully', language));
    } catch (error) {
      showError(t('failedToRemoveAddress', language));
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  };

  const prepareLocation = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setError(t('locationPermissionDenied', language));
      return;
    }

    try {
      await promptForEnableLocationIfNeeded({interval: 10000});
      setLocationReady(true);
    } catch (error) {
      showError(t('pleaseEnableLocation', language));
      return;
    }
  };

  const fetchCurrentLocation = () => {
    if (fetchingLocation) {
      return;
    }

    setFetchingLocation(true);

    Geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLatitude(lat);
        setCurrentLongitude(lng);
        setLatitude(lat);
        setLongitude(lng);
        setCoordinates(lat, lng);

        setAddressText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        setShowMap(true);

        setTimeout(() => {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }, 300);

        setCoordinates(lat, lng);

        const fetchedAddress = await getAddressFromCoordinates(lat, lng);

        if (fetchedAddress) {
          setAddressText(fetchedAddress);
        }

        setFetchingLocation(false);
      },

      error => {
        setFetchingLocation(false);
        showError(error.message);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const handleSaveAddress = async () => {
    setNameError('');
    setAddressError('');
    setSecondaryPhoneError('');
    setError('');

    if (!customerName.trim()) {
      setNameError(t('pleaseEnterName', language));
      return;
    }

    if (!address.trim()) {
      setAddressError(t('pleaseEnterAddress', language));
      return;
    }

    // Secondary phone is optional — only validate when the user actually
    // entered something, using the exact same per-country rule Login uses
    // (isValidPhoneForCountry against the country picked in this form).
    const trimmedSecondaryPhone = secondaryPhone.trim();

    if (
      trimmedSecondaryPhone &&
      !isValidPhoneForCountry(trimmedSecondaryPhone, secondaryPhoneCountry)
    ) {
      setSecondaryPhoneError(
        `${t('enterValidPhone', language)} ${secondaryPhoneCountry.maxLength} ${t('digitPhoneNumber', language)}`,
      );
      return;
    }

    const secondaryPhonePayload = trimmedSecondaryPhone
      ? `${secondaryPhoneCountry.code}${trimmedSecondaryPhone}`
      : '';

    try {
      if (editingAddressId) {
        const response = await updateAddress(editingAddressId, {
          customerName,
          secondaryPhone: secondaryPhonePayload,
          label: addressType,
          fullAddress: address,
          latitude,
          longitude,
        });

        const updatedAddress = response.data.address;

        const updatedAddresses = savedAddresses.map(item =>
          item.id === editingAddressId ? updatedAddress : item,
        );

        setSavedAddresses(updatedAddresses);
        setAddresses(updatedAddresses);

        if (authUser && authUser.name !== customerName) {
          await updateUser({...authUser, name: customerName});
        }

        setSelectedSavedAddress(updatedAddress);
        setShowForm(false);
        setAddressSaved(true);
        setEditingAddressId(null);
        setName('');
        setSecondaryNumber('');
        setAddressText('');

        showSuccess(t('addressUpdatedSuccessfully', language));

        // Refresh from ERP rather than trusting the optimistic merge alone.
        await loadAddresses();

        return;
      }

      const response = await addAddress({
        customerName,
        primaryPhone,
        secondaryPhone: secondaryPhonePayload,
        label: addressType,
        fullAddress: address,
        latitude,
        longitude,
        isDefault: true,
      });

      const newAddress = response.data.address;

      const updatedAddresses = [newAddress, ...savedAddresses];

      setSavedAddresses(updatedAddresses);
      setAddresses(updatedAddresses);

      if (authUser && authUser.name !== customerName) {
        await updateUser({...authUser, name: customerName});
      }

      setSelectedSavedAddress(response.data.address);
      setShowForm(false);
      setAddressSaved(true);
      setName('');
      setSecondaryNumber('');
      setAddressText('');

      showSuccess(t('addressSavedSuccessfully', language));
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          t('failedToSaveAddress', language),
      );
    }
  };

  const handleContinue = async () => {
    if (!customerName.trim()) {
      setNameError(t('pleaseEnterName', language));
      return;
    }

    if (!address.trim() && (!latitude || !longitude)) {
      showError(t('pleaseSelectAddress', language));
      return;
    }

    try {
      setLoading(true);

      // The name field on this screen can be edited even when continuing
      // with an already-selected saved address, but until now that edit
      // was only ever kept in local/booking state — it never reached the
      // backend in this flow (only the "Add Address" form's save button
      // did), so the ERP customer record — and therefore every booking —
      // kept showing the old name.
      if (
        selectedSavedAddress &&
        customerName.trim() !== (selectedSavedAddress.customerName || '').trim()
      ) {
        try {
          await updateName(customerName.trim());

          if (authUser) {
            await updateUser({...authUser, name: customerName.trim()});
          }
        } catch (nameError: any) {
          showError(
            nameError?.response?.data?.message ||
              t('failedToSaveAddress', language),
          );
        }
      }

      setCustomerName(customerName);
      setSecondaryPhone(secondaryPhone);
      setAddress(address);

      navigation.navigate('BookingSummary');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          t('failedToSaveAddress', language),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.headerContainer}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}>
              <Ionicons
                name={
                  language === 'ar'
                    ? 'chevron-forward'
                    : 'chevron-back'
                }
                size={22}
                color="#0F172A"
              />
            </TouchableOpacity>

            <View style={styles.headerTextBlock}>
              <Text style={styles.heading}>
                {t('chooseAddress', language)}
              </Text>
              <Text style={styles.subtitle}>
                {t('chooseAddressSubtitle', language)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Saved Addresses ── */}
        {!showForm && (
          <>
            <View style={styles.savedHeader}>

              <View style={styles.savedTitleRow}>
                <View style={styles.savedTitleAccent} />
                <Text style={styles.savedTitle}>
                  {t('savedAddresses', language)}
                </Text>
                {savedAddresses.length > 0 && (
                  <View style={styles.savedCountBadge}>
                    <Text style={styles.savedCountText}>
                      {savedAddresses.length}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.addAddressButton}
                activeOpacity={0.7}
                onPress={() => {
                  setShowForm(true);
                  setSelectedSavedAddress(null);
                  setAddressSaved(false);
                  setEditingAddressId(null);
                  setAddressType('Home');
                  setSecondaryPhoneCountry(PHONE_COUNTRIES[0]);
                  setName('');
                  setSecondaryNumber('');
                  setAddressText('');
                  setLatitude(null);
                  setLongitude(null);
                  setShowMap(false);
                }}>
                <Ionicons
                  name="add-circle"
                  size={18}
                  color="#2563EB"
                />
                <Text style={styles.addAddressText}>
                  {t('addAddress', language)}
                </Text>
              </TouchableOpacity>

            </View>

            {loadingAddresses ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color="#2563EB"
                />
                <Text style={styles.loadingText}>
                  {t('loadingAddresses', language)}
                </Text>
              </View>
            ) : (
              <>
                {savedAddresses.length === 0 && (
                  <View style={styles.emptyAddresses}>
                    <View style={styles.emptyAddressIcon}>
                      <Ionicons
                        name="location-outline"
                        size={36}
                        color="#2563EB"
                      />
                    </View>
                    <Text style={styles.emptyAddressTitle}>
                      {t('noSavedAddresses', language)}
                    </Text>
                    <Text style={styles.emptyAddressSubtitle}>
                      {t('addAddressToContinue', language)}
                    </Text>
                  </View>
                )}

                {savedAddresses.map((item, index) => {
                  const isSelected =
                    selectedSavedAddress?.id === item.id;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.savedCard,
                        isSelected && styles.selectedSavedCard,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setSelectedSavedAddress(item);
                        setName(item.customerName || '');
                        setSecondaryNumber(item.secondaryPhone || '');
                        setAddressText(item.fullAddress);
                        setLatitude(item.latitude);
                        setLongitude(item.longitude);
                        setShowMap(false);
                        setShowForm(false);
                      }}>

                      {isSelected && (
                        <View style={styles.selectedTopBar} />
                      )}

                      <View style={styles.savedCardTop}>
                        <View style={[
                          styles.labelChip,
                          isSelected && styles.labelChipSelected,
                        ]}>
                          <Ionicons
                            name={
                              item.label === 'Office'
                                ? 'business'
                                : 'home'
                            }
                            size={13}
                            color={isSelected ? '#2563EB' : '#64748B'}
                          />
                          <Text style={[
                            styles.savedLabel,
                            isSelected && styles.savedLabelSelected,
                          ]}>
                            {item.label}
                          </Text>
                        </View>

                        <View style={styles.savedCardActions}>
                          {isSelected && (
                            <View style={styles.checkBadge}>
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#FFFFFF"
                              />
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => {
                              const {country, localNumber} =
                                parsePhoneWithCountry(item.secondaryPhone);

                              setEditingAddressId(item.id);
                              setSelectedSavedAddress(null);
                              setAddressSaved(false);
                              setAddressType(item.label || 'Home');
                              setName(item.customerName || '');
                              setSecondaryPhoneCountry(country);
                              setSecondaryNumber(localNumber);
                              setAddressText(item.fullAddress || '');
                              setLatitude(item.latitude);
                              setLongitude(item.longitude);
                              setShowMap(false);
                              setShowForm(true);
                            }}>
                            <Ionicons
                              name="create-outline"
                              size={15}
                              color="#2563EB"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() =>
                              handleDeleteAddress(item.id)
                            }>
                            <Ionicons
                              name="trash-outline"
                              size={15}
                              color="#EF4444"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.customerName}>
                        {item.customerName}
                      </Text>

                      <Text style={styles.phone}>
                        {item.primaryPhone}
                      </Text>

                      <View style={styles.addressRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#94A3B8"
                          style={styles.addressIcon}
                        />
                        <Text style={styles.addressText}>
                          {item.fullAddress}
                        </Text>
                      </View>

                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── Global error ── */}
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color="#EF4444"
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Add Address Form ── */}
        {showForm && (
          <View style={styles.formContainer}>

            <View style={styles.formHeader}>
              <TouchableOpacity
                style={styles.formBackBtn}
                onPress={() => {
                  setShowForm(false);
                  setEditingAddressId(null);
                }}
                activeOpacity={0.7}>
                <Ionicons
                  name={
                    language === 'ar'
                      ? 'chevron-forward'
                      : 'chevron-back'
                  }
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
              <View>
                <Text style={styles.formTitle}>
                  {editingAddressId
                    ? t('editAddress', language)
                    : t('addNewAddress', language)}
                </Text>
                <Text style={styles.formSubtitle}>
                  {t('addressFormSubtitle', language)}
                </Text>
              </View>
            </View>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  addressType === 'Home' && styles.activeType,
                ]}
                activeOpacity={0.8}
                onPress={() => setAddressType('Home')}>
                <Ionicons
                  name="home-outline"
                  size={17}
                  color={addressType === 'Home' ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[
                  styles.typeText,
                  addressType === 'Home' && styles.activeTypeText,
                ]}>
                  {t('home', language)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  addressType === 'Office' && styles.activeType,
                ]}
                activeOpacity={0.8}
                onPress={() => setAddressType('Office')}>
                <Ionicons
                  name="business-outline"
                  size={17}
                  color={addressType === 'Office' ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[
                  styles.typeText,
                  addressType === 'Office' && styles.activeTypeText,
                ]}>
                  {t('office', language)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={14} color="#64748B" />
                <Text style={styles.label}>
                  {t('fullName', language)}
                </Text>
              </View>
              <TextInput
                value={customerName}
                onChangeText={text => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                placeholder={t('enterYourName', language)}
                placeholderTextColor="#CBD5E1"
                style={styles.singleInput}
              />
              {nameError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldError}>{nameError}</Text>
                </View>
              ) : null}
            </View>

            {/* Primary phone (read-only) */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="call-outline" size={14} color="#64748B" />
                <Text style={styles.label}>
                  {t('mobileNumber', language)}
                </Text>
              </View>
              <TextInput
                editable={false}
                value={primaryPhone}
                style={styles.readOnlyInput}
              />
            </View>

            {/* Secondary phone */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="call-outline" size={14} color="#64748B" />
                <Text style={styles.label}>
                  {t('alternativeNumber', language)}
                </Text>
              </View>
              <View style={styles.secondaryPhoneRow}>
                <TouchableOpacity
                  style={styles.secondaryCountryWrap}
                  activeOpacity={0.8}
                  onPress={() => setShowSecondaryCountryModal(true)}>
                  <Text style={styles.country}>
                    {secondaryPhoneCountry.flag} {secondaryPhoneCountry.code}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                  <View style={styles.countryDivider} />
                </TouchableOpacity>
                <TextInput
                  value={secondaryPhone}
                  keyboardType="phone-pad"
                  maxLength={secondaryPhoneCountry.maxLength}
                  onChangeText={text => {
                    setSecondaryNumber(text);
                    if (secondaryPhoneError) setSecondaryPhoneError('');
                  }}
                  placeholder={t('optional', language)}
                  placeholderTextColor="#CBD5E1"
                  style={[styles.singleInput, styles.secondaryPhoneInput]}
                />
              </View>
              {secondaryPhoneError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldError}>{secondaryPhoneError}</Text>
                </View>
              ) : null}
            </View>

            {/* Secondary phone country modal */}
            <Modal
              transparent
              animationType="fade"
              visible={showSecondaryCountryModal}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowSecondaryCountryModal(false)}>
                <View style={styles.modalCard}>
                  {PHONE_COUNTRIES.map(item => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.countryItem}
                      onPress={() => {
                        setSecondaryPhoneCountry(item);
                        setSecondaryNumber('');
                        setSecondaryPhoneError('');
                        setShowSecondaryCountryModal(false);
                      }}>
                      <Text style={styles.countryItemText}>
                        {item.flag} {t(item.nameKey, language)}
                      </Text>
                      <Text style={styles.countryCode}>
                        {item.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Address text */}
            <View style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.label}>
                  {t('address', language)}
                </Text>
              </View>
              <TextInput
                placeholder={t('enterCompleteAddress', language)}
                placeholderTextColor="#CBD5E1"
                multiline
                numberOfLines={5}
                value={address}
                onChangeText={text => {
                  setAddressText(text);
                  if (addressError) setAddressError('');
                }}
                style={styles.input}
              />
              {addressError ? (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.fieldError}>{addressError}</Text>
                </View>
              ) : null}
            </View>

            {/* Use current location */}
            {!selectedSavedAddress && (
              <TouchableOpacity
                style={styles.locationButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (!locationReady) {
                    prepareLocation();
                  } else {
                    fetchCurrentLocation();
                  }
                }}>
                <View style={styles.locationIconWrap}>
                  <Ionicons name="locate" size={17} color="#2563EB" />
                </View>
                <Text style={styles.locationButtonText}>
                  {fetchingLocation
                    ? t('fetchingLocation', language)
                    : locationReady
                    ? t('fetchCurrentLocation', language)
                    : t('useCurrentLocation', language)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}

            {/* Map */}
            {showMap && (
              <View style={styles.mapWrapper}>
                <MapView
                  ref={mapRef}
                  region={region}
                  showsUserLocation={true}
                  style={styles.map}
                  onPress={async e => {
                    const lat = e.nativeEvent.coordinate.latitude;
                    const lng = e.nativeEvent.coordinate.longitude;

                    setLatitude(lat);
                    setLongitude(lng);
                    setCoordinates(lat, lng);

                    setRegion({
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });

                    setAddressText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

                    const fetchedAddress = await getAddressFromCoordinates(lat, lng);

                    if (fetchedAddress) {
                      setAddressText(fetchedAddress);
                    }
                  }}
                  onRegionChangeComplete={newRegion => {
                    setRegion(newRegion);
                  }}>
                  <Marker
                    draggable
                    coordinate={{
                      latitude: latitude!,
                      longitude: longitude!,
                    }}
                    onDragEnd={async e => {
                      const lat = e.nativeEvent.coordinate.latitude;
                      const lng = e.nativeEvent.coordinate.longitude;

                      setLatitude(lat);
                      setLongitude(lng);
                      setCoordinates(lat, lng);

                      setRegion({
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      });

                      setAddressText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    }}
                  />
                </MapView>
              </View>
            )}

            {/* Location captured badge */}
            {latitude && longitude ? (
              <View style={styles.locationCapturedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.locationCapturedText}>
                  {t('locationCaptured', language)}
                </Text>
              </View>
            ) : null}

            {/* Save Address button */}
            {(editingAddressId || (!selectedSavedAddress && !addressSaved)) && (
              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.85}
                onPress={handleSaveAddress}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingAddressId
                    ? t('updateAddress', language)
                    : t('saveAddress', language)}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        )}

      </ScrollView>

      {/* ── Sticky Footer ── */}
      {!showForm && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={[
              styles.button,
              (loading || !selectedSavedAddress) && styles.disabledButton,
            ]}
            disabled={loading || !selectedSavedAddress}
            activeOpacity={0.85}
            onPress={handleContinue}>
            <Ionicons
              name={language === 'ar' ? 'arrow-back' : 'arrow-forward'}
              size={20}
              color={
                loading || !selectedSavedAddress ? '#94A3B8' : '#FFFFFF'
              }
              style={styles.buttonIcon}
            />
            <Text style={[
              styles.buttonText,
              (loading || !selectedSavedAddress) && styles.buttonTextDisabled,
            ]}>
              {t('continue', language)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({

  root: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 140,
  },

  headerContainer: {
    marginTop: 45,
    marginBottom: 24,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  headerTextBlock: {
    flex: 1,
  },

  heading: {
    fontSize: 26,
    color: '#0F172A',
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },

  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  savedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  savedTitleAccent: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  savedTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  savedCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },

  savedCountText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#2563EB',
  },

  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  addAddressText: {
    color: '#2563EB',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },

  emptyAddresses: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyAddressIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyAddressTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 6,
  },

  emptyAddressSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#64748B',
  },

  savedCard: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 3,
  },

  selectedSavedCard: {
    borderColor: '#2563EB',
    backgroundColor: '#FAFBFF',
    shadowColor: '#2563EB',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  selectedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  labelChipSelected: {
    backgroundColor: '#EEF2FF',
  },

  savedLabel: {
    color: '#64748B',
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },

  savedLabelSelected: {
    color: '#2563EB',
  },

  savedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  customerName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 3,
  },

  phone: {
    color: '#64748B',
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 8,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },

  addressIcon: {
    marginTop: 2,
    flexShrink: 0,
  },

  addressText: {
    flex: 1,
    color: '#475569',
    lineHeight: 20,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: Fonts.medium,
  },

  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  formBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  formTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  formSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  typeButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  activeType: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },

  typeText: {
    color: '#64748B',
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  activeTypeText: {
    color: '#FFFFFF',
  },

  fieldCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },

  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  singleInput: {
    height: 44,
    color: '#0F172A',
    fontSize: 15,
    fontFamily: Fonts.medium,
    paddingVertical: 0,
  },

  secondaryPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  secondaryCountryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },

  country: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Fonts.semiBold,
  },

  countryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 8,
    marginRight: 4,
  },

  secondaryPhoneInput: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '82%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },

  countryItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  countryItemText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: '#0F172A',
  },

  countryCode: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#64748B',
  },

  readOnlyInput: {
    height: 44,
    color: '#94A3B8',
    fontSize: 15,
    fontFamily: Fonts.regular,
    paddingVertical: 0,
  },

  input: {
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Fonts.regular,
    lineHeight: 20,
    paddingVertical: 4,
  },

  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },

  fieldError: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  locationButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C7CEFF',
    backgroundColor: '#FAFBFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },

  locationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  locationButtonText: {
    flex: 1,
    color: '#2563EB',
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  mapWrapper: {
    height: 220,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  map: {
    flex: 1,
  },

  locationCapturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },

  locationCapturedText: {
    color: '#16A34A',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },

  saveButton: {
    backgroundColor: '#2563EB',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
    shadowColor: '#2563EB',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  stickyFooter: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },

  button: {
    backgroundColor: '#2563EB',
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },

  disabledButton: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonIcon: {
    marginRight: 2,
  },

  buttonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },

  buttonTextDisabled: {
    color: '#94A3B8',
  },

  loadingContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: Fonts.medium,
  },
});
