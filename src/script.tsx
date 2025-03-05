import { registerIconLibrary } from "@shoelace-style/shoelace/dist/shoelace.js";
import { Row } from "./components/row";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { connected, ntcore, checks, enabled } from "./nt";
import { render } from "preact";
import { signal } from "@preact/signals";
registerIconLibrary("default", {
  resolver: (name) =>
    `https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/${name}.svg`,
});

if ("serviceWorker" in navigator)
  navigator.serviceWorker.register(new URL("sw.js", import.meta.url), {
    type: "module",
  });

let deferredPrompt: BeforeInstallPromptEvent;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.style.display = "block";
  }
});

const savedIp = localStorage.getItem("ip");
const addr = signal(savedIp || "127.0.0.1");

function App() {
  return (
    <div>
      <div className="body">
        {Object.entries(checks.value).map(([name, check]) =>
          check.runStatus.value ? (
            <Row type="running" subsystem={name}>
              Executing <code>SystemCheck</code> command...
            </Row>
          ) : check.faults.value.length ? (
            check.faults.value.map((fault) => (
              <Row type="fault" subsystem={name}>
                {fault}
              </Row>
            ))
          ) : (
            <Row type="info" subsystem={name}>
              {check.statusText}
            </Row>
          )
        )}
      </div>
      <div className="side">
        <SlButton
          onClick={() => {
            for (const check of Object.values(checks.value)) check.run();
          }}
        >
          Run Checks
        </SlButton>
      </div>
      <div className="stat">
        <div
          id="install-button"
          style={{ display: "none" }}
          onClick={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
            }
          }}
        >
          Install App
        </div>
        <div
          onClick={() => {
            const team = prompt("Team number or IP Address");
            if (!team) return;
            const [ip, p] = team.split(":");
            const address = ip.match(/^[0-9]+$/)
              ? `roborio-${ip}-frc.local`
              : ip;
            const port = Number.isNaN(parseInt(p)) ? 5810 : parseInt(p);
            ntcore.changeURI(address, port);
            localStorage.setItem("ip", address);
            localStorage.setItem("port", `${p}`);
            addr.value = address;
            checks.value = {};
          }}
        >
          <code>{addr}</code>
        </div>
        <div>{connected}</div>
        <div>{enabled}</div>
      </div>
    </div>
  );
}

render(<App />, document.body);
