// src/screens/Profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { fetchUser } from "../Service/functions";

interface Student {
  studentPersonalDetails: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    nationality?: string;
    religion?: string;
    category?: string;
    motherTongue?: string;
    secondLanguage?: string;
    studentPhoto?: string;
  };
  parentDetails: {
    fatherName: string;
    fatherPhone: string;
    fatherOccupation?: string;
    motherName: string;
    motherPhone: string;
    motherOccupation?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    email: string;
  };
  academicDetails: {
    admissionNumber: string;
    rollNumber: string;
    admissionDate: string;
    class: string;
    section: string;
    academicYear: string;
    admissionType?: string;
    sessionTiming?: string;
    mediumOfInstruction?: string;
  };
  addresses: {
    currentAddress: string;
    permanentAddress: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  documents: {
    aadharCard: string | null;
    birthCertificate: string | null;
    communityCertificate: string | null;
    passport?: string | null;
    parentIdProof?: string | null;
    previousReportCard?: string | null;
  };
  medicalDetails: {
    disability: string;
    medicalConditions?: string;
    doctorContact?: string;
  };
}

const Profile: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: false,
    academic: false,
    parent: false,
    health: false,
    documents: false,
  });

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/[-_]/g, " ")
      .replace(/(\b\w)/g, (c) => c.toUpperCase())
      .replace(/([a-z])([A-Z])/g, "$1 $2");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getIconForSection = (section: string) => {
    switch (section) {
      case "personal":
        return "person";
      case "contact":
        return "location-on";
      case "academic":
        return "school";
      case "parent":
        return "family-restroom";
      case "health":
        return "medical-services";
      case "documents":
        return "description";
      default:
        return "person";
    }
  };

  const handleDocumentPress = (url: string) => {
    if (!url) return;
    
    Alert.alert(
      "Open Document",
      "Do you want to open this document?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open", onPress: () => Linking.openURL(url) }
      ]
    );
  };

  const renderSection = (title: string, data: Record<string, string | null>, sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey];
    const entries = Object.entries(data).filter(([_, value]) => value);

    if (entries.length === 0) return null;

    return (
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleContainer}>
            <Icon name={getIconForSection(sectionKey)} size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Icon 
            name={isExpanded ? "expand-less" : "expand-more"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {entries.map(([key, value]) => {
              const isLink = value && value.startsWith("http");

              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{formatLabel(key)}</Text>
                  
                  {isLink ? (
                    <TouchableOpacity
                      style={styles.documentButton}
                      onPress={() => handleDocumentPress(value!)}
                    >
                      <Text style={styles.documentButtonText}>View Document</Text>
                      <Icon name="open-in-new" size={16} color="#2196F3" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.detailValue}>
                      {key.toLowerCase().includes('date') ? formatDate(value!) : value}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await fetchUser();
        if (!user) {
          Alert.alert("Error", "Failed to load profile data");
          return;
        }

        // Map the user data to Student interface
        const mapped: Student = {
          studentPersonalDetails: {
            firstName: user.firstName || user.studentName?.split(' ')[0] || "",
            middleName: user.middleName || "",
            lastName: user.lastName || user.studentName?.split(' ').slice(1).join(' ') || "",
            dob: user.dob || "",
            gender: user.gender || "",
            bloodGroup: user.bloodGroup || "",
            nationality: user.nationality || "",
            religion: user.religion || "",
            category: user.category || "",
            motherTongue: user.motherTongue || "",
            secondLanguage: user.secondLanguage || "",
            studentPhoto: user.studentPhoto || "",
          },
          parentDetails: {
            fatherName: user.fatherName || "",
            fatherPhone: user.fatherPhoneNumber || "",
            fatherOccupation: user.fatherOccupation || "",
            motherName: user.motherName || "",
            motherPhone: user.motherPhoneNumber || "",
            motherOccupation: user.motherOccupation || "",
            guardianName: user.guardianName || "",
            guardianPhone: user.guardianPhone || "",
            guardianEmail: user.guardianEmail || "",
            email: user.parentEmail || user.email || "",
          },
          academicDetails: {
            admissionNumber: user.admissionNumber || "",
            rollNumber: user.rollNumber || "",
            admissionDate: user.admissionDate || "",
            class: user.studentClass || "",
            section: user.section || "",
            academicYear: user.academicYear || "",
            admissionType: user.admissionType || "",
            sessionTiming: user.sessionTiming || "",
            mediumOfInstruction: user.mediumOfInstruction || "",
          },
          addresses: {
            currentAddress: user.currentAddress || "",
            permanentAddress: user.permanentAddress || "",
            city: user.city || "",
            state: user.state || "",
            country: user.country || "",
            pincode: user.pincode || "",
          },
          documents: {
            aadharCard: user.aadharCard || null,
            birthCertificate: user.birthCertificate || null,
            communityCertificate: user.communityCertificate || null,
            passport: user.passport || null,
            parentIdProof: user.parentIdProof || null,
            previousReportCard: user.previousReportCard || null,
          },
          medicalDetails: {
            disability: user.disability || "",
            medicalConditions: user.medicalConditions || "",
            doctorContact: user.doctorContact || "",
          },
        };

        setStudent(mapped);
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="error-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Profile Data</Text>
          <Text style={styles.emptyText}>Unable to load student profile information</Text>
        </View>
      </View>
    );
  }

  const fullName = `${student.studentPersonalDetails.firstName} ${
    student.studentPersonalDetails.middleName || ""
  } ${student.studentPersonalDetails.lastName}`.trim();

  return (
    <View style={styles.container}>
      {/* Header matching Attendance page */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {student.studentPersonalDetails.studentPhoto ? (
              <Image
                source={{ uri: student.studentPersonalDetails.studentPhoto }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={48} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Icon name="verified" size={16} color="#4CAF50" />
            </View>
          </View>
          
          <Text style={styles.studentName}>{fullName}</Text>
          <View style={styles.studentBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{student.academicDetails.class}</Text>
            </View>
            <View style={styles.badge}>
              <Icon name="badge" size={14} color="#2196F3" />
              <Text style={styles.badgeText}>Roll No: {student.academicDetails.rollNumber}</Text>
            </View>
          </View>
        </View>

        {/* Profile Sections */}
        <View style={styles.sectionsContainer}>
          {renderSection("Personal Details", student.studentPersonalDetails, "personal")}
          {renderSection("Contact & Address", student.addresses, "contact")}
          {renderSection("Academic Information", student.academicDetails, "academic")}
          {renderSection("Parent/Guardian", student.parentDetails, "parent")}
          {renderSection("Health & Emergency", student.medicalDetails, "health")}
          {renderSection("Documents", student.documents, "documents")}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Header matching Attendance page
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#2196F3",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#2196F3",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2196F3",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  studentName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  studentBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 4,
  },
  badgeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  // Sections Container
  sectionsContainer: {
    marginBottom: 16,
  },

  // Section Card
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  documentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  documentButtonText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },

  // Quick Actions
  actionsContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    alignItems: "center",
    width: "22%",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});

export default Profile;