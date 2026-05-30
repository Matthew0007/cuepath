'use client'

import { useEffect } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'

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
  padding:28px 18px 80px;
}
.salary-wrap{max-width:980px;margin:0 auto;}
.salary-wrap h1{font-size:24px;font-weight:800;margin-bottom:4px;color:var(--text);}
.salary-wrap .desc{color:var(--sub);font-size:13px;margin-bottom:24px;}
.salary-wrap .panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}
.salary-wrap .panel2{background:var(--panel2);border:1px solid #bfdbfe;border-radius:10px;padding:14px;}
.salary-wrap .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.salary-wrap .panel-title{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;margin-bottom:16px;}
.salary-wrap .dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.salary-wrap .field{margin-bottom:12px;}
.salary-wrap .field-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.salary-wrap .field-header label{font-size:12px;color:var(--sub);font-weight:500;}
.salary-wrap .field input[type=text]{width:100%;padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:8px;color:var(--text);font-size:15px;font-family:inherit;outline:none;transition:border-color .2s;}
.salary-wrap .field input[type=text]:focus{border-color:var(--cur);box-shadow:0 0 0 3px rgba(10,102,194,0.1);}
.salary-wrap .field input[type=text].auto-val{color:var(--warn);border-color:#fde68a;background:#fffbeb;}
.salary-wrap .field input[type=text]:read-only{opacity:.7;cursor:default;}
.salary-wrap .hint{font-size:11px;color:var(--sub2);margin-top:3px;}
.salary-wrap .badge{font-size:10px;padding:2px 7px;border-radius:4px;font-weight:600;cursor:pointer;user-select:none;}
.salary-wrap .badge-auto{background:#fffbeb;color:var(--warn);border:1px solid #fde68a;}
.salary-wrap .badge-manual{background:#f0fdf4;color:var(--tgt);border:1px solid #bbf7d0;}
.salary-wrap .section-divider{border-top:1px solid var(--line);margin:14px 0;}
.salary-wrap .section-label{font-size:11px;color:var(--sub2);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px;}
.salary-wrap .opt-toggles{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.salary-wrap .opt-btn{font-size:12px;padding:5px 10px;border-radius:6px;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--sub);transition:all .15s;user-select:none;}
.salary-wrap .opt-btn.active{border-color:var(--purple);background:#f5f3ff;color:var(--purple);}
.salary-wrap .opt-btn .ico{margin-right:3px;}
.salary-wrap .opt-fields{display:none;}
.salary-wrap .opt-fields.open{display:block;}
.salary-wrap .total-row{border-top:1px solid var(--line);padding-top:10px;margin-top:8px;display:flex;justify-content:space-between;font-size:15px;align-items:center;}
.salary-wrap .total-row span:last-child{font-weight:700;}
.salary-wrap .param-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.salary-wrap .slider-label{display:flex;justify-content:space-between;font-size:13px;color:var(--sub);margin-bottom:8px;}
.salary-wrap .slider-label span:last-child{font-weight:600;}
.salary-wrap input[type=range]{width:100%;-webkit-appearance:none;height:6px;border-radius:3px;background:var(--line);outline:none;cursor:pointer;}
.salary-wrap input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;cursor:pointer;}
.salary-wrap #rng-target::-webkit-slider-thumb{background:var(--tgt);}
.salary-wrap #rng-min::-webkit-slider-thumb{background:var(--warn);}
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
.salary-wrap .note{font-size:11px;color:var(--sub2);margin-top:20px;line-height:1.7;}
.salary-wrap .fill-btn{font-size:11px;font-weight:600;padding:3px 9px;border-radius:5px;cursor:pointer;border:none;font-family:inherit;transition:all .15s;white-space:nowrap;}
.salary-wrap .fill-btn-tgt{background:#f0fdf4;color:var(--tgt);border:1px solid #bbf7d0;}
.salary-wrap .fill-btn-tgt:hover{background:#dcfce7;}
.salary-wrap .fill-btn-warn{background:#fffbeb;color:var(--warn);border:1px solid #fde68a;}
.salary-wrap .fill-btn-warn:hover{background:#fef3c7;}
@media(max-width:680px){
  .salary-wrap .cols,.salary-wrap .step-grid,.salary-wrap .param-grid,.salary-wrap .takehome-grid{grid-template-columns:1fr;}
  .salary-wrap h1{font-size:20px;}
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
        target_pct:      parseInt(((document.getElementById('rng-target') as HTMLInputElement | null)?.value ?? '20'), 10),
        min_pct:         parseInt(((document.getElementById('rng-min')    as HTMLInputElement | null)?.value ?? '10'), 10),
      }
      fetch('/api/salary-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }

    // ── 계산 결과 debounce 저장 (3초 후 유의미한 데이터 있을 때만)
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
    const OPT_KEYS = ['equity', 'corpcard', 'car', 'edu', 'housing', 'etc']
    const OPT_LABEL: Record<string, string> = {
      equity: '주식·RSU', corpcard: '법인카드', car: '차량 지원',
      edu: '교육비', housing: '주거 지원', etc: '기타',
    }

    // ── 유틸
    const won = (n: number) => (!n || isNaN(n)) ? '0원' : Math.round(n).toLocaleString('ko-KR') + '원'
    const wonS = (n: number) => (!n || isNaN(n)) ? '0원' : (n >= 0 ? '+' : '-') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원'
    const pct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
    const getRaw = (id: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null
      return el ? (parseInt(el.dataset.raw || '0', 10) || 0) : 0
    }
    const setVal = (id: string, num: number) => {
      const el = document.getElementById(id) as HTMLInputElement | null
      if (!el) return
      el.dataset.raw = String(num)
      el.value = num > 0 ? num.toLocaleString('ko-KR') : ''
    }

    // ── 쉼표 입력
    function attachNum(el: Element) {
      el.addEventListener('input', function (this: HTMLInputElement) {
        const pos = this.selectionStart ?? 0
        const prev = this.value.length
        const raw = this.value.replace(/[^0-9]/g, '')
        const fmt = raw ? parseInt(raw, 10).toLocaleString('ko-KR') : ''
        this.dataset.raw = raw || '0'
        this.value = fmt
        const next = pos + (fmt.length - prev)
        this.setSelectionRange(next, next)
        recalc()
      })
    }

    // ── 퇴직급여 자동/수동 토글
    function toggleRetireMode(p: string) {
      if (retireMode[p] === 'auto') {
        retireMode[p] = 'manual'
        const el = document.getElementById(`${p}_retire`) as HTMLInputElement
        el.readOnly = false
        el.classList.remove('auto-val')
        el.value = ''; el.dataset.raw = '0'
        const badge = document.getElementById(`${p}_retire_badge`)!
        badge.className = 'badge badge-manual'
        badge.textContent = '직접 입력'
        document.getElementById(`${p}_retire_hint`)!.textContent = '직접 입력 중 · 배지 클릭으로 자동계산 복귀'
      } else {
        retireMode[p] = 'auto'
        const el = document.getElementById(`${p}_retire`) as HTMLInputElement
        el.readOnly = true
        el.classList.add('auto-val')
        const badge = document.getElementById(`${p}_retire_badge`)!
        badge.className = 'badge badge-auto'
        badge.textContent = '자동계산'
        document.getElementById(`${p}_retire_hint`)!.textContent = '기본급 ÷ 12 자동 적용 · 배지 클릭으로 직접 입력'
        updateAutoRetire(p)
      }
      recalc()
    }

    function updateAutoRetire(p: string) {
      if (retireMode[p] !== 'auto') return
      const base = getRaw(`${p}_base`)
      setVal(`${p}_retire`, Math.round(base / 12))
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

    // ── 총보상 집계
    function getTotal(p: string) {
      const base = ['base', 'bonus', 'welfare', 'retire']
      const opts = [...optActive[p]]
      const signing = p === 'o' ? getRaw('o_signing') : 0
      return base.reduce((s, k) => s + getRaw(`${p}_${k}`), 0)
           + opts.reduce((s, k) => s + getRaw(`${p}_${k}`), 0)
           + signing
    }

    // ── 대상 회사 자동 채우기
    function autoFillOffer(mode: string) {
      const curTotal = getTotal('c')
      if (curTotal === 0) return
      const targetUp = parseInt((document.getElementById('rng-target') as HTMLInputElement).value, 10)
      const minUp    = parseInt((document.getElementById('rng-min') as HTMLInputElement).value, 10)
      const rate     = mode === 'target' ? targetUp : minUp
      const T        = Math.round(curTotal * (1 + rate / 100))
      const cOpts = optActive['c']
      const oOpts = optActive['o']
      OPT_KEYS.forEach(k => { if (cOpts.has(k) && oOpts.has(k)) setVal(`o_${k}`, getRaw(`c_${k}`)) })
      const oBonus   = getRaw('c_bonus')
      const oWelfare = getRaw('c_welfare')
      setVal('o_bonus', oBonus)
      setVal('o_welfare', oWelfare)
      const oSigning = getRaw('o_signing')
      const oOptsNow = optActive['o']
      const optSum   = [...oOptsNow].reduce((s, k) => s + getRaw(`o_${k}`), 0)
      const absorbedKeys = [...cOpts].filter(k => !oOptsNow.has(k))
      const absorbedSum  = absorbedKeys.reduce((s, k) => s + getRaw(`c_${k}`), 0)
      const remaining = T - oBonus - oWelfare - optSum - oSigning
      setVal('o_base', Math.max(0, Math.round(remaining * 12 / 13)))
      if (retireMode['o'] !== 'auto') {
        retireMode['o'] = 'auto'
        const el = document.getElementById('o_retire') as HTMLInputElement
        el.readOnly = true; el.classList.add('auto-val')
        document.getElementById('o_retire_badge')!.className   = 'badge badge-auto'
        document.getElementById('o_retire_badge')!.textContent = '자동계산'
        document.getElementById('o_retire_hint')!.textContent  = '기본급 ÷ 12 자동 적용 · 배지 클릭으로 직접 입력'
      }
      updateAutoRetire('o')
      ;['o_base', 'o_bonus', 'o_welfare'].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement
        const v = parseInt(el.dataset.raw || '0', 10) || 0
        el.value = v > 0 ? v.toLocaleString('ko-KR') : ''
      })
      OPT_KEYS.forEach(k => {
        if (oOptsNow.has(k)) {
          const el = document.getElementById(`o_${k}`) as HTMLInputElement | null
          if (el) { const v = parseInt(el.dataset.raw || '0', 10) || 0; el.value = v > 0 ? v.toLocaleString('ko-KR') : '' }
        }
      })
      recalc()
      // 버튼 클릭 이벤트 추적
      trackEvent(mode === 'target' ? 'fill_target' : 'fill_min')
      if (absorbedSum > 0) {
        const names = absorbedKeys.map(k => OPT_LABEL[k]).join(', ')
        showToast(`${names} (${won(absorbedSum)}) → 대상 회사 기본급에 반영됐습니다.`)
      }
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
      OPT_KEYS.forEach(k => {
        if (cHas.has(k) && !oHas.has(k)) { const v = getRaw(`c_${k}`); losses.push(`${OPT_LABEL[k]}${v > 0 ? ' (' + won(v) + ')' : ''}`) }
        if (!cHas.has(k) && oHas.has(k)) { const v = getRaw(`o_${k}`); gains.push(`${OPT_LABEL[k]}${v > 0 ? ' (' + won(v) + ')' : ''}`) }
      })
      if (losses.length === 0 && gains.length === 0) { box.style.display = 'none'; return }
      box.style.display = ''
      let html = ''
      if (losses.length) html += `<div style="margin-bottom:6px"><span style="font-size:11px;color:var(--bad);margin-right:6px">▼ 이직 시 상실</span>` + losses.map(l => `<span class="item-tag loss">${l}</span>`).join('') + '</div>'
      if (gains.length)  html += `<div><span style="font-size:11px;color:var(--tgt);margin-right:6px">▲ 이직 시 획득</span>` + gains.map(g => `<span class="item-tag gain">${g}</span>`).join('') + '</div>'
      if (losses.length) {
        const lossTotal = losses.reduce((s, _, i) => { const k = OPT_KEYS.filter(k => cHas.has(k) && !oHas.has(k))[i]; return s + (k ? getRaw(`c_${k}`) : 0) }, 0)
        if (lossTotal > 0) html += `<div style="margin-top:8px;font-size:12px;color:var(--sub)">💡 상실 항목 연환산 합계 <b style="color:var(--bad)">${won(lossTotal)}</b> — 협상 시 이 금액을 기본급에 반영하도록 요구하세요.</div>`
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
      const box = document.getElementById('verdict-box')!
      box.style.borderColor = color
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
      const targetUp = parseInt((document.getElementById('rng-target') as HTMLInputElement).value, 10)
      const minUp    = parseInt((document.getElementById('rng-min') as HTMLInputElement).value, 10)
      const floor  = curTotal * (1 + minUp / 100)
      const target = curTotal * (1 + targetUp / 100)
      const anchor = curTotal * (1 + (targetUp + 8) / 100)
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
    document.querySelectorAll('input[inputmode="numeric"]').forEach(el => attachNum(el))
    document.getElementById('rng-target')!.addEventListener('input', function (this: HTMLInputElement) {
      document.getElementById('lbl-target')!.textContent = this.value + '%'; recalc()
    })
    document.getElementById('rng-min')!.addEventListener('input', function (this: HTMLInputElement) {
      document.getElementById('lbl-min')!.textContent = this.value + '%'; recalc()
    })
    ;['c_base', 'o_base'].forEach(id => {
      document.getElementById(id)!.addEventListener('input', () => {
        updateAutoRetire(id.startsWith('c') ? 'c' : 'o')
      })
    })

    // ── window에 노출 (JSX onClick에서 호출)
    ;(window as any).__salary = { toggleRetireMode, toggleOpt, autoFillOffer }

    recalc()

    // ── 페이지 view 이벤트 (최초 로드)
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

  // onClick 헬퍼 — useEffect 이후 window에서 가져옴
  const S = () => (window as any).__salary as {
    toggleRetireMode: (p: string) => void
    toggleOpt: (p: string, key: string, btn: HTMLElement) => void
    autoFillOffer: (mode: string) => void
  }

  return (
    <div className="salary-page">
      {/* 상단 네비게이션 — 인증 상태 포함 */}
      <SiteHeader backHref="/" />

      <div className="salary-wrap">
      <h1>연봉 비교·협상 계산기</h1>
      <p className="desc">모든 보상 항목을 총보상(Total Comp)으로 환산해 비교하고, 협상 3단계 금액을 산출합니다.</p>

      {/* ══ 입력 2열 ══ */}
      <div className="cols">

        {/* ── 현재 회사 ── */}
        <div className="panel">
          <div className="panel-title"><span className="dot" style={{ background: 'var(--cur)' }} />현재 회사</div>

          {/* 회사명 (선택) */}
          <div className="field" style={{ marginBottom: '16px' }}>
            <div className="field-header">
              <label htmlFor="c_company">회사명</label>
              <span style={{ fontSize: '11px', color: 'var(--sub2)' }}>선택 항목</span>
            </div>
            <input type="text" id="c_company" placeholder="회사명 검색 또는 직접 입력" list="salary-company-list" autoComplete="off" />
            <div className="hint">입력하지 않아도 계산이 가능합니다</div>
          </div>
          <div className="section-divider" />

          <div className="section-label">기본 보상</div>
          <div className="field">
            <div className="field-header"><label>기본급 (연)</label></div>
            <input type="text" inputMode="numeric" id="c_base" placeholder="0" data-raw="0" />
            <div className="hint">월 기본급 × 12</div>
          </div>
          <div className="field">
            <div className="field-header"><label>성과급·상여 (연)</label></div>
            <input type="text" inputMode="numeric" id="c_bonus" placeholder="0" data-raw="0" />
            <div className="hint">연간 변동 상여 합계</div>
          </div>
          <div className="field">
            <div className="field-header"><label>복지·수당 (연)</label></div>
            <input type="text" inputMode="numeric" id="c_welfare" placeholder="0" data-raw="0" />
            <div className="hint">식대·교통·통신·복지포인트 등</div>
          </div>

          <div className="section-divider" />
          <div className="section-label">퇴직급여</div>
          <div className="field">
            <div className="field-header">
              <label>퇴직급여 적립 (연)</label>
              <span className="badge badge-auto" id="c_retire_badge" onClick={() => S().toggleRetireMode('c')}>자동계산</span>
            </div>
            <input type="text" inputMode="numeric" id="c_retire" placeholder="0" data-raw="0" className="auto-val" readOnly />
            <div className="hint" id="c_retire_hint">기본급 ÷ 12 자동 적용 · 배지 클릭으로 직접 입력</div>
          </div>

          <div className="section-divider" />
          <div className="section-label">선택 항목 <span style={{ color: 'var(--sub2)', fontWeight: 400 }}>(해당하는 항목 선택)</span></div>
          <div className="opt-toggles" id="c_opt_toggles">
            <span className="opt-btn" data-key="equity"   onClick={(e) => S().toggleOpt('c', 'equity',   e.currentTarget as HTMLElement)}><span className="ico">📈</span>주식·RSU</span>
            <span className="opt-btn" data-key="corpcard" onClick={(e) => S().toggleOpt('c', 'corpcard', e.currentTarget as HTMLElement)}><span className="ico">💳</span>법인카드</span>
            <span className="opt-btn" data-key="car"      onClick={(e) => S().toggleOpt('c', 'car',      e.currentTarget as HTMLElement)}><span className="ico">🚗</span>차량 지원</span>
            <span className="opt-btn" data-key="edu"      onClick={(e) => S().toggleOpt('c', 'edu',      e.currentTarget as HTMLElement)}><span className="ico">📚</span>교육비</span>
            <span className="opt-btn" data-key="housing"  onClick={(e) => S().toggleOpt('c', 'housing',  e.currentTarget as HTMLElement)}><span className="ico">🏠</span>주거 지원</span>
            <span className="opt-btn" data-key="etc"      onClick={(e) => S().toggleOpt('c', 'etc',      e.currentTarget as HTMLElement)}><span className="ico">➕</span>기타</span>
          </div>
          <div className="opt-fields" id="c_opt_fields">
            <div className="panel2">
              <div id="c_field_equity"   style={{ display: 'none' }}><div className="field"><div className="field-header"><label>📈 주식·RSU (연환산)</label></div><input type="text" inputMode="numeric" id="c_equity"   placeholder="0" data-raw="0" /><div className="hint">스톡옵션·RSU 1년치 환산액 (베스팅 기준)</div></div></div>
              <div id="c_field_corpcard" style={{ display: 'none' }}><div className="field"><div className="field-header"><label>💳 법인카드 (연간 실사용액)</label></div><input type="text" inputMode="numeric" id="c_corpcard" placeholder="0" data-raw="0" /><div className="hint">업무 목적 실사용 혜택 연환산 (실질 가처분 기준)</div></div></div>
              <div id="c_field_car"      style={{ display: 'none' }}><div className="field"><div className="field-header"><label>🚗 차량 지원 (연간)</label></div><input type="text" inputMode="numeric" id="c_car"      placeholder="0" data-raw="0" /><div className="hint">유류비·리스·주차비 지원액 합계</div></div></div>
              <div id="c_field_edu"      style={{ display: 'none' }}><div className="field"><div className="field-header"><label>📚 교육비 지원 (연간)</label></div><input type="text" inputMode="numeric" id="c_edu"      placeholder="0" data-raw="0" /><div className="hint">자격증·대학원·외부교육 지원액</div></div></div>
              <div id="c_field_housing"  style={{ display: 'none' }}><div className="field"><div className="field-header"><label>🏠 주거 지원 (연간)</label></div><input type="text" inputMode="numeric" id="c_housing"  placeholder="0" data-raw="0" /><div className="hint">사택·월세 보조 연간 지원액</div></div></div>
              <div id="c_field_etc"      style={{ display: 'none' }}><div className="field"><div className="field-header"><label>➕ 기타 수당 (연간)</label></div><input type="text" inputMode="numeric" id="c_etc"      placeholder="0" data-raw="0" /><div className="hint">위에 해당하지 않는 기타 보상</div></div></div>
            </div>
          </div>
          <div className="total-row">
            <span style={{ color: 'var(--sub)' }}>총보상</span>
            <span id="c_total" style={{ color: 'var(--cur)' }}>0원</span>
          </div>
        </div>

        {/* ── 대상 회사 ── */}
        <div className="panel">
          <div className="panel-title"><span className="dot" style={{ background: 'var(--tgt)' }} />대상 회사 제안</div>

          {/* 회사명 (선택) */}
          <div className="field" style={{ marginBottom: '16px' }}>
            <div className="field-header">
              <label htmlFor="o_company">회사명</label>
              <span style={{ fontSize: '11px', color: 'var(--sub2)' }}>선택 항목</span>
            </div>
            <input type="text" id="o_company" placeholder="회사명 검색 또는 직접 입력" list="salary-company-list" autoComplete="off" />
            <div className="hint">입력하지 않아도 계산이 가능합니다</div>
          </div>
          <div className="section-divider" />

          <div className="section-label">기본 보상</div>
          <div className="field">
            <div className="field-header"><label>기본급 (연)</label></div>
            <input type="text" inputMode="numeric" id="o_base" placeholder="0" data-raw="0" />
            <div className="hint">월 기본급 × 12</div>
          </div>
          <div className="field">
            <div className="field-header"><label>성과급·상여 (연)</label></div>
            <input type="text" inputMode="numeric" id="o_bonus" placeholder="0" data-raw="0" />
            <div className="hint">연간 변동 상여 합계</div>
          </div>
          <div className="field">
            <div className="field-header"><label>사이닝 보너스</label></div>
            <input type="text" inputMode="numeric" id="o_signing" placeholder="0" data-raw="0" />
            <div className="hint">입사 시 일회성 지급액</div>
          </div>
          <div className="field">
            <div className="field-header"><label>복지·수당 (연)</label></div>
            <input type="text" inputMode="numeric" id="o_welfare" placeholder="0" data-raw="0" />
            <div className="hint">식대·교통·통신·복지포인트 등</div>
          </div>

          <div className="section-divider" />
          <div className="section-label">퇴직급여</div>
          <div className="field">
            <div className="field-header">
              <label>퇴직급여 적립 (연)</label>
              <span className="badge badge-auto" id="o_retire_badge" onClick={() => S().toggleRetireMode('o')}>자동계산</span>
            </div>
            <input type="text" inputMode="numeric" id="o_retire" placeholder="0" data-raw="0" className="auto-val" readOnly />
            <div className="hint" id="o_retire_hint">기본급 ÷ 12 자동 적용 · 배지 클릭으로 직접 입력</div>
          </div>

          <div className="section-divider" />
          <div className="section-label">선택 항목 <span style={{ color: 'var(--sub2)', fontWeight: 400 }}>(해당하는 항목 선택)</span></div>
          <div className="opt-toggles" id="o_opt_toggles">
            <span className="opt-btn" data-key="equity"   onClick={(e) => S().toggleOpt('o', 'equity',   e.currentTarget as HTMLElement)}><span className="ico">📈</span>주식·RSU</span>
            <span className="opt-btn" data-key="corpcard" onClick={(e) => S().toggleOpt('o', 'corpcard', e.currentTarget as HTMLElement)}><span className="ico">💳</span>법인카드</span>
            <span className="opt-btn" data-key="car"      onClick={(e) => S().toggleOpt('o', 'car',      e.currentTarget as HTMLElement)}><span className="ico">🚗</span>차량 지원</span>
            <span className="opt-btn" data-key="edu"      onClick={(e) => S().toggleOpt('o', 'edu',      e.currentTarget as HTMLElement)}><span className="ico">📚</span>교육비</span>
            <span className="opt-btn" data-key="housing"  onClick={(e) => S().toggleOpt('o', 'housing',  e.currentTarget as HTMLElement)}><span className="ico">🏠</span>주거 지원</span>
            <span className="opt-btn" data-key="etc"      onClick={(e) => S().toggleOpt('o', 'etc',      e.currentTarget as HTMLElement)}><span className="ico">➕</span>기타</span>
          </div>
          <div className="opt-fields" id="o_opt_fields">
            <div className="panel2">
              <div id="o_field_equity"   style={{ display: 'none' }}><div className="field"><div className="field-header"><label>📈 주식·RSU (연환산)</label></div><input type="text" inputMode="numeric" id="o_equity"   placeholder="0" data-raw="0" /><div className="hint">스톡옵션·RSU 1년치 환산액 (베스팅 기준)</div></div></div>
              <div id="o_field_corpcard" style={{ display: 'none' }}><div className="field"><div className="field-header"><label>💳 법인카드 (연간 실사용액)</label></div><input type="text" inputMode="numeric" id="o_corpcard" placeholder="0" data-raw="0" /><div className="hint">업무 목적 실사용 혜택 연환산</div></div></div>
              <div id="o_field_car"      style={{ display: 'none' }}><div className="field"><div className="field-header"><label>🚗 차량 지원 (연간)</label></div><input type="text" inputMode="numeric" id="o_car"      placeholder="0" data-raw="0" /><div className="hint">유류비·리스·주차비 지원액 합계</div></div></div>
              <div id="o_field_edu"      style={{ display: 'none' }}><div className="field"><div className="field-header"><label>📚 교육비 지원 (연간)</label></div><input type="text" inputMode="numeric" id="o_edu"      placeholder="0" data-raw="0" /><div className="hint">자격증·대학원·외부교육 지원액</div></div></div>
              <div id="o_field_housing"  style={{ display: 'none' }}><div className="field"><div className="field-header"><label>🏠 주거 지원 (연간)</label></div><input type="text" inputMode="numeric" id="o_housing"  placeholder="0" data-raw="0" /><div className="hint">사택·월세 보조 연간 지원액</div></div></div>
              <div id="o_field_etc"      style={{ display: 'none' }}><div className="field"><div className="field-header"><label>➕ 기타 수당 (연간)</label></div><input type="text" inputMode="numeric" id="o_etc"      placeholder="0" data-raw="0" /><div className="hint">위에 해당하지 않는 기타 보상</div></div></div>
            </div>
          </div>
          <div className="total-row">
            <span style={{ color: 'var(--sub)' }}>총보상</span>
            <span id="o_total" style={{ color: 'var(--tgt)' }}>0원</span>
          </div>
        </div>
      </div>

      {/* ══ 협상 파라미터 ══ */}
      <div className="panel" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>협상 기준 설정</span>
          <span style={{ fontSize: '11px', color: 'var(--sub2)' }}>버튼 클릭 시 대상 회사 금액 자동 산출</span>
        </div>
        <div className="param-grid">
          <div>
            <div className="slider-label">
              <span>목표 인상률</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span id="lbl-target" style={{ color: 'var(--tgt)' }}>20%</span>
                <button className="fill-btn fill-btn-tgt" onClick={() => S().autoFillOffer('target')}>목표로 채우기 →</button>
              </div>
            </div>
            <input type="range" id="rng-target" min="0" max="60" defaultValue="20" />
          </div>
          <div>
            <div className="slider-label">
              <span>최소 수용 인상률</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span id="lbl-min" style={{ color: 'var(--warn)' }}>10%</span>
                <button className="fill-btn fill-btn-warn" onClick={() => S().autoFillOffer('min')}>최저로 채우기 →</button>
              </div>
            </div>
            <input type="range" id="rng-min" min="0" max="60" defaultValue="10" />
          </div>
        </div>
      </div>

      {/* ══ 총보상 비교 ══ */}
      <div className="panel" style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>총보상 비교</div>
        <div className="bar-row">
          <div className="bar-meta"><span style={{ color: 'var(--sub)' }}>현재</span><span id="bar-c-val" style={{ color: 'var(--cur)' }}>0원</span></div>
          <div className="bar-track"><div className="bar-fill" id="bar-c" style={{ background: 'var(--cur)', width: '0%' }} /></div>
        </div>
        <div className="bar-row" id="row-offer" style={{ display: 'none' }}>
          <div className="bar-meta"><span style={{ color: 'var(--sub)' }}>제안</span><span id="bar-o-val" style={{ color: 'var(--tgt)' }}>0원</span></div>
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

      {/* ══ 실수령액 비교 ══ */}
      <div className="panel" style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>실수령액 비교</div>
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
              <span className="dot" style={{ background: 'var(--tgt)' }} />대상 회사 제안
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

      {/* ══ 협상 3단계 ══ */}
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

      {/* ══ 판정 ══ */}
      <div id="verdict-wrap" style={{ display: 'none' }}>
        <div className="verdict" id="verdict-box">
          <div className="verdict-title" id="v-title" />
          <div className="verdict-body"  id="v-body"  />
          <div className="verdict-sub"   id="v-sub"   />
        </div>
      </div>

      <p className="note">
        주식·RSU는 베스팅 일정·세금 별도 / 법인카드·차량 등 비과세 항목은 실질 가처분 기준으로 환산 / 실수령액은 2024년 세율 기준 근사치입니다.<br />
        본 계산은 협상 참고용이며 실제 합의는 직무·시장·개인 상황에 따라 달라집니다.
      </p>

      {/* 회사명 자동완성 목록 (주요 한국 기업) */}
      <datalist id="salary-company-list">
        {[
          '삼성전자','SK하이닉스','NAVER','카카오','카카오뱅크','토스(비바리퍼블리카)','현대자동차','기아','LG전자',
          'LG에너지솔루션','삼성SDI','SK이노베이션','POSCO홀딩스','현대모비스','삼성바이오로직스','셀트리온',
          '삼성물산','SK텔레콤','KT','LG유플러스','쿠팡','우아한형제들(배달의민족)','직방','당근마켓','야놀자',
          '여기어때','크래프톤','넥슨','NC소프트','펄어비스','데브시스터즈','컴투스','위메이드','스마일게이트',
          '카카오게임즈','라인플러스','하이브','SM엔터테인먼트','JYP엔터테인먼트','CJ ENM','현대건설',
          '삼성엔지니어링','GS건설','DL이앤씨','SK에코플랜트','포스코건설','롯데건설','대우건설','HDC현대산업개발',
          'KB국민은행','신한은행','하나은행','우리은행','NH농협은행','IBK기업은행','한국산업은행',
          'KB증권','미래에셋증권','NH투자증권','삼성증권','키움증권','한국투자증권','메리츠증권','신한투자증권',
          '삼성화재','DB손해보험','현대해상','메리츠화재','KB손해보험','한화손해보험',
          '삼성생명','한화생명','교보생명','신한라이프','NH농협생명',
          '아모레퍼시픽','LG생활건강','한국콜마','코스맥스','애경산업',
          'CJ제일제당','롯데제과','오리온','빙그레','농심','풀무원','하림','동원F&B','대상',
          'LG CNS','삼성SDS','SK C&C','현대오토에버','포스코DX','KT DS','롯데정보통신',
          '대한항공','아시아나항공','제주항공','진에어','티웨이항공','에어부산',
          'CJ대한통운','한진','롯데글로벌로지스','현대글로비스','HMM',
          'SK에너지','GS칼텍스','에쓰오일','현대오일뱅크',
          '한국전력공사','한국가스공사','한국수력원자력','한국동서발전','한국남부발전','한국중부발전','한국서부발전',
          '코레일(한국철도공사)','서울교통공사','인천국제공항공사','한국공항공사',
          '롯데쇼핑','이마트','GS리테일','BGF리테일','현대백화점','신세계','AK플라자',
          '올리브영','무신사','29CM','W컨셉','에이블리','지그재그',
          '마켓컬리','SSG닷컴','11번가','G마켓','옥션','인터파크','위메프',
          '쏘카','카카오모빌리티','카카오T','버킷플레이스(오늘의집)','왓챠','웨이브',
          '카카오엔터테인먼트','네이버웹툰','카카오웹툰',
          '한화시스템','한화에어로스페이스','LIG넥스원','한국항공우주산업(KAI)',
          '현대제철','고려아연','포스코인터내셔널','LS전선','LS일렉트릭',
          '롯데케미칼','LG화학','SK케미칼','한화솔루션','효성화학',
          '한국타이어','금호타이어','넥센타이어',
        ].map(c => <option key={c} value={c} />)}
      </datalist>

      </div>
    </div>
  )
}
