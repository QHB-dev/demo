import React, { useMemo, useState } from "react";
import { Activity, Camera, ChevronRight, Dumbbell, HeartPulse, Home, LineChart, RefreshCcw, Sparkles, Users, UserRound } from "lucide-react";

const USER_STATES = {
  "我今天很累": { style: "recovery", delta: -4, cap: 8, note: "今天不用硬撑，恢复训练也算一次成功。" },
  "我只有 5 分钟": { style: "reset", delta: -6, cap: 5, note: "时间很少也没关系，目标是不断线。" },
  "我只有 10 分钟": { style: "balanced", delta: 0, cap: 10, note: "10 分钟足够完成一次低冲击燃脂。" },
  "我想出汗": { style: "energizing", delta: 3, cap: 20, note: "今天可以认真一点，但仍保持低冲击。" },
  "我只想拉伸": { style: "stretch", delta: -3, cap: 8, note: "用拉伸恢复身体，也是有效行动。" },
  "我今天压力很大": { style: "reset", delta: -5, cap: 6, note: "先把身体从压力里拉回来。" },
};

const PHASES = {
  Restart: { cn: "重启期", base: 7, min: 4, max: 10, focus: "建立重新开始的信心" },
  Build: { cn: "养成期", base: 10, min: 6, max: 14, focus: "稳定微运动习惯" },
  Upgrade: { cn: "老手模式", base: 14, min: 8, max: 20, focus: "提升训练效率" },
};

const WORKOUTS = {
  reset: ["1 分钟呼吸放松", "肩颈舒展", "坐姿抬膝", "床边伸展", "原地轻走", "手臂画圈"],
  recovery: ["睡前拉伸", "猫牛式伸展", "站姿体侧拉伸", "髋部打开", "缓步走动", "低强度核心激活"],
  stretch: ["颈肩放松", "胸椎打开", "腿后侧拉伸", "靠墙小腿拉伸", "髋部环绕", "深呼吸放松"],
  balanced: ["椅子深蹲", "站姿核心收紧", "墙面俯卧撑", "低冲击开合步", "臀桥", "原地快走"],
  energizing: ["深蹲", "站姿提膝", "低冲击波比替代", "核心卷腹替代动作", "交替后撤箭步蹲", "快节奏原地走"],
  strength: ["下肢力量循环", "臀腿强化组合", "核心稳定训练", "低冲击 HIIT", "平板支撑触肩", "核心燃脂收尾"],
};

const RESET_OPTIONS = {
  soft: { title: "4 分钟恢复训练", minutes: 4, style: "reset" },
  sweat: { title: "10 分钟轻出汗训练", minutes: 10, style: "balanced" },
  back: { title: "15 分钟重新进入计划", minutes: 15, style: "energizing" },
};

const RESET_REASONS = {
  "工作太忙": { option: "soft", insight: "你不是不想坚持，而是时间被挤压了。今天先用 4 分钟恢复连续性。", reminder: "工作日傍晚改成更短提醒，降低负担。" },
  "身体不舒服": { option: "soft", insight: "身体不舒服时不适合强推训练，先做低冲击恢复和拉伸。", reminder: "未来检测到睡眠差或酸痛高，自动切到保护版。" },
  "没看到效果": { option: "sweat", insight: "体重没变化不代表没进步，今天用 10 分钟轻出汗找回反馈感。", reminder: "优先展示围度、步数、完成次数和身体轻盈感。" },
  "情绪不好": { option: "soft", insight: "情绪低落时先降低开始成本，用 4 分钟完成一次成功重启。", reminder: "减少压力话术，增加温柔鼓励。" },
  "想重新认真开始": { option: "back", insight: "你已经准备好回到计划，可以用 15 分钟重新进入节奏。", reminder: "保持进阶提醒，但保留一键降级。" },
};

const MEALS = {
  high: { title: "恢复型健康饮食", breakfast: "燕麦 + 牛奶/豆奶 + 香蕉", lunch: "鸡肉/豆类 + 米饭 + 熟蔬菜", dinner: "汤类 + 蛋白质 + 蔬菜", principle: "高压力日不要极端控卡，先稳定血糖和食欲。" },
  medium: { title: "低压力稳定饮食", breakfast: "鸡蛋 + 燕麦/全麦面包 + 水果", lunch: "蛋白质 + 蔬菜 + 适量主食", dinner: "七分饱，优先蛋白质和蔬菜", principle: "重点是规律和稳定，而不是吃得很少。" },
  low: { title: "高状态平衡饮食", breakfast: "酸奶/鸡蛋 + 全麦吐司 + 水果", lunch: "鸡胸肉/豆腐 + 糙米/土豆 + 蔬菜", dinner: "鱼类/瘦肉 + 沙拉 + 适量复合碳水", principle: "保持轻微热量缺口，不极端节食。" },
};

