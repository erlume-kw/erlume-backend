/**
 * Kuwait Governorates Enum
 * Kuwait is divided into 6 governorates
 */
export enum KuwaitGovernorate {
	AlAsimah = "Al Asimah",
	Hawalli = "Hawalli",
	Farwaniya = "Farwaniya",
	Ahmadi = "Ahmadi",
	Jahra = "Jahra",
	MubarakAlKabeer = "Mubarak Al-Kabeer",
}

/**
 * Kuwait Cities/Areas Enum
 * Major cities and areas within Kuwait governorates
 */
export enum KuwaitCity {
	// Al Asimah Governorate
	KuwaitCity = "Kuwait City",
	Sharq = "Sharq",
	Dasma = "Dasma",
	Salmiya = "Salmiya",
	BneidAlQar = "Bneid Al-Qar",
	Kaifan = "Kaifan",
	Khaldiya = "Khaldiya",
	Mansouriya = "Mansouriya",
	Rawda = "Rawda",
	Surra = "Surra",
	Yarmouk = "Yarmouk",

	// Hawalli Governorate
	Hawalli = "Hawalli",
	Salwa = "Salwa",
	Bayraq = "Bayraq",
	Jabriya = "Jabriya",
	Mishref = "Mishref",
	Rumaithiya = "Rumaithiya",
	Zahra = "Zahra",

	// Farwaniya Governorate
	Farwaniya = "Farwaniya",
	AbraqKheetan = "Abraq Kheetan",
	Ardiya = "Ardiya",
	JleebAlShuyoukh = "Jleeb Al-Shuyoukh",
	Khaitan = "Khaitan",
	Omariya = "Omariya",
	Rai = "Rai",
	Rehab = "Rehab",
	SabahAlNasser = "Sabah Al-Nasser",

	// Ahmadi Governorate
	Ahmadi = "Ahmadi",
	Fahaheel = "Fahaheel",
	Mahboula = "Mahboula",
	Mangaf = "Mangaf",
	Wafra = "Wafra",
	Zour = "Zour",

	// Jahra Governorate
	Jahra = "Jahra",
	Abdali = "Abdali",
	Kabd = "Kabd",
	SaadAlAbdullah = "Saad Al-Abdullah",
	Sulaibiya = "Sulaibiya",
	Taima = "Taima",

	// Mubarak Al-Kabeer Governorate
	MubarakAlKabeer = "Mubarak Al-Kabeer",
	AbuAlHasaniya = "Abu Al-Hasaniya",
	Adan = "Adan",
	Fnaitees = "Fnaitees",
	Messila = "Messila",
	Qurain = "Qurain",
	SabahAlAhmad = "Sabah Al-Ahmad",
}

/**
 * Mapping of Governorates to their Cities
 * This allows filtering cities by governorate
 */
export const GovernorateCities: Record<KuwaitGovernorate, KuwaitCity[]> = {
	[KuwaitGovernorate.AlAsimah]: [
		KuwaitCity.KuwaitCity,
		KuwaitCity.Sharq,
		KuwaitCity.Dasma,
		KuwaitCity.Salmiya,
		KuwaitCity.BneidAlQar,
		KuwaitCity.Kaifan,
		KuwaitCity.Khaldiya,
		KuwaitCity.Mansouriya,
		KuwaitCity.Rawda,
		KuwaitCity.Surra,
		KuwaitCity.Yarmouk,
	],
	[KuwaitGovernorate.Hawalli]: [
		KuwaitCity.Hawalli,
		KuwaitCity.Salwa,
		KuwaitCity.Bayraq,
		KuwaitCity.Jabriya,
		KuwaitCity.Mishref,
		KuwaitCity.Rumaithiya,
		KuwaitCity.Zahra,
	],
	[KuwaitGovernorate.Farwaniya]: [
		KuwaitCity.Farwaniya,
		KuwaitCity.AbraqKheetan,
		KuwaitCity.Ardiya,
		KuwaitCity.JleebAlShuyoukh,
		KuwaitCity.Khaitan,
		KuwaitCity.Omariya,
		KuwaitCity.Rai,
		KuwaitCity.Rehab,
		KuwaitCity.SabahAlNasser,
	],
	[KuwaitGovernorate.Ahmadi]: [
		KuwaitCity.Ahmadi,
		KuwaitCity.Fahaheel,
		KuwaitCity.Mahboula,
		KuwaitCity.Mangaf,
		KuwaitCity.Wafra,
		KuwaitCity.Zour,
	],
	[KuwaitGovernorate.Jahra]: [
		KuwaitCity.Jahra,
		KuwaitCity.Abdali,
		KuwaitCity.Kabd,
		KuwaitCity.SaadAlAbdullah,
		KuwaitCity.Sulaibiya,
		KuwaitCity.Taima,
	],
	[KuwaitGovernorate.MubarakAlKabeer]: [
		KuwaitCity.MubarakAlKabeer,
		KuwaitCity.AbuAlHasaniya,
		KuwaitCity.Adan,
		KuwaitCity.Fnaitees,
		KuwaitCity.Messila,
		KuwaitCity.Qurain,
		KuwaitCity.SabahAlAhmad,
	],
};
