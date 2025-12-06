import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HeaderNotificationButtonProps {
  count?: number;
  iconColor?: string;
  onPress?: () => void;
}

const HeaderNotificationButton: React.FC<HeaderNotificationButtonProps> = ({
  count = 0,
  iconColor = '#1E40AF',
  onPress,
}) => {
  const badgeText = count > 99 ? '99+' : String(count);
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    Alert.alert('Notifications', 'Notifications feature coming soon!');
  };

  return (
    <TouchableOpacity
      style={styles.notificationButton}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <Icon name="notifications-none" size={24} color={iconColor} />
      {count > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{badgeText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default HeaderNotificationButton;
