import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, Platform, ActivityIndicator,
  Image, Alert, TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';
import { useAuth } from '../../../src/auth/AuthProvider';
import { useActiveRide } from '../../../src/context/ActiveRideContext';
import {
  collection, query, where, onSnapshot,
  doc, getDoc, getDocs,
  runTransaction, writeBatch, addDoc, serverTimestamp, updateDoc, arrayRemove,
} from 'firebase/firestore';
import { auth, db, functions } from '../../../src/firebase';
import { httpsCallable } from 'firebase/functions';
import DefaultAvatar from '../../components/DefaultAvatar';

const tagColors = {
  'Downtown': '#e11d48', 'Groceries/Shopping': '#f97316', 'SBA': '#efdf70',
  'LAX': '#10b981', 'Amtrak Station': '#0ea5e9', 'Going Home/Far': '#6366f1', 'Other': '#ff1493',
};

function formatDate(ds) { if (!ds) return ''; return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatTime(ds) { if (!ds) return ''; return new Date(ds).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
function formatDateTime(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function getRideLocationLabel(r, f) { return f === 'to' ? String(r?.toLabel || r?.toAddress || '') : String(r?.fromLabel || r?.fromAddress || ''); }

export default function MyRidesPage() {
  const { user } = useAuth();
  const { activeRide, setActiveRide } = useActiveRide();

  const [tab, setTab] = useState('hosted');
  const [hostedRides, setHostedRides] = useState([]);
  const [joinedRides, setJoinedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedRideIds, setJoinedRideIds] = useState([]);
  const [activeRideId, setActiveRideId] = useState(null);

  const [selectedRide, setSelectedRide] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [leaveRideModalVisible, setLeaveRideModalVisible] = useState(false);
  const [leavingRide, setLeavingRide] = useState(false);
  const [cancelRideModalVisible, setCancelRideModalVisible] = useState(false);
  const [cancellingRide, setCancellingRide] = useState(false);

  // PIN Verification (host)
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyRide, setVerifyRide] = useState(null);
  const [riders, setRiders] = useState([]);
  const [pinInputs, setPinInputs] = useState({});
  const [verifyingPins, setVerifyingPins] = useState({});
  const [verifiedRiders, setVerifiedRiders] = useState({});
  const [noShowRiders, setNoShowRiders] = useState({});
  const [loadingRiders, setLoadingRiders] = useState(false);

  // View Pin (rider) — ported from original homepage
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [activePinRideId, setActivePinRideId] = useState(null);
  const [ridePins, setRidePins] = useState({});

  const rideUnsubsRef = useRef([]);

  // ── User doc listener ───────────────────────────────────────
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
      if (!snap.exists()) { setJoinedRideIds([]); setActiveRideId(null); return; }
      const d = snap.data() || {};
      setJoinedRideIds(Array.isArray(d.joinedRideIds) ? d.joinedRideIds : []);
      setActiveRideId(d.activeRideId || null);
    });
    return () => unsub();
  }, []);

  // ── Hosted rides ────────────────────────────────────────────
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) { setLoading(false); return; }
    const q = query(collection(db, 'rides'), where('ownerId', '==', u.uid));
    const unsub = onSnapshot(q, (snap) => {
      setHostedRides(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.status !== 'cancelled' && r.status !== 'canceled' && r.status !== 'completed')
        .sort((a, b) => new Date(a.rideDate) - new Date(b.rideDate)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // ── Joined ride doc listeners ───────────────────────────────
  useEffect(() => {
    rideUnsubsRef.current.forEach((u) => u());
    rideUnsubsRef.current = [];
    if (!joinedRideIds.length) { setJoinedRides([]); return; }
    const rideMap = {};
    const unsubs = joinedRideIds.map((rideId) =>
      onSnapshot(doc(db, 'rides', rideId), (snap) => {
        if (!snap.exists()) { delete rideMap[rideId]; }
        else { const d = snap.data(); if (['cancelled','canceled','completed'].includes(d.status)) delete rideMap[rideId]; else rideMap[rideId] = { id: rideId, ...d }; }
        setJoinedRides(Object.values(rideMap).sort((a, b) => new Date(a.rideDate) - new Date(b.rideDate)));
      }, () => { delete rideMap[rideId]; })
    );
    rideUnsubsRef.current = unsubs;
    return () => unsubs.forEach((u) => u());
  }, [joinedRideIds]);

  // ── Active ride detection ───────────────────────────────────
  const activeJoinedRide = activeRideId ? joinedRides.find((r) => r.id === activeRideId) || null : null;
  const isRideActive = Boolean(activeRide) || Boolean(activeJoinedRide);

  useFocusEffect(useCallback(() => {
    if (activeRide) router.push({ pathname: '/(tabs)/home/duringride', params: activeRide });
    else if (activeJoinedRide) router.push({ pathname: '/(tabs)/home/duringride', params: { rideId: activeJoinedRide.id, fromAddress: activeJoinedRide.fromAddress, toAddress: activeJoinedRide.toAddress, rideDate: activeJoinedRide.rideDate, ownerName: activeJoinedRide.ownerName } });
  }, [activeRide, activeJoinedRide]));

  // ── View Pin (rider) ────────────────────────────────────────
  const handleViewPin = useCallback(async (ride) => {
    setActivePinRideId(ride.id);
    setPinModalVisible(true);
    if (ridePins[ride.id]) return; // Already cached
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) { setRidePins((p) => ({ ...p, [ride.id]: 'ERR' })); return; }
      const joinRef = doc(db, 'rides', ride.id, 'joins', currentUserId);
      const joinSnap = await getDoc(joinRef);
      if (joinSnap.exists()) {
        setRidePins((p) => ({ ...p, [ride.id]: joinSnap.data().pickupPin || 'N/A' }));
      } else {
        setRidePins((p) => ({ ...p, [ride.id]: 'NONE' }));
      }
    } catch (e) {
      console.error('Error fetching PIN:', e);
      setRidePins((p) => ({ ...p, [ride.id]: 'ERR' }));
    }
  }, [ridePins]);

  // ── Open details modal ──────────────────────────────────────
  const openDetails = useCallback(async (ride) => {
    setSelectedRide(ride); setDriverInfo(null); setDriverVehicle(null); setDetailsModalVisible(true);
    try {
      const snap = await getDoc(doc(db, 'users', ride.ownerId));
      if (snap.exists()) { const d = snap.data() || {}; setDriverInfo(d);
        let fv = d.vehicle || (Array.isArray(d.vehicles) && d.vehicles[0]) || null;
        if (fv) setDriverVehicle({ make: fv.make || fv.manufacturer || '', model: fv.model || fv.trim || '', licensePlate: fv.licensePlate || fv.plate || fv.license_plate || '' });
      }
    } catch (e) { console.error('Error:', e); }
  }, []);

  // ── Open PIN verify modal (host) ────────────────────────────
  const openVerifyModal = useCallback(async (ride) => {
    setVerifyRide(ride); setVerifyModalVisible(true); setLoadingRiders(true);
    setPinInputs({}); setVerifyingPins({}); setVerifiedRiders({}); setNoShowRiders({});
    try {
      const joinsSnap = await getDocs(collection(db, 'rides', ride.id, 'joins'));
      const list = [], noShow = {}, verified = {};
      for (const jd of joinsSnap.docs) {
        const data = jd.data() || {}; let name = data.riderEmail || jd.id;
        try { const us = await getDoc(doc(db, 'users', jd.id)); if (us.exists()) name = us.data().name || name; } catch (_) {}
        list.push({ id: jd.id, name, status: data.status });
        if (data.no_show) noShow[jd.id] = true;
        if (data.status === 'verified') verified[jd.id] = true;
      }
      setRiders(list); setNoShowRiders(noShow); setVerifiedRiders(verified);
    } catch (e) { Alert.alert('Error', 'Failed to load riders.'); }
    finally { setLoadingRiders(false); }
  }, []);

  const handleVerifyPin = useCallback(async (riderId) => {
    const pin = pinInputs[riderId];
    if (!pin || pin.length !== 4) { Alert.alert('Invalid', 'Enter a 4-digit PIN.'); return; }
    setVerifyingPins((p) => ({ ...p, [riderId]: true }));
    try {
      const res = await httpsCallable(functions, 'verifyRiderPin')({ rideId: verifyRide.id, riderId, pin });
      if (res.data.verified) setVerifiedRiders((p) => ({ ...p, [riderId]: true }));
      else Alert.alert('Failed', 'Incorrect PIN.');
    } catch (e) { Alert.alert('Error', 'Could not verify.'); }
    finally { setVerifyingPins((p) => ({ ...p, [riderId]: false })); }
  }, [pinInputs, verifyRide]);

  const handleMarkNoShow = useCallback(async (riderId) => {
    Alert.alert('Mark No-Show', 'Mark this rider as a no-show?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: async () => {
        try { await updateDoc(doc(db, 'rides', verifyRide.id, 'joins', riderId), { no_show: true, markedNoShowAt: new Date().toISOString() }); setNoShowRiders((p) => ({ ...p, [riderId]: true })); }
        catch (e) { Alert.alert('Error', 'Failed.'); }
      }},
    ]);
  }, [verifyRide]);

  const handleStartRide = useCallback(async () => {
    const allDone = riders.every((r) => verifiedRiders[r.id] || r.status === 'verified' || noShowRiders[r.id]);
    if (!allDone && riders.length > 0) { const rem = riders.filter((r) => !verifiedRiders[r.id] && r.status !== 'verified' && !noShowRiders[r.id]).length; Alert.alert('Cannot Start', `${rem} rider${rem > 1 ? 's' : ''} still need verification.`); return; }
    try {
      await updateDoc(doc(db, 'rides', verifyRide.id), { status: 'started', startedAt: new Date().toISOString() });
      const riderIds = riders.filter((r) => !noShowRiders[r.id]).map((r) => r.id);
      await Promise.all(riderIds.map((uid) => updateDoc(doc(db, 'users', uid), { activeRideId: verifyRide.id }).catch(() => {})));
      const params = { rideId: verifyRide.id, fromAddress: verifyRide.fromAddress, toAddress: verifyRide.toAddress, rideDate: verifyRide.rideDate, ownerName: verifyRide.ownerName };
      setActiveRide(params); setVerifyModalVisible(false);
      router.push({ pathname: '/(tabs)/home/duringride', params });
    } catch (e) { Alert.alert('Error', 'Failed to start ride.'); }
  }, [riders, verifiedRiders, noShowRiders, verifyRide, setActiveRide]);

  // ── Leave ride ──────────────────────────────────────────────
  const handleLeaveRide = useCallback(async () => {
    if (!selectedRide || leavingRide) return; setLeavingRide(true);
    try {
      const u = auth.currentUser; if (!u) return;
      await u.getIdToken(true);
      await httpsCallable(functions, 'leaveRideAndPromote')({ rideId: selectedRide.id });
      try { await updateDoc(doc(db, 'users', u.uid), { joinedRideIds: arrayRemove(selectedRide.id) }); } catch (_) {}
      try { let name = u.email; try { const us = await getDoc(doc(db, 'users', u.uid)); if (us.exists()) name = us.data().name || name; } catch (_) {}
        await addDoc(collection(db, 'notifications'), { userId: selectedRide.ownerId, type: 'ride_left', title: 'Updates to Your Ride', body: `${name} has left the ride.`, driverId: selectedRide.ownerId, rideId: selectedRide.id, fromAddress: selectedRide.fromAddress, toAddress: selectedRide.toAddress, createdAt: serverTimestamp(), readAt: null });
      } catch (_) {}
      setLeaveRideModalVisible(false); setDetailsModalVisible(false); setSelectedRide(null);
    } catch (e) { const m = String(e?.message || '').toLowerCase(); if (m.includes('not joined') || m.includes('no longer')) { setLeaveRideModalVisible(false); setDetailsModalVisible(false); setSelectedRide(null); Alert.alert('Notice', 'You are no longer in this ride.'); } else Alert.alert('Error', 'Failed to leave ride.'); }
    finally { setLeavingRide(false); }
  }, [selectedRide, leavingRide]);

  // ── Cancel ride ─────────────────────────────────────────────
  const handleCancelRide = useCallback(async () => {
    if (!selectedRide || cancellingRide) return; setCancellingRide(true);
    try {
      const u = auth.currentUser; if (!u) return;
      const rideRef = doc(db, 'rides', selectedRide.id);
      const joinsSnap = await getDocs(collection(db, 'rides', selectedRide.id, 'joins'));
      const uids = joinsSnap.docs.map((d) => d.id);
      await runTransaction(db, async (tx) => { const snap = await tx.get(rideRef); if (!snap.exists()) throw new Error('Gone'); if (snap.data().ownerId !== u.uid) throw new Error('Auth'); tx.update(rideRef, { status: 'cancelled', cancelledAt: new Date().toISOString(), cancelledBy: u.uid }); });
      if (uids.length) { const nb = writeBatch(db);
        await Promise.all(uids.map(async (uid) => { try { await updateDoc(doc(db, 'users', uid), { joinedRideIds: arrayRemove(selectedRide.id), activeRideId: null }); } catch (_) {} nb.set(doc(collection(db, 'notifications')), { userId: uid, type: 'ride_cancelled', title: 'Ride Cancellation', body: 'The host cancelled this ride.', driverId: selectedRide.ownerId, rideId: selectedRide.id, fromAddress: selectedRide.fromAddress, toAddress: selectedRide.toAddress, createdAt: serverTimestamp(), readAt: null }); }));
        await nb.commit(); }
      const jRefs = joinsSnap.docs.map((d) => d.ref); for (let i = 0; i < jRefs.length; i += 450) { const b = writeBatch(db); jRefs.slice(i, i + 450).forEach((r) => b.delete(r)); await b.commit(); }
      try { await updateDoc(doc(db, 'conversations', selectedRide.id), { cancelled: true }); } catch (_) {}
      setCancelRideModalVisible(false); setDetailsModalVisible(false); setSelectedRide(null);
    } catch (e) { Alert.alert('Error', 'Failed to cancel.'); }
    finally { setCancellingRide(false); }
  }, [selectedRide, cancellingRide]);

  // ── Ride card ───────────────────────────────────────────────
  const RideCard = ({ ride, isHosted }) => {
    const canStart = isHosted && new Date() >= new Date(ride.rideDate);
    return (
      <View style={st.rideCard}>
        <View style={st.cardContent}>
          <View style={st.cardLeft}><Text style={st.cardLabel}>When</Text><Text style={st.cardDate}>{formatDate(ride.rideDate)}</Text><Text style={st.cardTime}>{formatTime(ride.rideDate)}</Text></View>
          <View style={st.cardRight}><Text style={st.cardLabel}>Route</Text><Text style={st.cardDestination} numberOfLines={2}>{getRideLocationLabel(ride, 'from')} → {getRideLocationLabel(ride, 'to')}</Text></View>
        </View>
        {ride.tag && (<View style={st.tagRow}><View style={[st.tagDot, { backgroundColor: tagColors[ride.tag] || '#9ca3af' }]} /><Text style={st.tagText}>{ride.tag}</Text><Text style={st.priceText}>${ride.price}</Text></View>)}
        <View style={st.buttonRow}>
          <TouchableOpacity style={st.detailsButton} onPress={() => openDetails(ride)}><Text style={st.detailsButtonText}>View Details</Text></TouchableOpacity>
          {isHosted ? (
            <TouchableOpacity style={[st.startButton, !canStart && st.startButtonDisabled]} onPress={() => canStart && openVerifyModal(ride)} disabled={!canStart}>
              <Text style={[st.startButtonText, !canStart && st.startButtonTextDisabled]}>Start Ride</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={st.viewPinButton} onPress={() => handleViewPin(ride)}>
              <Text style={st.viewPinButtonText}>View Pin</Text>
            </TouchableOpacity>
          )}
        </View>
        {isHosted && !canStart && <Text style={st.notYetText}>Available at ride time</Text>}
      </View>
    );
  };

  // ── Active ride banner ──────────────────────────────────────
  if (isRideActive) {
    const ar = activeRide || (activeJoinedRide ? { rideId: activeJoinedRide.id, fromAddress: activeJoinedRide.fromAddress, toAddress: activeJoinedRide.toAddress, rideDate: activeJoinedRide.rideDate, ownerName: activeJoinedRide.ownerName } : {});
    return (
      <SafeAreaView style={st.container}><Text style={st.title}>My Rides</Text>
        <View style={st.activeBanner}>
          <Ionicons name="car-sport" size={40} color="#22c55e" />
          <Text style={st.activeBannerTitle}>Ride In Progress</Text>
          <Text style={st.activeBannerText}>{ar.fromAddress || ''} → {ar.toAddress || ''}</Text>
          <TouchableOpacity style={st.goToRideButton} onPress={() => router.push({ pathname: '/(tabs)/home/duringride', params: ar })}><Text style={st.goToRideButtonText}>Go to Active Ride</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentRides = tab === 'hosted' ? hostedRides : joinedRides;
  return (
    <SafeAreaView style={st.container}>
      <Text style={st.title}>My Rides</Text>
      <View style={st.tabContainer}>
        {['hosted', 'joined'].map((k) => (<TouchableOpacity key={k} style={[st.tabButton, tab === k && st.tabButtonActive]} onPress={() => setTab(k)}><Text style={[st.tabText, tab === k && st.tabTextActive]}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text></TouchableOpacity>))}
      </View>
      {loading ? (<View style={st.loadingContainer}><ActivityIndicator size="large" color={colors.accent} /></View>) : (
        <ScrollView contentContainerStyle={[st.listContainer, { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }]}>
          {currentRides.length === 0 ? (
            <View style={st.emptyState}><Ionicons name={tab === 'hosted' ? 'car-outline' : 'people-outline'} size={40} color={colors.border} /><Text style={st.emptyText}>{tab === 'hosted' ? 'No upcoming hosted rides' : 'No upcoming joined rides'}</Text></View>
          ) : currentRides.map((r) => <RideCard key={r.id} ride={r} isHosted={tab === 'hosted'} />)}
        </ScrollView>
      )}

      {/* ━━━ DETAILS MODAL ━━━ */}
      <Modal animationType="slide" transparent visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={st.modalOverlay}><View style={st.modalContent}>
          <TouchableOpacity style={st.closeButton} onPress={() => setDetailsModalVisible(false)}><Text style={st.closeButtonText}>✕</Text></TouchableOpacity>
          {selectedRide && (<ScrollView style={st.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={st.modalHeader}>
              <View style={st.modalDriverIcon}>{driverInfo?.photoURL ? <Image source={{ uri: driverInfo.photoURL }} style={{ width: 60, height: 60, borderRadius: 30 }} /> : <DefaultAvatar size={60} bgColor={driverInfo?.avatarBgColor || '#FFFFFF'} avatarType={driverInfo?.avatarPreset || 'default'} />}</View>
              <Text style={st.modalDriverTitle}>{driverInfo?.name || selectedRide.ownerName}</Text>
            </View>
            <Text style={st.mst}>Ride Info</Text>
            <View style={st.ms}><IR l="Date" v={formatDate(selectedRide.rideDate)} /><IR l="Time" v={formatTime(selectedRide.rideDate)} /><IR l="From" v={selectedRide.fromAddress} /><IR l="To" v={selectedRide.toAddress} /><IR l="Seats" v={`${Number(selectedRide.seats)} / ${Number(selectedRide.total_seats ?? selectedRide.seats)}`} /><IR l="Price" v={`$${selectedRide.price}`} />{selectedRide.cancellationDeadline && <IR l="Cancel By" v={formatDateTime(selectedRide.cancellationDeadline)} />}</View>
            {driverVehicle && (<><View style={st.divider} /><Text style={st.mst}>Vehicle</Text><View style={st.ms}>{driverVehicle.make && <IR l="Make" v={driverVehicle.make} />}{driverVehicle.model && <IR l="Model" v={driverVehicle.model} />}{driverVehicle.licensePlate && <IR l="Plate" v={driverVehicle.licensePlate} />}</View></>)}
            {selectedRide.driverNotes && (<><View style={st.divider} /><Text style={st.mst}>Driver Notes</Text><View style={st.notesBox}><Text style={st.notesText}>{selectedRide.driverNotes}</Text></View></>)}
            <View style={{ marginTop: 16, marginBottom: 24, gap: 10 }}>
              {selectedRide.ownerId !== auth.currentUser?.uid && <TouchableOpacity style={st.leaveButton} onPress={() => setLeaveRideModalVisible(true)}><Text style={st.leaveButtonText}>Leave Ride</Text></TouchableOpacity>}
              {selectedRide.ownerId === auth.currentUser?.uid && <TouchableOpacity style={st.leaveButton} onPress={() => setCancelRideModalVisible(true)}><Text style={st.leaveButtonText}>Cancel Ride</Text></TouchableOpacity>}
            </View>
          </ScrollView>)}
          {leaveRideModalVisible && <ConfirmOverlay title="Leave this ride?" msg="This action cannot be undone." loading={leavingRide} onBack={() => setLeaveRideModalVisible(false)} onConfirm={handleLeaveRide} confirmLabel="Leave Ride" />}
          {cancelRideModalVisible && <ConfirmOverlay title="Cancel this ride?" msg="All riders will be notified. This cannot be undone." loading={cancellingRide} onBack={() => setCancelRideModalVisible(false)} onConfirm={handleCancelRide} confirmLabel="Cancel Ride" />}
        </View></View>
      </Modal>

      {/* ━━━ VIEW PIN MODAL (rider) ━━━ */}
      <Modal animationType="slide" transparent visible={pinModalVisible} onRequestClose={() => setPinModalVisible(false)}>
        <View style={st.modalOverlay}><View style={st.modalContent}>
          <TouchableOpacity style={st.closeButton} onPress={() => setPinModalVisible(false)}><Text style={st.closeButtonText}>✕</Text></TouchableOpacity>
          <View style={{ paddingTop: 10, alignItems: 'center' }}>
            <Text style={[st.mst, { marginTop: 0 }]}>Your Ride PIN</Text>
            <View style={st.pinDigitsRow}>
              {String(ridePins[activePinRideId] || '----').split('').map((digit, i) => (
                <View key={i} style={st.pinBox}><Text style={st.pinDigitText}>{digit}</Text></View>
              ))}
            </View>
            <Text style={st.pinInstructionText}>Provide PIN to your driver upon pickup.</Text>
          </View>
        </View></View>
      </Modal>

      {/* ━━━ PIN VERIFICATION MODAL (host) ━━━ */}
      <Modal animationType="slide" transparent visible={verifyModalVisible} onRequestClose={() => setVerifyModalVisible(false)}>
        <View style={st.modalOverlay}><View style={[st.modalContent, { maxHeight: '90%' }]}>
          <TouchableOpacity style={st.closeButton} onPress={() => setVerifyModalVisible(false)}><Text style={st.closeButtonText}>✕</Text></TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
            <Text style={[st.mst, { marginTop: 4 }]}>Verify Riders</Text>
            <Text style={st.verifySubtext}>Ask each rider for their 4-digit PIN before starting.</Text>
            {loadingRiders ? <View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator size="small" color={colors.accent} /></View> :
              riders.length === 0 ? <View style={{ paddingVertical: 20, alignItems: 'center' }}><Text style={{ color: colors.textSecondary }}>No riders have joined yet.</Text></View> :
              riders.map((r) => (
                <View key={r.id} style={st.verifyRow}>
                  <View style={st.verifyRowTop}><Ionicons name="person-circle-outline" size={22} color={colors.textSecondary} /><Text style={[st.verifyRowName, noShowRiders[r.id] && { textDecorationLine: 'line-through', color: '#999' }]}>{r.name}{noShowRiders[r.id] ? ' (No Show)' : ''}</Text></View>
                  <View style={st.verifyRowBottom}>
                    {verifiedRiders[r.id] || r.status === 'verified' ? <View style={st.verifiedBadge}><Ionicons name="checkmark-circle" size={18} color="#22c55e" /><Text style={st.verifiedText}>Verified</Text></View>
                    : noShowRiders[r.id] ? <View style={st.verifiedBadge}><Ionicons name="alert-circle" size={18} color="#f59e0b" /><Text style={[st.verifiedText, { color: '#f59e0b' }]}>No Show</Text></View>
                    : (<>
                      <TextInput style={st.pinInput} placeholder="PIN" placeholderTextColor="#aaa" keyboardType="number-pad" maxLength={4} value={pinInputs[r.id] || ''} onChangeText={(t) => setPinInputs((p) => ({ ...p, [r.id]: t }))} editable={!verifyingPins[r.id]} />
                      <TouchableOpacity style={st.pinVerifyBtn} onPress={() => handleVerifyPin(r.id)} disabled={verifyingPins[r.id]}>{verifyingPins[r.id] ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.pinVerifyText}>Verify</Text>}</TouchableOpacity>
                      <TouchableOpacity style={st.noShowBtn} onPress={() => handleMarkNoShow(r.id)}><Text style={st.noShowBtnText}>No Show</Text></TouchableOpacity>
                    </>)}
                  </View>
                </View>
              ))
            }
            {riders.length > 0 && <TouchableOpacity style={st.startRideFinalBtn} onPress={handleStartRide}><Ionicons name="play-circle" size={22} color="#fff" style={{ marginRight: 8 }} /><Text style={st.startRideFinalText}>Start Ride</Text></TouchableOpacity>}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function IR({ l, v }) { return <View style={st.infoRow}><Text style={st.infoLabel}>{l}:</Text><Text style={st.infoValue}>{v}</Text></View>; }

function ConfirmOverlay({ title, msg, loading, onBack, onConfirm, confirmLabel }) {
  return (<View style={st.confirmOverlay}><View style={st.confirmBox}>
    <Text style={st.confirmTitle}>{title}</Text><Text style={st.confirmMessage}>{msg}</Text>
    <View style={st.confirmButtons}>
      <TouchableOpacity style={st.confirmGoBack} onPress={onBack} disabled={loading}><Text style={st.confirmGoBackText}>Go Back</Text></TouchableOpacity>
      <TouchableOpacity style={[st.confirmLeave, loading && { opacity: 0.5 }]} onPress={onConfirm} disabled={loading}>{loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.confirmLeaveText}>{confirmLabel}</Text>}</TouchableOpacity>
    </View>
  </View></View>);
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 12 : 20, paddingBottom: 12, backgroundColor: colors.white },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tabButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, flexGrow: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  rideCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: colors.border },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { flex: 1 }, cardRight: { flex: 1, marginLeft: 8 },
  cardLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  cardDate: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cardTime: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cardDestination: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tagDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  tagText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  priceText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  buttonRow: { flexDirection: 'row', gap: 8 },
  detailsButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  detailsButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  startButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center' },
  startButtonDisabled: { backgroundColor: '#d4d4d4' },
  startButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  startButtonTextDisabled: { color: '#888' },
  viewPinButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center' },
  viewPinButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  notYetText: { fontSize: 11, color: colors.textSecondary, textAlign: 'right', marginTop: 4, fontStyle: 'italic' },
  activeBanner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  activeBannerTitle: { fontSize: 22, fontWeight: '700', color: '#22c55e', marginTop: 12 },
  activeBannerText: { fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  goToRideButton: { marginTop: 20, backgroundColor: '#22c55e', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  goToRideButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.white, borderRadius: 12, padding: 20, paddingBottom: 4, width: '90%', maxHeight: '82%', borderWidth: 2, borderColor: colors.border },
  modalScrollContent: { maxHeight: '100%' },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
  closeButtonText: { fontSize: 24, color: colors.textPrimary, fontWeight: 'bold' },
  modalHeader: { alignItems: 'center', marginBottom: 16, marginTop: 10 },
  modalDriverIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, marginBottom: 10 },
  modalDriverTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  mst: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 12 },
  ms: { backgroundColor: colors.backgroundLight, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' },
  infoLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, width: 110 },
  infoValue: { fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  notesBox: { backgroundColor: colors.background, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  notesText: { fontSize: 15, color: colors.textPrimary, lineHeight: 20 },
  leaveButton: { backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#dc2626' },
  leaveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // PIN modal (rider)
  pinDigitsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  pinBox: { borderWidth: 1, borderColor: '#b3b3b3', borderRadius: 4, width: 38, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  pinDigitText: { fontSize: 26, fontWeight: '400', color: '#000' },
  pinInstructionText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginBottom: 20 },
  // Confirm overlay
  confirmOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  confirmBox: { backgroundColor: colors.white, borderRadius: 16, padding: 24, width: '85%', maxWidth: 400, borderWidth: 2, borderColor: colors.border },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 14, textAlign: 'center' },
  confirmMessage: { fontSize: 15, color: colors.textSecondary, marginBottom: 20, lineHeight: 22 },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  confirmGoBack: { flex: 1, backgroundColor: colors.background, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: colors.border },
  confirmGoBackText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  confirmLeave: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#dc2626' },
  confirmLeaveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // Verify riders
  verifySubtext: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  verifyRow: { backgroundColor: colors.background, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  verifyRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  verifyRowName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginLeft: 8, flex: 1 },
  verifyRowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', flex: 1 },
  verifiedText: { fontSize: 14, fontWeight: '700', color: '#22c55e', marginLeft: 6 },
  pinInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, fontWeight: '600', color: colors.textPrimary, backgroundColor: colors.white, textAlign: 'center', letterSpacing: 4 },
  pinVerifyBtn: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  pinVerifyText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  noShowBtn: { backgroundColor: '#f59e0b', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8 },
  noShowBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  startRideFinalBtn: { flexDirection: 'row', backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  startRideFinalText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
