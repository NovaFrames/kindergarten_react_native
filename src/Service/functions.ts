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
  getCountFromServer,
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
  dateId?: string;
  classId?: string;
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

export interface CommentType {
  id: string;
  text: string;
  userName: string;
  userProfile: string;
  createdAt: any;
  userId: string;
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

/** --------------------- Helper Functions --------------------- */
const fetchUserClass = async (
  userId: string
): Promise<{ classId: string; studentData: Student } | null> => {
  try {
    // Query all classes where the student exists
    const classesSnap = await getDocs(collection(db, "classes"));

    // Create an array of promises to check each class
    const classChecks = classesSnap.docs.map(async (classDoc) => {
      const studentRef = doc(db, "classes", classDoc.id, "students", userId);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        return {
          classId: classDoc.id,
          studentData: { uid: userId, ...studentSnap.data() } as Student,
        };
      }
      return null;
    });

    // Wait for all checks and find the first non-null result
    const results = await Promise.all(classChecks);
    return results.find((result) => result !== null) || null;
  } catch (error) {
    console.error("Error fetching user class:", error);
    return null;
  }
};

/** --------------------- User Functions --------------------- */

// Fetch current logged-in student with optimized query
export const fetchUser = async (): Promise<Student | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const userClass = await fetchUserClass(currentUser.uid);
  return userClass ? userClass.studentData : null;
};

export const fetchUserById = async (
  userId: string
): Promise<Student | null> => {
  const userClass = await fetchUserClass(userId);
  return userClass ? userClass.studentData : null;
};

