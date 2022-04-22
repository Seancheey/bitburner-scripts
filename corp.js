/** @param {NS} ns */

const CYCLE_INTERVAL = 10
const cities = ['Aevum', "Sector-12", "Chongqing", "New Tokyo", "Volhaven", "Ishima"]

class Industry {
	constructor(type, opts) {
		this.type = type
		this.reFac = 0
		this.robFac = 0
		this.aiFac = 0
		this.hwFac = 0
		this.makesProducts = false
		this.prodMats = []
		this.reqMats = {}
		for (const key of Object.keys(opts)) {
			this[key] = opts[key]
		}
	}
}

const industries = {
	"Energy": new Industry("Energy", {
		reFac: 0.65,
		sciFac: 0.7,
		robFac: 0.05,
		aiFac: 0.3,
		advFac: 0.08,
		reqMats: {
			Hardware: 0.1,
			Metal: 0.2,
		},
		prodMats: ["Energy"]
	}),
	"Utilities": new Industry("Utilities", {
		reFac: 0.5,
		sciFac: 0.6,
		robFac: 0.4,
		aiFac: 0.4,
		advFac: 0.08,
		reqMats: {
			Hardware: 0.1,
			Metal: 0.1,
		},
		prodMats: ["Water"]
	}),
	"Agriculture": new Industry("Agriculture", {
		reFac: 0.72,
		sciFac: 0.5,
		hwFac: 0.2,
		robFac: 0.3,
		aiFac: 0.3,
		advFac: 0.04,
		reqMats: {
			Water: 0.5,
			Energy: 0.5,
		},
		prodMats: ["Plants", "Food"]
	}),
	"Fishing": new Industry("Fishing", {
		reFac: 0.15,
		sciFac: 0.35,
		hwFac: 0.35,
		robFac: 0.5,
		aiFac: 0.2,
		advFac: 0.08,
		reqMats: {
			Energy: 0.5,
		},
		prodMats: ["Food"]
	}),
	"Mining": new Industry("Mining", {
		reFac: 0.3,
		sciFac: 0.26,
		hwFac: 0.4,
		robFac: 0.45,
		aiFac: 0.45,
		advFac: 0.06,
		reqMats: {
			Energy: 0.8,
		},
		prodMats: ["Metal"]
	}),
	"Food": new Industry("Food", {
		sciFac: 0.12,
		hwFac: 0.15,
		robFac: 0.3,
		aiFac: 0.25,
		advFac: 0.25,
		reFac: 0.05,
		reqMats: {
			Food: 0.5,
			Water: 0.5,
			Energy: 0.2,
		},
		makesProducts: true
	}),
	"Tobacco": new Industry("Tobacco", {
		reFac: 0.15,
		sciFac: 0.75,
		hwFac: 0.15,
		robFac: 0.2,
		aiFac: 0.15,
		advFac: 0.2,
		reqMats: {
			Plants: 1,
			Water: 0.2,
		},
		makesProducts: true
	}),
	"Chemical": new Industry("Chemical", {
		reFac: 0.25,
		sciFac: 0.75,
		hwFac: 0.2,
		robFac: 0.25,
		aiFac: 0.2,
		advFac: 0.07,
		reqMats: {
			Plants: 1,
			Energy: 0.5,
			Water: 0.5,
		},
		prodMats: ["Chemicals"]
	}),
	"Pharmaceutical": new Industry("Pharmaceutical", {
		reFac: 0.05,
		sciFac: 0.8,
		hwFac: 0.15,
		robFac: 0.25,
		aiFac: 0.2,
		advFac: 0.16,
		reqMats: {
			Chemicals: 2,
			Energy: 1,
			Water: 0.5,
		},
		prodMats: ["Drugs"],
		makesProducts: true
	}),
	"Computer": new Industry("Computer", {
		reFac: 0.2,
		sciFac: 0.62,
		robFac: 0.36,
		aiFac: 0.19,
		advFac: 0.17,
		reqMats: {
			Metal: 2,
			Energy: 1,
		},
		prodMats: ["Hardware"],
		makesProducts: true
	}),
	"Robotics": new Industry("Robotics", {
		reFac: 0.32,
		sciFac: 0.65,
		aiFac: 0.36,
		advFac: 0.18,
		hwFac: 0.19,
		reqMats: {
			Hardware: 5,
			Energy: 3,
		},
		prodMats: ["Robots"],
		makesProducts: true
	}),
	"Software": new Industry("Software", {
		sciFac: 0.62,
		advFac: 0.16,
		hwFac: 0.25,
		reFac: 0.15,
		aiFac: 0.18,
		robFac: 0.05,
		reqMats: {
			Hardware: 0.5,
			Energy: 0.5,
		},
		prodMats: ["AICores"],
		makesProducts: true
	}),
	"Healthcare": new Industry("Healthcare", {
		reFac: 0.1,
		sciFac: 0.75,
		advFac: 0.11,
		hwFac: 0.1,
		robFac: 0.1,
		aiFac: 0.1,
		reqMats: {
			Robots: 10,
			AICores: 5,
			Energy: 5,
			Water: 5,
		},
		makesProducts: true
	}),
	"RealEstate": new Industry("RealEstate", {
		robFac: 0.6,
		aiFac: 0.6,
		advFac: 0.25,
		sciFac: 0.05,
		hwFac: 0.05,
		reqMats: {
			Metal: 5,
			Energy: 5,
			Water: 2,
			Hardware: 4,
		},
		prodMats: ["RealEstate"],
		makesProducts: true
	})
}

