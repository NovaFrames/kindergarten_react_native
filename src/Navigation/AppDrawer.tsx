import React, { useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import AppTabs from "./AppTabs";
import { View, Text } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../Service/firebase";

const Drawer = createDrawerNavigator();

function LogoutScreen() {
  useEffect(() => {
    signOut(auth);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Logging out...</Text>
    </View>
  );
}

export default function AppDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home" component={AppTabs} />
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}
