/** @param {NS} ns **/
export async function main(ns) {
	const fragments = ns.stanek.activeFragments()
	if(fragments.length == 0){
		return
	}
	while(true){
		for(const f of fragments){
			await ns.stanek.charge(f.x, f.y)
		}
	}
}