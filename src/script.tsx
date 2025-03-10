import { Row } from "./components/row";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { connected, ntcore1, checks, enabled, clearEventTarget, ntcore2 } from "./nt";
import { render } from "preact";
import { signal } from "@preact/signals";
import { toast } from "./components/toast";
import FeatherIcon from "feather-icons-react";
const favicon = new URL("favicon.png", import.meta.url);

if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register(new URL("sw.js", import.meta.url), {
      type: "module",
    })
    .catch((r) => console.warn("Failed to register service worker", r));

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
      <div class="body">
        <div
          class="welcome"
          hidden={Object.keys(checks.value).length > 0}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <img
            src={favicon.href}
            height="100"
            width="100"
            style={{
              filter: "saturate(0)",
              opacity: 0.1,
              height: "min(50vh, 50vw)",
              width: "min(50vh, 50vw)",
            }}
          ></img>
        </div>
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
      <div className="stat">
        <div
          id="install-button"
          style={{ display: "none" }}
          onClick={(ev) => {
            const button = ev.currentTarget;
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then((v) => {
                if (v.outcome === "accepted") {
                  button.style.display = "none";
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
            ntcore1.changeURI(address, port);
            ntcore2.changeURI(address, port);
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
        <div>{enabled.value ? "En" : "Dis"}abled</div>
      </div>
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
            console.error(e);
            button.disabled = false;
          }
        }}
        circle
        class="float"
      >
        <FeatherIcon icon="play"></FeatherIcon>
      </SlButton>
    </div>
  );
}

render(<App />, document.body);