export const fetchStudentDoc = async (
  student: Student
): Promise<Student | null> => {
  try {
    const studentRef = doc(
      db,
      "classes",
      student.studentClass,
      "students",
      student.uid
    );
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const data = studentSnap.data() as Student;
      if (data.studentName === student.studentName) {
        return { ...data, uid: student.uid };
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
  setTodayAttendance?: React.Dispatch<
    React.SetStateAction<AttendanceRecord | null>
  >
): Promise<AttendanceRecord[]> => {
  try {
    // Query attendance for the specific class
    const q = query(
      collection(db, "attendance"),
      where("className", "==", studentData.studentClass)
    );

    const snap = await getDocs(q);
    const today = format(new Date(), "yyyy-MM-dd");
    const records: AttendanceRecord[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const studentId = studentData.id || studentData.uid;

      // Find student in attendance using array query
      const studentRecord = data.students?.find(
        (s: any) => s.id === studentId || s.uid === studentId
      );

      if (studentRecord) {
        const record: AttendanceRecord = {
          id: docSnap.id,
          date: data.date,
          status: studentRecord.status,
        };
        records.push(record);

        // Set today's attendance if date matches
        if (data.date === today && setTodayAttendance) {
          setTodayAttendance(record);
        }
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
  const q = query(
    collection(db, "attendance"),
    where("className", "==", className)
  );

  const snap = await getDocs(q);
  const records: AttendanceRecord[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const studentRecord = data.students?.find(
      (s: any) => s.id === studentId || s.uid === studentId
    );

    if (studentRecord) {
      records.push({
        id: docSnap.id,
        date: data.date,
        status: studentRecord.status,
      });
    }
  });

  return records;
};

/** --------------------- Announcements & Events --------------------- */
export const fetchAnnouncements = async (
  setTodayAnnouncementsCount?: React.Dispatch<React.SetStateAction<number>>
): Promise<Announcement[]> => {
  const q = query(
    collection(db, "announcement"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  const snap = await getDocs(q);
  const today = new Date();
  let todayCount = 0;
  const announcements: Announcement[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data() as Announcement;
    data.id = docSnap.id;
    announcements.push(data);

    // Check if announcement is from today
    if (data.createdAt && isSameDay(data.createdAt.toDate(), today)) {
      todayCount++;
    }
  });

  if (setTodayAnnouncementsCount) {
    setTodayAnnouncementsCount(todayCount);
  }

  return announcements;
};

export const fetchAllAnnouncements = async (): Promise<Announcement[]> => {
  const q = query(collection(db, "announcement"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map(
    (docSnap) =>
      ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Announcement)
  );
};

export const fetchEvents = async (): Promise<EventItem[]> => {
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
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
    // First find the user's class
    const userClass = await fetchUserClass(currentUser.uid);
    if (!userClass) return [];

    const { classId } = userClass;
    const homeworkRef = collection(db, "classes", classId, "homework");
    const q = query(homeworkRef, orderBy("updatedAt", "desc"), limit(10));

    const hwSnap = await getDocs(q);
    const today = new Date();
    let todayCount = 0;
    const homework: Homework[] = [];

    hwSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const dateId = docSnap.id;

      // Handle nested homeworks array
      if (Array.isArray(data.homeworks) && data.homeworks.length > 0) {
        data.homeworks.forEach((hw: any) => {
          const itemDate = hw.date || hw.createdAt || data.date || new Date();
          const itemDateObj = new Date(itemDate);

          if (isSameDay(itemDateObj, today)) {
            todayCount++;
          }

          homework.push({
            ...hw,
            dateId,
            classId,
            id: hw.createdAt || Math.random().toString(),
            details: hw.details,
            subject: hw.subject,
            date: itemDate,
            createdAt: hw.createdAt || data.createdAt,
            updatedAt: hw.updatedAt || data.updatedAt,
          });
        });
      } else {
        // Handle single homework entry
        const itemDate = data.date || data.createdAt || new Date();
        const itemDateObj = new Date(itemDate);

        if (isSameDay(itemDateObj, today)) {
          todayCount++;
        }

        homework.push({
          id: docSnap.id,
          classId,
          dateId,
          date: itemDate,
          details: data.details,
          subject: data.subject,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          ...data,
        } as Homework);
      }
    });

    // Sort by date
    homework.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    if (setTodayHomeworkCount) {
      setTodayHomeworkCount(todayCount);
    }

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
  const q = query(
    collection(db, "classes", classId, "homework"),
    orderBy("updatedAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  let allHomework: Homework[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const dateId = docSnap.id;

    if (Array.isArray(data.homeworks) && data.homeworks.length > 0) {
      const mapped = data.homeworks.map((hw: any) => ({
        ...hw,
        dateId,
        classId,
        id: hw.createdAt || Math.random().toString(),
        details: hw.details,
        subject: hw.subject,
        date: hw.date || hw.createdAt || data.date || new Date(),
        createdAt: hw.createdAt || data.createdAt,
        updatedAt: hw.updatedAt || data.updatedAt,
      }));
      allHomework.push(...mapped);
    } else {
      allHomework.push({
        id: docSnap.id,
        classId,
        dateId,
        date: data.date,
        details: data.details,
        subject: data.subject,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data,
      } as Homework);
    }
  });

  // Sort and limit
  allHomework.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || a.date).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  return allHomework.slice(0, limitCount);
};

/** --------------------- Grades --------------------- */
export const fetchGrades = async (): Promise<Grade[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const userClass = await fetchUserClass(currentUser.uid);
  if (!userClass) return [];

  const { classId, studentData } = userClass;

  // Get grades directly from student document
  const studentRef = doc(db, "classes", classId, "students", currentUser.uid);
  const studentSnap = await getDoc(studentRef);

  if (studentSnap.exists()) {
    const grades = studentSnap.data()?.grades || [];
    return grades.sort(
      (a: Grade, b: Grade) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  return [];
};

/** --------------------- Combined Fetch --------------------- */
export const fetchAllData = async (
  setTodayAttendance?: React.Dispatch<
    React.SetStateAction<AttendanceRecord | null>
  >,
  setTodayAnnouncementsCount?: React.Dispatch<React.SetStateAction<number>>,
  setTodayHomeworkCount?: React.Dispatch<React.SetStateAction<number>>
) => {
  const user = await fetchUser();
  if (!user) return null;

  // Fetch all data in parallel
  const [attendance, announcements, homework] = await Promise.all([
    fetchAttendance(user, setTodayAttendance),
    fetchAnnouncements(setTodayAnnouncementsCount),
    fetchHomework(setTodayHomeworkCount),
  ]);

  return {
    studentData: user,
    attendance,
    announcements,
    homework,
  };
};

/** --------------------- Posts & Teacher --------------------- */
export const fetchPosts = async (): Promise<Post[]> => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map(
    (docSnap) =>
      ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Post)
  );
};

export const fetchTeacher = async (id: string): Promise<any | null> => {
  const q = query(collection(db, "teachers"), where("id", "==", id), limit(1));

  const snap = await getDocs(q);

  if (!snap.empty) {
    const doc = snap.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  return null;
};

/** --------------------- Realtime Posts --------------------- */
export const fetchPostsRealtime = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
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
        comments: [],
      } as Post;
    });
    callback(posts);
  });
};

