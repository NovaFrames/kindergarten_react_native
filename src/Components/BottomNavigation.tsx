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
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.name)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Icon
                  name={tab.icon}
                  size={24}
                  color={isActive ? '#2196F3' : '#666'}
                />
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel
                ]}>
                  {tab.label}
                </Text>
                
                {isActive && (
                  <View style={styles.activeIndicator} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Safe area padding for iOS */}
      <View style={styles.safeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#2196F3',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2196F3',
  },
  safeArea: {
    height: 20, // Increased for better safe area handling
    backgroundColor: '#FFFFFF',
  },
});

export default BottomNavigation;