from fastapi import APIRouter
from tastytrade import Account
from config import session

router = APIRouter()

@router.get("/balances")
async def get_balances():
    """Simple REST call to get real Net Liquidating Value + cash + buying power"""
    try:
        # Get all accounts for this session
        accounts = await Account.get(session)
        
        result = []
        for acc in accounts:
            # This is the official way to get current balances
            balance = await acc.get_balances(session)
            
            net_liq = float(getattr(balance, 'net_liquidating_value', 0))
            
            result.append({
                "account_number": getattr(acc, 'account_number', 'Unknown'),
                "net_liquidating_value": net_liq,
                "cash": float(getattr(balance, 'cash_balance', 0)),
                "buying_power": float(getattr(balance, 'equity_buying_power', 0)),
                "currency": getattr(balance, 'currency', 'USD')
            })
        
        print(f"✅ /api/balances returned {len(result)} accounts | Real Net Liq = ${result[0]['net_liquidating_value'] if result else 0}")
        return {"balances": result}
    
    except Exception as e:
        print(f"❌ Balances endpoint error: {type(e).__name__} - {e}")
        return {"balances": [], "error": str(e)}