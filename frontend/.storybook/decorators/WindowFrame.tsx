import type { ReactNode } from "react";
import appIcon from "../../../build/appicon.svg";
import classes from "./WindowFrame.module.css";

/** Decorative window chrome for captures; the application stays interactive. */
export function WindowFrame({ children }: { children: ReactNode }) {
  return (
    <div className={classes.window} data-capture-window>
      <div className={classes.titlebar} aria-hidden="true">
        <div className={classes.title}>
          <img src={appIcon} width={18} height={18} alt="" />
          <span>PZ Admin</span>
        </div>
        <div className={classes.controls}>
          <svg viewBox="0 0 16 16">
            <path d="M3 11h10" />
          </svg>
          <svg viewBox="0 0 16 16">
            <rect x="3.5" y="3.5" width="9" height="9" rx="1" />
          </svg>
          <svg viewBox="0 0 16 16">
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </div>
      </div>
      <div id="capture-content" className={classes.content}>
        {children}
      </div>
    </div>
  );
}
