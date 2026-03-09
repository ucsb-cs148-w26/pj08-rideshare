import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, Modal, Platform, RefreshControl, Alert,
} from 'react-native';
import {
  collection, query, orderBy,
  onSnapshot, doc, getDoc, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { auth, db, functions } from '../../../src/firebase';
import { httpsCallable } from 'firebase/functions';
import { useStripe } from '@stripe/stripe-react-native';
import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';
import DefaultAvatar from '../../components/DefaultAvatar';
import { getOrCreateRideConversation } from '../../../src/utils/messaging';
import STRIPE_CONFIG from '../../../src/stripeConfig';

const tagColors = {
  'Downtown': '#e11d48', 'Groceries/Shopping': '#f97316', 'SBA': '#efdf70',
  'LAX': '#10b981', 'Amtrak Station': '#0ea5e9', 'Going Home/Far': '#6366f1', 'Other': '#ff1493',
};

const PREFILLED_TEMPLATES = [
  { id: 'grocery', icon: 'cart-outline', label: 'Grocery Run', subtitle: 'Costco / Target / Trader Joe\'s', params: { prefillTag: 'Groceries/Shopping', prefillSeats: '3', prefillPrice: '5' } },
  { id: 'downtown', icon: 'business-outline', label: 'Downtown Trip', subtitle: 'State St & surrounds', params: { prefillTag: 'Downtown', prefillSeats: '3', prefillPrice: '3' } },
  { id: 'airport', icon: 'airplane-outline', label: 'Airport / Amtrak', subtitle: 'LAX or SB Amtrak Station', params: { prefillTag: 'LAX', prefillSeats: '2', prefillPrice: '15' } },
];

function formatDate(ds) { if (!ds) return ''; return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatTime(ds) { if (!ds) return ''; return new Date(ds).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
function getRideLocationLabel(r, f) { return f === 'to' ? String(r?.toLabel || r?.toAddress || '') : String(r?.fromLabel || r?.fromAddress || ''); }
const toNumber = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v)); return Number.isFinite(n) ? n : 0; };

