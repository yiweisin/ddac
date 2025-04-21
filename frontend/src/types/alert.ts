export interface PriceAlert {
  id: number;
  stockId: number;
  stockSymbol: string;
  stockName: string;
  targetPrice: number;
  isAboveTarget: boolean;
  isTriggered: boolean;
  createdAt: string;
}

export interface CreatePriceAlertRequest {
  stockId: number;
  targetPrice: number;
  isAboveTarget: boolean;
}
