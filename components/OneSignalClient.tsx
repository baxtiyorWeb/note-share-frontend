"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export const OneSignalClient = () => {
  useEffect(() => {
    const initOneSignal = async () => {
      if (typeof window === "undefined") return;

      await OneSignal.init({
        appId: "39374148-0bc5-4d2b-80bb-510a3aa0c615",
        allowLocalhostAsSecureOrigin: true,

        notifyButton: {
          enable: true,
          position: "bottom-right",
          prenotify: true,
          showCredit: false,

          // ✅ Xato 1 uchun yechim: Barcha talab qilinadigan matn kalitlari qo‘shildi
          text: {
            "tip.state.unsubscribed": "Enable notifications",
            "tip.state.subscribed": "You’re subscribed",
            "tip.state.blocked": "You’ve blocked notifications",

            // Minimal qo‘shilgan kalitlar (tur xatosini tuzatish uchun)
            "dialog.blocked.title": "Notifications Blocked",
            "dialog.blocked.message": "Follow these instructions to enable notifications.",
            "dialog.main.title": "Manage Notifications",
            "dialog.main.button.subscribe": "SUBSCRIBE",
            "dialog.main.button.unsubscribe": "UNSUBSCRIBE",
            "message.action.resubscribed": "You have successfully resubscribed.",
            "message.action.subscribing": "Subscribing...",
            "message.action.unsubscribed": "You have successfully unsubscribed.",
            "message.action.subscribed": "You are now subscribed!",
            "message.prenotify": ""
          },
        },

        // ✅ Xato 2 uchun yechim: Yangi `slidedown` formatiga o‘tkazildi
        promptOptions: {
          slidedown: { // 👈 YANGI: promptOptions endi `slidedown` obyektini o‘z ichiga oladi
            prompts: [
              {
                type: "push",
                autoPrompt: false,
                delay: {
                  timeDelay: 3,
                },
                categories: []
              },
            ],
          },
        },
      });

      // ⚠️ Avtomatik prompt yoqilgani uchun bu qism endi kerak emas va olib tashlandi
      // const isPushEnabled = await OneSignal.isPushNotificationsEnabled();
      // if (!isPushEnabled) {
      //   await OneSignal.Slidedown.promptPush();
      // }
    };

    initOneSignal();
  }, []);

  return null;
};