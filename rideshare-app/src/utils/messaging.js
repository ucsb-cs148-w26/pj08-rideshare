import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function getOrCreateConversation(otherUserId, rideDetails = null) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  if (currentUser.uid === otherUserId) throw new Error('Cannot message yourself');

  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUser.uid)
  );

  const snapshot = await getDocs(q);
  const existingConvo = snapshot.docs.find((doc) => {
    const data = doc.data();
    const hasOtherUser = data.participants.includes(otherUserId);
    if (rideDetails?.rideId) {
      return hasOtherUser && data.rideId === rideDetails.rideId;
    }
    return hasOtherUser;
  });

  if (existingConvo) {
    return existingConvo.id;
  }

  const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));

  const currentUserName = currentUserDoc.exists()
    ? currentUserDoc.data().name
    : 'Unknown';
  const otherUserName = otherUserDoc.exists()
    ? otherUserDoc.data().name
    : 'Unknown';

  const newConvo = await addDoc(conversationsRef, {
    participants: [currentUser.uid, otherUserId],
    participantNames: {
      [currentUser.uid]: currentUserName,
      [otherUserId]: otherUserName,
    },
    rideId: rideDetails?.rideId || null,
    rideInfo: rideDetails?.rideInfo || null,
    rideDate: rideDetails?.rideDate || null,
    lastMessage: null,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: null,
    lastMessageRead: true,
    hasMessages: false,
    createdAt: serverTimestamp(),
  });

  return newConvo.id;
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