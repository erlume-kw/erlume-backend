import { Request, Response } from "express";
import { OrderStatus } from "../enums/orderEnums";
import { ItemStatus } from "../enums/statusEnums";
import { UserRole } from "../enums/userEnums";
import { DropStatus } from "../enums/dropEnums";
import { ItemCondition } from "../enums/itemEnums";
import { Stars } from "../enums/reviewEnums";
import {
	KuwaitGovernorate,
	KuwaitCity,
	GovernorateCities,
} from "../enums/kuwaitEnums";
import { TransactionStatus } from "../enums/transactionEnums";
import { PaymentMethod } from "../enums/paymentEnums";
import { ExpenseType } from "../enums/expenseEnums";
import { BagBrand } from "../enums/bagBrandEnums";
import {
	AuthenticationStatus,
	ReturnStatus,
	DeliveryStatus,
	EscalationStatus,
} from "../enums/flowEnums";
import { SellerOnboardingStatus, ItemsOnboardingStatus } from "../enums/sellerEnums";

/**
 * Get all enums used in the system
 * Useful for frontend/Retool to dynamically populate dropdowns
 */
const getEnums = async (req: Request, res: Response) => {
	try {
		const enums = {
			orderStatus: {
				values: Object.values(OrderStatus),
				options: Object.entries(OrderStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			itemStatus: {
				values: Object.values(ItemStatus),
				options: Object.entries(ItemStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			userRole: {
				values: Object.values(UserRole),
				options: Object.entries(UserRole).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			dropStatus: {
				values: Object.values(DropStatus),
				options: Object.entries(DropStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			itemCondition: {
				values: Object.values(ItemCondition),
				options: Object.entries(ItemCondition).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			reviewStars: {
				values: Object.values(Stars).filter(
					(v) => typeof v === "number",
				) as number[],
				options: [1, 2, 3, 4, 5].map((value) => ({
					label: `${value} Star${value > 1 ? "s" : ""}`,
					value: value,
				})),
			},
			kuwaitGovernorate: {
				values: Object.values(KuwaitGovernorate),
				options: Object.entries(KuwaitGovernorate).map(([key, value]) => ({
					label: value,
					value: value,
				})),
			},
			kuwaitCity: {
				values: Object.values(KuwaitCity),
				options: Object.entries(KuwaitCity).map(([key, value]) => ({
					label: value,
					value: value,
				})),
			},
			kuwaitGovernorateCities: Object.entries(GovernorateCities).reduce(
				(acc, [governorate, cities]) => {
					acc[governorate] = {
						governorate: governorate,
						cities: cities.map((city) => ({
							label: city,
							value: city,
						})),
						cityValues: cities,
					};
					return acc;
				},
				{} as Record<string, any>,
			),
			transactionStatus: {
				values: Object.values(TransactionStatus),
				options: Object.entries(TransactionStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			paymentMethod: {
				values: Object.values(PaymentMethod),
				options: Object.entries(PaymentMethod).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			expenseType: {
				values: Object.values(ExpenseType),
				options: Object.entries(ExpenseType).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			authenticationStatus: {
				values: Object.values(AuthenticationStatus),
				options: Object.entries(AuthenticationStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			returnStatus: {
				values: Object.values(ReturnStatus),
				options: Object.entries(ReturnStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			deliveryStatus: {
				values: Object.values(DeliveryStatus),
				options: Object.entries(DeliveryStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			escalationStatus: {
				values: Object.values(EscalationStatus),
				options: Object.entries(EscalationStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			bagBrand: {
				values: Object.values(BagBrand),
				options: Object.entries(BagBrand).map(([key, value]) => ({
					label: value,
					value: value,
				})),
			},
			sellerOnboardingStatus: {
				values: Object.values(SellerOnboardingStatus),
				options: Object.entries(SellerOnboardingStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
			itemsOnboardingStatus: {
				values: Object.values(ItemsOnboardingStatus),
				options: Object.entries(ItemsOnboardingStatus).map(([key, value]) => ({
					label: key,
					value: value,
				})),
			},
		};

		res.json({
			success: true,
			data: enums,
		});
	} catch (error) {
		console.error("Error fetching enums:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

/**
 * Get specific enum category
 */
const getEnumCategory = async (req: Request, res: Response) => {
	try {
		const { category } = req.params;

		let enumData: any = null;

		switch (category) {
			case "orderStatus":
				enumData = {
					values: Object.values(OrderStatus),
					options: Object.entries(OrderStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "itemStatus":
				enumData = {
					values: Object.values(ItemStatus),
					options: Object.entries(ItemStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "userRole":
				enumData = {
					values: Object.values(UserRole),
					options: Object.entries(UserRole).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "dropStatus":
				enumData = {
					values: Object.values(DropStatus),
					options: Object.entries(DropStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "itemCondition":
				enumData = {
					values: Object.values(ItemCondition),
					options: Object.entries(ItemCondition).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "reviewStars":
				enumData = {
					values: Object.values(Stars).filter(
						(v) => typeof v === "number",
					) as number[],
					options: [1, 2, 3, 4, 5].map((value) => ({
						label: `${value} Star${value > 1 ? "s" : ""}`,
						value: value,
					})),
				};
				break;

			case "kuwaitGovernorate":
				enumData = {
					values: Object.values(KuwaitGovernorate),
					options: Object.entries(KuwaitGovernorate).map(([key, value]) => ({
						label: value,
						value: value,
					})),
				};
				break;

			case "kuwaitCity":
				enumData = {
					values: Object.values(KuwaitCity),
					options: Object.entries(KuwaitCity).map(([key, value]) => ({
						label: value,
						value: value,
					})),
				};
				break;

			case "kuwaitGovernorateCities":
				enumData = Object.entries(GovernorateCities).reduce(
					(acc, [governorate, cities]) => {
						acc[governorate] = {
							governorate: governorate,
							cities: cities.map((city) => ({
								label: city,
								value: city,
							})),
							cityValues: cities,
						};
						return acc;
					},
					{} as Record<string, any>,
				);
				break;

			case "transactionStatus":
				enumData = {
					values: Object.values(TransactionStatus),
					options: Object.entries(TransactionStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "paymentMethod":
				enumData = {
					values: Object.values(PaymentMethod),
					options: Object.entries(PaymentMethod).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;
			case "expenseType":
				enumData = {
					values: Object.values(ExpenseType),
					options: Object.entries(ExpenseType).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "authenticationStatus":
				enumData = {
					values: Object.values(AuthenticationStatus),
					options: Object.entries(AuthenticationStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "returnStatus":
				enumData = {
					values: Object.values(ReturnStatus),
					options: Object.entries(ReturnStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "deliveryStatus":
				enumData = {
					values: Object.values(DeliveryStatus),
					options: Object.entries(DeliveryStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "escalationStatus":
				enumData = {
					values: Object.values(EscalationStatus),
					options: Object.entries(EscalationStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "bagBrand":
				enumData = {
					values: Object.values(BagBrand),
					options: Object.entries(BagBrand).map(([key, value]) => ({
						label: value,
						value: value,
					})),
				};
				break;

			case "sellerOnboardingStatus":
				enumData = {
					values: Object.values(SellerOnboardingStatus),
					options: Object.entries(SellerOnboardingStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			case "itemsOnboardingStatus":
				enumData = {
					values: Object.values(ItemsOnboardingStatus),
					options: Object.entries(ItemsOnboardingStatus).map(([key, value]) => ({
						label: key,
						value: value,
					})),
				};
				break;

			default:
				res.status(404).json({
					success: false,
					error: `Enum category '${category}' not found`,
					availableCategories: [
						"orderStatus",
						"itemStatus",
						"userRole",
						"dropStatus",
						"itemCondition",
						"reviewStars",
						"kuwaitGovernorate",
						"kuwaitCity",
						"kuwaitGovernorateCities",
						"transactionStatus",
						"paymentMethod",
						"expenseType",
						"authenticationStatus",
						"returnStatus",
						"deliveryStatus",
						"escalationStatus",
						"bagBrand",
						"sellerOnboardingStatus",
						"itemsOnboardingStatus",
					],
				});
				return;
		}

		res.json({
			success: true,
			category: category,
			data: enumData,
		});
	} catch (error) {
		console.error("Error fetching enum category:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

export { getEnums, getEnumCategory };