const visionTips = {
  "椅子深蹲": "膝盖方向基本正确，下蹲时臀部向后坐，避免膝盖内扣。",
  "墙面俯卧撑": "肩、髋、脚跟保持一条直线，推起时不要耸肩。",
  "深蹲": "动作略快，建议降低速度，保持核心收紧。",
  default: "动作整体稳定，继续保持慢速和低冲击。",
};

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function getPhase(activeDays, streak, interruptions, completionRate) {
  if (interruptions >= 4 || completionRate < 45) return "Restart";
  if ((activeDays >= 21 || streak >= 14) && completionRate >= 70 && interruptions <= 2) return "Upgrade";
  if ((activeDays >= 8 || streak >= 7) && completionRate >= 55 && interruptions <= 3) return "Build";
  return "Restart";
}
function getDifficulty(phase, activeDays, streak, interruptions, completionRate, injury) {
  if (injury === "膝盖/腰背不适") return { label: "保护版", score: 1 };
  if (phase === "Upgrade" && activeDays >= 28 && streak >= 21 && completionRate >= 80 && interruptions <= 1) return { label: "老手强化", score: 4 };
  if (phase === "Upgrade") return { label: "老手入门", score: 3 };
  if (phase === "Build") return { label: "进阶基础", score: 2 };
  return { label: "轻量重启", score: 1 };
}
function getHealth({ mood, energy, sleep, sore, water, protein, veg, snacks, steps, waistChange, lightness }) {
  const food = clamp((water / 8) * 16, 0, 16) + clamp((protein / 3) * 10, 0, 10) + clamp((veg / 3) * 10, 0, 10) - clamp(snacks * 5, 0, 30);
  const state = (mood + energy + sleep + lightness) * 4 - Math.max(0, sore - 2) * 6;
  const move = clamp((steps / 8000) * 16, 0, 16);
  const waist = waistChange < 0 ? 8 : waistChange === 0 ? 3 : 0;
  return clamp(Math.round(food + state + move + waist), 20, 100);
}
function getPlan({ state, phase, difficulty, mood, energy, sleep, sore, health, injury, reset }) {
  const config = USER_STATES[state];
  const phaseBase = PHASES[phase].base;
  const deltas = [
    ["阶段基础", phaseBase],
    ["状态调整", config.delta],
    ["心情调整", mood >= 4 ? 1 : mood <= 2 ? -2 : 0],
    ["精力调整", energy >= 4 ? 2 : energy <= 2 ? -3 : 0],
    ["睡眠调整", sleep >= 4 ? 1 : sleep <= 2 ? -3 : 0],
    ["酸痛调整", sore >= 4 ? -4 : sore <= 2 ? 1 : 0],
    ["健康程度", health >= 80 ? 2 : health < 50 ? -3 : 0],
    ["难度等级", difficulty.score >= 4 ? 3 : difficulty.score >= 2 ? 1 : 0],
    ["风险保护", injury === "膝盖/腰背不适" ? -4 : 0],
  ];
  let minutes = deltas.reduce((sum, [, v]) => sum + v, 0);
  minutes = clamp(minutes, PHASES[phase].min, PHASES[phase].max);
  if (config.cap) minutes = Math.min(minutes, config.cap);
  if (injury === "膝盖/腰背不适") minutes = Math.min(minutes, 8);
  let style = config.style;
  if (mood <= 2 || energy <= 2 || sleep <= 2 || sore >= 4) style = "reset";
  if (phase === "Upgrade" && difficulty.score >= 4 && style === "energizing") style = "strength";
  if (reset) { minutes = RESET_OPTIONS[reset].minutes; style = RESET_OPTIONS[reset].style; }
  const count = minutes <= 5 ? 3 : minutes <= 8 ? 4 : minutes <= 12 ? 5 : 6;
  const exercises = WORKOUTS[style].slice(0, count);
  const bucket = mood <= 2 || energy <= 2 || sleep <= 2 || sore >= 4 ? "high" : mood >= 4 && energy >= 4 ? "low" : "medium";
  return { minutes: Math.round(minutes), style, exercises, deltas, meal: MEALS[bucket], calories: Math.round(70 + minutes * 8 + difficulty.score * 12), coach: config.note };
}
function getReset(reason, daysAway, completionRate, weightChanged, mood, energy, sleep) {
  const item = RESET_REASONS[reason];
  let option = item.option;
  if (daysAway >= 5 || mood <= 2 || energy <= 2 || sleep <= 2) option = "soft";
  if (reason === "没看到效果" && completionRate >= 70 && !weightChanged) option = "sweat";
  if (reason === "想重新认真开始" && mood >= 4 && energy >= 4) option = "back";
  return { ...item, option, plan: RESET_OPTIONS[option] };
}

