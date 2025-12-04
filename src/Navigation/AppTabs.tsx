import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Dashboard from "../Screens/Dashboard";
import Attendance from "../Screens/Attendance";
import HomeWork from "../Screens/HomeWork";
import Announcement from "../Screens/Announcement";
import Gallery from "../Screens/Gallery";
import Grades from "../Screens/Grades";
import Profile from "../Screens/Profile";
import Events from "../Screens/Events";
import Settings from "../Screens/Settings";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Dashboard") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Announcements") {
            iconName = focused ? "megaphone" : "megaphone-outline";
          } else if (route.name === "Attendance") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Homework") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Gallery") {
            iconName = focused ? "images" : "images-outline";
          } else if (route.name === "Grades") {
            iconName = focused ? "school" : "school-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Calendar") {
            iconName = focused ? "calendar-number" : "calendar-number-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          } else {
            iconName = "ellipse";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Announcements" component={Announcement} />
      <Tab.Screen name="Attendance" component={Attendance} />
      <Tab.Screen name="Homework" component={HomeWork} />
      <Tab.Screen name="Gallery" component={Gallery} />
      <Tab.Screen name="Grades" component={Grades} />
      <Tab.Screen name="Calendar" component={Events} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}
