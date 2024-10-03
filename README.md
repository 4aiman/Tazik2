# What is this?

This is a Postman-like API test app.
You can add requests, methods, payload, etc and send them wherever to get a response.

# Running
1. Clone this repo
2. `cd` into its folder
3. run `npm install`
4. launch with `npm run tauri dev --debug --verbose`

# Building
## Current Architecture
Binaries are built with `npm run tauri build`.
More info at [Tauri](https://v2.tauri.app/distribute/)

## Android
1. setup your Java NDK
2. `npm run tauri android init`
3. `npm run tauri android build`
4. sign your apk if your device isn't rooted

# Developing

- Desktops OS: `npm run tauri dev`
- Android (emulated or real) `npm run tauri android dev`

# Screenshots
[![](screenshots/shot%20(8).png)](screenshots/shot%20(8).png)
[![](screenshots/shot%20(1).png)](screenshots/shot%20(1).png)
[![](screenshots/shot%20(2).png)](screenshots/shot%20(2).png)
[![](screenshots/shot%20(3).png)](screenshots/shot%20(3).png)
[![](screenshots/shot%20(4).png)](screenshots/shot%20(4).png)
[![](screenshots/shot%20(5).png)](screenshots/shot%20(5).png)
[![](screenshots/shot%20(6).png)](screenshots/shot%20(6).png)
[![](screenshots/shot%20(7).png)](screenshots/shot%20(7).png)

