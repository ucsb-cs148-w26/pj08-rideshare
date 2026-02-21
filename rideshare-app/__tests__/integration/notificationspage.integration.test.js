import React from "react";
import { render, fireEvent, waitFor, within } from "@testing-library/react-native";

// --- Mocks to keep the test stable in Jest ---
jest.mock("../../src/firebase", () => ({
  db: {},
  auth: { currentUser: { uid: "user-1" } },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View, TouchableOpacity } = require("react-native");

  return {
    Swipeable: ({ children, renderRightActions }) => (
      <View>
        {children}
        {typeof renderRightActions === "function" ? renderRightActions() : null}
      </View>
    ),
    RectButton: ({ children, onPress, testID, style }) => (
      <TouchableOpacity testID={testID} onPress={onPress} style={style}>
        {children}
      </TouchableOpacity>
    ),
  };
});

const NotificationsScreen =
  require("../../app/(tabs)/home/notificationspage").default;

describe("NotificationsScreen integration", () => {
  test("renders notifications, opens details modal (marks read), and deletes", async () => {
    const fakeAuth = { currentUser: { uid: "user-1" } };
    const fakeDb = {};

    const markNotificationRead = jest.fn().mockResolvedValue(undefined);
    const deleteNotificationDoc = jest.fn().mockResolvedValue(undefined);

    // This simulates Firestore onSnapshot subscription:
    // call onData immediately with 2 notifications
    const subscribeToNotifications = jest.fn((_db, userId, onData, _onError) => {
      expect(userId).toBe("user-1");
      onData([
        {
          id: "n1",
          userId: "user-1",
          type: "ride_cancelled",
          title: "Ride Cancellation Notice",
          body: "Driver canceled.",
          createdAt: null,
          readAt: null,
          fromAddress: "A",
          toAddress: "B",
        },
        {
          id: "n2",
          userId: "user-1",
          type: "ride_left",
          title: "Rider left",
          body: "A rider left.",
          createdAt: null,
          readAt: null,
          fromAddress: "C",
          toAddress: "D",
        },
      ]);
      return () => {}; // unsubscribe
    });

    const { getByTestId, queryByTestId, getByText } = render(
      <NotificationsScreen
        authOverride={fakeAuth}
        dbOverride={fakeDb}
        subscribeToNotifications={subscribeToNotifications}
        markNotificationRead={markNotificationRead}
        deleteNotificationDoc={deleteNotificationDoc}
      />
    );

    // Screen rendered
    expect(getByTestId("notifications-screen")).toBeTruthy();

    // Notifications show up (subscription already pushed data)
    await waitFor(() => {
      expect(getByTestId("notif-row-n1")).toBeTruthy();
      expect(getByTestId("notif-row-n2")).toBeTruthy();
    });

    // Tap n1: should mark as read and open modal
    fireEvent.press(getByTestId("notif-row-n1"));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith(fakeDb, "n1");
      expect(getByTestId("notif-details-modal")).toBeTruthy();
    });

    // Modal shows title (sanity check)
    const modal = getByTestId("notif-details-modal");
    expect(within(modal).getByText("Ride Cancellation Notice")).toBeTruthy();

    // Close modal
    fireEvent.press(getByTestId("notif-details-close"));
    await waitFor(() => {
      expect(queryByTestId("notif-details-modal")).toBeNull();
    });

    // Delete n1 (optimistic UI removal + backend delete call)
    fireEvent.press(getByTestId("notif-delete-n1"));

    await waitFor(() => {
      expect(deleteNotificationDoc).toHaveBeenCalledWith(fakeDb, "n1");
      expect(queryByTestId("notif-row-n1")).toBeNull();
      expect(getByTestId("notif-row-n2")).toBeTruthy();
    });
  });
});