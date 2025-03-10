import { signal } from "@preact/signals";
import { NetworkTables, NetworkTablesTypeInfos } from "ntcore-ts-client";
import { toast } from "./components/toast";

const checks = signal<Record<string, Check>>({});
var ntEvents = new EventTarget();
const ntStore: Record<string, any> = {};
const savedIp = localStorage.getItem("ip");
const savedPort = localStorage.getItem("port");
const connected = signal("Loading");
const enabled = signal(false);
var wasOnline = false,
  wasEnabled = false;

// Everything else
const ntcore1 = NetworkTables.getInstanceByURI(
  savedIp || "127.0.0.1",
  Number(savedPort) || 5810
);
// Prefix topic handler
// @ts-ignore This line makes ntcore ignore existing instance and create a new one
NetworkTables._instances.clear();
const ntcore2 = NetworkTables.getInstanceByURI(
  savedIp || "127.0.0.1",
  Number(savedPort) || 5810
);
ntcore1.addRobotConnectionListener((online) => {
  connected.value = online ? "Connected" : "Disconnected";
  if (!online) {
    enabled.value = false;
  }
  if (online != wasOnline) {
    wasOnline = online;
    if (online) toast("Connected to the robot.");
    else toast("Disconnected from the robot.", "warning");
  }
});
const sysStats = ntcore2.createPrefixTopic("/SmartDashboard/SystemStatus");
const state = ntcore1.createTopic<number>(
  `/FMSInfo/FMSControlData`,
  NetworkTablesTypeInfos.kInteger,
  0
);

sysStats.subscribe((value, params) => {
  const match = params.name.match(/^\/SmartDashboard\/SystemStatus\/([^/]+)/);
  const name = match?.[1];
  if (name && !checks.value[name]) {
    checks.value = { ...checks.value, [name]: new Check(name) };
  }
  ntEvents.dispatchEvent(new NetworkTablesEvent(params.name, value));
  ntStore[params.name] = value;
});

state.subscribe((value) => {
  const isEnabled: boolean = value ? value > 32 : false;
  enabled.value = isEnabled;
  if (isEnabled != wasEnabled) {
    wasEnabled = isEnabled;
    if (isEnabled) toast("Robot enabled.");
    else toast("Robot disabled.");
  }
});

class Check {
  private prefix: string;
  private running;
  private next?: (value: unknown) => void;
  public faults = signal<string[]>([]);
  public runStatus = signal(false);
  public statusText = signal("Unknown status");

  constructor(name: string) {
    this.prefix = `/SmartDashboard/SystemStatus/${name}`;
    this.running = ntcore1.createTopic<boolean>(
      `${this.prefix}/SystemCheck/running`,
      NetworkTablesTypeInfos.kBoolean,
      false
    );
    ntEvents.addEventListener(`${this.prefix}/Faults`, (e) => {
      const { value } = e as NetworkTablesEvent<string[]>;
      this.faults.value = value;
    });
    ntEvents.addEventListener(`${this.prefix}/Status`, (e) => {
      const { value } = e as NetworkTablesEvent<string>;
      this.statusText.value = value || "Unknown status";
    });
    ntEvents.addEventListener(`${this.prefix}/SystemCheck/running`, (e) => {
      const { value } = e as NetworkTablesEvent<boolean>;
      this.runStatus.value = value || false;
      if (value === false && this.next) {
        this.next(0);
        this.next = undefined;
      }
    });
  }

  async run() {
    console.log("pub");
    await this.running.publish();
    console.log("set");
    this.running.setValue(true);
    console.log("done");
    let next: (value: unknown) => void = () => {};
    const promise = new Promise((r) => (next = r));
    this.next = next;
    return promise;
  }
}

class NetworkTablesEvent<T> extends Event {
  value: T;
  constructor(path: string, data: T) {
    super(path);
    this.value = data;
  }
}

function clearEventTarget() {
  ntEvents = new EventTarget();
}

checks.value = Object.fromEntries(["CoralHandler", "CoralHandlerWristVertical", "CoralHandlerWristHorizontal"].map(e=>([e, new Check(e)])));

export { ntcore1, ntcore2, connected, checks, enabled, clearEventTarget, ntStore };
