import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyStudents from "./tools/list-my-students";
import getWorkoutPlan from "./tools/get-workout-plan";
import searchExercises from "./tools/search-exercises";
import listNotifications from "./tools/list-notifications";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "trainylab",
  title: "TrainyLab",
  version: "0.1.0",
  instructions:
    "Tools for TrainyLab, a training platform for personal trainers and their students. Use `get_my_profile` to know who the signed-in user is. Students can read their active workout plan with `get_workout_plan`. Personal trainers can list their students with `list_my_students` and read a student's plan by passing `student_user_id`. `search_exercises` browses the exercise catalog and `list_notifications` reads alerts. All data is scoped to the signed-in user's permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listMyStudents, getWorkoutPlan, searchExercises, listNotifications],
});
