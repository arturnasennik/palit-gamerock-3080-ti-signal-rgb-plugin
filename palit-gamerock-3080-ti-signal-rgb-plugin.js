
// Modifying SMBUS Plugins is -DANGEROUS- and can -DESTROY- devices.
export function Name() { return "ewtsdf"; }
export function Publisher() { return "sdfgsdfg"; }
export function Type() { return "SMBUS"; }
export function Size() { return [8, 8]; }
export function DefaultPosition(){return [5, 2];}
export function DefaultScale(){return 2.5;}
export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

let vLedNames = [
    "Led 1",
    "Led 2",
    "Led 3",
    "Led 4",
    "Led 5",
    "Led 6",
    "Led 7",
    "Led 8",
];

let vLedPositions = [
	[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
];

/** @param {FreeAddressBus} bus */
export function Scan(bus) {
	const FoundAddresses = [];

	  // Skip any non AMD / INTEL Busses
	  if (!bus.IsNvidiaBus()) {
		return [];
	}

	for(const PNYGPUID of PNYGPUIDs) {
		if(PNYGPUID.Vendor === bus.Vendor() &&
		PNYGPUID.SubVendor === bus.SubVendor() &&
		PNYGPUID.Device === bus.Product() &&
		PNYGPUID.SubDevice === bus.SubDevice()
		) {
			FoundAddresses.push(PNYGPUID.Address);
		}
	}

	return FoundAddresses;
}

export function Initialize() {
	console.log(bus);
	bus.WriteByte(PNYGPU.registers.Control, 0x00);
	bus.WriteByte(PNYGPU.registers.Mode, 0x01);
	bus.WriteByte(PNYGPU.registers.Brightness, 0x64);
	SetGPUNameFromBusIds();
}

export function Render() {
	sendColors();
}

export function Shutdown(SystemSuspending) {

	if(SystemSuspending){
		sendColors("#000000"); // Go Dark on System Sleep/Shutdown
	}else{
		sendColors(shutdownColor);
	}

}

function SetGPUNameFromBusIds() {
	for(const PNYGPUID of PNYGPUIDs) {
		if(PNYGPUID.Vendor === bus.Vendor() &&
		PNYGPUID.SubVendor === bus.SubVendor() &&
		PNYGPUID.Device === bus.Product() &&
		PNYGPUID.SubDevice === bus.SubDevice()
		) {
			device.setName(PNYGPUID.Name);
		}
	}
}

function sendColors(overrideColor) {

	// example header packet
	let packet = [];
	packet[0] = 0x00; //Zero Padding
	packet[1] = 0x00;
	packet[2] = 0x00;
	packet[3] = 0x00;
	packet[4] = 0x00;
	packet[5] = 0x00;
	packet[6] = 0x00;


	for (var idx = 0; idx < vLedPositions.length; idx++) {
		let iPxX = vLedPositions[idx][0];
		let iPxY = vLedPositions[idx][1];
		var color;

		if(overrideColor){
			color = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		}else{
			color = device.color(iPxX, iPxY);
		}
		packet[idx] = color[0];
		packet[idx+1] = color[1];
		packet[idx+2] = color[2];
	}

	//packet[89] = CalculateCrc(packet); // Example Crc
	device.send_report(packet, 65); // Send commands

}

class PNYGPUController {
	constructor() {
		this.registers =
        {
        	Control    : 0xE0,
        	Mode       : 0x60,
        	R          : 0x6C,
        	G          : 0x6D,
        	B          : 0x6E,
        	Brightness : 0x6F
        };
	}

	setDeviceMode(mode) {
		bus.WriteByte(this.registers.Mode, mode);
	}
}

const PNYGPU = new PNYGPUController();

class GPUIdentifier {
	constructor(Vendor, SubVendor, Device, SubDevice, Address, Name, Model = "") {
		this.Vendor = Vendor;
		this.SubVendor = SubVendor;
		this.Device = Device;
		this.SubDevice = SubDevice;
		this.Address = Address;
		this.Name = Name;
		this.Model = Model;
	}
}

class PNYGPUIdentifier extends GPUIdentifier {
	constructor(Brand, Device, SubDevice, Name, Model = "") {
		super(0x10DE, Brand, Device, SubDevice, 0x49, Name, Model);
	}
}
export function BrandGPUList(){ return PNYGPUIDs; }

const PNYGPUIDs =
[
	new PNYGPUIdentifier(0x196E, 0x2484, 0x136E, "PNY 3070 XLR8"),
	new PNYGPUIdentifier(0x196E, 0x2216, 0x138B, "PNY 3080 XLR8"),
	new PNYGPUIdentifier(0x196E, 0x2208, 0x1385, "PNY 3080TI Revel"),
	new PNYGPUIdentifier(0x196E, 0x2206, 0x136B, "PNY 3080 XLR8 REVEL EPIC-X RGB"),
	new PNYGPUIdentifier(0x196E, 0x2204, 0x136A, "PNY 3090 XLR8"),

	new PNYGPUIdentifier(0x1569, 0x2486, 0x2486, "PALIT 3060TI Dual OC"),
	new PNYGPUIdentifier(0x1569, 0x2482, 0xf278, "PALIT 3070TI GameRock"),
	new PNYGPUIdentifier(0x1569, 0x2482, 0x2482, "PALIT 3070TI Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2204, 0xf278, "PALIT 3090 GameRock"),
	new PNYGPUIdentifier(0x1569, 0x2204, 0x2204, "PALIT 3090 Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2208, 0x2208, "PALIT 3080TI Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2216, 0x2216, "PALIT 3080 Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2208, 0xf278, "PALIT 3080TI GameRock OC"),
	new PNYGPUIdentifier(0x1569, 0x2206, 0x2206, "PALIT 3080 Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2484, 0x2484, "PALIT 3070 Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2488, 0x2488, "PALIT 3070 Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2484, 0xf280, "PALIT 3070 JetStream"),
	new PNYGPUIdentifier(0x1569, 0x2488, 0xf278, "PALIT 3070 GameRock"),
	new PNYGPUIdentifier(0x1569, 0x2484, 0xf278, "PALIT 3070 GameRock OC"),
	new PNYGPUIdentifier(0x1569, 0x2782, 0xF298, "PALIT 4070TI Gaming Pro"),
	new PNYGPUIdentifier(0x1569, 0x2782, 0xF294, "PALIT 4070TI GameRock Classic"),
	new PNYGPUIdentifier(0x1569, 0x2704, 0xF296, "PALIT 4080 GameRock"),
	new PNYGPUIdentifier(0x1569, 0x2684, 0xF296, "PALIT 4090 GameRock OC"),

	new PNYGPUIdentifier(0x10B0, 0x2482, 0x2482, "Gainward 3070TI Phoenix"),
	new PNYGPUIdentifier(0x10B0, 0x2782, 0xF299, "Gainward 4070Ti Phoenix GS"),
	new PNYGPUIdentifier(0x10B0, 0x2704, 0xF299, "Gainward 4080 Phoenix GS"),

];

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function ImageUrl() {
	return "https://marketplace.signalrgb.com/devices/brands/pny/gpus/gpu.png";
}
