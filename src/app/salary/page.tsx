'use client'

import { useEffect } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { COMPANY_LIST } from '@/lib/companies'

/* ── 만원 단위 ── */
const UNIT = 10000

/* ── 선택(토글) 항목 정의 ── */
interface OptDef { key: string; label: string; icon: string; hint: string; auto?: boolean; targetOnly?: boolean }
const OPT_DEFS: OptDef[] = [
  { key: 'bonus',    label: '성과급·상여',   icon: '📊', hint: '연간 변동 상여 합계' },
  { key: 'welfare',  label: '복지·수당',     icon: '🎁', hint: '식대·교통·통신·복지포인트 등' },
  { key: 'retire',   label: '퇴직급여',      icon: '🏦', hint: '기본급 ÷ 12 자동 적용 · 배지 클릭으로 직접 입력', auto: true },
  { key: 'signing',  label: '사이닝 보너스', icon: '✍️', hint: '입사 시 일회성 지급액', targetOnly: true },
  { key: 'equity',   label: '주식·RSU',     icon: '📈', hint: '스톡옵션·RSU 1년치 환산액 (베스팅 기준)' },
  { key: 'corpcard', label: '법인카드',      icon: '💳', hint: '업무 목적 실사용 혜택 연환산' },
  { key: 'car',      label: '차량 지원',     icon: '🚗', hint: '유류비·리스·주차비 지원액 합계' },
  { key: 'edu',      label: '교육비',        icon: '📚', hint: '자격증·대학원·외부교육 지원액' },
  { key: 'housing',  label: '주거 지원',     icon: '🏠', hint: '사택·월세 보조 연간 지원액' },
  { key: 'etc',      label: '기타',          icon: '➕', hint: '위에 해당하지 않는 기타 보상' },
]
const OPT_KEYS = OPT_DEFS.map(d => d.key)
const OPT_LABEL: Record<string, string> = Object.fromEntries(OPT_DEFS.map(d => [d.key, d.label]))

