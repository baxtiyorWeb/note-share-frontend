"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export const OneSignalClient = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      OneSignal.init({
        appId: "39374148-0bc5-4d2b-80bb-510a3aa0c615",
        notifyButton: {
          enable: true,
          position: "bottom-right",
          prenotify: false,
          showCredit: false,
          text: { "tip.state.unsubscribed": "Enable notifications" },
        } as any,
        allowLocalhostAsSecureOrigin: true,
      });
    }
  }, []);

  return null;
};
