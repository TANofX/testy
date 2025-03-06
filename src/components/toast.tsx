import type { SlAlert } from "@shoelace-style/shoelace";
import feather from "feather-icons";
import type { FeatherIconName } from "feather-icons-react";

export function toast(
  text: string,
  variant: "primary" | "success" | "neutral" | "warning" | "danger" = "primary",
  icon = "info"
) {
  const alert = Object.assign(document.createElement("sl-alert"), {
    variant,
    closable: true,
    duration: 5000,
    // God of types please forgive me
    innerHTML: `
          ${feather.icons[icon as FeatherIconName]
            .toSvg()
            .replace("<svg", '<svg slot="icon"')}
          ${escapeHtml(text)}
        `,
    countdown: "rtl",
  });

  document.body.append(alert);
  return (alert as SlAlert).toast();
}

// Always escape HTML for text arguments!
function escapeHtml(html: string) {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}
