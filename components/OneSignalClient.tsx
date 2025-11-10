"use client";

import api from "@/config/api";
import { useEffect } from "react";
import toast from "react-hot-toast";
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

          text: {
            "tip.state.unsubscribed": "Enable notifications",
            "tip.state.subscribed": "You’re subscribed",
            "tip.state.blocked": "You’ve blocked notifications",

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

        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: true,
                delay: {
                  timeDelay: 3,
                },
                categories: []
              },
            ],
          },
        },
      });

      OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
        const playerId = event.current.id || OneSignal.User.PushSubscription.id;

        if (playerId) {
          console.log("🎯 OneSignal Player ID:", playerId);

          const token = localStorage.getItem("access_token");
          if (!token) {
            console.warn("⚠️ Token topilmadi — foydalanuvchi login qilmagan");
            return;
          }

          try {
            // 🔥 Backend’ga yuborish
            await api.post(
              "/users/onesignal",
              { playerId },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            console.log("✅ Player ID backendda saqlandi:", playerId);
            toast.success("Notification ID saqlandi 🔔");
          } catch (error) {
            console.error("❌ Player ID saqlanmadi:", error);
            toast.error("Player ID yuborishda xatolik");
          }
        }
      });

    };

    initOneSignal();
  }, []);

  return null;
};