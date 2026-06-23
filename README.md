<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# ANTIDRAMA

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/adf6e6a5-0840-486c-9f45-3dd70f1b11d8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase

Create a Firebase Web App, copy the `VITE_FIREBASE_*` values into `.env.local`, and restart the dev server. The app initializes Firebase only when all Firebase variables are present.

## Vercel

Set these environment variables in Vercel before deploying:

- `GEMINI_API_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
