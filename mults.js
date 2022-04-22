/** @param {NS} ns **/
export async function main(ns) {
	const mults = ns.getBitNodeMultipliers()
	for (const key of Object.keys(mults)) {
		if(mults[key] != 1){
			ns.tprint(key + ": " + mults[key])
		}
	}
	for (const key of Object.keys(mults)) {
		if(mults[key] == 1){
			ns.tprint(key + ": " + mults[key])
		}
	}
	ns.exploit()
}