const facToMaterial = {
	reFac: "RealEstate",
	aiFac: "AICores",
	robFac: "Robots",
	hwFac: "Hardware"
}

const materialToFac = {}
for (const [k, v] of Object.entries(facToMaterial)) {
	materialToFac[v] = k
}

const materials = [
	"Water",
	"Energy",
	"Food",
	"Plants",
	"Metal",
	"Hardware",
	"Chemicals",
	"Drugs",
	"Robots",
	"AICores",
	"RealEstate",
]

const materialSize = {
	Water: 0.05,
	Energy: 0.01,
	Food: 0.03,
	Plants: 0.05,
	Metal: 0.1,
	Hardware: 0.06,
	Chemicals: 0.05,
	Drugs: 0.02,
	Robots: 0.5,
	AICores: 0.1,
	RealEstate: 0.005,
	"Real Estate": 0.005,
	"AI Cores": 0.1,
};

const researches = [
	{
		name: "AutoBrew",
		cost: 12e3,
	},
	{
		name: "AutoPartyManager",
		cost: 15e3,
	},
	{
		name: "Automatic Drug Administration",
		cost: 10e3,
	},
	{
		name: "Bulk Purchasing",
		cost: 5e3,
	},
	{
		name: "CPH4 Injections",
		cost: 25e3,
		employeeCreMult: 1.1,
		employeeChaMult: 1.1,
		employeeEffMult: 1.1,
		employeeIntMult: 1.1,
	},
	{
		name: "Drones",
		cost: 5e3,
	},
	{
		name: "Drones - Assembly",
		cost: 25e3,
		productionMult: 1.2,
	},
	{
		name: "Drones - Transport",
		cost: 30e3,
		storageMult: 1.5,
	},
	{
		name: "Go-Juice",
		cost: 25e3,
	},
	{
		name: "Hi-Tech R&D Laboratory",
		cost: 5e3,
		sciResearchMult: 1.1,
	},
	{
		name: "HRBuddy-Recruitment",
		cost: 15e3,
	},
	{
		name: "HRBuddy-Training",
		cost: 20e3,
	},
	{
		name: "JoyWire",
		cost: 20e3,
	},
	{
		name: "Market-TA.I",
		cost: 20e3,
	},
	{
		name: "Market-TA.II",
		cost: 50e3,
	},
	{
		name: "Overclock",
		cost: 15e3,
		employeeEffMult: 1.25,
		employeeIntMult: 1.25,
	},
	{
		name: "Self-Correcting Assemblers",
		cost: 25e3,
		productionMult: 1.1,
	},
	{
		name: "Sti.mu",
		cost: 30e3,
	},
	{
		name: "sudo.Assist",
		cost: 15e3,
	},
	{
		name: "uPgrade: Capacity.I",
		cost: 20e3,
	},
	{
		name: "uPgrade: Capacity.II",
		cost: 30e3,
	},
	{
		name: "uPgrade: Dashboard",
		cost: 5e3,
	},
	{
		name: "uPgrade: Fulcrum",
		cost: 10e3,
		productProductionMult: 1.05,
	},
];

const corpUpgrades = {
	"Smart Factories": {
		basePrice: 2e9,
		priceMult: 1.06,
		benefitMult: 0.03,
		multName: "productionMult"
	},

	"Smart Storage": {
		basePrice: 2e9,
		priceMult: 1.06,
		benefitMult: 0.1,
		multName: "storageMult"
	},

	"DreamSense": {
		basePrice: 4e9,
		priceMult: 1.1,
		benefitMult: 0.001,
		multName: "dreameSenseMult"
	},

	"Wilson Analytics": {
		basePrice: 4e9,
		priceMult: 1.5,
		benefitMult: 0.005,
		multName: "advertisingMult"
	},

	"Nuoptimal Nootropic Injector Implants": {
		basePrice: 1e9,
		priceMult: 1.06,
		benefitMult: 0.1,
		multName: "employeeCreMult"
	},

	"Speech Processor Implants": {
		basePrice: 1e9,
		priceMult: 1.06,
		benefitMult: 0.1,
		multName: "employeeChaMult"
	},

	"Neural Accelerators": {
		basePrice: 1e9,
		priceMult: 1.06,
		benefitMult: 0.1,
		multName: "employeeIntMult"
	},

	"FocusWires": {
		basePrice: 1e9,
		priceMult: 1.06,
		benefitMult: 0.1,
		multName: "employeeEffMult"
	},

	"ABC SalesBots": {
		basePrice: 1e9,
		priceMult: 1.07,
		benefitMult: 0.01,
		multName: "salesMult"
	},

	"Project Insight": {
		basePrice: 5e9,
		priceMult: 1.07,
		benefitMult: 0.05,
		multName: "sciMult"
	},
};

