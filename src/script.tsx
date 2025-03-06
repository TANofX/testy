import { registerIconLibrary } from "@shoelace-style/shoelace/dist/shoelace.js";
import { Row } from "./components/row";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { connected, ntcore, checks, enabled, clearEventTarget } from "./nt";
import { render } from "preact";
import { signal } from "@preact/signals";
import { toast } from "./components/toast";
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
  toast("Install the App for offline use!");
});

window.addEventListener("error", (ev) => {
  toast(`${ev.message}`, "danger");
});
window.addEventListener("unhandledrejection", (ev) => {
  toast(`${ev.reason}`, "danger");
});

const savedIp = localStorage.getItem("ip");
const addr = signal(savedIp || "127.0.0.1");

function App() {
  return (
    <div>
      <div className="body">
        {Object.entries(checks.value)
          .sort(
            ([, checkA], [, checkB]) =>
              checkB.faults.value.length - checkA.faults.value.length ||
              Number(checkA.statusText.value.includes("OK")) -
                Number(checkB.statusText.value.includes("OK"))
          )
          .map(([name, check]) =>
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
              <Row
                type={
                  check.statusText.value.includes("OK") ? "info" : "unknown"
                }
                subsystem={name}
              >
                {check.statusText}
              </Row>
            )
          )}
      </div>
      <div className="side">
        <SlButton
          onClick={async (ev) => {
            const button = ev.currentTarget;
            let current: string = "None";
            try {
              if (enabled.value) {
                button.disabled = true;
                toast("SystemCheck requested.");
                for (const [name, check] of Object.entries(checks.value)) {
                  current = name;
                  await check.run();
                }
                toast("SystemCheck completed.");
                button.disabled = false;
              } else toast("Robot is not enabled.", "danger");
            } catch (e) {
              toast(`SystemCheck failed at ${current}.`, "danger");
              console.log(e);
              button.disabled = false;
            }
          }}
        >
          Run Checks
        </SlButton>
      </div>
      <div className="stat">
        <div
          id="install-button"
          style={{ display: "none" }}
          onClick={(ev) => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then((v) => {
                if (v.outcome === "accepted") {
                  ev.currentTarget.style.display = "none";
                  toast("Installing PWA...");
                }
              });
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
            clearEventTarget();
            checks.value = {};
          }}
        >
          <code>{addr}</code>
        </div>
        <div>{connected}</div>
        <div>{enabled ? "En" : "Dis"}abled</div>
      </div>
    </div>
  );
}

render(<App />, document.body);
