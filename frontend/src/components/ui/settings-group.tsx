import React, { ReactNode, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestart } from "@/contexts/restart-provider";
import { main } from "@/wailsjs/go/models";
import { useConfig } from "@/contexts/config-provider";

interface SettingsComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const SettingsGroup: React.FC<SettingsComponentProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={`w-full ${className}`} {...rest}>
    {children}
  </div>
);

interface SettingsItemProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
  vertical?: boolean;
  disabled?: boolean;
  children: ReactNode;
  configKey?: keyof main.Config | (keyof main.Config)[];
  requiresRestart?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  children,
  className,
  disabled,
  loading,
  vertical,
  configKey,
  requiresRestart,
  ...rest
}) => {
  const { addRestartRequired, removeRestartRequired } = useRestart();
  const { config, initialConfig } = useConfig();

  useEffect(() => {
    if (requiresRestart && configKey && config && initialConfig && !loading) {
      if (Array.isArray(configKey)) {
        // Handle array of keys
        configKey.forEach((k) => {
          const configValue = config[k as keyof main.Config];
          const initialValue = initialConfig[k as keyof main.Config];
          if (configValue === initialValue) {
            removeRestartRequired(k as keyof main.Config);
          } else {
            addRestartRequired(k as keyof main.Config);
          }
        });
      } else {
        // Handle single key
        const k = configKey as keyof main.Config;
        const configValue = config[k];
        const initialValue = initialConfig[k];
        if (configValue === initialValue) {
          removeRestartRequired(k);
        } else {
          addRestartRequired(k);
        }
      }
    }
  }, [config]);

  if (loading) {
    return <SettingsItemSkeleton className={className} {...rest} />;
  } else {
    return (
      <div
        className={`flex gap-4 justify-between py-2 w-full border-b ${
          vertical ? "flex-col" : "flex-row items-center"
        } 
    ${disabled ? "opacity-50 pointer-events-none" : ""}
       ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  }
};

export const SettingLabel: React.FC<SettingsComponentProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={`font-medium text-foreground ${className}`} {...rest}>
    {children}
  </div>
);

export const SettingDescription: React.FC<SettingsComponentProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={`text-sm text-muted-foreground ${className}`} {...rest}>
    {children}
  </div>
);

export const SettingContent: React.FC<SettingsComponentProps> = ({
  children,
  className,
  ...rest
}) => (
  <div className={`flex flex-col ${className}`} {...rest}>
    {children}
  </div>
);

interface SettingsGroupSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const SettingsItemSkeleton: React.FC<SettingsGroupSkeletonProps> = ({
  className,
  ...rest
}) => (
  <div
    className={`flex items-center justify-between w-full my-2 ${className}`}
    {...rest}
  >
    <div className="space-y-2 w-full">
      <Skeleton className="w-1/3 h-4" />
      <Skeleton className="w-[90%] h-4" />
    </div>
    <Skeleton className="rounded-full w-24 h-12" />
  </div>
);
