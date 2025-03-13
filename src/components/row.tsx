import { signal } from "@preact/signals";
import { SlAlert } from "@shoelace-style/shoelace/dist/react";
import FeatherIcon, { type FeatherIconName } from "feather-icons-react";
import { checks, enabled } from "src/nt";
import { toast } from "./toast";

export function Row(props: { type: "info" | "fault" | "running" | "unknown", children?: any, subsystem: string }) {
  const subsystem = checks.value[props.subsystem];
  const running = signal(false);
  const { icon, variant } = {
    info: { icon: "check-circle", variant: "success" as "success" },
    fault: { icon: "alert-triangle", variant: "danger" as "danger" },
    running: { icon: "play", variant: "neutral" as "neutral" },
    unknown: { icon: "help-circle", variant: "neutral" as "neutral" },
  }[props.type];
  return (
    <SlAlert open variant={variant}>
      <FeatherIcon slot="icon" icon={icon as FeatherIconName} />
      <strong>{props.subsystem}</strong>: {props.children}<FeatherIcon icon="play" class={running.value ? "disabled" : ""} onClick={async () => {
        if(running.value) return;
          try {
            if (enabled.value) {
              running.value = true;
              toast(`SystemCheck requested for ${props.subsystem}.`);
              await subsystem.run();
              toast(`SystemCheck completed for ${props.subsystem}.`);
              running.value = false;
            } else toast("Robot is not enabled.", "danger");
          } catch (e) {
            toast(`SystemCheck failed for ${props.subsystem}.`, "danger");
            console.error(e);
            running.value = false;
          }
        }}/>
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
