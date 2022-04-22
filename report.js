/** @param {NS} ns **/
export async function main(ns) {
	while (true) {
		await ns.sleep(10000)
		for (let action = ns.readPort(2); action != 'NULL PORT DATA'; action = ns.readPort(2)) {
			ns.print(action)
		}
	}
}