// SafeNet AI — React Native App
// Root navigation setup
//
// Since you know Next.js, think of this as your _app.js / layout.js
// NavigationContainer = <BrowserRouter>
// Tab.Navigator     = your bottom nav layout
// Stack.Screen      = your page routes

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import messaging from "@react-native-firebase/messaging";
import { Alert, Platform } from "react-native";

import DashboardScreen   from "./screens/DashboardScreen";
import ScanScreen        from "./screens/ScanScreen";
import HistoryScreen     from "./screens/HistoryScreen";
import FamilyScreen      from "./screens/FamilyScreen";
import AlertDetailScreen from "./screens/AlertDetailScreen";

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  bg:      "#0d0d16",
  card:    "#161625",
  accent:  "#00c6ff",
  danger:  "#ff4444",
  warning: "#ffaa00",
  safe:    "#00e676",
  text:    "#ffffff",
  muted:   "#666680",
};

// Tab navigator (main app)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111120",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 85 : 65,
        },
        tabBarActiveTintColor:   COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Dashboard: focused ? "shield"          : "shield-outline",
            Scan:      focused ? "search"           : "search-outline",
            History:   focused ? "time"             : "time-outline",
            Family:    focused ? "people"           : "people-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scan"      component={ScanScreen}      />
      <Tab.Screen name="History"   component={HistoryScreen}   />
      <Tab.Screen name="Family"    component={FamilyScreen}    />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    setupFirebaseMessaging();
  }, []);

  async function setupFirebaseMessaging() {
    try {
      // Request notification permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      // Get FCM token (needed for guardian alerts)
      const token = await messaging().getToken();
      setFcmToken(token);
      console.log("[SafeNet] FCM Token:", token);

      // Handle foreground notifications (guardian alert received)
      messaging().onMessage(async (remoteMessage) => {
        if (remoteMessage.data?.type === "GUARDIAN_ALERT") {
          Alert.alert(
            "🚨 Family Alert",
            remoteMessage.notification?.body || "A family member is visiting a dangerous site!",
            [
              { text: "Dismiss",      style: "cancel" },
              { text: "View Details", style: "destructive",
                onPress: () => { /* navigate to alert screen */ }
              },
            ]
          );
        }
      });

      // Handle background/quit notification taps
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log("[SafeNet] Notification opened:", remoteMessage.data);
      });
    } catch (err) {
      console.warn("[SafeNet] Firebase not available in this environment (likely Expo Go). Using Demo Mode.");
    }
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary:    COLORS.accent,
          background: COLORS.bg,
          card:       COLORS.card,
          text:       COLORS.text,
          border:     "rgba(255,255,255,0.06)",
          notification: COLORS.danger,
        },
      }}
    >
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"        component={MainTabs}         />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
