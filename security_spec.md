# security_spec.md

## 1. Data Invariants
- **User Record Invariant**: The user document `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`. No user can access or modify another user's configuration.
- **Message Invariant**: A message `/users/{userId}/messages/{messageId}` can only belong to the authenticated user's own path. It is physically nested under the user document, and we enforce `request.auth.uid == userId`.
- **Field Integrity**: Users cannot set custom or malicious fields. Fields such as `uid` must match `request.auth.uid`.

## 2. The Great Twelve ("Dirty Dozen") Payloads
These payloads attempt to breach security, modify arbitrary data, hijack UIDs, or exceed limits. They must all be blocked:
1. **Malicious ID Hijack**: Writing to `/users/anotherUserUid` with your own credentials.
2. **Untracked Auth State**: Writing a user document where the `uid` field does not match the actual `request.auth.uid`.
3. **Invalid Level Spikes (Boundary Breach)**: Setting `humorLevel` to `1000` or `-5` (valid bounds are 1-5).
4. **Invalid Pragmatism Level Bounds**: Setting `pragmatismLevel` to `99`.
5. **PII Leak Attempt**: Reading `/users` or listing multiple users where you don't own the keys.
6. **Shadow Field Injection**: Creating a user document with unexpected extra fields (e.g. `isAdmin: true` or `shadowField: "hidden"`).
7. **Cross-User Subcollection Write**: Writing a message to `/users/someoneElse/messages/msgKey`.
8. **Malicious Bot Message Forgery**: Forging a bot message as the user by writing `sender: "bot"` but spoofing other fields.
9. **Extremely Large Message payload (Denial of Wallet)**: Setting `text` to a 5MB string (must limit text size to 10000 characters).
10. **Arbitrary Timestamp Hijack**: Writing a future timestamp.
11. **Injecting Malicious HTML/JS into Text**: Script tags in text.
12. **Missing Vital Fields in User Profile**: Omitting required fields like `metrics` or `modes`.

## 3. Firestore Rules draft
Below is our robust secure rules configuration, which we compile and save to `firestore.rules` and `DRAFT_firestore.rules`.
