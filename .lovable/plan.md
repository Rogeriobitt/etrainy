

## Problem

The exercise editing appears to work in the code, but there's a critical **index mismatch bug** that breaks editing and removing exercises.

On line 247, exercises are filtered to remove deleted ones:
```ts
const currentExercises = currentDayId ? (editedExercises[currentDayId] || []).filter((e) => !e.deleted) : [];
```

Then on line 319-328, the filtered array's index (`idx`) is passed to `onUpdate` and `onRemove`. But `updateExercise` and `removeExercise` use that index to access the **unfiltered** `editedExercises[dayId]` array. After any deletion, the indices no longer align, causing edits to target the wrong exercise or crash.

## Fix

1. **`src/pages/PersonalStudentDetail.tsx`** — Stop using array index for exercise identification. Instead, use the exercise `id` to find the correct item:

   - Change `updateExercise(dayId, index, field, value)` to find by `id` instead of array index
   - Change `removeExercise(dayId, index)` to find by `id` instead of array index  
   - Update `ExerciseEditor` calls to pass exercise `id` instead of filtered `idx`

2. **`src/components/ExerciseEditor.tsx`** — Update the props interface to use `exerciseId: string` instead of `index: number`, and pass `exerciseId` to the `onUpdate` and `onRemove` callbacks.

This is a small, surgical fix — two files, no database changes needed. The add, save, and UI rendering logic all remain the same.

