import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/notifications/styles.css";
import "@/i18n";
import { Website } from "@/website/Website";
import { WebsiteProviders } from "@/website/WebsiteProviders";
import "@/website/website.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WebsiteProviders>
      <Website />
    </WebsiteProviders>
  </React.StrictMode>,
);
