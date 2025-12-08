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
import { LoaderProvider } from "./src/Context/LoaderContext/LoaderContext";

const Stack = createNativeStackNavigator();

// Screens that should have BottomNavigation
const USER_SCREENS = [
  "Dashboard",
  "Gallery",
  "Profile",
  "Settings",
  "Attendance",
  "Homework",
  "Announcement",
  "Grades",
  "Events",
];

// Layout wrapper
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.mainContainer}>
    <View style={styles.contentContainer}>{children}</View>
    <BottomNavigation />
  </View>
);

// Higher Order Component to wrap screens with BottomNavigation
const withBottomNav = (Component: React.ComponentType<any>) => (props: any) => (
  <MainLayout>
    <Component {...props} />
  </MainLayout>
);

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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <LoaderProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              animation: USER_SCREENS.includes(route.name)
                ? "none"
                : "slide_from_right",
            })}
          >
            {user ? (
              <>
                <Stack.Screen
                  name="Dashboard"
                  component={withBottomNav(Dashboard)}
                />
                <Stack.Screen
                  name="Gallery"
                  component={withBottomNav(Gallery)}
                />
                <Stack.Screen
                  name="Profile"
                  component={withBottomNav(Profile)}
                />
                <Stack.Screen
                  name="Settings"
                  component={withBottomNav(Settings)}
                />
                <Stack.Screen
                  name="Attendance"
                  component={withBottomNav(Attendance)}
                />
                <Stack.Screen
                  name="Homework"
                  component={withBottomNav(Homework)}
                />
                <Stack.Screen
                  name="Announcement"
                  component={withBottomNav(AnnouncementScreen)}
                />
                <Stack.Screen
                  name="Grades"
                  component={withBottomNav(Grades)}
                />
                <Stack.Screen
                  name="Events"
                  component={withBottomNav(Events)}
                />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </LoaderProvider>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