/* ── CSS: 마운트 시 <head>에 주입, 언마운트 시 제거 ── */
const SALARY_CSS = `
.salary-page {
  --bg:#F3F2EF; --panel:#FFFFFF; --panel2:#EAF0F8; --line:#e2e8f0;
  --text:#1e293b; --sub:#64748b; --sub2:#94a3b8;
  --cur:#0A66C2; --tgt:#059669; --warn:#d97706; --bad:#dc2626; --purple:#7c3aed;
  background:var(--bg);
  color:var(--text);
  font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  min-height:100vh;
}
.salary-wrap{max-width:980px;margin:0 auto;padding:28px 18px 80px;}
.salary-wrap h1{font-size:24px;font-weight:800;margin-bottom:4px;color:var(--text);}
.salary-wrap .desc{color:var(--sub);font-size:13px;margin-bottom:20px;}

/* 가이드 스텝퍼 — 컴팩트 칩 스타일 */
.salary-wrap .guide{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.06);}
.salary-wrap .guide-step{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--sub);font-weight:500;background:#f8fafc;border:1px solid var(--line);border-radius:20px;padding:5px 10px;}
.salary-wrap .guide-num{width:18px;height:18px;border-radius:50%;background:var(--cur);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.salary-wrap .guide-step.guide-last{background:var(--cur);border-color:var(--cur);color:#fff;font-weight:700;}
.salary-wrap .guide-last .guide-num{background:#ffffff44;}
.salary-wrap .guide-arrow{color:var(--sub2);font-size:11px;}

.salary-wrap .panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}
.salary-wrap .panel2{background:var(--panel2);border:1px solid #bfdbfe;border-radius:10px;padding:14px;}
.salary-wrap .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.salary-wrap .panel-title{display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:16px;margin-bottom:16px;}
.salary-wrap .panel-title .pt-left{display:flex;align-items:center;gap:8px;}
.salary-wrap .unit-badge{font-size:11px;color:var(--cur);background:var(--panel2);border:1px solid #bfdbfe;padding:3px 9px;border-radius:20px;font-weight:600;}
.salary-wrap .dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.salary-wrap .field{margin-bottom:12px;}
.salary-wrap .field-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.salary-wrap .field-header label{font-size:12px;color:var(--sub);font-weight:500;}
.salary-wrap .lbl-unit{color:var(--sub2);font-weight:400;font-size:11px;}
.salary-wrap .field input[type=text]{width:100%;padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:8px;color:var(--text);font-size:15px;font-family:inherit;outline:none;transition:border-color .2s;}
.salary-wrap .field input[type=text]:focus{border-color:var(--cur);box-shadow:0 0 0 3px rgba(10,102,194,0.1);}
.salary-wrap .field input[type=text].auto-val{color:var(--warn);border-color:#fde68a;background:#fffbeb;}
.salary-wrap .field input[type=text]:read-only{opacity:.7;cursor:default;}
/* 만원 suffix 입력 래퍼 */
.salary-wrap .input-wrap{position:relative;display:flex;align-items:center;}
.salary-wrap .input-wrap input[type=text]{padding-right:52px;}
.salary-wrap .input-suffix{position:absolute;right:12px;font-size:12px;color:var(--sub2);pointer-events:none;font-weight:500;}
.salary-wrap .hint{font-size:11px;color:var(--sub2);margin-top:3px;}
.salary-wrap .badge{font-size:10px;padding:2px 7px;border-radius:4px;font-weight:600;cursor:pointer;user-select:none;}
.salary-wrap .badge-auto{background:#fffbeb;color:var(--warn);border:1px solid #fde68a;}
.salary-wrap .badge-manual{background:#f0fdf4;color:var(--tgt);border:1px solid #bbf7d0;}
.salary-wrap .section-divider{border-top:1px solid var(--line);margin:14px 0;}
.salary-wrap .section-label{font-size:11px;color:var(--sub2);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px;}
.salary-wrap .opt-toggles{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.salary-wrap .opt-btn{font-size:12px;padding:6px 11px;border-radius:6px;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--sub);transition:all .15s;user-select:none;}
.salary-wrap .opt-btn:hover{border-color:var(--purple);color:var(--purple);}
.salary-wrap .opt-btn.active{border-color:var(--purple);background:#f5f3ff;color:var(--purple);font-weight:600;}
.salary-wrap .opt-btn .ico{margin-right:3px;}
.salary-wrap .opt-fields{display:none;}
.salary-wrap .opt-fields.open{display:block;}
.salary-wrap .total-row{border-top:1px solid var(--line);padding-top:10px;margin-top:8px;display:flex;justify-content:space-between;font-size:15px;align-items:center;}
.salary-wrap .total-row span:last-child{font-weight:700;}

/* 협상 기준 */
.salary-wrap .neg-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;font-weight:700;font-size:16px;flex-wrap:wrap;gap:4px;}
.salary-wrap .neg-head .neg-sub{font-size:11px;color:var(--sub2);font-weight:400;}
.salary-wrap .neg-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px;}
.salary-wrap .neg-label{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--sub);margin-bottom:10px;font-weight:600;}
.salary-wrap .neg-val-tgt{color:var(--tgt);font-size:15px;font-weight:700;}
.salary-wrap .neg-val-warn{color:var(--warn);font-size:15px;font-weight:700;}
.salary-wrap .neg-input-row{display:flex;align-items:center;gap:6px;margin-bottom:10px;}
.salary-wrap .neg-unit{font-size:14px;color:var(--sub);font-weight:600;}
.salary-wrap input[type=number]{width:90px;padding:9px 10px;background:#fff;border:1px solid var(--line);border-radius:8px;color:var(--text);font-size:17px;font-weight:700;font-family:inherit;outline:none;text-align:center;}
.salary-wrap input[type=number]:focus{border-color:var(--cur);box-shadow:0 0 0 3px rgba(10,102,194,0.1);}
.salary-wrap .chip-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.salary-wrap .pct-chip{font-size:12px;font-weight:600;padding:6px 13px;border-radius:20px;border:1px solid var(--line);background:#fff;color:var(--sub);cursor:pointer;transition:all .15s;}
.salary-wrap .pct-chip:hover{border-color:var(--cur);color:var(--cur);background:var(--panel2);}
.salary-wrap input[type=range]{width:100%;-webkit-appearance:none;height:6px;border-radius:3px;background:var(--line);outline:none;cursor:pointer;}
.salary-wrap input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;cursor:pointer;}
.salary-wrap #rng-target::-webkit-slider-thumb{background:var(--tgt);}
.salary-wrap #rng-min::-webkit-slider-thumb{background:var(--warn);}

/* 채우기 큰 버튼 + 계산 버튼 */
.salary-wrap .fill-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
.salary-wrap .fill-big{padding:16px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;border:2px solid;font-family:inherit;transition:all .15s;}
.salary-wrap .fill-big-tgt{background:#f0fdf4;color:var(--tgt);border-color:#86efac;}
.salary-wrap .fill-big-tgt:hover{background:#dcfce7;transform:translateY(-1px);}
.salary-wrap .fill-big-warn{background:#fffbeb;color:var(--warn);border-color:#fcd34d;}
.salary-wrap .fill-big-warn:hover{background:#fef3c7;transform:translateY(-1px);}
.salary-wrap .calc-btn{width:100%;padding:17px;border-radius:12px;background:var(--cur);color:#fff;font-size:16px;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .15s;}
.salary-wrap .calc-btn:hover{background:#004182;transform:translateY(-1px);}

.salary-wrap .bar-row{margin-bottom:12px;}
.salary-wrap .bar-meta{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;}
.salary-wrap .bar-meta span:last-child{font-weight:600;}
.salary-wrap .bar-track{height:10px;background:var(--line);border-radius:6px;overflow:hidden;}
.salary-wrap .bar-fill{height:100%;border-radius:6px;transition:width .4s cubic-bezier(.4,0,.2,1);}
.salary-wrap .diff-box{margin-top:12px;padding:10px 14px;background:#f8fafc;border:1px solid var(--line);border-radius:8px;font-size:14px;}
.salary-wrap .item-diff-box{margin-top:10px;padding:12px 14px;background:#f8fafc;border:1px solid var(--line);border-radius:8px;}
.salary-wrap .item-diff-title{font-size:12px;color:var(--sub);margin-bottom:6px;font-weight:600;}
.salary-wrap .item-tag{display:inline-block;font-size:11px;padding:3px 8px;border-radius:4px;margin:2px;}
.salary-wrap .item-tag.loss{background:#fef2f2;color:var(--bad);border:1px solid #fecaca;}
.salary-wrap .item-tag.gain{background:#f0fdf4;color:var(--tgt);border:1px solid #bbf7d0;}
.salary-wrap .step-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
.salary-wrap .step-card{padding:16px;border-radius:12px;background:var(--panel);border:1px solid var(--line);box-shadow:0 1px 3px rgba(0,0,0,0.06);}
.salary-wrap .step-label{font-size:12px;color:var(--sub);}
.salary-wrap .step-val{font-size:18px;font-weight:700;margin:6px 0 4px;}
.salary-wrap .step-hint{font-size:11px;color:var(--sub);}
.salary-wrap .verdict{padding:18px;border-radius:12px;background:var(--panel);border:1px solid;border-left-width:4px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}
.salary-wrap .verdict-title{font-weight:700;font-size:16px;margin-bottom:6px;}
.salary-wrap .verdict-body{font-size:14px;line-height:1.6;color:var(--text);}
.salary-wrap .verdict-sub{font-size:13px;color:var(--sub);margin-top:8px;line-height:1.6;}
.salary-wrap .takehome-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.salary-wrap .th-main{font-size:26px;font-weight:800;line-height:1.1;margin-bottom:4px;}
.salary-wrap .th-annual{font-size:13px;color:var(--sub);margin-bottom:14px;}
.salary-wrap .th-breakdown{border-top:1px solid var(--line);padding-top:10px;}
.salary-wrap .th-row{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;}
.salary-wrap .th-row span:first-child{color:var(--sub);}
.salary-wrap .th-divider{border-top:1px dashed var(--line);margin:5px 0;}
.salary-wrap .th-total-row{display:flex;justify-content:space-between;font-size:13px;font-weight:600;padding:4px 0;}
.salary-wrap .th-diff-bar{margin-top:14px;padding:12px 16px;background:#f8fafc;border:1px solid var(--line);border-radius:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;}
.salary-wrap .th-diff-item{text-align:center;}
.salary-wrap .th-diff-item .label{font-size:11px;color:var(--sub);margin-bottom:3px;}
.salary-wrap .th-diff-item .value{font-size:15px;font-weight:700;}
.salary-wrap .section-title{font-weight:700;font-size:15px;margin-bottom:16px;}
.salary-wrap .note{font-size:11px;color:var(--sub2);margin-top:20px;line-height:1.7;}
@media(max-width:680px){
  .salary-wrap .cols,.salary-wrap .step-grid,.salary-wrap .neg-grid,.salary-wrap .fill-row,.salary-wrap .takehome-grid{grid-template-columns:1fr;}
  .salary-wrap h1{font-size:20px;}
  .salary-wrap .guide-arrow{display:none;}
}
`

