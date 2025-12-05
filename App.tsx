// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { Provider as PaperProvider } from "react-native-paper";

import { ActivityIndicator, View } from "react-native";
import { auth } from "./src/Service/firebase";
import Dashboard from "./src/Screens/Dashboard";
import LoginScreen from "./src/Screens/LoginScreen";
import Attendance from "./src/Screens/Attendance";
import HomeworkScreen from "./src/Screens/HomeWork";
import AnnouncementScreen from "./src/Screens/Announcement";
import Grades from "./src/Screens/Grades";
import Events from "./src/Screens/Events";
import Gallery from "./src/Screens/Gallery";

const Stack = createNativeStackNavigator();

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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Attendance" component={Attendance} />
          <Stack.Screen name="Homework" component={HomeworkScreen} />
          <Stack.Screen name="Announcement" component={AnnouncementScreen} />
          <Stack.Screen name="Grades" component={Grades} />
          <Stack.Screen name="Events" component={Events} />
          <Stack.Screen name="Gallery" component={Gallery} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
