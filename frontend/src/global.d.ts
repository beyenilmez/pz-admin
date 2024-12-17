declare global {
  interface Window {
    toast: (props: ToastProps) => void;
    goto: goto;
    sendNotification: sendNotification;
    setProgress: setProgress;
  }
}

export {};
