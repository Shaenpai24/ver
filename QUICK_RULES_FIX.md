# Quick Firestore Rules Fix

## Copy this to Firebase Console → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /artifacts/{appId} {
      
      // PRIVATE ANSWERS - Block access
      match /private/{document=**} {
        allow read, write: if false;
      }
      
      // PUBLIC QUESTIONS - Allow read
      match /public/data/questions/{questionId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
      
      // PUBLIC TEAMS - Allow read and update own
      match /public/data/teams/{userId} {
        allow read: if request.auth != null;
        allow update: if request.auth != null && request.auth.uid == userId;
      }
      
      // GAME CONFIG - Allow read (THIS WAS MISSING!)
      match /public/data/game_config/settings {
        allow read: if request.auth != null;
        allow write: if false;
      }
      
      // USERS - Allow read/write own
      match /users/{userId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Steps

1. Go to Firebase Console
2. Click **Firestore Database**
3. Click **Rules** tab
4. **Delete everything** and paste the rules above
5. Click **Publish**

## That's It!

This will fix the permissions error. Your app will work now!