export const getDivisionMultipliers = requireOfficeApi(function (ns, divisionName) {
	const mults = {
		employeeCreMult: 1,
		employeeChaMult: 1,
		employeeEffMult: 1,
		employeeIntMult: 1,
		productionMult: 1,
		productProductionMult: 1,
		storageMult: 1,
		sciResearchMult: 1,
	}
	const validKeys = Object.keys(mults)
	for (const r of researches) {
		if (ns.corporation.hasResearched(divisionName, r.name)) {
			Object.keys(r).filter(k => validKeys.includes(k)).forEach(k => {
				mults[k] *= r[k]
			})
		}
	}
	return mults
})

export const getCorporationMultipliers = function (ns) {
	const mults = {}
	for (const [upgrade, info] of Object.entries(corpUpgrades)) {
		const level = ns.corporation.getUpgradeLevel(upgrade)
		mults[info.multName] = ((info.multName == "dreameSenseMult") ? 0 : 1) + level * info.benefitMult
	}
	return mults
}

function calculateEmployeeProductivity(ns, divisionName, cityName, employeeName, divisionMults, corpMults) {
	const employee = ns.corporation.getEmployee(divisionName, cityName, employeeName)
	const effCre = employee.cre * corpMults.employeeCreMult * divisionMults.employeeCreMult,
		effCha = employee.cha * corpMults.employeeChaMult * divisionMults.employeeChaMult,
		effInt = employee.int * corpMults.employeeIntMult * divisionMults.employeeIntMult,
		effEff = employee.eff * corpMults.employeeEffMult * divisionMults.employeeEffMult;
	const prodBase = employee.mor * employee.hap * employee.ene * 1e-6;
	let prodMult = 0;
	switch (employee.pos) {
		case "Operations":
			prodMult = 0.6 * effInt + 0.1 * effCha + employee.exp + 0.5 * effCre + effEff;
			break;
		case "Engineer":
			prodMult = effInt + 0.1 * effCha + 1.5 * employee.exp + effEff;
			break;
		case "Business":
			prodMult = 0.4 * effInt + effCha + 0.5 * employee.exp;
			break;
		case "Management":
			prodMult = 2 * effCha + employee.exp + 0.2 * effCre + 0.7 * effEff;
			break;
		case "RandD":
		case "Research & Development":
			prodMult = 1.5 * effInt + 0.8 * employee.exp + effCre + 0.5 * effEff;
			break;
		case "Unassigned":
		case "Training":
			prodMult = 0;
			break;
		default:
			ns.toast(`Invalid employee position: ${employee.pos}`, "error", 600000);
			break;
	}
	return prodBase * prodMult;
}

function getEmployeeProds(ns, divisionName, city, divMults, corpMults) {
	let total = 0;
	const office = ns.corporation.getOffice(divisionName, city)
	const employeeProd = {}
	ns.print(office)
	for (const i in office.employees) {
		const employeeName = office.employees[i]
		const position = office.employeeProd[i]
		const prod = calculateEmployeeProductivity(ns, divisionName, city, employeeName, divMults, corpMults);
		employeeProd[position] += prod;
		total += prod;
	}
	employeeProd.total = total;
	// ns.print(employeeProd)
	return employeeProd
}

const getOfficeProductivity = requireOfficeApi(function (ns, divisionName, city, isProduct, divMults, corpMults) {
	const prods = ns.corporation.getOffice(divisionName, city).employeeProd
	const opProd = prods["Operations"];
	const engrProd = prods["Engineer"];
	const mgmtProd = prods["Management"];
	const total = opProd + engrProd + mgmtProd;

	if (total <= 0) return 0;

	// Management is a multiplier for the production from Operations and Engineers
	const mgmtFactor = 1 + mgmtProd / (1.2 * total);

	// For production, Operations is slightly more important than engineering
	// Both Engineering and Operations have diminishing returns
	const prod = (Math.pow(opProd, 0.4) + Math.pow(engrProd, 0.3)) * mgmtFactor;

	// Generic multiplier for the production. Used for game-balancing purposes
	const balancingMult = 0.05;

	if (isProduct) {
		// Products are harder to create and therefore have less production
		return 0.5 * balancingMult * prod;
	} else {
		return balancingMult * prod;
	}
})