export default function SalaryPage() {
  useEffect(() => {
    // ── CSS 주입
    const style = document.createElement('style')
    style.id = 'salary-page-css'
    style.textContent = SALARY_CSS
    document.head.appendChild(style)

    // ── 익명 ID (localStorage 기반, 디바이스당 1건)
    function getAnonymousId(): string {
      const KEY = 'cuepath_anon_id'
      let id = localStorage.getItem(KEY)
      if (!id) {
        id = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
        localStorage.setItem(KEY, id)
      }
      return id
    }

    // ── 이벤트 추적 (fire-and-forget)
    function trackEvent(eventType: string) {
      const payload = {
        event_type:      eventType,
        anonymous_id:    getAnonymousId(),
        current_company: (document.getElementById('c_company') as HTMLInputElement | null)?.value || null,
        offer_company:   (document.getElementById('o_company') as HTMLInputElement | null)?.value || null,
        current_base:    getRaw('c_base') || null,
        current_bonus:   getRaw('c_bonus') || null,
        offer_base:      getRaw('o_base')  || null,
        offer_bonus:     getRaw('o_bonus') || null,
        target_pct:      targetPct(),
        min_pct:         minPct(),
      }
      fetch('/api/salary-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }

    let saveTimer: ReturnType<typeof setTimeout> | null = null
    function debouncedSave() {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        if (getRaw('c_base') > 0) trackEvent('calculate')
      }, 3000)
    }

    // ── 상태
    const retireMode: Record<string, string> = { c: 'auto', o: 'auto' }
    const optActive: Record<string, Set<string>> = { c: new Set(), o: new Set() }

    // ── 유틸 (입력=만원, 내부 raw·출력=원)
    const won = (n: number) => (!n || isNaN(n)) ? '0원' : Math.round(n).toLocaleString('ko-KR') + '원'
    const wonS = (n: number) => (!n || isNaN(n)) ? '0원' : (n >= 0 ? '+' : '-') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원'
    const pct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
    const getRaw = (id: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null
      return el ? (parseInt(el.dataset.raw || '0', 10) || 0) : 0
    }
    const setVal = (id: string, wonValue: number) => {
      const el = document.getElementById(id) as HTMLInputElement | null
      if (!el) return
      const manwon = Math.round(wonValue / UNIT)
      el.dataset.raw = String(manwon * UNIT)
      el.value = manwon > 0 ? manwon.toLocaleString('ko-KR') : ''
    }
    const targetPct = () => parseInt((document.getElementById('inp-target') as HTMLInputElement | null)?.value || '0', 10) || 0
    const minPct    = () => parseInt((document.getElementById('inp-min')    as HTMLInputElement | null)?.value || '0', 10) || 0

    // ── 만원 단위 입력 처리
    function attachNum(el: Element) {
      el.addEventListener('input', function (this: HTMLInputElement) {
        const pos = this.selectionStart ?? 0
        const prev = this.value.length
        const digits = this.value.replace(/[^0-9]/g, '')
        const manwon = digits ? parseInt(digits, 10) : 0
        this.dataset.raw = String(manwon * UNIT)
        this.value = manwon ? manwon.toLocaleString('ko-KR') : ''
        const next = pos + (this.value.length - prev)
        this.setSelectionRange(Math.max(0, next), Math.max(0, next))
        if (this.id === 'c_base') updateAutoRetire('c')
        if (this.id === 'o_base') updateAutoRetire('o')
        recalc()
      })
    }

    // ── 퇴직급여 자동/수동 토글
    function toggleRetireMode(p: string) {
      if (!optActive[p].has('retire')) return
      const el = document.getElementById(`${p}_retire`) as HTMLInputElement
      const badge = document.getElementById(`${p}_retire_badge`)!
      const hint = document.getElementById(`${p}_retire_hint`)!
      if (retireMode[p] === 'auto') {
        retireMode[p] = 'manual'
        el.readOnly = false; el.classList.remove('auto-val'); el.value = ''; el.dataset.raw = '0'
        badge.className = 'badge badge-manual'; badge.textContent = '직접 입력'
        hint.textContent = '직접 입력 중 · 배지 클릭으로 자동계산 복귀'
      } else {
        retireMode[p] = 'auto'
        el.readOnly = true; el.classList.add('auto-val')
        badge.className = 'badge badge-auto'; badge.textContent = '자동계산'
        hint.textContent = '기본급 ÷ 12 자동 적용 · 배지 클릭으로 직접 입력'
        updateAutoRetire(p)
      }
      recalc()
    }

    function updateAutoRetire(p: string) {
      if (!optActive[p].has('retire') || retireMode[p] !== 'auto') return
      setVal(`${p}_retire`, Math.round(getRaw(`${p}_base`) / 12))
    }

    // ── 선택 항목 토글
    function toggleOpt(p: string, key: string, btn: HTMLElement) {
      const set = optActive[p]
      const fieldWrap = document.getElementById(`${p}_field_${key}`)!
      if (set.has(key)) {
        set.delete(key)
        btn.classList.remove('active')
        fieldWrap.style.display = 'none'
        const inp = document.getElementById(`${p}_${key}`) as HTMLInputElement | null
        if (inp) { inp.value = ''; inp.dataset.raw = '0' }
      } else {
        set.add(key)
        btn.classList.add('active')
        fieldWrap.style.display = 'block'
        document.getElementById(`${p}_opt_fields`)!.classList.add('open')
        if (key === 'retire') { retireMode[p] = 'auto'; updateAutoRetire(p) }
      }
      if (set.size === 0) document.getElementById(`${p}_opt_fields`)!.classList.remove('open')
      recalc()
    }

    // ── 실수령 계산
    function calcTakeHome(annual: number) {
      if (annual <= 0) return { monthly: 0, annualNet: 0, b: { np: 0, hi: 0, lt: 0, em: 0, it: 0, lc: 0, totalDeduct: 0 } }
      const monthly = annual / 12
      const taxableM = Math.max(0, monthly - 200000)
      const taxableA = taxableM * 12
      const npBase = Math.min(taxableM, 5900000)
      const np = Math.round(npBase * 0.045)
      const hi = Math.round(taxableM * 0.03545)
      const lt = Math.round(hi * 0.1295)
      const em = Math.round(taxableM * 0.009)
      let ded: number
      if      (taxableA <= 5000000)   ded = taxableA * 0.70
      else if (taxableA <= 15000000)  ded = 3500000 + (taxableA - 5000000) * 0.40
      else if (taxableA <= 45000000)  ded = 7500000 + (taxableA - 15000000) * 0.15
      else if (taxableA <= 100000000) ded = 12000000 + (taxableA - 45000000) * 0.05
      else                            ded = 14750000
      ded = Math.min(ded, 20000000)
      const taxBase = Math.max(0, taxableA - ded - 1500000)
      let tax: number
      if      (taxBase <= 14000000)  tax = taxBase * 0.06
      else if (taxBase <= 50000000)  tax = 840000 + (taxBase - 14000000) * 0.15
      else if (taxBase <= 88000000)  tax = 6240000 + (taxBase - 50000000) * 0.24
      else if (taxBase <= 150000000) tax = 15360000 + (taxBase - 88000000) * 0.35
      else if (taxBase <= 300000000) tax = 37060000 + (taxBase - 150000000) * 0.38
      else if (taxBase <= 500000000) tax = 94060000 + (taxBase - 300000000) * 0.40
      else                           tax = 174060000 + (taxBase - 500000000) * 0.42
      let credit = tax <= 1300000 ? tax * 0.55 : 715000 + (tax - 1300000) * 0.30
      let limit: number
      if      (taxableA <= 33000000) limit = 740000
      else if (taxableA <= 70000000) limit = 740000 - (taxableA - 33000000) * 0.008
      else                           limit = 660000 - (taxableA - 70000000) * 0.5
      limit = Math.max(limit, 500000)
      credit = Math.min(credit, limit)
      const finalTax = Math.max(0, tax - credit - 130000)
      const it = Math.round(finalTax / 12)
      const lc = Math.round(finalTax * 0.1 / 12)
      const totalDeduct = np + hi + lt + em + it + lc
      return { monthly: Math.round(monthly - totalDeduct), annualNet: Math.round((monthly - totalDeduct) * 12), b: { np, hi, lt, em, it, lc, totalDeduct } }
    }

    function fillTakeHome(p: string, r: ReturnType<typeof calcTakeHome>) {
      const f = (n: number) => n ? won(n) : '—'
      const b = r.b
      const el = (id: string) => document.getElementById(id)!
      el(`th-${p}-monthly`).textContent = r.monthly > 0 ? won(r.monthly) + ' / 월' : '—'
      el(`th-${p}-annual`).textContent  = r.annualNet > 0 ? '연 환산 ' + won(r.annualNet) : '연 환산 —'
      el(`th-${p}-np`).textContent      = f(b.np)
      el(`th-${p}-hi`).textContent      = f(b.hi)
      el(`th-${p}-lt`).textContent      = f(b.lt)
      el(`th-${p}-em`).textContent      = f(b.em)
      el(`th-${p}-it`).textContent      = f(b.it)
      el(`th-${p}-lc`).textContent      = f(b.lc)
      el(`th-${p}-deduct`).textContent  = f(b.totalDeduct)
    }

    // ── 총보상 집계 (기본급 + 활성 선택 항목)
    function getTotal(p: string) {
      let sum = getRaw(`${p}_base`)
      optActive[p].forEach(k => { sum += getRaw(`${p}_${k}`) })
      return sum
    }

    // ── 협상 인상률 설정 (입력·슬라이더·칩 동기화)
    function setPct(which: 'target' | 'min', val: number, opts: { fromInput?: boolean; fromRange?: boolean } = {}) {
      val = Math.max(0, Math.min(100, isNaN(val) ? 0 : Math.round(val)))
      const inp = document.getElementById(`inp-${which}`) as HTMLInputElement | null
      const rng = document.getElementById(`rng-${which}`) as HTMLInputElement | null
      const lbl = document.getElementById(`lbl-${which}`)
      if (inp && !opts.fromInput) inp.value = String(val)
      if (rng && !opts.fromRange) rng.value = String(Math.min(val, 60))
      if (lbl) lbl.textContent = val + '%'
      recalc()
    }

    // ── 대상 회사 자동 채우기 (현재→대상 흡수 반영)
    function autoFillOffer(mode: 'target' | 'min') {
      const curTotal = getTotal('c')
      if (curTotal === 0) { showToast('현재 회사 정보를 먼저 입력하세요.'); return }
      const rate = mode === 'target' ? targetPct() : minPct()
      const T = Math.round(curTotal * (1 + rate / 100))
      const oAct = optActive['o']
      const cAct = optActive['c']

      let sumOther = 0
      const absorbed: { k: string; v: number }[] = []
      OPT_KEYS.forEach(k => {
        if (k === 'retire') return
        if (oAct.has(k)) {
          const cv = cAct.has(k) ? getRaw(`c_${k}`) : getRaw(`o_${k}`)
          setVal(`o_${k}`, cv)
          sumOther += cv
        } else if (cAct.has(k)) {
          absorbed.push({ k, v: getRaw(`c_${k}`) })
        }
      })

      if (oAct.has('retire') && retireMode['o'] === 'auto') {
        const base = Math.max(0, Math.round((T - sumOther) * 12 / 13))
        setVal('o_base', base)
        setVal('o_retire', Math.round(base / 12))
      } else {
        const retireManual = oAct.has('retire') ? getRaw('o_retire') : 0
        setVal('o_base', Math.max(0, T - sumOther - retireManual))
      }

      recalc()
      trackEvent(mode === 'target' ? 'fill_target' : 'fill_min')
      const absorbedSum = absorbed.reduce((s, a) => s + a.v, 0)
      if (absorbedSum > 0) {
        const names = absorbed.map(a => OPT_LABEL[a.k]).join(', ')
        showToast(`${names} (${won(absorbedSum)}) → 대상 회사 기본급에 흡수 반영됐습니다.`)
      } else {
        showToast(mode === 'target' ? '목표 금액으로 대상 회사를 채웠습니다.' : '최저 수용선으로 대상 회사를 채웠습니다.')
      }
    }

    // ── 계산하기 (결과로 스크롤 + 추적)
    function doCalculate() {
      recalc()
      trackEvent('calculate')
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // ── 토스트
    function showToast(msg: string) {
      let el = document.getElementById('salary-toast')
      if (!el) {
        el = document.createElement('div')
        el.id = 'salary-toast'
        el.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#f0fdf4;border:1px solid #bbf7d0;color:#059669;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;z-index:9999;pointer-events:none;transition:opacity .3s;white-space:nowrap;max-width:90vw;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1)'
        document.body.appendChild(el)
      }
      el.textContent = msg
      el.style.opacity = '1'
      clearTimeout((el as HTMLElement & { _t?: ReturnType<typeof setTimeout> })._t)
      ;(el as HTMLElement & { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => { el!.style.opacity = '0' }, 3500)
    }

    // ── 항목 차이 분석
    function renderItemDiff(hasOffer: boolean) {
      const box = document.getElementById('item-diff-box')!
      const con = document.getElementById('item-diff-content')!
      if (!hasOffer) { box.style.display = 'none'; return }
      const cHas = optActive['c'], oHas = optActive['o']
      const losses: string[] = [], gains: string[] = []
      const lossKeys: string[] = []
      OPT_KEYS.forEach(k => {
        if (cHas.has(k) && !oHas.has(k)) { const v = getRaw(`c_${k}`); losses.push(`${OPT_LABEL[k]}${v > 0 ? ' (' + won(v) + ')' : ''}`); lossKeys.push(k) }
        if (!cHas.has(k) && oHas.has(k)) { const v = getRaw(`o_${k}`); gains.push(`${OPT_LABEL[k]}${v > 0 ? ' (' + won(v) + ')' : ''}`) }
      })
      if (losses.length === 0 && gains.length === 0) { box.style.display = 'none'; return }
      box.style.display = ''
      let html = ''
      if (losses.length) html += `<div style="margin-bottom:6px"><span style="font-size:11px;color:var(--bad);margin-right:6px">▼ 이직 시 상실</span>` + losses.map(l => `<span class="item-tag loss">${l}</span>`).join('') + '</div>'
      if (gains.length)  html += `<div><span style="font-size:11px;color:var(--tgt);margin-right:6px">▲ 이직 시 획득</span>` + gains.map(g => `<span class="item-tag gain">${g}</span>`).join('') + '</div>'
      if (lossKeys.length) {
        const lossTotal = lossKeys.reduce((s, k) => s + getRaw(`c_${k}`), 0)
        if (lossTotal > 0) html += `<div style="margin-top:8px;font-size:12px;color:var(--sub)">💡 상실 항목 합계 <b style="color:var(--bad)">${won(lossTotal)}</b> — 협상 시 이 금액을 대상 회사 기본급에 반영하도록 요구하세요.</div>`
      }
      con.innerHTML = html
    }

    // ── 판정
    function renderVerdict(hasOffer: boolean, offTotal: number, floor: number, target: number, anchor: number) {
      const wrap = document.getElementById('verdict-wrap')!
      if (!hasOffer) { wrap.style.display = 'none'; return }
      wrap.style.display = ''
      let color: string, title: string, body: string, sub = ''
      if (offTotal < floor) {
        color = 'var(--bad)'; title = '재협상 필요'
        body = '현재 대비 최소 수용선에 미달합니다. 앵커 금액으로 재협상하거나 거절을 고려하세요.'
        sub = `최저선까지 ${won(floor - offTotal)} 부족합니다. 앵커 ${won(anchor)}로 역제안하세요.`
      } else if (offTotal < target) {
        color = 'var(--warn)'; title = '협상 권장'
        body = '최저선은 넘었으나 목표에 미달합니다. 목표 금액까지의 간극을 근거로 역제안하세요.'
        sub = `목표까지 ${won(target - offTotal)} 부족 · 앵커 ${won(anchor)}로 역제안 후 목표선(${won(target)})에서 합의를 노려보세요.`
      } else {
        color = 'var(--tgt)'; title = '수락 권장'
        body = '제안이 목표 금액을 충족합니다. 세부 조건(사이닝·베스팅·근무형태)만 확인 후 수락하세요.'
      }
      document.getElementById('verdict-box')!.style.borderColor = color
      const vTitle = document.getElementById('v-title')!
      vTitle.style.color = color; vTitle.textContent = title
      document.getElementById('v-body')!.textContent = body
      document.getElementById('v-sub')!.textContent = sub
    }

    function setBar(barId: string, valId: string, value: number, max: number) {
      document.getElementById(barId)!.style.width = max ? Math.min(100, (value / max) * 100) + '%' : '0%'
      document.getElementById(valId)!.textContent = won(value)
    }

    // ── 메인 계산
    function recalc() {
      const curTotal = getTotal('c')
      const offTotal = getTotal('o')
      const hasOffer = offTotal > 0
      const floor  = curTotal * (1 + minPct() / 100)
      const target = curTotal * (1 + targetPct() / 100)
      const anchor = curTotal * (1 + (targetPct() + 8) / 100)
      document.getElementById('c_total')!.textContent    = won(curTotal)
      document.getElementById('o_total')!.textContent    = won(offTotal)
      document.getElementById('st-anchor')!.textContent  = won(anchor)
      document.getElementById('st-target')!.textContent  = won(target)
      document.getElementById('st-floor')!.textContent   = won(floor)
      const maxBar = Math.max(curTotal, offTotal, target, 1)
      setBar('bar-c', 'bar-c-val', curTotal, maxBar)
      setBar('bar-o', 'bar-o-val', offTotal, maxBar)
      setBar('bar-t', 'bar-t-val', target, maxBar)
      document.getElementById('row-offer')!.style.display = hasOffer ? '' : 'none'
      const diffBox = document.getElementById('diff-box')!
      if (hasOffer) {
        const diff = offTotal - curTotal, dp = curTotal ? (diff / curTotal) * 100 : 0
        const col = diff >= 0 ? 'var(--tgt)' : 'var(--bad)'
        diffBox.style.display = ''
        diffBox.innerHTML = `제안은 현재 대비 <b style="color:${col}">${won(diff)} (${pct(dp)})</b>`
      } else diffBox.style.display = 'none'
      renderItemDiff(hasOffer)
      const thC = calcTakeHome(getRaw('c_base') + getRaw('c_bonus'))
      const thO = calcTakeHome(getRaw('o_base') + getRaw('o_bonus'))
      fillTakeHome('c', thC)
      if (hasOffer && (getRaw('o_base') + getRaw('o_bonus')) > 0) {
        document.getElementById('th-offer-card')!.style.display = ''
        fillTakeHome('o', thO)
        document.getElementById('th-diff-row')!.style.display = ''
        const md = thO.monthly - thC.monthly, ad = md * 12
        const dc = md >= 0 ? 'var(--tgt)' : 'var(--bad)'
        document.getElementById('th-d-cur')!.textContent   = won(thC.monthly)
        document.getElementById('th-d-off')!.textContent   = won(thO.monthly)
        const diffEl  = document.getElementById('th-d-diff')!
        const adiffEl = document.getElementById('th-d-adiff')!
        diffEl.textContent  = wonS(md);  (diffEl as HTMLElement).style.color  = dc
        adiffEl.textContent = wonS(ad);  (adiffEl as HTMLElement).style.color = dc
      } else {
        document.getElementById('th-offer-card')!.style.display = 'none'
        document.getElementById('th-diff-row')!.style.display   = 'none'
      }
      renderVerdict(hasOffer, offTotal, floor, target, anchor)
      debouncedSave()
    }

    // ── 이벤트 등록
    document.querySelectorAll('.salary-wrap input[inputmode="numeric"]').forEach(el => attachNum(el))

    // ── window 노출 (JSX onClick/onInput에서 호출)
    ;(window as any).__salary = { toggleRetireMode, toggleOpt, autoFillOffer, setPct, doCalculate }

    recalc()
    trackEvent('view')

    // ── 정리
    return () => {
      if (saveTimer) clearTimeout(saveTimer)
      const s = document.getElementById('salary-page-css')
      if (s) document.head.removeChild(s)
      const t = document.getElementById('salary-toast')
      if (t) document.body.removeChild(t)
      delete (window as any).__salary
    }
  }, [])

  // onClick/onInput 헬퍼
  const S = () => (window as any).__salary as {
    toggleRetireMode: (p: string) => void
    toggleOpt: (p: string, key: string, btn: HTMLElement) => void
    autoFillOffer: (mode: 'target' | 'min') => void
    setPct: (which: 'target' | 'min', val: number, opts?: { fromInput?: boolean; fromRange?: boolean }) => void
    doCalculate: () => void
  }

  // 회사 패널 렌더
  const renderPanel = (p: 'c' | 'o') => {
    const isOffer = p === 'o'
    const defs = OPT_DEFS.filter(d => isOffer || !d.targetOnly)
    return (
      <div className="panel">
        <div className="panel-title">
          <span className="pt-left">
            <span className="dot" style={{ background: isOffer ? 'var(--tgt)' : 'var(--cur)' }} />
            {isOffer ? '대상 회사' : '현재 회사'}
          </span>
          <span className="unit-badge">✏️ 만원 단위 입력</span>
        </div>

        {/* 회사명 (선택) */}
        <div className="field" style={{ marginBottom: '16px' }}>
          <div className="field-header">
            <label htmlFor={`${p}_company`}>회사명</label>
            <span style={{ fontSize: '11px', color: 'var(--sub2)' }}>선택 항목</span>
          </div>
          <input type="text" id={`${p}_company`} placeholder="회사명 검색 또는 직접 입력" list="salary-company-list" autoComplete="off" />
          <div className="hint">입력하지 않아도 계산이 가능합니다</div>
        </div>
        <div className="section-divider" />

        {/* 기본급 (항상 노출) */}
        <div className="section-label">기본 보상</div>
        <div className="field">
          <div className="field-header"><label>기본급 (연)</label></div>
          <div className="input-wrap">
            <input type="text" inputMode="numeric" id={`${p}_base`} placeholder="0" data-raw="0" />
            <span className="input-suffix">만원</span>
          </div>
          <div className="hint">월 기본급 × 12</div>
        </div>

        <div className="section-divider" />

        {/* 선택 항목 토글 */}
        <div className="section-label">항목 추가 <span style={{ color: 'var(--sub2)', fontWeight: 400 }}>(해당하는 항목 클릭)</span></div>
        <div className="opt-toggles" id={`${p}_opt_toggles`}>
          {defs.map(d => (
            <span
              key={d.key}
              className="opt-btn"
              data-key={d.key}
              onClick={(e) => S().toggleOpt(p, d.key, e.currentTarget as HTMLElement)}
            >
              <span className="ico">{d.icon}</span>{d.label}
            </span>
          ))}
        </div>

        <div className="opt-fields" id={`${p}_opt_fields`}>
          <div className="panel2">
            {defs.map(d => (
              <div key={d.key} id={`${p}_field_${d.key}`} style={{ display: 'none' }}>
                <div className="field" style={{ marginBottom: '8px' }}>
                  <div className="field-header">
                    <label>{d.icon} {d.label}</label>
                    {d.auto && (
                      <span className="badge badge-auto" id={`${p}_retire_badge`} onClick={() => S().toggleRetireMode(p)}>자동계산</span>
                    )}
                  </div>
                  <div className="input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      id={`${p}_${d.key}`}
                      placeholder="0"
                      data-raw="0"
                      className={d.auto ? 'auto-val' : undefined}
                      readOnly={d.auto}
                    />
                    <span className="input-suffix">만원</span>
                  </div>
                  <div className="hint" id={d.auto ? `${p}_retire_hint` : undefined}>{d.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="total-row">
          <span style={{ color: 'var(--sub)' }}>총보상</span>
          <span id={`${p}_total`} style={{ color: isOffer ? 'var(--tgt)' : 'var(--cur)' }}>0원</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <SiteHeader backHref="/" />
      <div className="salary-page">
      <div className="salary-wrap">
        <h1>연봉 비교·협상 계산기</h1>
        <p className="desc">모든 보상 항목을 총보상(Total Comp)으로 환산해 비교하고, 협상 3단계 금액을 산출합니다. <b style={{ color: 'var(--cur)' }}>입력은 만원 단위</b>, 결과는 원 단위로 표시됩니다.</p>

        {/* ══ 가이드 스텝퍼 ══ */}
        <div className="guide">
          <div className="guide-step"><span className="guide-num">1</span>🏢 회사명</div>
          <span className="guide-arrow">›</span>
          <div className="guide-step"><span className="guide-num">2</span>📋 항목 선택</div>
          <span className="guide-arrow">›</span>
          <div className="guide-step"><span className="guide-num">3</span>💰 금액 입력</div>
          <span className="guide-arrow">›</span>
          <div className="guide-step"><span className="guide-num">4</span>🎯 협상 기준</div>
          <span className="guide-arrow">›</span>
          <div className="guide-step guide-last"><span className="guide-num">5</span>📊 계산하기</div>
        </div>

        {/* ══ 입력 2열 ══ */}
        <div className="cols">
          {renderPanel('c')}
          {renderPanel('o')}
        </div>

        {/* ══ 협상 기준 ══ */}
        <div className="panel" style={{ marginBottom: '14px' }}>
          <div className="neg-head">
            <span>협상 기준 설정</span>
            <span className="neg-sub">현재 총보상 대비 인상률 · 버튼으로 대상 회사 자동 산출</span>
          </div>

          <div className="neg-grid">
            {/* 목표 */}
            <div>
              <div className="neg-label"><span>🎯 목표 인상률</span><span id="lbl-target" className="neg-val-tgt">20%</span></div>
              <div className="neg-input-row">
                <input
                  type="number" id="inp-target" min="0" max="100" defaultValue="20"
                  onInput={(e) => S().setPct('target', parseInt((e.currentTarget as HTMLInputElement).value || '0', 10), { fromInput: true })}
                />
                <span className="neg-unit">%</span>
              </div>
              <div className="chip-row">
                {[5, 10, 15, 20, 25].map(v => (
                  <button key={v} className="pct-chip" onClick={() => S().setPct('target', v)}>{v}%</button>
                ))}
              </div>
              <input
                type="range" id="rng-target" min="0" max="60" defaultValue="20"
                onInput={(e) => S().setPct('target', parseInt((e.currentTarget as HTMLInputElement).value, 10), { fromRange: true })}
              />
            </div>

            {/* 최저 */}
            <div>
              <div className="neg-label"><span>🛡️ 최소 수용 인상률</span><span id="lbl-min" className="neg-val-warn">10%</span></div>
              <div className="neg-input-row">
                <input
                  type="number" id="inp-min" min="0" max="100" defaultValue="10"
                  onInput={(e) => S().setPct('min', parseInt((e.currentTarget as HTMLInputElement).value || '0', 10), { fromInput: true })}
                />
                <span className="neg-unit">%</span>
              </div>
              <div className="chip-row">
                {[5, 10, 15, 20, 25].map(v => (
                  <button key={v} className="pct-chip" onClick={() => S().setPct('min', v)}>{v}%</button>
                ))}
              </div>
              <input
                type="range" id="rng-min" min="0" max="60" defaultValue="10"
                onInput={(e) => S().setPct('min', parseInt((e.currentTarget as HTMLInputElement).value, 10), { fromRange: true })}
              />
            </div>
          </div>

          {/* 큰 채우기 버튼 */}
          <div className="fill-row">
            <button className="fill-big fill-big-tgt" onClick={() => S().autoFillOffer('target')}>🎯 목표로 채우기</button>
            <button className="fill-big fill-big-warn" onClick={() => S().autoFillOffer('min')}>🛡️ 최저로 채우기</button>
          </div>

          {/* 계산하기 */}
          <button className="calc-btn" onClick={() => S().doCalculate()}>📊 계산하기</button>
        </div>

        {/* ══ 결과 영역 ══ */}
        <div id="results">

          {/* 총보상 비교 */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="section-title">총보상 비교</div>
            <div className="bar-row">
              <div className="bar-meta"><span style={{ color: 'var(--sub)' }}>현재</span><span id="bar-c-val" style={{ color: 'var(--cur)' }}>0원</span></div>
              <div className="bar-track"><div className="bar-fill" id="bar-c" style={{ background: 'var(--cur)', width: '0%' }} /></div>
            </div>
            <div className="bar-row" id="row-offer" style={{ display: 'none' }}>
              <div className="bar-meta"><span style={{ color: 'var(--sub)' }}>대상</span><span id="bar-o-val" style={{ color: 'var(--tgt)' }}>0원</span></div>
              <div className="bar-track"><div className="bar-fill" id="bar-o" style={{ background: 'var(--tgt)', width: '0%' }} /></div>
            </div>
            <div className="bar-row">
              <div className="bar-meta"><span style={{ color: 'var(--sub)' }}>목표 금액</span><span id="bar-t-val" style={{ color: 'var(--warn)' }}>0원</span></div>
              <div className="bar-track"><div className="bar-fill" id="bar-t" style={{ background: 'var(--warn)', width: '0%' }} /></div>
            </div>
            <div className="diff-box" id="diff-box" style={{ display: 'none' }} />
            <div className="item-diff-box" id="item-diff-box" style={{ display: 'none' }}>
              <div className="item-diff-title">⚖️ 회사별 항목 차이 — 협상 시 반드시 언급하세요</div>
              <div id="item-diff-content" />
            </div>
          </div>

          {/* 실수령액 비교 */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ marginBottom: '4px' }}>실수령액 비교</div>
            <div style={{ fontSize: '12px', color: 'var(--sub)', marginBottom: '16px' }}>기본급+성과급 기준 · 4대보험·근로소득세·지방소득세 공제 후 (2024년 세율)</div>
            <div className="takehome-grid">
              <div className="panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--sub)', marginBottom: '10px' }}>
                  <span className="dot" style={{ background: 'var(--cur)' }} />현재 회사
                </div>
                <div className="th-main" id="th-c-monthly" style={{ color: 'var(--cur)' }}>—</div>
                <div className="th-annual" id="th-c-annual">연 환산 —</div>
                <div className="th-breakdown">
                  <div className="th-row"><span>국민연금 (4.5%)</span><span id="th-c-np">—</span></div>
                  <div className="th-row"><span>건강보험 (3.545%)</span><span id="th-c-hi">—</span></div>
                  <div className="th-row"><span>장기요양 (건보×12.95%)</span><span id="th-c-lt">—</span></div>
                  <div className="th-row"><span>고용보험 (0.9%)</span><span id="th-c-em">—</span></div>
                  <div className="th-divider" />
                  <div className="th-row"><span>근로소득세</span><span id="th-c-it">—</span></div>
                  <div className="th-row"><span>지방소득세 (소득세×10%)</span><span id="th-c-lc">—</span></div>
                  <div className="th-divider" />
                  <div className="th-total-row" style={{ color: 'var(--bad)' }}><span>월 공제 합계</span><span id="th-c-deduct">—</span></div>
                </div>
              </div>
              <div className="panel" id="th-offer-card" style={{ padding: '16px', display: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--sub)', marginBottom: '10px' }}>
                  <span className="dot" style={{ background: 'var(--tgt)' }} />대상 회사
                </div>
                <div className="th-main" id="th-o-monthly" style={{ color: 'var(--tgt)' }}>—</div>
                <div className="th-annual" id="th-o-annual">연 환산 —</div>
                <div className="th-breakdown">
                  <div className="th-row"><span>국민연금 (4.5%)</span><span id="th-o-np">—</span></div>
                  <div className="th-row"><span>건강보험 (3.545%)</span><span id="th-o-hi">—</span></div>
                  <div className="th-row"><span>장기요양 (건보×12.95%)</span><span id="th-o-lt">—</span></div>
                  <div className="th-row"><span>고용보험 (0.9%)</span><span id="th-o-em">—</span></div>
                  <div className="th-divider" />
                  <div className="th-row"><span>근로소득세</span><span id="th-o-it">—</span></div>
                  <div className="th-row"><span>지방소득세 (소득세×10%)</span><span id="th-o-lc">—</span></div>
                  <div className="th-divider" />
                  <div className="th-total-row" style={{ color: 'var(--bad)' }}><span>월 공제 합계</span><span id="th-o-deduct">—</span></div>
                </div>
              </div>
            </div>
            <div className="th-diff-bar" id="th-diff-row" style={{ display: 'none' }}>
              <div className="th-diff-item"><div className="label">현재 월 실수령</div><div className="value" id="th-d-cur" style={{ color: 'var(--cur)' }}>—</div></div>
              <div style={{ fontSize: '20px', color: 'var(--sub)' }}>→</div>
              <div className="th-diff-item"><div className="label">이직 후 월 실수령</div><div className="value" id="th-d-off" style={{ color: 'var(--tgt)' }}>—</div></div>
              <div style={{ fontSize: '20px', color: 'var(--sub)' }}>＝</div>
              <div className="th-diff-item"><div className="label">월 차이</div><div className="value" id="th-d-diff">—</div></div>
              <div className="th-diff-item"><div className="label">연 차이</div><div className="value" id="th-d-adiff">—</div></div>
            </div>
          </div>

          {/* 협상 3단계 */}
          <div className="step-grid">
            <div className="step-card">
              <div className="step-label">앵커 (첫 제안)</div>
              <div className="step-val" id="st-anchor" style={{ color: 'var(--bad)' }}>0원</div>
              <div className="step-hint">협상의 출발점 — 높게 제시</div>
            </div>
            <div className="step-card">
              <div className="step-label">목표 (Target)</div>
              <div className="step-val" id="st-target" style={{ color: 'var(--tgt)' }}>0원</div>
              <div className="step-hint">현실적 합의 지점</div>
            </div>
            <div className="step-card">
              <div className="step-label">최저 수용선</div>
              <div className="step-val" id="st-floor" style={{ color: 'var(--warn)' }}>0원</div>
              <div className="step-hint">이하면 거절 검토</div>
            </div>
          </div>

          {/* 판정 */}
          <div id="verdict-wrap" style={{ display: 'none' }}>
            <div className="verdict" id="verdict-box">
              <div className="verdict-title" id="v-title" />
              <div className="verdict-body"  id="v-body"  />
              <div className="verdict-sub"   id="v-sub"   />
            </div>
          </div>

        </div>

        <p className="note">
          입력은 만원 단위, 결과는 원 단위로 표시됩니다. 주식·RSU는 베스팅 일정·세금 별도 / 법인카드·차량 등 비과세 항목은 실질 가처분 기준으로 환산 / 실수령액은 2024년 세율 기준 근사치입니다.<br />
          본 계산은 협상 참고용이며 실제 합의는 직무·시장·개인 상황에 따라 달라집니다.
        </p>

        {/* 회사명 자동완성 목록 (src/lib/companies.ts) */}
        <datalist id="salary-company-list">
          {COMPANY_LIST.map(c => <option key={c} value={c} />)}
        </datalist>

      </div>
      </div>
    </>
  )
}
