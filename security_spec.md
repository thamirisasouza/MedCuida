# Security Specification — MedCuida (`medcuida1`)

## 1. Data Invariants
1. **Strict Tenant Isolation**: Every document in `/users/{userId}/medications/{medicationId}` and `/users/{userId}/doseLogs/{logId}` belongs exclusively to `userId` and can only be read, created, updated, or deleted when `request.auth != null`, `request.auth.token.email_verified == true`, `request.auth.uid == userId`, and `data.userId == userId`.
2. **Schema & Key Integrity**:
   - `Medication` documents must strictly contain the 26 defined keys (`hasAll` + `hasOnly`), preventing shadow fields.
   - `DoseLog` documents must strictly contain the 12 defined keys (`hasAll` + `hasOnly`), preventing shadow fields.
3. **Immutable Ownership & Identifiers**: `id` and `userId` cannot be mutated during `update` operations (`incoming().id == existing().id && incoming().userId == existing().userId`).
4. **Volumetric & Regex Guards**: Document IDs must match `^[a-zA-Z0-9_\-]+$` with length `<= 128`, strings are bounded by maximum character limits, and lists (`clinicalTags`, `scheduleTimes`) are bounded in size.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: `auth = null` attempting to create `/users/u1/medications/med-1` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth.token.email_verified = false` attempting to create `/users/u1/medications/med-1` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Read**: `auth.uid = "attacker"` attempting `get` or `list` on `/users/victim/medications` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Write Spoofing**: `auth.uid = "u1"` writing to `/users/u1/medications/med-1` with `userId: "u2"` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Create**: Payload containing an extra key `isAdmin: true` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection on Update**: Update modifying an undeclared key `secretNote: "x"` -> `PERMISSION_DENIED`.
7. **ID Poisoning Attack**: Document ID containing special characters or `> 128` chars -> `PERMISSION_DENIED`.
8. **String Exhaustion Attack**: `purpose` string of 10,000 characters (`> 500`) -> `PERMISSION_DENIED`.
9. **Unbounded Array Attack**: `clinicalTags` with 50 items (`> 20`) -> `PERMISSION_DENIED`.
10. **Negative Stock Poisoning**: `currentStock: -10` -> `PERMISSION_DENIED`.
11. **Ownership Transfer on Update**: Updating `userId` from `"u1"` to `"u2"` -> `PERMISSION_DENIED`.
12. **Invalid DoseLog Status Enum**: Creating a `DoseLog` with `status: "hacked"` -> `PERMISSION_DENIED`.