// This is 100% accurate when called at PRODUCTION state
export function getTrueProdMult(ns, divisionName, city, isProduct) {
	const hasOfficeApi = tryUnlockOfficeApi(ns)
	const corpMults = getCorporationMultipliers(ns)
	const divMults = hasOfficeApi ? getDivisionMultipliers(ns, divisionName) : null

	const materialMult = ns.corporation.getDivision(divisionName).prodMult
	const officeMult = hasOfficeApi ? getOfficeProductivity(ns, divisionName, city, isProduct, divMults, corpMults) : 0.7
	const corpMult = corpMults.productionMult
	const divResearchMult = hasOfficeApi ? divMults.productionMult : 1
	const divProductMult = hasOfficeApi ? (isProduct ? divMults.productProductionMult : 1) : 1

	// ns.print("mat mult = " + materialMult)
	// ns.print("office mult = " + officeMult)
	// ns.print("div prod mult = " + divResearchMult)

	const trueMult = materialMult * officeMult * corpMult * divResearchMult * divProductMult * (isProduct ? 0.5 : 1)
	if (!isProduct) {
		ns.print("true mult for " + divisionName + " in " + city + " is " + trueMult)
	}
	return trueMult
}

export function getCycleMaxWarehouseUsage(ns, division, city) {
	const industry = industries[division.type]
	const normalMult = getTrueProdMult(ns, division.name, city, false)
	const productMult = getTrueProdMult(ns, division.name, city, true)
	const productNum = division.products.length
	const productSize = Object.entries(industry.reqMats).map(e => e[1] * materialSize[e[0]]).reduce((a, b) => a + b, 0)

	const rawCycleUsage = Object.entries(industry.reqMats).map(e => e[1] * materialSize[e[0]]).reduce((a, b) => a + b, 0) * (productNum * productMult * 2 + normalMult)
	const processCycleUsage = industry.prodMats.map(mat => materialSize[mat] * normalMult).reduce((a, b) => a + b, 0) + productMult * productSize * productNum * 2
	ns.print("raw Cycle = " + rawCycleUsage)
	ns.print("product Cycle = " + processCycleUsage)
	return Math.max(rawCycleUsage, processCycleUsage) * CYCLE_INTERVAL
}

function calculateBestBoosterConfig(ns, division, city) {
	const allFactors = ['aiFac', 'robFac', 'hwFac', 'reFac']
	const industry = industries[division.type]

	const wareHouse = ns.corporation.getWarehouse(division.name, city)
	const size = wareHouse.size
	const reserveSpace = Math.max(10, size * 0.01) + getCycleMaxWarehouseUsage(ns, division, city)
	const availableSize = Math.max(size - reserveSpace, 0)
	if (availableSize <= 0) {
		ns.toast("Should increase the warehouse storage for " + division.name + " in " + city, 'error', 20000)
		return Object.fromEntries(allFactors.map(f => [facToMaterial[f], 0]))
	}
	let usedFactors = [...allFactors]
	let allPositive
	let facQuantities

	do {
		// we calculate aiFac first, since aiFac is non-zero for all industries
		const thisFactor = usedFactors[0]
		const otherFactors = usedFactors.slice(1)
		const thisMult = industry[thisFactor]
		const thisWeight = materialSize[facToMaterial[thisFactor]]

		const otherMults = {}
		const otherWeights = {}
		for (const otherFac of otherFactors) {
			otherMults[otherFac] = industry[otherFac]
			otherWeights[otherFac] = materialSize[facToMaterial[otherFac]]
		}
		const multRatios = otherFactors.map(fac => otherMults[fac] / thisMult)

		// products of all materials: (0.002 * qty + 1) ^ N should be maximized
		// based on constraints:
		// 1. sum of all material qty * weight = allocated space
		// 2. all material qty > 0
		// since 2 is too complicated to consider with multi variable, we use constraint 1 only, and trim negative parts later..

		// Use lagrange multiplier method: (omitting N steps...)
		// we have Qi = (500 + Qa)*(Ni/Na) - 500
		function getQ(thisQ, thisN, otherN, thisW, otherW) {
			return (500 + thisQ) * (otherN / thisN) * (thisW / otherW) - 500
		}

		facQuantities = {}

		const thisQuantity = (availableSize - otherFactors.map(fac => 500 * (thisWeight * otherMults[fac] / thisMult - materialSize[facToMaterial[fac]])).reduce((a, b) => a + b, 0)) / (1 + multRatios.reduce((a, b) => a + b, 0)) / thisWeight
		facQuantities[thisFactor] = thisQuantity

		otherFactors.forEach(fac => { facQuantities[fac] = getQ(thisQuantity, thisMult, otherMults[fac], thisWeight, otherWeights[fac]) })
		// ns.print("division = " + division.name + ", city = " + city)
		// ns.print("available weight = " + availableSize)
		ns.print(facQuantities)

		const newTotalSize = Object.entries(facQuantities).map(e => materialSize[facToMaterial[e[0]]] * e[1]).reduce((a, b) => a + b, 0)
		if (availableSize < newTotalSize * 0.99 || availableSize > newTotalSize * 1.01) {
			ns.print("ERROR: Formula must be incorrect. Wanted size = " + availableSize + ", but actual calculated size = " + newTotalSize)
			return null
		}

		const negatives = Object.entries(facQuantities).filter(e => e[1] < 0)
		allPositive = negatives.length == 0
		if (!allPositive) {
			for (const [fac, unused] of negatives) {
				usedFactors.splice(usedFactors.indexOf(fac), 1)
			}
			ns.print("Recalculate ratios using [" + usedFactors + "] only.")
		} else {
			ns.print("available space for " + division.name + " in " + city + " is " + availableSize + "/" + size)
		}
	} while (!allPositive)

	const materialQuantities = {}
	for (const fac of allFactors) {
		if (facQuantities[fac]) {
			materialQuantities[facToMaterial[fac]] = facQuantities[fac]
		} else {
			materialQuantities[facToMaterial[fac]] = 0
		}
	}
	return materialQuantities
}

