import { SlAlert, SlIcon } from "@shoelace-style/shoelace/dist/react";
import FeatherIcon, { type FeatherIconName } from "feather-icons-react";

export function Row(props: { type: "info" | "fault" | "running" | "unknown", children?: any, subsystem: string }) {
  const { icon, variant } = {
    info: { icon: "check-circle", variant: "success" as "success" },
    fault: { icon: "alert-triangle", variant: "danger" as "danger" },
    running: { icon: "play", variant: "neutral" as "neutral" },
    unknown: { icon: "help-circle", variant: "neutral" as "neutral" },
  }[props.type];
  return (
    <SlAlert open variant={variant}>
      <FeatherIcon slot="icon" icon={icon as FeatherIconName} />
      <strong style={{float: "end"}}>{props.subsystem}</strong>: {props.children}
    </SlAlert>
  );
}
/*

        <SlAlert open>
          <SlIcon slot="icon" name="alert-circle" />
          This is a standard alert. You can customize its content and even the
          icon.
        </SlAlert>
        <SlAlert open variant="warning">
          <SlIcon slot="icon" name="alert-triangle" />
          This is a standard alert. You can customize its content and even the
          icon.
        </SlAlert>
        <SlAlert open variant="danger">
          <SlIcon slot="icon" name="alert-octagon" />
          This is a standard alert. You can customize its content and even the
          icon.
        </SlAlert>
        */
