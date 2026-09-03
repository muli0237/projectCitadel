import React, { useState } from 'react';
import {
  Cpu,
  Activity,
  HardDrive,
  Wifi,
  Shield,
  Layers,
  Battery,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Zap,
  Server,
  Radio,
  Sliders,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { MetricPanel } from '../../common/MetricPanel';
import { DriveHealthPanel } from '../../common/DriveHealthPanel';
import { StatusPill } from '../../common/StatusPill';

import monitorCardSvg from '../../../assets/images/card_monitor_vector.svg';

export const SystemMonitor: React.FC = () => {
  const {
    systemMetrics,
    driveHealth,
    workspace,
    triggerSafeEject,
    simulateDriveDisconnect,
    simulateDriveReconnect,
    showToast,
  } = useCitadelStore();

  const [ejectLoading, setEjectLoading] = useState(false);

  const handleEject = async () => {
    setEjectLoading(true);
    await triggerSafeEject();
    setEjectLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent text-slate-200 relative">
      <div className="relative z-10 space-y-6">
        {/* 1. CyberGuard Hardware Telemetry Header */}
      <div className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-[#071126]/90 p-5 shadow-xl backdrop-blur-md">
        <div
          className="absolute top-0 right-0 w-48 h-full opacity-15 pointer-events-none bg-contain bg-no-repeat bg-right"
          style={{ backgroundImage: `url(${monitorCardSvg})` }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xs bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-oxanium font-bold text-white uppercase tracking-[0.15em]">
                  System Hardware & Drive Telemetry
                </h1>
                <StatusPill status="healthy" label="KERNEL SECURE" pulse />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Host: <span className="text-cyan-300 font-mono">{systemMetrics?.hostname || 'citadel-enclave'}</span> • OS: <span className="text-slate-200 font-mono">{systemMetrics?.osName || 'Linux 6.8.0'}</span> ({systemMetrics?.kernelVersion || 'x86_64-generic'})
              </p>
            </div>
          </div>

          {/* Flash Drive Simulator Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => simulateDriveDisconnect()}
              className="px-3 py-1.5 rounded-xs bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold hover:bg-rose-900/40 transition-colors"
              title="Simulate Sudden USB Flash Drive Pull"
            >
              [Test Drive Disconnect]
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Flash Drive Status Panel */}
      <DriveHealthPanel />

      {/* 3. CPU Multi-Core Load Distribution Matrix */}
      <div className="bg-[#071126] border border-cyan-500/20 rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              CPU Multi-Core Load Distribution ({systemMetrics?.cpuCores?.length || 8} Logical Cores)
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-300 font-bold">
            Average Utilization: {systemMetrics?.cpuUsagePercent !== undefined ? `${systemMetrics.cpuUsagePercent.toFixed(1)}%` : '18.4%'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {(systemMetrics?.cpuCores || [
            { coreId: 0, usagePercent: 14, frequencyMhz: 3600 },
            { coreId: 1, usagePercent: 28, frequencyMhz: 3600 },
            { coreId: 2, usagePercent: 8, frequencyMhz: 3600 },
            { coreId: 3, usagePercent: 42, frequencyMhz: 3600 },
            { coreId: 4, usagePercent: 19, frequencyMhz: 3600 },
            { coreId: 5, usagePercent: 6, frequencyMhz: 3600 },
            { coreId: 6, usagePercent: 12, frequencyMhz: 3600 },
            { coreId: 7, usagePercent: 33, frequencyMhz: 3600 },
          ]).map((core) => (
            <div
              key={core.coreId}
              className="p-3 rounded-xs bg-[#030917] border border-cyan-950 text-center flex flex-col justify-between hover:border-cyan-500/30 transition-colors"
            >
              <div className="text-[10px] font-mono text-slate-400">Core {core.coreId}</div>
              <div className="text-base font-bold font-mono text-cyan-400 my-1">
                {core.usagePercent}%
              </div>
              <div className="w-full bg-[#071126] rounded-full h-1 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${core.usagePercent}%` }}
                />
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                {core.frequencyMhz} MHz
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Network Interfaces and Mounted Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Interfaces */}
        <div className="bg-[#071126] border border-cyan-500/20 rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Network Adapters & Virtual Tunnels
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">ISOLATED ENCLAVE</span>
          </div>

          <div className="space-y-2.5">
            {(systemMetrics?.networkInterfaces || [
              { name: 'eno1', ipAddresses: ['192.168.1.104/24'], rxBytesSec: 42000, txBytesSec: 12000, isVpnOrTunnel: false },
              { name: 'wg0', ipAddresses: ['10.8.0.2/32'], rxBytesSec: 18000, txBytesSec: 9000, isVpnOrTunnel: true },
            ]).map((iface) => (
              <div
                key={iface.name}
                className="p-3 rounded-xs bg-[#030917] border border-cyan-950 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{iface.name}</span>
                    {iface.isVpnOrTunnel && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded-xs font-mono border border-cyan-800">
                        WIREGUARD VPN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                    {iface.ipAddresses.join(', ') || 'No IP Assigned'}
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div>RX: {(iface.rxBytesSec / 1024).toFixed(1)} KB/s</div>
                  <div>TX: {(iface.txBytesSec / 1024).toFixed(1)} KB/s</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating System and Host Architecture */}
        <div className="bg-[#071126] border border-cyan-500/20 rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Host Distribution & Platform Architecture
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">x86_64 / Debian</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-cyan-950">
              <span className="text-slate-400">Distribution</span>
              <span className="text-cyan-300 font-bold">{systemMetrics?.osName || 'Kali Linux 2024.2 (Rolling)'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-cyan-950">
              <span className="text-slate-400">Kernel Release</span>
              <span className="text-white font-mono">{systemMetrics?.kernelVersion || '6.8.11-kali-amd64'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-cyan-950">
              <span className="text-slate-400">Process Table Count</span>
              <span className="text-white font-mono">{systemMetrics?.activeProcessesCount || 184} active tasks</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Uptime</span>
              <span className="text-emerald-400 font-bold font-mono">
                {Math.floor((systemMetrics?.uptimeSeconds || 84920) / 3600)}h{' '}
                {Math.floor(((systemMetrics?.uptimeSeconds || 84920) % 3600) / 60)}m
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