function Card({ children, className = "" }) { return <div className={`rounded-[28px] border border-slate-100 bg-white shadow-sm ${className}`}>{children}</div>; }
function Button({ children, active = false, className = "", ...props }) { return <button className={`rounded-2xl px-4 py-2 text-sm font-bold transition active:scale-[0.98] ${active ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50"} ${className}`} {...props}>{children}</button>; }
function Stat({ label, value, sub, green = false }) { return <div className={`${green ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-900"} rounded-2xl p-4`}><p className="text-xs font-bold opacity-70">{label}</p><p className="mt-1 text-2xl font-black">{value}</p>{sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}</div>; }
function Bar({ label, value }) { return <div><div className="mb-2 flex justify-between text-sm"><span className="font-bold">{label}</span><span className="text-slate-500">{value}%</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-500" style={{ width: `${value}%` }} /></div></div>; }
function Choice({ title, options, value, onChange }) { return <div><p className="mb-2 text-sm font-bold">{title}</p><div className="flex flex-wrap gap-2">{options.map((x) => <Button key={x} active={value === x} onClick={() => onChange(x)}>{x}</Button>)}</div></div>; }
function Stepper({ label, value, setValue, min = 0, max = 10, step = 1, suffix = "" }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-black">{label}</p><p className="mt-1 text-2xl font-black text-emerald-600">{value}{suffix}</p></div><div className="flex gap-2"><button onClick={() => setValue((v) => clamp(Number((v - step).toFixed(1)), min, max))} className="h-9 w-9 rounded-xl bg-white font-black shadow-sm">−</button><button onClick={() => setValue((v) => clamp(Number((v + step).toFixed(1)), min, max))} className="h-9 w-9 rounded-xl bg-emerald-600 font-black text-white">+</button></div></div></div>; }

export default function App() {
  const [tab, setTab] = useState("today");
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [goal, setGoal] = useState("可持续减重");
  const [failureReason, setFailureReason] = useState("懒得开始");
  const [timeAvailable, setTimeAvailable] = useState("10分钟");
  const [emotionalEating, setEmotionalEating] = useState("偶尔");
  const [state, setState] = useState("我今天很累");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [sore, setSore] = useState(2);
  const [lightness, setLightness] = useState(3);
  const [injury, setInjury] = useState("无明显不适");
  const [sittingHours, setSittingHours] = useState(8);
  const [water, setWater] = useState(4);
  const [protein, setProtein] = useState(2);
  const [veg, setVeg] = useState(2);
  const [snacks, setSnacks] = useState(1);
  const [waist, setWaist] = useState(72.5);
  const [lastWaist] = useState(73.2);
  const [hip, setHip] = useState(96);
  const [activeDays, setActiveDays] = useState(9);
  const [streak, setStreak] = useState(5);
  const [interruptions, setInterruptions] = useState(1);
  const [completionRate, setCompletionRate] = useState(72);
  const [weightChanged, setWeightChanged] = useState(false);
  const [daysAway, setDaysAway] = useState(3);
  const [resetReason, setResetReason] = useState("工作太忙");
  const [resetOverride, setResetOverride] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState("椅子深蹲");
  const [cameraOn, setCameraOn] = useState(false);
  const [postureMode, setPostureMode] = useState("动作标准");
  const [completed, setCompleted] = useState(false);
  const [weeklyMinutes, setWeeklyMinutes] = useState(52);
  const [steps, setSteps] = useState(6800);
  const [chat, setChat] = useState(["早上好，我会根据你的状态、健康记录和阶段自动调整运动时间。"]);
  const [coachInput, setCoachInput] = useState("");

  const phase = useMemo(() => getPhase(activeDays, streak, interruptions, completionRate), [activeDays, streak, interruptions, completionRate]);
  const difficulty = useMemo(() => getDifficulty(phase, activeDays, streak, interruptions, completionRate, injury), [phase, activeDays, streak, interruptions, completionRate, injury]);
  const health = useMemo(() => getHealth({ mood, energy, sleep, sore, water, protein, veg, snacks, steps, waistChange: waist - lastWaist, lightness }), [mood, energy, sleep, sore, water, protein, veg, snacks, steps, waist, lastWaist, lightness]);
  const plan = useMemo(() => getPlan({ state, phase, difficulty, mood, energy, sleep, sore, health, injury, reset: resetOverride }), [state, phase, difficulty, mood, energy, sleep, sore, health, injury, resetOverride]);
  const reset = useMemo(() => getReset(resetReason, daysAway, completionRate, weightChanged, mood, energy, sleep), [resetReason, daysAway, completionRate, weightChanged, mood, energy, sleep]);
  const unlock = clamp(Math.round((streak / 14) * 45 + (activeDays / 21) * 35 + (completionRate / 100) * 20 - interruptions * 8), 0, 100);
  const waistChange = Number((waist - lastWaist).toFixed(1));
  const visionScore = postureMode === "动作标准" ? 92 : 68;
  const visionTip = postureMode === "动作标准" ? `动作质量不错：${visionTips[selectedExercise] || visionTips.default}` : `AI 检测到动作需要调整：${visionTips[selectedExercise] || visionTips.default}`;

  function finishWorkout() {
    setCompleted(true);
    setStreak((v) => v + 1);
    setActiveDays((v) => v + 1);
    setWeeklyMinutes((v) => v + plan.minutes);
    setSteps((v) => v + plan.minutes * 75);
    setLightness((v) => clamp(v + 1, 1, 5));
    setDaysAway(0);
    setChat((xs) => [...xs, "完成得很好。今天记录的是一次成功行动，不是体重数字。"]);
  }
  function chooseReset(option) {
    setResetOverride(option);
    setTab("today");
    setDaysAway(0);
    setChat((xs) => [...xs, "欢迎回来。中断不会清零，这次会记录为一次成功重启。"]);
  }
  function sendMessage() {
    if (!coachInput.trim()) return;
    const reply = health < 50 ? "健康程度偏低，今天减少运动时间，优先恢复和补水。" : phase === "Upgrade" ? "你已进入老手模式，但状态差时仍会自动降级。" : "今天按推荐计划完成即可，结束后记录一个非体重进步。";
    setChat((xs) => [...xs, coachInput, reply]);
    setCoachInput("");
  }

  const nav = [
    ["today", Home, "Today"], ["coach", RefreshCcw, "AI Coach"], ["progress", LineChart, "Progress"], ["community", Users, "Community"], ["profile", UserRound, "Profile"], ["premium", Sparkles, "Premium"],
  ];

  return <div className="min-h-screen bg-[#F6F8F3] text-slate-900"><div className="flex min-h-screen">
    <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white p-5 md:block"><div className="mb-8 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-600 text-xl font-black text-white">E</div><div><p className="text-xl font-black">EaseFit</p><p className="text-xs text-slate-500">AI companion</p></div></div><div className="space-y-2">{nav.map(([key, Icon, label]) => <button key={key} onClick={() => setTab(key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold ${tab === key ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon size={18}/>{label}</button>)}</div></aside>
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:px-8 md:pb-10">
      <div className="mb-6 flex items-center justify-between md:hidden"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-emerald-600 font-black text-white">E</div><div><p className="font-black">EaseFit</p><p className="text-xs text-slate-500">AI companion</p></div></div><button onClick={() => setTab("premium")} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Premium</button></div>

      {!onboardingDone && <Card className="mb-6 overflow-hidden border-emerald-100"><div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="text-sm font-bold text-emerald-700">2-min Onboarding</p><h1 className="mt-2 text-3xl font-black">先判断你的减重困难类型</h1><p className="mt-3 leading-7 text-slate-600">EaseFit 快速理解你为什么过去没坚持下来，再给你一个更容易开始的计划。</p><div className="mt-5 rounded-3xl bg-emerald-50 p-5"><p className="text-sm font-bold text-emerald-700">当前判断</p><p className="mt-1 text-2xl font-black text-emerald-900">{emotionalEating === "经常" ? "情绪进食型" : timeAvailable === "5分钟" ? "时间碎片型" : failureReason === "懒得开始" ? "低动力重启型" : "久坐轻运动型"}</p><p className="mt-2 text-sm leading-6 text-emerald-800">你需要低压力但能逐步升级的计划，而不是一开始就高强度训练。</p></div></div><div className="space-y-5"><Choice title="你的目标是什么？" value={goal} onChange={setGoal} options={["可持续减重", "重新开始运动", "轻塑形"]}/><Choice title="每天通常有多少时间？" value={timeAvailable} onChange={setTimeAvailable} options={["5分钟", "10分钟", "15分钟"]}/><Choice title="过去为什么没有坚持？" value={failureReason} onChange={setFailureReason} options={["没时间", "懒得开始", "压力大", "看不到变化"]}/><Choice title="是否容易情绪性进食？" value={emotionalEating} onChange={setEmotionalEating} options={["很少", "偶尔", "经常"]}/><button onClick={() => setOnboardingDone(true)} className="w-full rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">完成 Onboarding，进入今日计划</button></div></div></Card>}

      {tab === "today" && <div className="space-y-6">{daysAway >= 2 && <Card className="border-orange-100 bg-orange-50 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="font-black text-orange-900">你已经 {daysAway} 天没打开 EaseFit</p><p className="mt-1 text-sm text-orange-800">这不是失败。要不要用 4 分钟重新开始？</p></div><button onClick={() => setTab("coach")} className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white">打开 Reset Coach</button></div></Card>}
        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><Card className="overflow-hidden bg-slate-950 text-white"><div className="p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-emerald-200">Today · {phase} {PHASES[phase].cn} · {difficulty.label}</p><h1 className="mt-2 text-3xl font-black md:text-5xl">{plan.minutes} 分钟{phase === "Upgrade" ? "进阶" : "微"}运动</h1><p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{plan.coach}</p></div><div className="rounded-3xl bg-white/10 p-4 text-4xl">{phase === "Upgrade" ? "⚡" : "🌿"}</div></div><div className="mt-6 grid gap-3 sm:grid-cols-4"><Stat label="健康程度" value={`${health}/100`} green/><Stat label="预计消耗" value={`${plan.calories} kcal`}/><Stat label="本周运动" value={`${weeklyMinutes} min`}/><Stat label="策略" value={injury === "膝盖/腰背不适" ? "保护版" : "标准版"}/></div></div></Card><Card className="p-6"><p className="text-sm font-bold text-slate-500">今天你的状态是？</p><div className="mt-4 space-y-4"><div className="flex flex-wrap gap-2">{Object.keys(USER_STATES).map((x) => <Button key={x} active={state === x} onClick={() => { setState(x); setResetOverride(null); }}>{x}</Button>)}</div><div><p className="mb-2 text-sm font-bold">心情 {mood}/5</p><input type="range" min="1" max="5" value={mood} onChange={(e) => setMood(Number(e.target.value))} className="w-full"/></div><div><p className="mb-2 text-sm font-bold">精力 {energy}/5</p><input type="range" min="1" max="5" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full"/></div><div><p className="mb-2 text-sm font-bold">睡眠 {sleep}/5</p><input type="range" min="1" max="5" value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="w-full"/></div><div><p className="mb-2 text-sm font-bold">身体酸痛 {sore}/5</p><input type="range" min="1" max="5" value={sore} onChange={(e) => setSore(Number(e.target.value))} className="w-full"/></div></div></Card></section>
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><Card className="p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-slate-500">Daily Plan · {difficulty.label}</p><h2 className="text-2xl font-black">今日动作</h2></div><Button active={completed} onClick={finishWorkout}>{completed ? "已完成 ✓" : "完成训练"}</Button></div><div className="rounded-3xl bg-emerald-50 p-4 text-emerald-900"><p className="text-xs font-black uppercase tracking-[0.15em]">Auto Growth</p><p className="mt-1 text-xl font-black">{phase} · {difficulty.label}</p><p className="mt-2 text-sm leading-6 opacity-80">系统根据坚持天数、完成率、中断次数和身体风险自动调整阶段与难度。</p></div><div className="mt-4 rounded-3xl bg-slate-50 p-4"><p className="text-sm font-black">为什么今天是 {plan.minutes} 分钟？</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{plan.deltas.map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-3 text-sm"><p className="text-slate-500">{label}</p><p className={`font-black ${value > 0 ? "text-emerald-600" : value < 0 ? "text-orange-600" : "text-slate-600"}`}>{value > 0 ? `+${value}` : value} min</p></div>)}</div></div><div className="mt-4 space-y-3">{plan.exercises.map((x, i) => <button key={x} onClick={() => setSelectedExercise(x)} className="flex w-full items-center justify-between rounded-2xl bg-emerald-50 p-4 text-left"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 font-black text-white">{i + 1}</div><div><p className="font-black">{x}</p><p className="text-xs text-slate-500">低冲击 · 可降级 · 可中断恢复</p></div></div><p className="text-sm font-bold text-slate-400">{Math.max(1, Math.round(plan.minutes / plan.exercises.length))}m</p></button>)}</div><div className="mt-4 rounded-3xl bg-slate-950 p-5 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-emerald-200">AI 影像动作指导</p><h3 className="mt-1 text-xl font-black">{selectedExercise}</h3></div><button onClick={() => setCameraOn(!cameraOn)} className={`rounded-2xl px-4 py-2 text-sm font-black ${cameraOn ? "bg-emerald-500" : "bg-white/10"}`}>{cameraOn ? "摄像头 ON" : "开启影像"}</button></div><div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1.2fr]"><div className="flex min-h-40 items-center justify-center rounded-3xl bg-white/10 text-center"><div><Camera className="mx-auto" size={48}/><p className="mt-2 text-sm text-slate-300">{cameraOn ? "AI 正在识别动作角度" : "开启后模拟识别姿势"}</p></div></div><div className="space-y-3"><Choice title="动作模拟" value={postureMode} onChange={setPostureMode} options={["动作标准", "需要纠正"]}/><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-emerald-100">动作评分</p><p className="mt-1 text-3xl font-black">{visionScore}/100</p><p className="mt-2 text-sm leading-6 text-slate-200">{visionTip}</p></div></div></div></div></Card><Card className="p-6"><p className="text-sm font-bold text-slate-500">Healthy Meal Plan</p><h2 className="mt-1 text-2xl font-black">{plan.meal.title}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Stat label="早餐" value={plan.meal.breakfast}/><Stat label="午餐" value={plan.meal.lunch}/><Stat label="晚餐" value={plan.meal.dinner}/><div className="rounded-2xl bg-emerald-50 p-4"><p className="font-black text-emerald-800">原则</p><p className="mt-1 text-sm text-emerald-700">{plan.meal.principle}</p></div></div></Card></section>
      </div>}

      {tab === "coach" && <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><Card className="p-6"><h1 className="text-3xl font-black">AI Reset Coach</h1><p className="mt-3 leading-7 text-slate-600">AI 先理解中断原因，再结合历史训练、步数、体重趋势和中断模式，推荐低压力重启方案。</p><div className="mt-5 rounded-3xl bg-orange-50 p-4"><p className="font-black text-orange-900">温柔召回</p><p className="mt-2 text-sm leading-6 text-orange-800">这几天可能有点忙，要不要用 4 分钟重新开始？中断不会清零，回来也是进步。</p></div><div className="mt-6"><Choice title="这次中断主要是因为什么？" value={resetReason} onChange={setResetReason} options={Object.keys(RESET_REASONS)}/></div><div className="mt-5 rounded-3xl bg-emerald-50 p-5"><p className="text-sm font-bold text-emerald-700">AI 推荐</p><h2 className="mt-1 text-2xl font-black text-emerald-900">{reset.plan.title}</h2><p className="mt-2 text-sm leading-6 text-emerald-800">{reset.insight}</p><button onClick={() => chooseReset(reset.option)} className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">按推荐方案重启</button></div><div className="mt-5 space-y-3">{Object.entries(RESET_OPTIONS).map(([key, item]) => <button key={key} onClick={() => chooseReset(key)} className={`w-full rounded-3xl p-4 text-left hover:bg-emerald-50 ${reset.option === key ? "bg-emerald-50 ring-2 ring-emerald-400" : "bg-slate-50"}`}><p className="font-black">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.minutes} 分钟 · {item.style}</p></button>)}</div></Card><Card className="flex min-h-[640px] flex-col p-6"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-3xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-500">历史流失模式学习</p><p className="mt-2 text-sm leading-6 text-slate-700">{daysAway >= 2 && interruptions >= 2 ? "你最近呈现中断后回归困难的模式，系统会提前推送 4 分钟 Reset。" : !weightChanged && completionRate >= 70 ? "你属于行动做了但体重反馈慢的风险，系统会优先展示非体重进步。" : "当前流失风险可控，保持轻提醒和阶段反馈。"}</p></div><div className="rounded-3xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-500">下次提前干预</p><p className="mt-2 text-sm leading-6 text-slate-700">{reset.reminder}</p></div></div><h2 className="mt-5 text-2xl font-black">Coach Chat</h2><div className="mt-4 flex-1 space-y-3 overflow-auto rounded-3xl bg-slate-50 p-4">{chat.map((m, i) => <div key={i} className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${i % 2 === 0 ? "bg-white text-slate-700" : "ml-auto bg-emerald-600 text-white"}`}>{m}</div>)}</div><div className="mt-4 flex gap-2"><input value={coachInput} onChange={(e) => setCoachInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="告诉 Coach 你今天的状态..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"/><button onClick={sendMessage} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white">发送</button></div></Card></div>}

      {tab === "progress" && <div className="space-y-5"><div><h1 className="text-3xl font-black">Progress Beyond Weight</h1><p className="mt-2 text-slate-600">体重是结果指标，行动和状态是过程指标。体重下降前，你也正在发生变化。</p></div><div className="grid gap-4 md:grid-cols-4"><Stat label="本周累计运动" value={`${weeklyMinutes + (completed ? plan.minutes : 0)} min`} sub="行动指标" green/><Stat label="完成次数" value={`${completed ? 6 : 5} 次`} sub="过程指标"/><Stat label="步数提升" value={`+${sittingHours >= 8 ? 18 : 10}%`} sub={`当前约 ${steps} 步/日`}/><Stat label="围度变化" value={`${waistChange > 0 ? "+" : ""}${waistChange} cm`} sub="不等于体重，但能看到身体变化" green={waistChange <= 0}/></div><div className="grid gap-5 lg:grid-cols-3"><Card className="p-6"><p className="text-sm font-bold text-slate-500">自动阶段判断</p><h2 className="mt-2 text-2xl font-black">{phase} · {difficulty.label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">系统根据坚持时间、完成率和中断次数自动判断是否进入老手模式。</p><div className="mt-4 rounded-2xl bg-slate-50 p-4"><Bar label="老手模式解锁进度" value={unlock}/></div></Card><Card className="space-y-5 p-6 lg:col-span-2"><div className="grid gap-3 sm:grid-cols-3"><Stat label="情绪状态" value={mood >= 4 ? "不错" : mood <= 2 ? "有压力" : "平稳"} sub={`${mood}/5`}/><Stat label="睡眠感受" value={sleep >= 4 ? "不错" : sleep <= 2 ? "偏差" : "一般"} sub={`${sleep}/5`}/><Stat label="身体轻盈感" value={lightness >= 4 ? "明显更轻" : "有一点改善"} sub={`${lightness}/5`} green/></div><Bar label="习惯养成" value={phase === "Restart" ? 42 : phase === "Build" ? 68 : 86}/><Bar label="运动信心" value={completed ? 76 : 58}/><Bar label="身体轻盈感" value={phase === "Upgrade" ? 82 : phase === "Build" ? 63 : 39}/></Card></div><Card className="p-6"><h2 className="text-2xl font-black">成长系统模拟</h2><p className="mt-2 text-sm text-slate-500">调节参数，观察阶段、难度和运动时间如何变化。</p><div className="mt-4 grid gap-5 md:grid-cols-5"><div><p className="mb-2 text-sm font-bold">坚持天数 {activeDays}</p><input type="range" min="0" max="35" value={activeDays} onChange={(e) => setActiveDays(Number(e.target.value))} className="w-full"/></div><div><p className="mb-2 text-sm font-bold">连续打卡 {streak}</p><input type="range" min="0" max="30" value={streak} onChange={(e) => setStreak(Number(e.target.value))} className="w-full"/></div><div><p className="mb-2 text-sm font-bold">完成率 {completionRate}%</p><input type="range" min="20" max="100" value={completionRate} onChange={(e) => setCompletionRate(Number(e.target.value))} className="w-full"/></div><div><p className="mb-2 text-sm font-bold">中断次数 {interruptions}</p><input type="range" min="0" max="6" value={interruptions} onChange={(e) => setInterruptions(Number(e.target.value))} className="w-full"/></div><Choice title="体重是否变化" value={weightChanged ? "有变化" : "无变化"} onChange={(v) => setWeightChanged(v === "有变化")} options={["无变化", "有变化"]}/></div></Card></div>}

      {tab === "community" && <div className="space-y-5"><h1 className="text-3xl font-black">Light Social</h1><p className="text-slate-600">只展示打卡、鼓励和阶段升级，不展示体重排名。</p><div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><Card className="p-6"><h2 className="text-2xl font-black">好友动态</h2>{[["Emma", "完成了 4 分钟恢复训练", "🌱"], ["Lucas", "连续打卡 15 天，解锁老手模式", "🔥"], ["Mia", "完成了进阶核心训练", "⭐"]].map(([name, text, emoji]) => <div key={name} className="mt-3 flex items-center gap-4 rounded-3xl bg-slate-50 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-2xl">{emoji}</div><div><p className="font-black">{name}</p><p className="text-sm text-slate-500">{text}</p></div></div>)}</Card><Card className="p-6"><h2 className="text-2xl font-black">小组挑战</h2><div className="mt-4 rounded-3xl bg-slate-950 p-5 text-white"><p className="text-sm text-emerald-200">7-Day Reset</p><p className="mt-2 text-3xl font-black">3/7 days</p><p className="mt-2 text-sm text-slate-300">每天完成一次 4-8 分钟低压力运动。</p></div></Card></div></div>}

      {tab === "profile" && <div className="space-y-5"><h1 className="text-3xl font-black">Profile & Health Records</h1><div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><Card className="p-6"><p className="text-sm font-bold text-slate-500">用户画像</p><h2 className="mt-2 text-2xl font-black">{goal} · {PHASES[phase].cn}</h2><p className="mt-2 text-sm leading-6 text-slate-600">健康程度会影响今日运动时间；状态好会适度增加，健康低或有风险会减少。</p><p className="mt-3 text-sm text-slate-600">健康程度：<span className="font-black text-emerald-600">{health}/100</span></p><div className="mt-5 space-y-4"><Choice title="目标" value={goal} onChange={setGoal} options={["可持续减重", "重新开始运动", "轻塑形"]}/><Choice title="身体风险" value={injury} onChange={setInjury} options={["无明显不适", "膝盖/腰背不适"]}/><div><p className="mb-2 text-sm font-bold">久坐 {sittingHours}h</p><input type="range" min="2" max="12" value={sittingHours} onChange={(e) => setSittingHours(Number(e.target.value))} className="w-full"/></div></div></Card><Card className="p-6"><h2 className="text-2xl font-black">健康记录</h2><p className="mt-2 text-sm text-slate-500">高糖零食次数越多，健康程度会下降；饮水、蛋白质、蔬菜会提高健康值。</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Stepper label="饮水" value={water} setValue={setWater} min={0} max={8} suffix="/8"/><Stepper label="蛋白质份数" value={protein} setValue={setProtein} min={0} max={5}/><Stepper label="蔬菜份数" value={veg} setValue={setVeg} min={0} max={5}/><Stepper label="高糖零食次数" value={snacks} setValue={setSnacks} min={0} max={6}/><Stepper label="腰围" value={waist} setValue={setWaist} min={50} max={120} step={0.5} suffix="cm"/><Stepper label="臀围" value={hip} setValue={setHip} min={70} max={140} step={0.5} suffix="cm"/></div><div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">当前健康程度 {health}/100：{health >= 80 ? "状态好，系统可以适度增加运动时间。" : health < 50 ? "恢复优先，系统会减少运动时间。" : "保持稳定，系统会推荐中等时长。"}</div></Card></div></div>}

      {tab === "premium" && <div className="space-y-5"><h1 className="text-3xl font-black">Premium</h1><div className="grid gap-5 lg:grid-cols-3"><Card className="p-6"><p className="text-sm font-bold text-slate-500">Free</p><h2 className="mt-2 text-3xl font-black">$0</h2><p className="mt-2 text-slate-600">基础计划、打卡、轻社交。</p></Card><Card className="p-6 ring-2 ring-emerald-500"><p className="text-sm font-bold text-emerald-700">Premium</p><h2 className="mt-2 text-3xl font-black">$9.99/mo</h2><p className="mt-2 text-slate-600">阶段课程、趋势复盘、饮食轻记录。</p></Card><Card className="p-6"><p className="text-sm font-bold text-orange-700">AI Coach Plus</p><h2 className="mt-2 text-3xl font-black">$14.99/mo</h2><p className="mt-2 text-slate-600">深度陪伴、7-Day Reset、中断召回。</p></Card></div></div>}
    </main>
  </div><div className="fixed bottom-4 left-1/2 z-40 grid w-[calc(100%-32px)] max-w-xl -translate-x-1/2 grid-cols-5 rounded-[28px] border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden">{nav.slice(0,5).map(([key, Icon, label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-2xl py-2 text-xs font-bold ${tab === key ? "bg-emerald-600 text-white" : "text-slate-500"}`}><Icon className="mx-auto mb-1" size={18}/>{label}</button>)}</div></div>;
}
