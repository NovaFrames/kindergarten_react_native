import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  iconName: string;
  iconColor?: string;
  accentColor?: string;
  iconBackgroundColor?: string;
  style?: ViewStyle;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  iconName,
  iconColor = '#1E3A8A',
  accentColor = '#E4EDFF',
  iconBackgroundColor = '#FFFFFF',
  style,
  actions,
  children,
}) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: accentColor },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.textWrapper}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.actionsWrapper}>
          {actions}
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Icon name={iconName} size={26} color={iconColor} />
          </View>
        </View>
      </View>
      {children ? (
        <View style={styles.childrenContainer}>{children}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginLeft: 12,
  },
  childrenContainer: {
    marginTop: 20,
  },
});

export default ScreenHeader;
