import React, { useEffect, useState } from "react";
import AuthStack from "./AuthStack";
import AppDrawer from "./AppDrawer";
import { onAuthStateChanged } from "firebase/auth";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../Service/firebase";

export default function Navigation() {
  const [user, setUser] = useState<any>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <AppDrawer /> : <AuthStack />;
}