function trySetMarketTa(ns, divisionName, city, productName, isProduct) {
	if (!tryUnlockOfficeApi(ns)) {
		return false
	}
	if (!tryUnlockWarehouseApi(ns)) {
		return false
	}
	if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
		if (isProduct) {
			ns.corporation.setProductMarketTA2(divisionName, productName, true)
		} else {
			ns.corporation.setMaterialMarketTA2(divisionName, city, productName, true)
		}
		return true
	} else if (ns.corporation.hasResearched(divisionName, "Market-TA.I")) {
		if (isProduct) {
			ns.corporation.setProductMarketTA1(divisionName, productName, true)
		} else {
			ns.corporation.setMaterialMarketTA1(divisionName, city, productName, true)
		}
		return true
	}
	return false
}

async function adjustWarehouseBooster(ns, division, approximationSpeed = 0.2) {
	const industry = industries[division.type]
	const underBonusTime = ns.corporation.getBonusTime() > 1000

	for (const city of division.cities) {
		if (!ns.corporation.hasWarehouse(division.name, city)) {
			ns.corporation.purchaseWarehouse(division.name, city)
			if (!ns.corporation.hasWarehouse(division.name, city)) {
				continue
			}
		}
		const normalMult = getTrueProdMult(ns, division.name, city, false)
		const productMult = getTrueProdMult(ns, division.name, city, true)
		const bestQuantities = calculateBestBoosterConfig(ns, division, city)
		const materialQuantities = Object.fromEntries(Object.entries(bestQuantities).map(e => {
			const mat = e[0]
			const qty = e[1]
			const curQty = ns.corporation.getMaterial(division.name, city, mat).qty
			const adjustedQty = (qty - curQty) * approximationSpeed + curQty
			return [mat, adjustedQty]
		}))

		const canEnableSmartSupply = ns.corporation.hasUnlockUpgrade("Smart Supply")
		let needChange = true
		if (canEnableSmartSupply) {
			for (const material of Object.keys(materialQuantities)) {
				if (Object.keys(industry.reqMats).includes(material)) {
					ns.corporation.setSmartSupplyUseLeftovers(division.name, city, material, false)
				}
			}
		}
		let anythingChanged = false
		let fullSize = false
		let lastState = null
		let startTime = new Date().getTime()
		while (needChange && new Date().getTime() - startTime < 60000) {
			const currentState = ns.corporation.getCorporation().state
			if (currentState == 'START') {
				if (canEnableSmartSupply) {
					ns.corporation.setSmartSupply(division.name, city, false)
					// Temporarily stops purchasing new materials for production.
					for (const reqMat of Object.keys(industry.reqMats)) {
						ns.corporation.buyMaterial(division.name, city, reqMat, 0)
					}
				}
				const currentInfo = ns.corporation.getWarehouse(division.name, city)
				if (currentInfo.size * 0.99999 <= currentInfo.sizeUsed) {
					fullSize = true
				}
				needChange = false
				ns.print("adjusting " + division.name + " in " + city)
				for (const [material, qty] of Object.entries(materialQuantities)) {
					let buyDiff
					const matInfo = ns.corporation.getMaterial(division.name, city, material)
					buyDiff = Math.floor(qty) - Math.floor(matInfo.qty)
					if (buyDiff > 0) {
						if (fullSize) {
							const msg = "Unable to buy more " + buyDiff + " " + material + ", full warehouse for " + division.name + " in " + city
							ns.print(msg)
							if (lastState != currentState) {
								ns.toast(msg, 'error', 10000)
							}
							continue;
						}
						anythingChanged = true
						needChange = true
						ns.corporation.sellMaterial(division.name, city, material, "", "")
						ns.corporation.buyMaterial(division.name, city, material, buyDiff / CYCLE_INTERVAL)
						const msg = "Purchasing " + buyDiff + " " + material + " for " + division.name + " in " + city
						if (lastState != currentState) {
							ns.toast(msg, 'info', 10000)
						}
						ns.print(msg)
					} else if (buyDiff < 0) {
						anythingChanged = true
						needChange = true
						ns.corporation.buyMaterial(division.name, city, material, 0)
						const price = industry.prodMats.includes(material) ? "MP" : "0"
						ns.corporation.sellMaterial(division.name, city, material, -buyDiff / CYCLE_INTERVAL, price)
						const msg = "Selling " + (-buyDiff) + " " + material + " at $" + price + " for " + division.name + " in " + city
						if (lastState != currentState) {
							ns.toast(msg, 'info', 10000)
						}
						ns.print(msg)
					} else {
						ns.corporation.buyMaterial(division.name, city, material, 0)
						ns.corporation.sellMaterial(division.name, city, material, "", "")
						ns.print("Keep " + material + " unchanged")
					}
				}
			}
			if (needChange) {
				await ns.sleep(underBonusTime ? 90 : 900)
			}
			lastState = currentState
		}
		if (needChange) {
			ns.toast("Max duration has passed but " + division.name + " in " + city + " still needs change", 'error', 20000)
		}
		if (anythingChanged) {
			ns.toast("Successfully adjusted " + division.name + "'s warehouse at " + city, 'success', 10000)
		} else {
			ns.print("No need to change " + division.name + " in " + city)
		}
		// reset back to normal sell/buy
		for (const material of Object.keys(materialQuantities)) {
			ns.corporation.buyMaterial(division.name, city, material, 0)
			if (Object.keys(industry.reqMats).includes(material)) {
				ns.print("required mat includes " + material + ", no need to set sell.")
				ns.corporation.sellMaterial(division.name, city, material, "", "")
			} else if (industry.prodMats.includes(material)) {
				ns.corporation.sellMaterial(division.name, city, material, "PROD", "MP")
				trySetMarketTa(ns, division.name, city, material, false)
			} else {
				ns.corporation.sellMaterial(division.name, city, material, "", "")
			}
		}
		// re-configure purchasing raw materials
		if (canEnableSmartSupply) {
			ns.corporation.setSmartSupply(division.name, city, true)
		} else {
			// manually configure the raw material supply
			for (const [mat, qty] of Object.entries(industry.reqMats)) {
				const surplus = ns.corporation.getMaterial(division.name, city, mat).qty - (materialQuantities[mat] || 0)
				const maxBuyRate = qty * (normalMult + division.products.length * productMult)
				const allowableSurplus = maxBuyRate * 40

				const adjustedRate = surplus > allowableSurplus ? 0 : surplus <= 0 ? maxBuyRate : (allowableSurplus - surplus) / allowableSurplus * maxBuyRate
				ns.print("Set to purchase " + mat + " at " + adjustedRate + "/s (surplus = " + surplus + ")")
				ns.corporation.buyMaterial(division.name, city, mat, adjustedRate)
			}
		}
		// re-configure selling products
		for (const product of industry.prodMats) {
			if (!Object.keys(materialQuantities).includes(product)) {
				ns.corporation.sellMaterial(division.name, city, product, "MAX", "MP")
				trySetMarketTa(ns, division.name, city, product, false)
			}
		}
		if (industry.makesProducts) {
			for (const product of division.products) {
				ns.corporation.sellProduct(division.name, city, product, "MAX", "MP", true)
				trySetMarketTa(ns, division.name, city, product, true)
			}
		}
	}
}

