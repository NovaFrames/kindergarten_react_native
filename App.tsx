// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { Provider as PaperProvider } from "react-native-paper";
import { ActivityIndicator, View, StyleSheet } from "react-native";

import { auth } from "./src/Service/firebase";
import Dashboard from "./src/Screens/Dashboard";
import LoginScreen from "./src/Screens/LoginScreen";
import Attendance from "./src/Screens/Attendance";
import AnnouncementScreen from "./src/Screens/Announcement";
import Grades from "./src/Screens/Grades";
import Events from "./src/Screens/Events";
import Gallery from "./src/Screens/Gallery";
import Profile from "./src/Screens/Profile";
import Settings from "./src/Screens/Settings";
import BottomNavigation from "./src/Components/BottomNavigation";
import Homework from "./src/Screens/HomeWork";

const Stack = createNativeStackNavigator();
const TAB_SCREENS = ['Dashboard', 'Gallery', 'Profile', 'Settings'];

// Main Layout component that includes BottomNavigation
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentContainer}>
        {children}
      </View>
      <BottomNavigation />
    </View>
  );
};

// Wrapper for screens that should show BottomNavigation
const withBottomNavigation = (ScreenComponent: React.ComponentType<any>) => {
  return (props: any) => (
    <MainLayout>
      <ScreenComponent {...props} />
    </MainLayout>
  );
};

// Create wrapped versions of the main screens
const DashboardWithNav = withBottomNavigation(Dashboard);
const GalleryWithNav = withBottomNavigation(Gallery);
const ProfileWithNav = withBottomNavigation(Profile);
const SettingsWithNav = withBottomNavigation(Settings);

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            animation: TAB_SCREENS.includes(route.name) ? 'none' : 'slide_from_right',
          })}
        >
          {user ? (
            <>
              {/* Main screens with BottomNavigation */}
              <Stack.Screen name="Dashboard" component={DashboardWithNav} />
              <Stack.Screen name="Gallery" component={GalleryWithNav} />
              <Stack.Screen name="Profile" component={ProfileWithNav} />
              <Stack.Screen name="Settings" component={SettingsWithNav} />
              
              {/* Other screens without BottomNavigation */}
              <Stack.Screen name="Attendance" component={Attendance} />
              <Stack.Screen name="Homework" component={Homework} />
              <Stack.Screen name="Announcement" component={AnnouncementScreen} />
              <Stack.Screen name="Grades" component={Grades} />
              <Stack.Screen name="Events" component={Events} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
  },
});

export default App;
