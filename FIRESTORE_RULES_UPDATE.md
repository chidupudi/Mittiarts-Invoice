# Firestore Rules Update for Short URL Support

## Issue
The current rules don't allow public read access for `shortToken` queries, causing "Missing or insufficient permissions" error when accessing `/i/XXXX` URLs.

## Required Change

Update the `orders` match block to include `shortToken` in the public read condition:

```javascript
// Orders: keep public read via shareToken, billToken, OR shortToken
match /orders/{orderId} {
  // Public read if document contains shareToken, billToken, OR shortToken
  allow read: if resource.data.shareToken != null ||
                resource.data.billToken != null ||
                resource.data.shortToken != null;

  // Special-case: allow unauthenticated query-based read for billToken lookups
  allow read: if request.auth == null &&
                resource.data.billToken != null &&
                request.query.limit == 1 &&
                request.query.where.size() == 1 &&
                request.query.where[0].field == 'billToken';

  // Authenticated owner OR authorized admin have full access
  allow read, write: if isOwnerByUserId(resource.data) || isAuthorizedUser();

  // Allow create only when request.resource includes the user's own userId
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
```

## Complete Updated Rules

Replace your existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // -------------------------
    // Helper functions
    // -------------------------
    function isAuthorizedUser() {
      return request.auth != null && request.auth.uid in [
        '5gps35DgErOpDd00qUOXPzNS2LC3',
        'CnpePEEiMVOhoWFmCBt5Frd1IxD3',
        'R4B24XPXgUf3BbUCquFfjouwTbz1',
        'PtIFDPFRdlSIyLKds56B5mW3uT63',
        'z1EaryuCZaNQOynhBORdAB7xhcB3',
        't0srKK0rzbeMrM23ryvFqgfb74J3'
      ];
    }

    function isOwnerByUserId(docData) {
      return request.auth != null && docData.userId == request.auth.uid;
    }

    // -------------------------
    // Public sharing rules
    // -------------------------

    match /estimates/{estimateId} {
      allow read: if resource.data.shareToken != null;
      allow read, write: if isOwnerByUserId(resource.data) || isAuthorizedUser();
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // 🆕 UPDATED: Orders now include shortToken for public access
    match /orders/{orderId} {
      // Public read if document contains shareToken, billToken, OR shortToken
      allow read: if resource.data.shareToken != null ||
                    resource.data.billToken != null ||
                    resource.data.shortToken != null;

      // Special-case: allow unauthenticated query-based read for billToken lookups
      allow read: if request.auth == null &&
                    resource.data.billToken != null &&
                    request.query.limit == 1 &&
                    request.query.where.size() == 1 &&
                    request.query.where[0].field == 'billToken';

      // Authenticated owner OR authorized admin have full access
      allow read, write: if isOwnerByUserId(resource.data) || isAuthorizedUser();

      // Allow create only when request.resource includes the user's own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /customers/{customerId} {
      allow read: if true;
      allow write: if (request.auth != null) && (isOwnerByUserId(resource.data) || isAuthorizedUser());
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /products/{productId} {
      allow read: if true;
      allow write: if (request.auth != null) && (isOwnerByUserId(resource.data) || isAuthorizedUser());
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /{collection}/{document} {
      allow create: if request.auth != null &&
                      request.auth.uid == request.resource.data.userId;
    }

    match /{document=**} {
      allow read, write: if request.auth != null &&
                           (isOwnerByUserId(resource.data) || isAuthorizedUser());
    }
  }
}
```

## Steps to Update

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the updated version above
5. Click **Publish**

After publishing, `https://invoice.mittiarts.com/i/SPDW` should work for everyone.
