/*
 * USBRelay
 * Copyright(c) 2018 Joseph Adams, github.com/josephdadams/usbrelay
 * MIT Licensed
 */

'use strict';

import HID = require('node-hid');

class USBRelay {
	device: HID.HID;
	devicePath: string;

	// gets relay devices currently connected
	static get Relays() {
		const devices = HID.devices();
		const connectedRelays = devices.filter((device) => {
			return device.product && device.product.indexOf('USBRelay') !== -1;
		});

		const relays = connectedRelays.map((device) => new USBRelay(device.path!));

		return relays;
	}

	constructor(devicePath: string) {
		if (typeof devicePath === 'undefined') {
			// Device path was not provided, so let's select the first connected device.
			const devices = HID.devices();
			const connectedRelays = devices.filter((device) => {
				return device.product && device.product.indexOf('USBRelay') !== -1;
			});
			if (!connectedRelays.length) {
				throw new Error('No USB Relays are connected.');
			}
			this.device = new HID.HID(connectedRelays[0].path!);
		} else {
			this.device = new HID.HID(devicePath);
		}
		this.devicePath = devicePath;
	}

	// set the current state (on = true, off = false) of relayNumber
	setState(relayNumber: number, state: boolean) {
		// Byte 0 = Report ID
		// Byte 1 = State
		// Byte 2 = Relay
		// Bytes 3-8 = Padding

		// index 0 turns all the relays on or off
		const relayOn = [
			[0x00, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xff, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
		];

		const relayOff = [
			[0x00, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			[0x00, 0xfd, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
		];

		let command = null;

		if (state) {
			command = relayOn[relayNumber];
		} else {
			command = relayOff[relayNumber];
		}

		this.device.sendFeatureReport(command);
	}

	getState(relayNumber: number) {
		const relayIndex = relayNumber - 1;
		if (relayIndex < 0 || relayIndex > 7) {
			throw new Error('Invalid relayNumber must be between 1 and 8');
		}
		const report = this.device.getFeatureReport(0, 9);

		/* tslint:disable:no-bitwise */
		return ((report[8] >> relayIndex) & 1) === 1;
		/* tslint:enable:no-bitwise */
	}

	getSerialNumber() {
		const report = this.device.getFeatureReport(0, 9);
		const serial = new Array(5);
		for (let i = 0; i < 5; i++) {
			serial[i] = String.fromCharCode(report[i + 1]);
		}

		return serial.join('');
	}
}

module.exports = USBRelay;
