import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from "../Screens/Dashboard";
import Attendance from "../Screens/Attendance";
import Homework from "../Screens/Announcement";


const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Attendance" component={Attendance} />
      <Tab.Screen name="Homework" component={Homework} />
    </Tab.Navigator>
  );
}
