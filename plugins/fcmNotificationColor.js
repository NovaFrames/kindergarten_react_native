
// module.exports = function withFcmNotificationColor(config) {
//   return require("expo/config-plugins").withAndroidManifest(config, (config) => {
//     const androidManifest = config.modResults.manifest;
//     const app = androidManifest.application?.[0];

//     if (!app) return config;

//     if (!app["meta-data"]) {
//       app["meta-data"] = [];
//     }

//     app["meta-data"] = app["meta-data"].filter(
//       (item) =>
//         item.$["android:name"] !==
//         "com.google.firebase.messaging.default_notification_color"
//     );

//     app["meta-data"].push({
//       $: {
//         "android:name": "com.google.firebase.messaging.default_notification_color",
//         "android:resource": "@color/notification_icon_color",
//         "tools:replace": "android:resource",
//       },
//     });

//     return config;
//   });
// };


