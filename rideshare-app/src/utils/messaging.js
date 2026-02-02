import {
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function getOrCreateRideConversation(rideDetails) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  const { rideId, rideInfo, rideDate, ownerId } = rideDetails || {};
  if (!rideId) throw new Error("rideId required");

  const conversationsRef = doc(db, 'conversations', rideId);

  // Fetch current user's name
  let currentUserName = 'Unknown';
  try {
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    currentUserName = currentUserDoc.exists()
      ? (currentUserDoc.data()?.name ?? 'Unknown')
      : 'Unknown';
  }
  catch {
    // keeps name as "Unknown"
  }

  // try to join/update first
  try {
    await updateDoc(conversationsRef, {
      participants: arrayUnion(currentUser.uid),
      [`participantNames.${currentUser.uid}`]: currentUserName,
      [`lastReadAt.${currentUser.uid}`]: serverTimestamp(),
      ...(rideInfo ? { rideInfo } : {}),
      ...(rideDate ? { rideDate } : {}),
    });

    return rideId;
  } catch (e) {
    // if the conversation doc doesn't exist yet, updateDoc throws "not-found"
    if (e?.code !== 'not-found') {
      throw e;
    }
  }

  // fetch owner's name
  let ownerName = null;
  if (ownerId) {
    try {
      const ownerDoc = await getDoc(doc(db, 'users', ownerId));
      ownerName = ownerDoc.exists() ? (ownerDoc.data()?.name ?? null) : null;
    } catch {
      ownerName = null;
    }
  }

  // create conversation doc for the ride
  const initialParticipants = ownerId
    ? Array.from(new Set([ownerId, currentUser.uid]))
    : [currentUser.uid];

  await setDoc(conversationsRef, {
    type: 'ride',
    rideId,
    rideInfo: rideInfo || null,
    rideDate: rideDate || null,
    participants: initialParticipants,
    participantNames: {
      [currentUser.uid]: currentUserName,
      ...(ownerId ? { [ownerId]: ownerName } : {}),
    },
    lastMessage: null,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: null,
    hasMessages: false,
    typing: {},
    lastReadAt: {
      [currentUser.uid]: serverTimestamp(),
    },
    createdAt: serverTimestamp(),
  });

  return rideId;
}

export async function setTypingStatus(conversationId, isTyping) {
  const user = auth.currentUser;
  if (!user || !conversationId) return;

  try {
    const convoRef = doc(db, 'conversations', conversationId);
    await updateDoc(convoRef, {
      [`typing.${user.uid}`]: isTyping,
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}

export function getTitle(conversation, currentUid) {
  const participants = conversation.participants || [];
  const namesMap = conversation.participantNames || {};

  if (!currentUid) return 'Ride Chat';

  const otherUids = participants.filter((uid) => uid !== currentUid); // everyone except me
  const otherNames = otherUids.map((uid) => namesMap[uid] || 'Unknown'); // map uids to display names (fallback if missing)

  if (otherNames.length === 0) return conversation.rideInfo || 'Ride Chat';
  return otherNames.join(', ');
}

export function getSubtitle(conversation) {
  const count = conversation.participants?.length || 0;

  // display the total number of participants (excluding myself)
  if (count > 2) return `${count - 1} people`;
  return '';
}