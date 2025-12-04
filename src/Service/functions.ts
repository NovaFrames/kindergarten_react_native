// src/Service/functions.ts
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  setDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { format, isSameDay } from "date-fns";
import React from "react";
import { auth, db } from "./firebase";

/** --------------------- Interfaces --------------------- */
export interface Student {
  uid: string;
  id?: string;
  studentName: string;
  studentClass: string;
  [key: string]: any;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: "Present" | "Halfday" | "Absent" | string;
}

export interface Announcement {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  description?: string;
  createdAt?: any;
}

export interface EventItem {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  description?: string;
}

export interface Homework {
  id: string;
  date: string | Date;
  details: string | string[];
  subject?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Post {
  id: string;
  text: string;
  title: string;
  description: string;
  createdAt: any;
  teacherId: string;
  mediaUrls: Media[];
  likes?: Record<string, boolean>;
  comments?: Comment[];
  likeCount?: number;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt?: any;
}

export interface Media {
  url: string;
  type: "image" | "video";
}

export interface Grade {
  examName: string;
  date: string;
  subjects: Record<string, string>;
}

/** --------------------- User Functions --------------------- */

// Fetch current logged-in student
export const fetchUser = async (): Promise<Student | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const classesSnap = await getDocs(collection(db, "classes"));
    for (const classDoc of classesSnap.docs) {
      const studentRef = doc(db, "classes", classDoc.id, "students", currentUser.uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        return { uid: currentUser.uid, ...studentSnap.data() } as Student;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
};

export const fetchUserById = async (userId: string): Promise<Student | null> => {
  try {
    const classesSnap = await getDocs(collection(db, "classes"));
    for (const classDoc of classesSnap.docs) {
      const studentSnap = await getDoc(
        doc(db, "classes", classDoc.id, "students", userId)
      );
      if (studentSnap.exists()) return { uid: userId, ...studentSnap.data() } as Student;
    }
    return null;
  } catch (error) {
    console.error("Error fetching student by id:", error);
    return null;
  }
};

export const fetchStudentDoc = async (student: Student): Promise<Student | null> => {
  try {
    const classesSnap = await getDocs(collection(db, "classes"));
    for (const classDoc of classesSnap.docs) {
      const studentSnap = await getDoc(
        doc(db, "classes", classDoc.id, "students", student.uid)
      );
      if (studentSnap.exists()) {
        const data = studentSnap.data() as Student;
        if (data.studentName === student.studentName && data.studentClass === student.studentClass) {
          return { ...data, uid: student.uid };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching student document:", error);
    return null;
  }
};

/** --------------------- Attendance --------------------- */
export const fetchAttendance = async (
  studentData: Student,
  setTodayAttendance?: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>
): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("className", "==", studentData.studentClass)
    );
    const snap = await getDocs(q);
    const today = format(new Date(), "yyyy-MM-dd");
    const records: AttendanceRecord[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const studentRecord = data.students?.find((s: any) => s.id === studentData.id || s.uid === studentData.uid);
      if (studentRecord) {
        const record: AttendanceRecord = {
          id: docSnap.id,
          date: data.date,
          status: studentRecord.status,
        };
        records.push(record);
        if (data.date === today && setTodayAttendance) setTodayAttendance(record);
      }
    });

    return records;
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
};

export const fetchAttendanceForStudent = async (
  studentId: string,
  className: string
): Promise<AttendanceRecord[]> => {
  const q = query(collection(db, "attendance"), where("className", "==", className));
  const snap = await getDocs(q);
  const records: AttendanceRecord[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const studentRecord = data.students?.find((s: any) => s.id === studentId);
    if (studentRecord) records.push({ id: docSnap.id, date: data.date, status: studentRecord.status });
  });
  return records;
};

/** --------------------- Announcements & Events --------------------- */
export const fetchAnnouncements = async (
  setTodayAnnouncementsCount?: React.Dispatch<React.SetStateAction<number>>
): Promise<Announcement[]> => {
  const q = query(collection(db, "announcement"), orderBy("createdAt", "desc"), limit(5));
  const snap = await getDocs(q);
  const today = new Date();
  let todayCount = 0;
  const announcements: Announcement[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data() as Announcement;
    data.id = docSnap.id;
    announcements.push(data);
    if (data.createdAt && isSameDay(data.createdAt.toDate(), today)) todayCount++;
  });

  if (setTodayAnnouncementsCount) setTodayAnnouncementsCount(todayCount);
  return announcements;
};

export const fetchAllAnnouncements = async (): Promise<Announcement[]> => {
  const snap = await getDocs(query(collection(db, "announcement"), orderBy("createdAt", "desc")));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Announcement));
};

export const fetchEvents = async (): Promise<EventItem[]> => {
  const snap = await getDocs(query(collection(db, "events"), orderBy("createdAt", "desc")));
  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as Announcement;
    return {
      id: docSnap.id,
      title: data.title,
      eventType: data.eventType,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      venue: data.venue,
      description: data.description,
    } as EventItem;
  });
};

