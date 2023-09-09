export function Name() { return "Palit GameRock 3080 TI"; }
export function VendorId() { return 0x4e 0x56 0x49 0x44 0x49 0x41; }
export function ProductId() { return 0x2208; }
export function Publisher() { return "Test"; }
export function Documentation(){ return "troubleshooting/brand"; }
export function Size() { return [30, 10]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

let vLedNames = [
	"Led 1",
    "Led 2",
    "Led 3",
    "Led 4",
];

let vLedPositions = [
	[0, 0], [0, 1], [0, 2], [0, 3],
];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {

}

export function Render() {
	sendColors();
	device.pause(1);
}

export function Shutdown(SystemSuspending) {
    if(SystemSuspending){
        sendColors("#000000"); // Go Dark on System Sleep/Shutdown
    }else{
        sendColors(shutdownColor);
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

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	let colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === 0 && endpoint.usage === 0x0000 && endpoint.usage_page === 0x0000 && endpoint.collection === 0x0000;
}

export function ImageUrl() {
	return "";
}
