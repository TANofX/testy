import { SlAlert, SlIcon } from "@shoelace-style/shoelace/dist/react";

export function Row(props: { type: "info" | "warning" | "error", children?: any, subsystem: string }) {
  const { icon, variant } = {
    info: { icon: "alert-circle", variant: "primary" as "primary" },
    warning: { icon: "alert-triangle", variant: "warning" as "warning" },
    error: { icon: "alert-octagon", variant: "danger" as "danger" },
  }[props.type];
  return (
    <SlAlert open variant={variant}>
      <SlIcon slot="icon" name={icon} />
      <strong>{props.subsystem}</strong>: {props.children}
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
