/** @param {NS} ns */

export const iPlayer = {
	currentCity: (ns) => ns.getPlayer().city,
	travelTo: (ns, city) => ns.travelToCity(city),
	workout: (ns, statName, gymName, focus) => ns.gymWorkout(gymName, statName, focus),
	study: (ns, university, course, focus) => ns.universityCourse(university, course, focus),
	crime: (ns, crime) => ns.commitCrime(crime),
	factionWork: (ns, faction, work, focus) => ns.workForFaction(faction, work, focus),
	companyWork: (ns, company, focus) => ns.workForCompany(company, focus),
	currentTask: (ns) => ns.getPlayer().workType,
	stats: (ns) => ns.getPlayer(),
	mult: (ns, stat) => ns.getPlayer()[stat + "_mult"],
	expMult: (ns, stat) => ns.getPlayer()[stat + "_exp_mult"],
	crimeChance: (ns, crime) => ns.getCrimeChance(crime),
	type: "player",
	name: "player",
}