async function adjustAllWarehouseBooster(ns) {
	const corpInfo = ns.corporation.getCorporation()
	for (const division of corpInfo.divisions) {
		await adjustWarehouseBooster(ns, division)
	}
}


function expandCityForDiv(ns, division) {
	for (const newCity of cities) {
		if (!division.cities.includes(newCity) && ns.corporation.getCorporation().funds > 4e9) {
			ns.corporation.expandCity(division.name, newCity)
			if (tryUnlockWarehouseApi(ns)) {
				ns.corporation.purchaseWarehouse(division.name, newCity)
			}
		}
	}
}

function expandCities(ns) {
	const corpInfo = ns.corporation.getCorporation()
	for (const division of corpInfo.divisions) {
		expandCityForDiv(ns, division)
	}
}

const expandDivisionOrder = [ "Agriculture","Software", "Food", "RealEstate", "Robotics", "Computer"]
function expandDivision(ns) {
	const corpInfo = ns.corporation.getCorporation()
	let nextDiv = null
	for (const testDiv of expandDivisionOrder) {
		if (!corpInfo.divisions.some(div => div.type == testDiv)) {
			nextDiv = testDiv
			break
		}
	}
	if (nextDiv == null) {
		return false
	}
	const baseCost = ns.corporation.getExpandIndustryCost(nextDiv)
	if (corpInfo.funds < baseCost) {
		return false
	}
	const shouldExpand = corpInfo.divisions.length == 0 ?
		true :
		corpInfo.funds >= baseCost + 9e9 * 5

	if (shouldExpand) {
		ns.print("Should expand industry to " + nextDiv)
		ns.corporation.expandIndustry(nextDiv, nextDiv)
		return true
	}
}

// returns true if already purchased
function tryUnlockUpgrade(ns, upgradeName) {
	if (!ns.corporation.hasUnlockUpgrade(upgradeName) && ns.corporation.getCorporation().funds >= ns.corporation.getUnlockUpgradeCost(upgradeName)) {
		ns.corporation.unlockUpgrade(upgradeName)
	}
	return ns.corporation.hasUnlockUpgrade(upgradeName)
}

