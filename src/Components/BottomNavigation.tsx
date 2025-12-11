// src/components/BottomNavigation.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type TabType = 'Dashboard' | 'Gallery' | 'Profile' | 'Settings';

interface TabItem {
  name: TabType;
  icon: string;
  label: string;
}

const BottomNavigation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');

  const tabs: TabItem[] = [
    { name: 'Dashboard', icon: 'dashboard', label: 'Home' },
    { name: 'Gallery', icon: 'collections', label: 'Gallery' },
    { name: 'Profile', icon: 'person', label: 'Profile' },
    { name: 'Settings', icon: 'settings', label: 'Settings' },
  ];

  const handleTabPress = (tabName: TabType) => {
    setActiveTab(tabName);
    navigation.navigate(tabName as never);
  };

  // Update active tab based on current route
  React.useEffect(() => {
    const routeName = route.name as TabType;
    if (tabs.some(tab => tab.name === routeName)) {
      setActiveTab(routeName);
    }
  }, [route.name]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.navigationBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.name)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.activePill,
                isActive && styles.activePillVisible
              ]} />
              <Icon
                name={tab.icon}
                size={22}
                color={isActive ? '#0F172A' : '#9CA3AF'}
              />
              <Text style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.safeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#0F172A',
  },
  activePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 8,
    right: 8,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    opacity: 0,
  },
  activePillVisible: {
    opacity: 1,
  },
  safeArea: {
    height: 16,
  },
});

export default BottomNavigation;
