import { fn } from "storybook/test";
import {
  Entry,
  Report as ReportModel,
} from "@bindings/internal/notices/models";

export const Report = fn(
  async () =>
    new ReportModel({
      applicationLicense:
        "Example application license text for the Storybook preview.",
      entries: [
        new Entry({
          name: "Example UI library",
          version: "1.0.0",
          identifier: "MIT",
          source: "https://example.com/library",
          text: "Example dependency license text for the Storybook preview.",
        }),
        new Entry({
          name: "Example icon set",
          identifier: "CC-BY-4.0",
          note: "Example attribution supplied by the asset author.",
        }),
      ],
    }),
).mockName("Notices.Report");