function requireWarehouseApi(f) {
	return function (...args) {
		const ns = args[0]
		if (!tryUnlockWarehouseApi(ns)) {
			ns.print("Unable to execute " + f.name + " since corporation haven't unlocked Warehouse API")
			return
		}
		return f(...args)
	}
}

function requireOfficeApi(f) {
	return function (...args) {
		const ns = args[0]
		if (!tryUnlockOfficeApi(ns)) {
			ns.print("Unable to execute " + f.name + " since corporation haven't unlocked Office API")
			return
		}
		return f(...args)
	}
}

function tryUnlockOfficeApi(ns) {
	return tryUnlockUpgrade(ns, "Office API")
}

function tryUnlockWarehouseApi(ns) {
	return tryUnlockUpgrade(ns, "Warehouse API")
}

const sellEverything = requireWarehouseApi(function (ns) {
	for (const division of ns.corporation.getCorporation().divisions) {
		for (const city of division.cities) {
			if (ns.corporation.hasWarehouse(division.name, city)) {
				for (const material of materials) {
					if (ns.corporation.getMaterial(division.name, city, material).qty > 0) {
						ns.corporation.sellMaterial(division.name, city, material, "MAX", "MP")
					}
				}
			}
		}
	}
})

// Idea of finding best option to invest: 
// There are following categories to invest money:
// 1. upgrade warehouse size
// 2. upgrade office size
// 3. unlock ability
// 4. upgrade corp upgrades
// 5. expand city
// 6. expand division

// among them:
// 3, 5, 6 are hard to quantify
// so we use a naive method: If profit/sec * 10min > cost, stop any other upgrades and wait until we can invest it.

// 1, 2, 4 can be quantified to profit/sec increase
// therefore, we can alway pick the option with maximum ROI

class InvestmentOption {
	constructor(investmentName, investCostFunc, investFunc, investProfitFunc) {
		this.investmentName = investmentName
		this.investCostFunc = investCostFunc
		this.investFunc = investFunc
		this.investProfitFunc = investProfitFunc
	}

	investCost(ns) {
		return this.investCostFunc(ns)
	}

	investProfit(ns) {
		return this.investProfitFunc(ns)
	}

	invest(ns) {
		return this.investFunc(ns)
	}
}

function getInvestmentOptions(ns) {
	const options = []
	// TODO
	return options
}

function getUnknownProfitInvestmentOptions(ns) {
	const options = []
	const corp = ns.corporation.getCorporation()
	// TODO: should eventually move them to known profit options
	for (const u of Object.keys(corpUpgrades)) {
		options.push(new InvestmentOption(
			u,
			ns => ns.corporation.getUpgradeLevelCost(u),
			ns => ns.corporation.levelUpgrade(u),
		))
	}
	if (tryUnlockWarehouseApi(ns)) {
		for (const division of corp.divisions) {
			for (const city of division.cities) {
				if (ns.corporation.hasWarehouse(division.name, city)) {
					options.push(new InvestmentOption(
						"upgrade warehouse for " + division.name + " in " + city,
						ns => ns.corporation.getUpgradeWarehouseCost(division.name, city),
						ns => ns.corporation.upgradeWarehouse(division.name, city)
					))
				}
			}
		}
	}
	return options
}

async function hireAll(ns) {
	if (!tryUnlockOfficeApi(ns)) {
		return
	}
	const corpInfo = ns.corporation.getCorporation()
	for (const division of corpInfo.divisions) {
		const divisionName = division.name
		for (const city of division.cities) {
			let newHireNum = 0
			while (ns.corporation.hireEmployee(divisionName, city)) {
				newHireNum += 1
			}
			if (newHireNum != 0) {
				ns.toast("Hired " + newHireNum + " employee for " + divisionName + " in " + city, 'success', 5000)
			}
			const office = ns.corporation.getOffice(divisionName, city)
			const jobNums = {}
			for (const employeeName of office.employees) {
				const curJob = ns.corporation.getEmployee(divisionName, city, employeeName).pos
				if (jobNums[curJob]) {
					jobNums[curJob] += 1
				} else {
					jobNums[curJob] = 1
				}
			}
			for (const employeeName of office.employees) {
				const curJob = ns.corporation.getEmployee(divisionName, city, employeeName).pos
				if (curJob == "Unassigned") {
					let nextJob = "Research & Development"
					if (!jobNums["Operations"]) {
						nextJob = "Operations"
					} else if (!jobNums["Engineer"]) {
						nextJob = "Engineer"
					} else if (!jobNums["Management"]) {
						nextJob = "Management"
					}
					await ns.corporation.assignJob(divisionName, city, employeeName, nextJob)

					if (jobNums[nextJob]) {
						jobNums[nextJob] += 1
					} else {
						jobNums[nextJob] = 1
					}
				}
			}
		}
	}
}