/** --------------------- Homework --------------------- */
export const fetchHomework = async (
  setTodayHomeworkCount?: React.Dispatch<React.SetStateAction<number>>
): Promise<Homework[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  try {
    const classesSnap = await getDocs(collection(db, "classes"));
    const today = new Date();
    let todayCount = 0;
    const homework: Homework[] = [];

    // Parallelize class processing
    for (const classDoc of classesSnap.docs) {
      const studentSnap = await getDoc(doc(db, "classes", classDoc.id, "students", currentUser.uid));
      if (!studentSnap.exists()) continue;

      const homeworkRef = collection(db, "classes", classDoc.id, "homework");
      const hwSnap = await getDocs(query(homeworkRef, orderBy("updatedAt", "desc"), limit(10)));

      hwSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const dateId = docSnap.id;

        // Nested homeworks array
        if (Array.isArray(data.homeworks) && data.homeworks.length > 0) {
          const mapped = data.homeworks.map((hw: any) => {
            const itemDate = hw.date || hw.createdAt || data.date || new Date();
            if (isSameDay(new Date(itemDate), today)) todayCount++;
            return {
              ...hw,
              dateId,
              id: hw.createdAt || Math.random().toString(),
              details: hw.details,
              subject: hw.subject,
              date: itemDate,
              createdAt: hw.createdAt || data.createdAt,
              updatedAt: hw.updatedAt || data.updatedAt
            };
          });
          homework.push(...mapped);
        } else {
          const itemDate = data.date || data.createdAt || new Date();
          if (isSameDay(new Date(itemDate), today)) todayCount++;
          homework.push({
            id: docSnap.id,
            date: itemDate,
            details: data.details,
            subject: data.subject,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            ...data
          } as Homework);
        }
      });

      break; // Stop after finding student's class
    }

    homework.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    if (setTodayHomeworkCount) setTodayHomeworkCount(todayCount);
    return homework;
  } catch (error) {
    console.error("Error fetching homework:", error);
    return [];
  }
};

export const fetchRecentHomework = async (
  classId: string,
  limitCount: number = 10
): Promise<Homework[]> => {
  const q = query(collection(db, "classes", classId, "homework"), orderBy("updatedAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  let allHomework: Homework[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const dateId = docSnap.id;

    if (Array.isArray(data.homeworks) && data.homeworks.length > 0) {
      const mapped = data.homeworks.map((hw: any) => ({
        ...hw,
        dateId,
        id: hw.createdAt || Math.random().toString(),
        details: hw.details,
        subject: hw.subject,
        date: hw.date || hw.createdAt || data.date || new Date(),
        createdAt: hw.createdAt || data.createdAt,
        updatedAt: hw.updatedAt || data.updatedAt
      }));
      allHomework = [...allHomework, ...mapped];
    } else {
      allHomework.push({
        id: docSnap.id,
        date: data.date,
        details: data.details,
        subject: data.subject,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data
      } as Homework);
    }
  });

  allHomework.sort((a, b) => new Date(b.updatedAt || b.createdAt || b.date).getTime() - new Date(a.updatedAt || a.createdAt || a.date).getTime());
  return allHomework.slice(0, limitCount);
};

/** --------------------- Grades --------------------- */
export const fetchGrades = async (): Promise<Grade[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const classesSnap = await getDocs(collection(db, "classes"));
  for (const classDoc of classesSnap.docs) {
    const studentSnap = await getDoc(doc(db, "classes", classDoc.id, "students", currentUser.uid));
    if (studentSnap.exists()) {
      const grades = studentSnap.data()?.grades || [];
      return grades.sort((a: Grade, b: Grade) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }
  return [];
};

/** --------------------- Combined Fetch --------------------- */
export const fetchAllData = async (
  setTodayAttendance?: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>,
  setTodayAnnouncementsCount?: React.Dispatch<React.SetStateAction<number>>,
  setTodayHomeworkCount?: React.Dispatch<React.SetStateAction<number>>
) => {
  const user = await fetchUser();
  if (!user) return null;

  const [studentData, attendance, announcements, homework] = await Promise.all([
    fetchStudentDoc(user),
    fetchAttendance(user, setTodayAttendance),
    fetchAnnouncements(setTodayAnnouncementsCount),
    fetchHomework(setTodayHomeworkCount)
  ]);

  if (!studentData) return null;
  return { studentData, attendance, announcements, homework };
};

/** --------------------- Posts & Teacher --------------------- */
export const fetchPosts = async (): Promise<Post[]> => {
  const snap = await getDocs(collection(db, "posts"));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Post));
};

export const fetchTeacher = async (id: string): Promise<any | null> => {
  const snap = await getDocs(query(collection(db, "teachers"), where("id", "==", id)));
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  return null;
};

/** --------------------- Realtime Posts --------------------- */
export const fetchPostsRealtime = (callback: (posts: Post[]) => void) => {
  const postsRef = collection(db, "posts");
  return onSnapshot(postsRef, (snapshot) => {
    const posts: Post[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        text: data.text || "",
        title: data.title || "",
        description: data.description || "",
        createdAt: data.createdAt || null,
        teacherId: data.teacherId || "",
        mediaUrls: data.mediaUrls || [],
        likes: data.likes || {},
        likeCount: data.likes ? Object.keys(data.likes).length : 0,
        comments: []
      } as Post;
    });
    callback(posts);
  });
};

/** --------------------- Post Actions --------------------- */
export const toggleLike = async (postId: string, userId: string): Promise<void> => {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as Post;
  const likes = data.likes || {};
  if (likes[userId]) delete likes[userId];
  else likes[userId] = true;

  await updateDoc(ref, { likes });
};

export const addComment = async (postId: string, userId: string, text: string): Promise<void> => {
  await addDoc(collection(db, "posts", postId, "comments"), {
    text,
    userId,
    createdAt: serverTimestamp(),
  });
};

export const markPostViewed = async (userId: string, postId: string): Promise<void> => {
  await setDoc(doc(db, "students", userId, "viewedPosts", postId), { viewedAt: serverTimestamp() });
};

export const getViewedPosts = async (userId: string): Promise<string[]> => {
  const snap = await getDocs(collection(db, "students", userId, "viewedPosts"));
  return snap.docs.map((docSnap) => docSnap.id);
};