// ── Compact ride row ──────────────────────────────────────────
const CompactRideRow = memo(({ item, ownerPhotos, ownerBgColors, ownerAvatarPresets, onPress }) => {
  const tagColor = item.tag ? tagColors[item.tag] : null;
  return (
    <TouchableOpacity style={s.compactRow} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={s.compactAvatar}>
        {ownerPhotos[item.ownerId] ? (
          <Image source={{ uri: ownerPhotos[item.ownerId] }} style={{ width: 36, height: 36, borderRadius: 18 }} />
        ) : (
          <DefaultAvatar size={36} bgColor={ownerBgColors[item.ownerId] || '#FFFFFF'} avatarType={ownerAvatarPresets[item.ownerId] || 'default'} />
        )}
        {tagColor && <View style={[s.compactTagDot, { backgroundColor: tagColor }]} />}
      </View>
      <View style={s.compactInfo}>
        <View style={s.compactTopLine}>
          <Text style={s.compactName} numberOfLines={1}>{item.ownerName}</Text>
          <Text style={s.compactPrice}>${item.price}</Text>
        </View>
        <Text style={s.compactRoute} numberOfLines={1}>{getRideLocationLabel(item, 'from')} → {getRideLocationLabel(item, 'to')}</Text>
        <Text style={s.compactDate}>{formatDate(item.rideDate)}  ·  {formatTime(item.rideDate)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
});

// ══════════════════════════════════════════════════════════════
export default function Homepage() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [ownerPhotos, setOwnerPhotos] = useState({});
  const [ownerBgColors, setOwnerBgColors] = useState({});
  const [ownerAvatarPresets, setOwnerAvatarPresets] = useState({});
  const ownerCacheRef = useRef(new Set());

  const [selectedRide, setSelectedRide] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmRide, setConfirmRide] = useState(null);
  const [showCancellationWarning, setShowCancellationWarning] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [joinedRideIds, setJoinedRideIds] = useState(new Set());
  const [hasVehicleInfo, setHasVehicleInfo] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const ridesUnsubRef = useRef(null);

  // ── Owner profiles ──────────────────────────────────────────
  const fetchOwnerProfiles = useCallback((rides) => {
    const uncachedIds = [...new Set(rides.map((r) => r.ownerId).filter((id) => id && !ownerCacheRef.current.has(id)))];
    if (!uncachedIds.length) return;
    uncachedIds.forEach((id) => ownerCacheRef.current.add(id));
    Promise.all(uncachedIds.map((id) => getDoc(doc(db, 'users', id)))).then((snaps) => {
      const ph = {}, bg = {}, pr = {};
      snaps.forEach((snap, i) => { if (snap.exists()) { const d = snap.data(); ph[uncachedIds[i]] = d.photoURL || null; bg[uncachedIds[i]] = d.avatarBgColor || '#FFFFFF'; pr[uncachedIds[i]] = d.avatarPreset || 'default'; } });
      setOwnerPhotos((p) => ({ ...p, ...ph })); setOwnerBgColors((p) => ({ ...p, ...bg })); setOwnerAvatarPresets((p) => ({ ...p, ...pr }));
    });
  }, []);

  // ── Subscribe to recent rides ───────────────────────────────
  const subscribeToRides = useCallback(() => {
    const u = auth.currentUser;
    if (!u) { setLoading(false); return; }
    if (ridesUnsubRef.current) ridesUnsubRef.current();
    const unsub = onSnapshot(query(collection(db, 'rides'), orderBy('createdAt', 'desc')), (snap) => {
      const now = Date.now();
      const avail = snap.docs
        .map((d) => ({ id: d.id, ...d.data(), ownerName: (d.data().ownerName ?? 'Unknown Driver').toString() }))
        .filter((r) => r.ownerId !== u.uid && r.status !== 'cancelled' && r.status !== 'canceled' && r.status !== 'started' && r.status !== 'completed' && new Date(r.rideDate).getTime() > now)
        .slice(0, 3);
      setRecentRides(avail); fetchOwnerProfiles(avail); setLoading(false); setRefreshing(false);
    }, () => { setLoading(false); setRefreshing(false); });
    ridesUnsubRef.current = unsub;
    return unsub;
  }, [fetchOwnerProfiles]);

  useEffect(() => { const u = subscribeToRides(); return () => { if (u) u(); }; }, [subscribeToRides]);

  // ── User doc listener (joinedRideIds + vehicle) ─────────────
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) { setHasVehicleInfo(false); setLoadingProfile(false); return; }
    const unsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
      if (!snap.exists()) { setJoinedRideIds(new Set()); setHasVehicleInfo(false); setLoadingProfile(false); return; }
      const d = snap.data() || {};
      setJoinedRideIds(new Set(Array.isArray(d.joinedRideIds) ? d.joinedRideIds : []));
      const vs = Array.isArray(d.vehicles) ? d.vehicles : []; const pv = vs[0] || {};
      setHasVehicleInfo(Boolean(pv.make?.trim() && pv.model?.trim() && pv.plate?.trim()));
      setLoadingProfile(false);
    }, () => { setJoinedRideIds(new Set()); setHasVehicleInfo(false); setLoadingProfile(false); });
    return () => unsub();
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); subscribeToRides(); }, [subscribeToRides]);

  // ── Open details ────────────────────────────────────────────
  const handleRidePress = useCallback(async (ride) => {
    setSelectedRide(ride); setDriverInfo(null); setDriverVehicle(null); setDetailsModalVisible(true);
    try {
      const snap = await getDoc(doc(db, 'users', ride.ownerId));
      if (snap.exists()) {
        const d = snap.data() || {}; setDriverInfo(d);
        let fv = d.vehicle || (Array.isArray(d.vehicles) && d.vehicles[0]) || null;
        if (fv) setDriverVehicle({ make: fv.make || fv.manufacturer || '', model: fv.model || fv.trim || '', licensePlate: fv.licensePlate || fv.plate || fv.license_plate || '' });
      }
    } catch (e) { console.error('Error:', e); }
  }, []);

  // ── Join confirm flow ───────────────────────────────────────
  const openJoinConfirm = useCallback((ride) => {
    if (joinedRideIds.has(ride.id)) { Alert.alert('Already Joined', 'You have already joined this ride.'); return; }
    if (Number(ride.seats) <= 0) { Alert.alert('Sold Out', 'No seats available.'); return; }
    // Close details modal first, then open confirm after iOS finishes dismissing
    setDetailsModalVisible(false);
    setConfirmRide(ride);
    setShowCancellationWarning(false);
    setTimeout(() => setConfirmVisible(true), 350);
  }, [joinedRideIds]);

  const closeJoinConfirm = () => { setConfirmVisible(false); setConfirmRide(null); setShowCancellationWarning(false); };

  // ── Full Stripe payment join (identical to joinpage) ────────
  const handleConfirmJoin = useCallback(async () => {
    if (!confirmRide) return;
    const currentUser = auth.currentUser;
    if (!currentUser) { Alert.alert('Not signed in', 'Please sign in to join a ride.'); return; }
    try {
      setIsJoining(true);
      await currentUser.getIdToken(true);

      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const { data } = await createPaymentIntent({ amount: Math.round(Number(confirmRide.price) * 100), rideId: confirmRide.id });
      const { clientSecret, paymentIntentId } = data;

      const { error: initError } = await initPaymentSheet({ merchantDisplayName: STRIPE_CONFIG.MERCHANT_NAME, paymentIntentClientSecret: clientSecret });
      if (initError) throw new Error(initError.message);

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) { if (paymentError.code === 'Canceled') { setIsJoining(false); return; } throw new Error(paymentError.message); }

      const finalizeJoinRide = httpsCallable(functions, 'finalizeJoinRide');
      await finalizeJoinRide({ rideId: confirmRide.id, paymentIntentId });

      try { await updateDoc(doc(db, 'users', currentUser.uid), { joinedRideIds: arrayUnion(confirmRide.id) }); } catch (_) {}
      try { await getOrCreateRideConversation({ rideId: confirmRide.id, ownerId: confirmRide.ownerId, rideInfo: `${confirmRide.fromAddress} → ${confirmRide.toAddress}`, rideDate: confirmRide.rideDate }); } catch (e) { console.error('Convo error:', e); }

      setJoinedRideIds((prev) => new Set(prev).add(confirmRide.id));
      closeJoinConfirm(); setDetailsModalVisible(false);
      Alert.alert('Ride Joined!', 'Payment successful! You can now message everyone in this ride from your Messages tab.', [{ text: 'OK' }]);
    } catch (e) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('already joined')) { closeJoinConfirm(); Alert.alert('Already Joined', 'You already joined this ride.'); return; }
      if (msg.toLowerCase().includes('unauthenticated') || e?.code === 'functions/unauthenticated') { closeJoinConfirm(); Alert.alert('Session Expired', 'Please sign in again.'); return; }
      console.error('Join error:', e); Alert.alert('Error', msg || 'Could not join ride.');
    } finally { setIsJoining(false); }
  }, [confirmRide, initPaymentSheet, presentPaymentSheet]);

  const alreadyJoined = selectedRide ? joinedRideIds.has(selectedRide.id) : false;

  // ── Render ──────────────────────────────────────────────────
  return (
    <View style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={[s.scrollContainer, { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.accent]} />}
      >
        {/* ── HEADER (scrolls with page, navy bg) ── */}
        <View style={s.headerSection}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/home/notificationspage")} style={s.bellButton} hitSlop={10}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </TouchableOpacity>
          <Image source={require("../../../assets/cs148_logo.png")} style={s.logoImage} resizeMode="contain" />
          <Text style={s.appName}>GauchoRides</Text>
        </View>

        {/* ── VIEW ALL AVAILABLE RIDES ── */}
        <TouchableOpacity style={s.viewAllButton} onPress={() => router.push("/(tabs)/home/joinpage")} activeOpacity={0.85}>
          <Ionicons name="search-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.viewAllButtonText}>View All Available Rides</Text>
        </TouchableOpacity>

        {/* ── QUICK JOIN ── */}
        <Text style={s.quickLabel}>Quick Join</Text>

        {loading ? (
          <View style={s.loadingBox}><ActivityIndicator size="small" color={colors.white} /><Text style={s.loadingText}>Loading rides…</Text></View>
        ) : recentRides.length === 0 ? (
          <View style={s.emptyBox}><Ionicons name="car-outline" size={36} color={colors.border} /><Text style={s.emptyText}>No available rides right now</Text><Text style={s.emptySubtext}>Check back later or host one yourself!</Text></View>
        ) : (
          <View style={s.ridesBox}>
            {recentRides.map((ride, i) => (
              <React.Fragment key={ride.id}>
                {i > 0 && <View style={s.rideDivider} />}
                <CompactRideRow item={ride} ownerPhotos={ownerPhotos} ownerBgColors={ownerBgColors} ownerAvatarPresets={ownerAvatarPresets} onPress={handleRidePress} />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* ── HOST A NEW RIDE ── */}
        <View style={s.hostSection}>
          <TouchableOpacity style={[s.hostButton, (!hasVehicleInfo || loadingProfile) && s.buttonDisabled]} onPress={() => { if (hasVehicleInfo) router.push("/(tabs)/home/hostpage"); }} disabled={!hasVehicleInfo || loadingProfile} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.hostButtonText}>Host a New Ride</Text>
          </TouchableOpacity>
          {!loadingProfile && !hasVehicleInfo && (
            <TouchableOpacity style={s.vehicleNotice} onPress={() => router.push('/(tabs)/account/accountpage')}><Text style={s.vehicleNoticeText}>Add vehicle info in your profile to host a ride.</Text></TouchableOpacity>
          )}
          <Text style={s.quickLabel}>Quick Create</Text>
          <View style={s.ridesBox}>
            {PREFILLED_TEMPLATES.map((tpl, i) => (
              <React.Fragment key={tpl.id}>
                {i > 0 && <View style={s.rideDivider} />}
                <TouchableOpacity style={[s.templateRow, (!hasVehicleInfo || loadingProfile) && s.buttonDisabled]} onPress={() => { if (hasVehicleInfo) router.push({ pathname: "/(tabs)/home/hostpage", params: tpl.params }); }} disabled={!hasVehicleInfo || loadingProfile} activeOpacity={0.7}>
                  <View style={s.templateIcon}><Ionicons name={tpl.icon} size={24} color={colors.accent} /></View>
                  <View style={s.templateText}><Text style={s.templateLabel}>{tpl.label}</Text><Text style={s.templateSubtitle}>{tpl.subtitle}</Text></View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ━━━ DETAILS MODAL ━━━ */}
      <Modal animationType="slide" transparent visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={s.modalOverlay}><View style={s.modalContent}>
          <TouchableOpacity style={s.closeButton} onPress={() => setDetailsModalVisible(false)}><Text style={s.closeButtonText}>✕</Text></TouchableOpacity>
          {selectedRide && (
            <ScrollView style={s.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={s.modalHeader}>
                <View style={s.modalDriverIcon}>
                  {driverInfo?.photoURL ? <Image source={{ uri: driverInfo.photoURL }} style={{ width: 60, height: 60, borderRadius: 30 }} /> :
                    <DefaultAvatar size={60} bgColor={driverInfo?.avatarBgColor || '#FFFFFF'} avatarType={driverInfo?.avatarPreset || 'default'} />}
                </View>
                <TouchableOpacity onPress={() => { setDetailsModalVisible(false); router.push({ pathname: '/(tabs)/account/profilepage', params: { userId: selectedRide.ownerId } }); }} activeOpacity={0.7}>
                  <Text style={s.modalDriverTitle}>{selectedRide.ownerName}</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.modalSectionTitle}>Ride Info</Text>
              <View style={s.modalSection}>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Date:</Text><Text style={s.modalInfoValue}>{formatDate(selectedRide.rideDate)}</Text></View>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Time:</Text><Text style={s.modalInfoValue}>{formatTime(selectedRide.rideDate)}</Text></View>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>From:</Text><Text style={s.modalInfoValue}>{selectedRide.fromAddress}</Text></View>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>To:</Text><Text style={s.modalInfoValue}>{selectedRide.toAddress}</Text></View>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Seats:</Text><Text style={s.modalInfoValue}>{Number(selectedRide.seats)} / {Number(selectedRide.total_seats ?? selectedRide.seats)}</Text></View>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Price:</Text><Text style={s.modalInfoValue}>${selectedRide.price}</Text></View>
                {selectedRide.tag && (<View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Tag:</Text><View style={s.modalTagContent}><View style={[s.modalTagDot, { backgroundColor: tagColors[selectedRide.tag] || '#9ca3af' }]} /><Text style={s.modalTagText}>{selectedRide.tag}</Text></View></View>)}
                {selectedRide.cancellationDeadline && (<View style={s.cancellationBox}><Text style={s.cancellationBoxLabel}>Cancellation Deadline</Text><Text style={s.cancellationBoxText}>{formatDate(selectedRide.cancellationDeadline)} at {formatTime(selectedRide.cancellationDeadline)}</Text></View>)}
              </View>
              {driverInfo && (<><View style={s.sectionDivider} /><Text style={s.modalSectionTitle}>Driver Info</Text><View style={s.modalSection}>
                <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Name:</Text><Text style={s.modalInfoValue}>{driverInfo.name || selectedRide.ownerName}</Text></View>
                {driverInfo.payHandle && <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Pay Handle:</Text><Text style={s.modalInfoValue}>{driverInfo.payHandle}</Text></View>}
                {driverInfo.role && <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Role:</Text><Text style={s.modalInfoValue}>{driverInfo.role.charAt(0).toUpperCase() + driverInfo.role.slice(1)}</Text></View>}
                {driverInfo.major && <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Major:</Text><Text style={s.modalInfoValue}>{driverInfo.major}</Text></View>}
              </View></>)}
              {driverVehicle && (<><View style={s.sectionDivider} /><Text style={s.modalSectionTitle}>Vehicle</Text><View style={s.modalSection}>
                {driverVehicle.make && <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Make:</Text><Text style={s.modalInfoValue}>{driverVehicle.make}</Text></View>}
                {driverVehicle.model && <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Model:</Text><Text style={s.modalInfoValue}>{driverVehicle.model}</Text></View>}
                {driverVehicle.licensePlate && <View style={s.modalInfoRow}><Text style={s.modalInfoLabel}>Plate:</Text><Text style={s.modalInfoValue}>{driverVehicle.licensePlate}</Text></View>}
              </View></>)}
              {selectedRide.driverNotes && (<><View style={s.sectionDivider} /><Text style={s.modalSectionTitle}>Driver Notes</Text><View style={s.modalNotes}><Text style={s.modalNotesText}>{selectedRide.driverNotes}</Text></View></>)}
              <View style={{ marginTop: 16, marginBottom: 24 }}>
                {alreadyJoined ? (
                  <View style={[s.joinBtn, s.joinBtnDisabled]}><Ionicons name="checkmark-circle" size={18} color="#999" style={{ marginRight: 6 }} /><Text style={s.joinBtnTextDisabled}>Already Joined</Text></View>
                ) : Number(selectedRide.seats) <= 0 ? (
                  <View style={[s.joinBtn, s.joinBtnDisabled]}><Text style={s.joinBtnTextDisabled}>Sold Out</Text></View>
                ) : (
                  <TouchableOpacity style={s.joinBtn} onPress={() => openJoinConfirm(selectedRide)} activeOpacity={0.85}><Text style={s.joinBtnText}>Join This Ride</Text></TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View></View>
      </Modal>

      {/* ━━━ CONFIRM JOIN MODAL (Stripe flow) ━━━ */}
      <Modal animationType="fade" transparent visible={confirmVisible} onRequestClose={closeJoinConfirm}>
        <View style={s.modalOverlay}><View style={s.confirmCard}>
          {!showCancellationWarning ? (<>
            <Text style={s.confirmTitle}>Confirm your ride</Text>
            {confirmRide && (<>
              <View style={s.confirmRow}><Text style={s.confirmLabel}>Driver</Text><Text style={s.confirmValue}>{confirmRide.ownerName}</Text></View>
              <View style={s.confirmRow}><Text style={s.confirmLabel}>When</Text><Text style={s.confirmValue}>{formatDate(confirmRide.rideDate)} • {formatTime(confirmRide.rideDate)}</Text></View>
              <View style={s.confirmRow}><Text style={s.confirmLabel}>From</Text><Text style={s.confirmValue} numberOfLines={2}>{confirmRide.fromAddress}</Text></View>
              <View style={s.confirmRow}><Text style={s.confirmLabel}>To</Text><Text style={s.confirmValue} numberOfLines={2}>{confirmRide.toAddress}</Text></View>
              <View style={s.confirmDivider} />
              <View style={s.confirmRow}><Text style={s.confirmLabel}>Ride price</Text><Text style={s.confirmValue}>${toNumber(confirmRide.price).toFixed(2)}</Text></View>
              <View style={s.confirmRow}><Text style={s.confirmTotalLabel}>Total</Text><Text style={s.confirmTotalValue}>${toNumber(confirmRide.price).toFixed(2)}</Text></View>
              <Text style={s.confirmTinyNote}>By confirming, you agree to pay the total amount shown.</Text>
            </>)}
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeJoinConfirm} disabled={isJoining}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.payBtn, isJoining && { opacity: 0.7 }]} onPress={() => setShowCancellationWarning(true)} disabled={isJoining}><Text style={s.payBtnText}>Confirm</Text></TouchableOpacity>
            </View>
          </>) : (<>
            {confirmRide && (<>
              <Text style={s.policyInfoText}>Additional fees may incur if you leave this ride after the cancellation deadline.</Text>
              <View style={s.policyDeadlineBox}>
                <Text style={s.policyDeadlineLabel}>Cancellation Deadline</Text>
                <Text style={s.policyDeadlineText}>{confirmRide.cancellationDeadline ? `${formatDate(confirmRide.cancellationDeadline)} • ${formatTime(confirmRide.cancellationDeadline)}` : 'No deadline set for this ride.'}</Text>
              </View>
            </>)}
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCancellationWarning(false)} disabled={isJoining}><Text style={s.cancelBtnText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={[s.payBtn, isJoining && { opacity: 0.7 }]} onPress={handleConfirmJoin} disabled={isJoining}><Text style={s.payBtnText}>{isJoining ? 'Processing...' : 'Pay & Join'}</Text></TouchableOpacity>
            </View>
          </>)}
        </View></View>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16 },

  // ── Header (inside scroll, same navy bg as page) ──────────
  headerSection: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 44 : 20, marginBottom: 20 },
  logoImage: { width: 80, height: 80, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '900', color: colors.white, letterSpacing: 1.2, fontFamily: Platform.OS === 'ios' ? 'Chalkduster' : 'sans-serif-condensed' },
  bellButton: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 20, right: 0, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },

  // ── View All ──────────────────────────────────────────────
  viewAllButton: { flexDirection: 'row', backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 0 },
  viewAllButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // ── Quick Join label ──────────────────────────────────────
  quickLabel: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 10, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Loading / empty ───────────────────────────────────────
  loadingBox: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  emptyBox: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  emptyText: { marginTop: 10, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  emptySubtext: { marginTop: 4, fontSize: 13, color: colors.textSecondary },

  // ── Rides box ─────────────────────────────────────────────
  ridesBox: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, marginBottom: 24, overflow: 'hidden' },
  rideDivider: { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 12 },
  compactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  compactAvatar: { width: 36, height: 36, marginRight: 10, position: 'relative' },
  compactTagDot: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.white },
  compactInfo: { flex: 1 },
  compactTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  compactName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: 8 },
  compactPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
  compactRoute: { fontSize: 13, color: colors.textPrimary, marginBottom: 2 },
  compactDate: { fontSize: 12, color: colors.textSecondary },

  // ── Host section ──────────────────────────────────────────
  hostSection: { marginTop: 4 },
  hostButton: { flexDirection: 'row', backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 0 },
  hostButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  vehicleNotice: { marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.1)' },
  vehicleNoticeText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  templateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  templateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f4f8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  templateText: { flex: 1 },
  templateLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  templateSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  // ── Modals ────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.white, borderRadius: 12, padding: 20, paddingBottom: 4, width: '88%', maxHeight: '82%', borderWidth: 2, borderColor: colors.border },
  modalScrollContent: { maxHeight: '100%' },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
  closeButtonText: { fontSize: 24, color: colors.textPrimary, fontWeight: 'bold' },
  modalHeader: { alignItems: 'center', marginBottom: 16, marginTop: 10 },
  modalDriverIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, marginBottom: 10 },
  modalDriverTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  modalSectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 16 },
  modalSection: { backgroundColor: colors.backgroundLight, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' },
  modalInfoLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, width: 110 },
  modalInfoValue: { fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  modalTagContent: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  modalTagDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  modalTagText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  cancellationBox: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  cancellationBoxLabel: { fontSize: 13, fontWeight: '700', color: '#991b1b', marginBottom: 4 },
  cancellationBoxText: { fontSize: 14, color: '#7f1d1d', fontWeight: '600' },
  modalNotes: { backgroundColor: colors.background, borderRadius: 8, padding: 14, minHeight: 50, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  modalNotesText: { fontSize: 15, color: colors.textPrimary, lineHeight: 20 },

  joinBtn: { flexDirection: 'row', backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  joinBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  joinBtnDisabled: { backgroundColor: '#e5e5e5' },
  joinBtnTextDisabled: { color: '#999', fontSize: 16, fontWeight: '600' },

  // ── Confirm modal ─────────────────────────────────────────
  confirmCard: { backgroundColor: colors.white, borderRadius: 14, padding: 18, width: '88%', borderWidth: 2, borderColor: colors.border },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  confirmLabel: { width: 80, fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  confirmValue: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  confirmDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  confirmTotalLabel: { width: 80, fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  confirmTotalValue: { flex: 1, fontSize: 16, fontWeight: '900', color: colors.primary, textAlign: 'right' },
  confirmTinyNote: { marginTop: 6, fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  policyInfoText: { marginTop: 4, fontSize: 14, lineHeight: 18, color: colors.primary, fontWeight: '700' },
  policyDeadlineBox: { marginTop: 12, borderRadius: 10, padding: 12, backgroundColor: '#fee2e2', borderWidth: 2, borderColor: '#ef4444' },
  policyDeadlineLabel: { fontSize: 13, fontWeight: '800', color: '#ef4444', marginBottom: 4 },
  policyDeadlineText: { fontSize: 14, fontWeight: '800', color: '#ef4444' },
  confirmActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.backgroundLight, marginRight: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  payBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center' },
  payBtnText: { fontSize: 14, fontWeight: '800', color: colors.white },
});