export async function investMoney(ns) {
	const preferredInvestAllowableTime = 5 * 60 // 5min


	let shouldContinue = true
	while (shouldContinue) {

		let corp = ns.corporation.getCorporation()
		const preferredMaxMoneyToInvest = (corp.revenue - corp.expenses) * preferredInvestAllowableTime
		const unknownProfitOptions = getUnknownProfitInvestmentOptions(ns)
		const investments = []
		for (const option of unknownProfitOptions) {
			const investCost = option.investCost(ns)
			if (investCost < preferredMaxMoneyToInvest) {
				if (investCost < corp.funds) {
					investments.push(option.investmentName)
					option.invest(ns)
					corp = ns.corporation.getCorporation()
				} else {
					ns.toast("Stop investing and save money to invest in " + option.investmentName)
					shouldContinue = false
					break
				}
			}
		}

		const knownProfitOptions = getInvestmentOptions(ns)
		const bestOptionTup = knownProfitOptions.
			map(op => { return { profit: op.investProfit(ns), cost: op.investCost(ns), option: op } }).
			filter(tup => tup.cost < corp.funds || tup.cost < preferredMaxMoneyToInvest).
			reduce((a, b) => a == null || a.profit / a.cost < b.profit / b.cost ? b : a, null)
		if (bestOptionTup) {
			const bestOption = bestOptionTup.option
			if (bestOptionTup.cost < corp.funds) {
				investments.push(bestOption.investmentName)
			} else {
				ns.toast("Stop investing and save money to invest in " + bestOption.investmentName)
				shouldContinue = false
			}
			bestOption.invest(ns)
		} else {
			ns.toast("Find nothing to invest")
		}
		shouldContinue = shouldContinue && investments.length > 0

		ns.toast("Corporation: invest in [" + investments + "]", 'success', 10000)
		await ns.sleep(1000)
	}
}

const researchBuyOrder = [
	"Hi-Tech R&D Laboratory",
	"Market-TA.I",
	"Market-TA.II",
	"uPgrade: Fulcrum",
	"uPgrade: Capacity.I",
	"uPgrade: Capacity.II",
	"Drones",
	"Drones - Assembly",
	"Drones - Transport",
	"Overclock",
	"Self-Correcting Assemblers",
	"Automatic Drug Administration",
	"Go-Juice",
	"CPH4 Injections",
	"Sti.mu",
	"JoyWire",
	"AutoBrew",
	"AutoPartyManager",
]

export function buyResearches(ns) {
	if (!tryUnlockOfficeApi(ns)) {
		return
	}
	let corp = ns.corporation.getCorporation()
	for (const division of corp.divisions) {
		for (const r of researchBuyOrder) {
			let cost = null
			try {
				cost = ns.corporation.getResearchCost(division.name, r)
			} catch (e) {
				ns.print("Unable to research " + r)
				ns.print(e)
				continue
			}
			if (!ns.corporation.hasResearched(division.name, r)) {
				if (division.research >= cost) {
					ns.toast("Research " + r + " for division " + division.name, 'success', 20000)
					ns.corporation.research(division.name, r)
				}
				break
			}
		}
	}
}

export function makeProducts(ns, investMoneyRatio = 0.2) {
	const corp = ns.corporation.getCorporation()
	if (!tryUnlockWarehouseApi(ns)) {
		return
	}
	const unlockedOfficeApi = tryUnlockOfficeApi(ns)
	for (const division of corp.divisions) {
		const industry = industries[division.name]
		if (!industry.makesProducts) {
			continue
		}
		let curProductNum = division.products.length
		let expectProductNum = 3
		if (unlockedOfficeApi) {
			expectProductNum += ns.corporation.hasResearched(division.name, "uPgrade: Capacity.I") ? 1 : 0
			expectProductNum += ns.corporation.hasResearched(division.name, "uPgrade: Capacity.II") ? 1 : 0
		}

		while (expectProductNum > curProductNum) {
			const money = ns.corporation.getCorporation().funds * investMoneyRatio
			const productName = division.name + "-" + Math.round(money / 1000) + "e3"
			ns.print("Developing new product for " + division.name + " in " + division.cities[0] + " and naming it as " + productName)

			ns.corporation.makeProduct(division.name, division.cities[0], productName, money / 2, money / 2)
			curProductNum += 1
		}
	}
}

export function spendCorpMoney(ns){
	expandCities(ns)
	await investMoney(ns)
}


export async function main(ns) {
	const player = ns.getPlayer()
	if (!player.hasCorporation) {
		ns.corporation.createCorporation("SeanCorp", player.bitNodeN != 3)
		return;
	}
	expandDivision(ns)
	tryUnlockWarehouseApi(ns)
	tryUnlockOfficeApi(ns)
	buyResearches(ns)
	makeProducts(ns)
	await hireAll(ns)

	const offer = ns.corporation.getInvestmentOffer()
	// if (offer) {
	// 	sellEverything(ns)
	// 	ns.print(offer)
	// } else {
	await adjustAllWarehouseBooster(ns)
	// }
}