/** --------------------- Post Actions --------------------- */
export const toggleLike = async (
  postId: string,
  userId: string
): Promise<void> => {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data() as Post;
  const likes = data.likes || {};

  if (likes[userId]) {
    delete likes[userId];
  } else {
    likes[userId] = true;
  }

  await updateDoc(ref, { likes });
};

export const addComment = async (
  postId: string,
  userId: string,
  text: string
): Promise<void> => {
  await addDoc(collection(db, "posts", postId, "comments"), {
    text,
    userId,
    createdAt: serverTimestamp(),
  });
};

export const listenToComments = (
  postId: string,
  callback: (comments: CommentType[]) => void
) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const comments: CommentType[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommentType[];

    callback(comments);
  });
};

export const markPostViewed = async (
  userId: string,
  postId: string
): Promise<void> => {
  await setDoc(doc(db, "students", userId, "viewedPosts", postId), {
    viewedAt: serverTimestamp(),
  });
};

export const getViewedPosts = async (userId: string): Promise<string[]> => {
  const snap = await getDocs(collection(db, "students", userId, "viewedPosts"));

  return snap.docs.map((docSnap) => docSnap.id);
};

/** --------------------- Additional Optimized Functions --------------------- */
export const fetchTodayAttendanceCount = async (
  className: string
): Promise<number> => {
  const today = format(new Date(), "yyyy-MM-dd");
  const q = query(
    collection(db, "attendance"),
    where("className", "==", className),
    where("date", "==", today)
  );

  const snap = await getDocs(q);
  return snap.size;
};

export const fetchClassStudents = async (
  className: string
): Promise<Student[]> => {
  const q = query(collection(db, "classes", className, "students"));

  const snap = await getDocs(q);
  return snap.docs.map(
    (docSnap) =>
      ({
        uid: docSnap.id,
        ...docSnap.data(),
      } as Student)
  );
};

export const fetchUpcomingEvents = async (
  limitCount: number = 5
): Promise<EventItem[]> => {
  const today = new Date();
  const q = query(
    collection(db, "events"),
    where("startDate", ">=", format(today, "yyyy-MM-dd")),
    orderBy("startDate", "asc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
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

export const fetchHomeworkByDate = async (
  classId: string,
  date: string
): Promise<Homework[]> => {
  const q = query(
    collection(db, "classes", classId, "homework"),
    where("date", "==", date),
    orderBy("updatedAt", "desc")
  );

  const snap = await getDocs(q);
  const homework: Homework[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    if (Array.isArray(data.homeworks) && data.homeworks.length > 0) {
      data.homeworks.forEach((hw: any) => {
        homework.push({
          ...hw,
          dateId: docSnap.id,
          classId,
          id: hw.createdAt || Math.random().toString(),
          date: hw.date || data.date,
          createdAt: hw.createdAt || data.createdAt,
          updatedAt: hw.updatedAt || data.updatedAt,
        });
      });
    } else {
      homework.push({
        id: docSnap.id,
        classId,
        dateId: docSnap.id,
        date: data.date,
        details: data.details,
        subject: data.subject,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data,
      } as Homework);
    }
  });

  return homework;
};
