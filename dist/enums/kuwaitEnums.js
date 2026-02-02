"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernorateCities = exports.KuwaitCity = exports.KuwaitGovernorate = void 0;
/**
 * Kuwait Governorates Enum
 * Kuwait is divided into 6 governorates
 */
var KuwaitGovernorate;
(function (KuwaitGovernorate) {
    KuwaitGovernorate["AlAsimah"] = "Al Asimah";
    KuwaitGovernorate["Hawalli"] = "Hawalli";
    KuwaitGovernorate["Farwaniya"] = "Farwaniya";
    KuwaitGovernorate["Ahmadi"] = "Ahmadi";
    KuwaitGovernorate["Jahra"] = "Jahra";
    KuwaitGovernorate["MubarakAlKabeer"] = "Mubarak Al-Kabeer";
})(KuwaitGovernorate || (exports.KuwaitGovernorate = KuwaitGovernorate = {}));
/**
 * Kuwait Cities/Areas Enum
 * Major cities and areas within Kuwait governorates
 */
var KuwaitCity;
(function (KuwaitCity) {
    // Al Asimah Governorate
    KuwaitCity["KuwaitCity"] = "Kuwait City";
    KuwaitCity["Sharq"] = "Sharq";
    KuwaitCity["Dasma"] = "Dasma";
    KuwaitCity["Salmiya"] = "Salmiya";
    KuwaitCity["BneidAlQar"] = "Bneid Al-Qar";
    KuwaitCity["Kaifan"] = "Kaifan";
    KuwaitCity["Khaldiya"] = "Khaldiya";
    KuwaitCity["Mansouriya"] = "Mansouriya";
    KuwaitCity["Rawda"] = "Rawda";
    KuwaitCity["Surra"] = "Surra";
    KuwaitCity["Yarmouk"] = "Yarmouk";
    // Hawalli Governorate
    KuwaitCity["Hawalli"] = "Hawalli";
    KuwaitCity["Salwa"] = "Salwa";
    KuwaitCity["Bayraq"] = "Bayraq";
    KuwaitCity["Jabriya"] = "Jabriya";
    KuwaitCity["Mishref"] = "Mishref";
    KuwaitCity["Rumaithiya"] = "Rumaithiya";
    KuwaitCity["Zahra"] = "Zahra";
    // Farwaniya Governorate
    KuwaitCity["Farwaniya"] = "Farwaniya";
    KuwaitCity["AbraqKheetan"] = "Abraq Kheetan";
    KuwaitCity["Ardiya"] = "Ardiya";
    KuwaitCity["JleebAlShuyoukh"] = "Jleeb Al-Shuyoukh";
    KuwaitCity["Khaitan"] = "Khaitan";
    KuwaitCity["Omariya"] = "Omariya";
    KuwaitCity["Rai"] = "Rai";
    KuwaitCity["Rehab"] = "Rehab";
    KuwaitCity["SabahAlNasser"] = "Sabah Al-Nasser";
    // Ahmadi Governorate
    KuwaitCity["Ahmadi"] = "Ahmadi";
    KuwaitCity["Fahaheel"] = "Fahaheel";
    KuwaitCity["Mahboula"] = "Mahboula";
    KuwaitCity["Mangaf"] = "Mangaf";
    KuwaitCity["Wafra"] = "Wafra";
    KuwaitCity["Zour"] = "Zour";
    // Jahra Governorate
    KuwaitCity["Jahra"] = "Jahra";
    KuwaitCity["Abdali"] = "Abdali";
    KuwaitCity["Kabd"] = "Kabd";
    KuwaitCity["SaadAlAbdullah"] = "Saad Al-Abdullah";
    KuwaitCity["Sulaibiya"] = "Sulaibiya";
    KuwaitCity["Taima"] = "Taima";
    // Mubarak Al-Kabeer Governorate
    KuwaitCity["MubarakAlKabeer"] = "Mubarak Al-Kabeer";
    KuwaitCity["AbuAlHasaniya"] = "Abu Al-Hasaniya";
    KuwaitCity["Adan"] = "Adan";
    KuwaitCity["Fnaitees"] = "Fnaitees";
    KuwaitCity["Messila"] = "Messila";
    KuwaitCity["Qurain"] = "Qurain";
    KuwaitCity["SabahAlAhmad"] = "Sabah Al-Ahmad";
})(KuwaitCity || (exports.KuwaitCity = KuwaitCity = {}));
/**
 * Mapping of Governorates to their Cities
 * This allows filtering cities by governorate
 */
exports.GovernorateCities = {
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
