import 'dotenv/config';

export default {
  expo: {
    name: "FitnessGym",
    slug: "FitnessGym",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fitnessgym.app",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"]
      }
    },
    android: {
      package: "com.fitnessgym.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      useNextNotificationsApi: true,
      softwareKeyboardLayoutMode: "pan"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#FF6B35",
          sounds: []
        }
      ]
    ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: "b204e40a-8fb9-4f15-9e12-07f66d2f49d9"
      }
    }
  }
};

