from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services import live_state

router = APIRouter()

class AlertRuleModel(BaseModel):
    id: str
    symbol: str
    field: str
    operator: str
    value: float
    enabled: bool = True
    desktop: bool = True
    pushover: bool = True
    triggerOnceUntilReset: bool = False
    cooldownMs: int = 0

@router.get('/alerts/rules')
async def list_rules():
    return {'rules': live_state.load_rules()}

@router.post('/alerts/rules')
async def create_rule(rule: AlertRuleModel):
    rules = live_state.load_rules()
    rules.insert(0, rule.model_dump())
    live_state.save_rules(rules)
    return {'ok': True, 'rule': rule.model_dump()}

@router.put('/alerts/rules/{rule_id}')
async def update_rule(rule_id: str, rule: AlertRuleModel):
    rules = live_state.load_rules()
    updated = False
    for i, existing in enumerate(rules):
        if str(existing.get('id')) == rule_id:
            rules[i] = rule.model_dump()
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail='Rule not found')
    live_state.save_rules(rules)
    return {'ok': True, 'rule': rule.model_dump()}

@router.delete('/alerts/rules/{rule_id}')
async def delete_rule(rule_id: str):
    rules = [r for r in live_state.load_rules() if str(r.get('id')) != rule_id]
    live_state.save_rules(rules)
    return {'ok': True}

@router.get('/alerts/history')
async def get_history():
    return {'events': live_state.alert_history[:100]}
