import { signal } from "@preact/signals";
import { NetworkTables, NetworkTablesTypeInfos } from "ntcore-ts-client";

const checks = signal<Record<string, Check>>({});
const savedIp = localStorage.getItem("ip");
const savedPort = localStorage.getItem("port");
const connected = signal("Loading");
const enabled = signal("Loading");

// Get or create the NT client instance
const ntcore = NetworkTables.getInstanceByURI(savedIp || "127.0.0.1", Number(savedPort) || 5810);
ntcore.addRobotConnectionListener(online => {
  connected.value = online ? "Connected" : "Disconnected";
  if(!online) {
    enabled.value = "Unknown";
  }
});
const sysStats = ntcore.createPrefixTopic("/SmartDashboard/SystemStatus");
const state = ntcore.createTopic<number>(`/FMSInfo/FMSControlData`, NetworkTablesTypeInfos.kInteger, 0);

sysStats.subscribe((value, params) => {
  const match = params.name.match(/^\/SmartDashboard\/SystemStatus\/([^/]+)/);
  const name = match?.[1];
  if (name && !checks.value[name]) {
    checks.value = { ...checks.value, [name]: new Check(name) };
    console.log(`Subsystem registered: ${name}`);
  }
});

state.subscribe((value) => {
  enabled.value = value ? "Enabled" : "Disabled";
})

class Check {
  private prefix: string;
  private running;
  private status;
  private faultsTopic;
  public faults = signal<string[]>([]);
  public runStatus = signal(false);
  public statusText = signal("Unknown status");
  
  constructor(name: string) {
    this.prefix = `/SmartDashboard/SystemStatus/${name}`;
    this.running = ntcore.createTopic<boolean>(`${this.prefix}/SystemCheck/running`, NetworkTablesTypeInfos.kBoolean, false);
    this.status = ntcore.createTopic<string>(`${this.prefix}/Status`, NetworkTablesTypeInfos.kString, "Unknown status, no error.");

    this.faultsTopic = ntcore.createTopic<string[]>(`${this.prefix}/Faults`, NetworkTablesTypeInfos.kStringArray);
    this.faultsTopic.subscribe((value) => {
      if(value) this.faults.value = value;
    });
    this.faults.value = this.faultsTopic.getValue() || [];

    this.running.subscribe(running => {
      if(typeof running === "boolean") this.runStatus.value = running;
    });
    this.runStatus.value = this.running.getValue() || false;

    this.status.subscribe(status => {
      if(status) this.statusText.value = status;
    });
    this.statusText.value = this.status.getValue() || "Unknown status";
  }

  async run() {
    await this.running.publish();
    this.running.setValue(true);
  }

  destroy() {
    this.running.unsubscribeAll();
    this.running.unpublish();
    this.faultsTopic.unsubscribeAll();
    this.status.unsubscribeAll();
  }
}

export {
    ntcore,
    connected,
    checks,
    enabled
};