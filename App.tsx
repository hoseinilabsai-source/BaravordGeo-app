import { useState, useEffect } from 'react';
import { 
  Phone as PhoneIcon, User, MapPin, Briefcase, ShieldCheck, Building2, 
  CheckCircle2, HelpCircle, Calculator, TrendingUp, TrendingDown, Users,
  FileCode2, Copy, Check, ArrowLeft, Coins, Percent, Scale, 
  HelpCircle as InfoIcon, Sparkles, ChevronLeft, Settings, Smartphone
} from 'lucide-react';
import { DART_MAIN_CODE } from './src/dartCode';
import { iranProvincesAndCities } from './src/iran_data';

const surveyingServices: Record<string, Record<string, string[]>> = {
  'نقشه ثبتی ماده (۱۴۷)': { 'برداشت میدانی': ['برداشت عرصه و اعیان'] },
  'عملیات زمینی': {
    'برداشت میدانی': ['برداشت عوارض و مبلمان و تاسیسات شهری', 'برداشت بلوک شهری تا عمق یک پلاک', 'برداشت ترافیکی و المان های ترافیکی', 'برداشت پلاک و معابر اطراف', 'تهیه نقشه تعیین موقعیت ملک', 'تفکیک آپارتمان', 'نقشه تک خطی', 'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک', 'برداشت توپوگرافی معابر شهری جهت کد گذاری', 'ازبیلت عمرانی و تاسیسات', 'تعیین بر و کف پلاک'],
    'طراحی': ['دفع آبهای سطحی', 'طراحی پروفیل طولی و عرضی'],
    'پیاده سازی': ['پیاده سازی قطعات تفکیکی', 'پیاده سازی طرح اجرایی']
  },
  'عملیات سازه ساختمانی': {
    'برداشت': ['برداشت پلاک جهت منطبق با طرح سازه'],
    'پیاده سازی': ['آکس ستون و فنداسیون', 'کنترل شاغولی ستون']
  },
  'عملیات فتو مپ و تصویر برداری': {
    'برداشت': ['برداشت عوارض شهری', 'برداشت مسطحاتی و توپوگرافی عوارض معدنی', 'برداشت نما ساختمان']
  }
};

function formatPersianCurrency(num: number): string { return Math.round(num).toLocaleString('fa-IR'); }
function formatPriceString(val: number): string { return (isNaN(val) || val === 0) ? '' : val.toLocaleString('en-US'); }
function parsePriceString(val: string): number {
  const parsed = parseInt(val.replace(/\D/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function getUnitForSubservice(sub: string): string {
  const units: Record<string, string> = {
    'برداشت عرصه و اعیان': 'نقطه‌ای', 'برداشت عوارض و مبلمان و تاسیسات شهری': 'هکتار (زیر یک هکتار)', 'برداشت بلوک شهری تا عمق یک پلاک': 'کیلومتر (زیر یک کیلومتر)', 'برداشت ترافیکی و المان های ترافیکی': 'کیلومتر (زیر یک کیلومتر)', 'برداشت پلاک و معابر اطراف': 'کیلومتر (زیر یک کیلومتر)', 'تهیه نقشه تعیین موقعیت ملک': 'نقطه‌ای', 'تفکیک آپارتمان': 'متر مربع قیمت ثابت به اضافه مشاعات', 'نقشه تک خطی': 'متر طول', 'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک': 'هکتار (زیر یک هکتار)', 'برداشت توپوگرافی معابر شهری جهت کد گذاری': 'هکتار (زیر یک هکتار)', 'ازبیلت عمرانی و تاسیسات': 'متر مربع قیمت ثابت به اضافه مشاعات', 'تعیین بر و کف پلاک': 'نقطه‌ای', 'دفع آبهای سطحی': 'پروژه (قیمت ثابت)', 'طراحی پروفیل طولی و عرضی': 'متر طول', 'پیاده سازی قطعات تفکیکی': 'متر مربع', 'پیاده سازی طرح اجرایی': 'متر مربع', 'برداشت پلاک جهت منطبق با طرح سازه': 'متر مربع', 'آکس ستون و فنداسیون': 'دهنه', 'کنترل شاغولی ستون': 'شاخه', 'برداشت عوارض شهری': 'هکتار (زیر یک هکتار)', 'برداشت مسطحاتی و توپوگرافی عوارض معدنی': 'هکتار (زیر یک هکتار)', 'برداشت نما ساختمان': 'متر مربع',
  };
  return units[sub] || 'انتخاب نشده';
}

function calculateSmartTariff(basePrice: number, volume: number, unitString: string, subBranch: string = ""): number {
  if (unitString.includes("زیر یک")) return basePrice * Math.max(1.0, volume);
  if (unitString.includes("قیمت ثابت") && !unitString.includes("به اضافه")) return basePrice;
  if (unitString.includes("قیمت ثابت به اضافه") || (unitString.includes("قیمت ثابت") && unitString.includes("به اضافه"))) {
    let X = 200.0;
    const match = /([0-9]+)\s+تا\s+([0-9]+)/.exec(unitString);
    if (match) X = parseFloat(match[1]) || 200.0;
    const extraVolume = Math.max(0.0, volume - X);
    let baseFixedPrice = basePrice;
    
    const tariffDatabase: Record<string, Record<string, number>> = {
      'همه': { 'برداشت عرصه و اعیان': 3500000, 'تهیه نقشه تعیین موقعیت ملک': 7600000, 'دفع آبهای سطحی': 35000000, 'نقشه تک خطی': 1500000, 'طراحی پروفیل طولی و عرضی': 2200000, 'پیاده سازی قطعات تفکیکی': 3000000, 'پیاده سازی طرح اجرایی': 4000000 },
      'شهرداری یزد': { 'برداشت عوارض و مبلمان و تاسیسات شهری': 6000000, 'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک': 18000000, 'برداشت توپوگرافی معابر شهری جهت کد گذاری': 15000000, 'تعیین بر و کف پلاک': 5000000, 'برداشت عوارض شهری': 7500000 },
      'نظام مهندسی ساختمان یزد': { 'تفکیک آپارتمان': 4500000, 'ازبیلت عمرانی و تاسیسات': 8000000, 'برداشت پلاک جهت منطبق با طرح سازه': 6500000, 'آکس ستون و فنداسیون': 2500000, 'کنترل شاغولی ستون': 1800000, 'برداشت نما ساختمان': 9000000 },
      'انجمن صنفی': { 'برداشت بلوک شهری تا عمق یک پلاک': 12000000, 'برداشت ترافیکی و المان های ترافیکی': 10000000, 'برداشت پلاک و معابر اطراف': 11000000, 'برداشت مسطحاتی و توپوگرافی عوارض معدنی': 14000000 },
    };

    for (const org of Object.keys(tariffDatabase)) {
      if (tariffDatabase[org][subBranch] && getUnitForSubservice(subBranch).includes("قیمت ثابت") && !getUnitForSubservice(subBranch).includes("به اضافه")) {
        baseFixedPrice = tariffDatabase[org][subBranch]; break;
      }
    }
    return baseFixedPrice + (extraVolume * basePrice);
  }
  return basePrice * volume;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  const [flowScreen, setFlowScreen] = useState<'auth' | 'estimation' | 'dashboard'>('auth');
  const [simulatedToast, setSimulatedToast] = useState<string | null>(null);
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const [authStep, setAuthStep] = useState<1 | 2 | 3 | 4>(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userRole, setUserRole] = useState<'surveyor' | 'client'>('surveyor');
  
  const [fullName, setFullName] = useState('');
  const [province, setProvince] = useState('یزد');
  const [city, setCity] = useState('یزد');
  const [experienceYears, setExperienceYears] = useState('۸');
  const [entityType, setEntityType] = useState<'حقیقی' | 'حقوقی'>('حقیقی');
  const [hasLicense, setHasLicense] = useState(true);
  const [isOfficialExpert, setIsOfficialExpert] = useState(false);

  const [estimationTab, setEstimationTab] = useState<1 | 2 | 3>(1);
  const [serviceType, setServiceType] = useState('نقشه ثبتی ماده (۱۴۷)');
  const [mainService, setMainService] = useState('برداشت میدانی');
  const [subBranch, setSubBranch] = useState('برداشت عرصه و اعیان');

  const [organization, setOrganization] = useState('همه');
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteBaseTariff, setRemoteBaseTariff] = useState<number | null>(3500000);

  useEffect(() => {
    let active = true;
    setIsRemoteLoading(true);
    const fetchLivePrice = async () => {
      try {
        const SUPABASE_URL = 'https://tzmtolgfejpqonjxemgy.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk';
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tariffs?select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
        });
        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const cleanStr = (s: any) => String(s || '').replace(/[\u200B-\u200D\uFEFF\s]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/آ/g, 'ا').replace(/[()]/g, '').toLowerCase();
            const match = data.find((row: any) => {
              const rowProv = cleanStr(row.province);
              const rowOrg = cleanStr(row.organization);
              return (!rowProv || rowProv === cleanStr(province) || rowProv === cleanStr('همه')) &&
                     cleanStr(row.sub_service) === cleanStr(subBranch) &&
                     (cleanStr(organization) === cleanStr('همه') || rowOrg === cleanStr(organization) || rowOrg === cleanStr('همه'));
            });
            setRemoteBaseTariff(match && match.price != null ? Number(match.price) : null);
          } else setRemoteBaseTariff(null);
        } else setRemoteBaseTariff(null);
      } catch (e) {
        setRemoteBaseTariff(null);
      } finally {
        if (active) setIsRemoteLoading(false);
      }
    };
    fetchLivePrice();
    return () => { active = false; };
  }, [subBranch, province, organization]);

  const [volume, setVolume] = useState('۱۲');
  const [fieldDays, setFieldDays] = useState('۴');

  const [supervisorUnit, setSupervisorUnit] = useState<'daily' | 'half' | 'flat'>('daily');
  const [assistantUnit, setAssistantUnit] = useState<'daily' | 'half' | 'flat'>('daily');
  const [totalStationUnit, setTotalStationUnit] = useState<'daily' | 'half' | 'flat'>('daily');
  const [gpsUnit, setGpsUnit] = useState<'daily' | 'half' | 'flat'>('daily');
  const [scannerUnit, setScannerUnit] = useState<'daily' | 'half' | 'flat'>('flat');
  const [officeUnit, setOfficeUnit] = useState<'daily' | 'half' | 'flat'>('flat');
  const [logisticsUnit, setLogisticsUnit] = useState<'daily' | 'half' | 'flat'>('flat');
  const [feedingUnit, setFeedingUnit] = useState<'daily' | 'half' | 'flat'>('flat');

  const [supervisorCount, setSupervisorCount] = useState(1);
  const [assistantCount, setAssistantCount] = useState(1);
  const [totalStationCount, setTotalStationCount] = useState(1);
  const [gpsCount, setGpsCount] = useState(1);
  const [scannerCount, setScannerCount] = useState(1);
  const [officeCount, setOfficeCount] = useState(1);

  const [supervisorPrice, setSupervisorPrice] = useState(50000000);
  const [assistantPrice, setAssistantPrice] = useState(25000000);
  const [totalStationPrice, setTotalStationPrice] = useState(30000000);
  const [gpsPrice, setGpsPrice] = useState(35000000);
  const [scannerPrice, setScannerPrice] = useState(80000000);
  const [officePrice, setOfficePrice] = useState(15000000);
  const [logisticsPrice, setLogisticsPrice] = useState(5000000);
  const [feedingPrice, setFeedingPrice] = useState(4000000);

  const [hardnessMultiplier, setHardnessMultiplier] = useState<1.0 | 1.2 | 1.5>(1.2);
  const [overheadProfitPct, setOverheadProfitPct] = useState(15);
  const [legalDeductionsPct, setLegalDeductionsPct] = useState(10);
  const [batchingFactor, setBatchingFactor] = useState(1);

  const [totalCalculatedCost, setTotalCalculatedCost] = useState(0);
  const [finalAgreedPrice, setFinalAgreedPrice] = useState('');
  const [priceStrategy, setPriceStrategy] = useState<'base' | 'official' | 'suggested'>('suggested');
  const [hasSubmittedPrice, setHasSubmittedPrice] = useState(false);
  const [marketPulse, setMarketPulse] = useState({ count: 0, maxProv: '---', maxPrice: 0, minProv: '---', minPrice: 0, avgPrice: 0 });

  const brandTheme = { primary: "#0B1D35", accent: "#C5A059", brandName: "برآورد ژئو" };

  useEffect(() => {
    if (hasSubmittedPrice) {
      fetch('https://tzmtolgfejpqonjxemgy.supabase.co/rest/v1/projects?select=province,final_price', {
        headers: { 'apikey': 'sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk', 'Authorization': 'Bearer sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk' }
      })
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) setMarketPulse(prev => ({ ...prev, count: data.length }));
      }).catch(err => console.error(err));
    }
  }, [hasSubmittedPrice]);

  const parsePersianOrEnglishFloatHelper = (str: string): number => {
    if (!str) return 0;
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    let clean = str;
    for (let i = 0; i < 10; i++) clean = clean.replace(persianNumbers[i], i.toString());
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  const derivedBasePrice = Math.round(totalCalculatedCost);
  const baseTariffVal = remoteBaseTariff ?? 0;
  const numVolumeVal = parsePersianOrEnglishFloatHelper(volume);
  const unitStringVal = getUnitForSubservice(subBranch);
  const rawBasePrice = calculateSmartTariff(baseTariffVal, numVolumeVal, unitStringVal, subBranch);
  const derivedOfficialPrice = Math.round(rawBasePrice * hardnessMultiplier * (1 + (overheadProfitPct / 100)) * (1 - (legalDeductionsPct / 100)));
  const derivedSuggestedPrice = Math.round(totalCalculatedCost * 1.15);

  useEffect(() => {
    if (priceStrategy === 'base') setFinalAgreedPrice(derivedBasePrice.toString());
    else if (priceStrategy === 'official') setFinalAgreedPrice(derivedOfficialPrice.toString());
    else if (priceStrategy === 'suggested') setFinalAgreedPrice(derivedSuggestedPrice.toString());
  }, [priceStrategy, derivedBasePrice, derivedOfficialPrice, derivedSuggestedPrice]);

  const handleCopy = () => {
    navigator.clipboard.writeText(DART_MAIN_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (message: string) => {
    setSimulatedToast(message);
    setTimeout(() => setSimulatedToast(null), 4000);
  };

  const runCalculationAndNavigate = () => {
    const days = parseInt(fieldDays) || 1;
    const getItemCost = (price: number, count: number, unit: 'daily' | 'half' | 'flat') => {
      const base = price * count;
      return (unit === 'daily' || unit === 'half') ? base * days : base;
    };

    const baseTotalCost = getItemCost(supervisorPrice, supervisorCount, supervisorUnit) + 
                          getItemCost(assistantPrice, assistantCount, assistantUnit) +
                          getItemCost(totalStationPrice, totalStationCount, totalStationUnit) + 
                          getItemCost(gpsPrice, gpsCount, gpsUnit) + 
                          getItemCost(scannerPrice, scannerCount, scannerUnit) +
                          getItemCost(officePrice, officeCount, officeUnit) +
                          getItemCost(logisticsPrice, 1, logisticsUnit) + 
                          getItemCost(feedingPrice, 1, feedingUnit);

    const costWithHardness = baseTotalCost * hardnessMultiplier;
    const batchedRawCost = costWithHardness / batchingFactor;
    const costWithOverhead = batchedRawCost * (1 + (overheadProfitPct / 100));
    setTotalCalculatedCost(costWithOverhead * (1 - (legalDeductionsPct / 100)));
    setPriceStrategy('suggested');
    setFlowScreen('dashboard');
  };

  const saveProjectFinal = async () => {
    showToast('برآورد نهایی شما با موفقیت ثبت گردید');
    setHasSubmittedPrice(true);
    setFlowScreen('estimation');
  };

  const handleNameChange = (val: string) => {
    if (/^[\u0600-\u06FF\s]*$/.test(val)) setFullName(val);
  };

  const renderCostRow = (
    label: string, price: number, setPrice: (v: number) => void, unit: 'daily' | 'half' | 'flat', setUnit: (v: 'daily' | 'half' | 'flat') => void, count?: number, setCount?: (v: number) => void, isLogistics: boolean = false
  ) => {
    const handleUnitChange = (newUnit: 'daily' | 'half' | 'flat') => {
      if (unit === 'daily' && newUnit === 'half') setPrice(Math.round(price / 2));
      else if (unit === 'half' && newUnit === 'daily') setPrice(price * 2);
      setUnit(newUnit);
    };

    return (
      <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center">
        <span className="col-span-3 text-[11px] font-bold text-slate-700 text-right pr-1 whitespace-normal break-words leading-tight" title={label}>{label}</span>
        <div className={isLogistics ? "col-span-5" : "col-span-4"}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={formatPriceString(price)} onChange={(e) => setPrice(parsePriceString(e.target.value))} className="w-full bg-slate-50 border border-slate-300 text-xs rounded text-center py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-900 font-mono font-bold text-slate-800" placeholder="ریال" />
        </div>
        <div className={isLogistics ? "col-span-4" : "col-span-3"}>
          {isLogistics ? <div className="w-full bg-slate-100 border border-slate-200 text-[10px] rounded py-1.5 text-slate-500 font-bold text-center">مقطع</div> : <select value={unit} onChange={(e: any) => handleUnitChange(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-[10px] rounded px-1 py-1.5 text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-indigo-900"><option value="daily">روزانه</option><option value="half">نیم روز</option><option value="flat">مقطوع</option></select>}
        </div>
        {!isLogistics && count !== undefined && setCount !== undefined && (
          <div className="col-span-2">
            <input type="number" inputMode="numeric" pattern="[0-9]*" value={count === 0 ? '' : count} min="0" onChange={(e) => { if (e.target.value === '') { setCount(0); return; } const val = parseInt(e.target.value); setCount(isNaN(val) ? 0 : Math.max(0, val)); }} className="w-full bg-slate-50 border border-slate-300 text-xs rounded text-center py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-900 font-bold text-indigo-900" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="border-b bg-white sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2.5 rounded-xl"><Coins className="w-6 h-6" /></div>
          <h1 className="text-xl font-bold tracking-tight">سامانه هوشمند برآورد بهای نقشه‌برداری</h1>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
          <button onClick={() => setActiveTab('simulator')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex gap-2 ${activeTab === 'simulator' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600'}`}><Smartphone className="w-4 h-4" />شبیه‌ساز موبایل</button>
          <button onClick={() => setActiveTab('code')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex gap-2 ${activeTab === 'code' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}><FileCode2 className="w-4 h-4" />کد Flutter</button>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className={`lg:col-span-6 xl:col-span-5 flex flex-col items-center justify-center ${activeTab === 'simulator' ? 'block' : 'hidden lg:flex'}`}>
          <div className="w-full max-w-[420px] bg-slate-900 rounded-[50px] p-4 shadow-2xl border-4 border-slate-800 relative">
            <div className="w-full h-[740px] bg-slate-50 rounded-[38px] overflow-hidden flex flex-col relative" dir="rtl">
              <div className="h-10 bg-slate-900 text-slate-200 px-6 flex justify-between items-end pb-1.5 text-xs z-20"><span className="font-mono text-[11px] font-bold">19:22</span></div>
              {simulatedToast && <div className="absolute top-12 left-4 right-4 bg-emerald-700 text-white rounded-xl py-3 px-4 shadow-xl text-xs font-bold z-50 flex gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-300" /><p>{simulatedToast}</p></div>}
              <div className="flex-1 flex flex-col overflow-y-auto">
                {flowScreen === 'auth' && (
                  <div className="flex-grow flex flex-col bg-white p-5 pt-1 justify-start">
                    <div className="text-white -mx-5 -mt-1 p-4 border-b flex justify-center items-center shadow-md" style={{ backgroundColor: brandTheme.primary }}><Coins className="w-4 h-4 ml-1.5" style={{ color: brandTheme.accent }} /><h2 className="font-bold text-xs">{brandTheme.brandName}</h2></div>
                    <div className="flex justify-center items-center mt-3 mb-5 gap-1.5">
                      {[1, 2, 3, 4].map((stepNum) => {
                        const isActive = authStep >= stepNum;
                        return (
                          <div key={stepNum} className="flex items-center">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: authStep === stepNum ? brandTheme.accent : (isActive ? brandTheme.primary : '#E2E8F0'), color: (authStep === stepNum || isActive) ? '#FFFFFF' : '#64748B' }}>{stepNum}</div>
                            {stepNum < 4 && <div className="w-8 h-1 mx-1 rounded-full" style={{ backgroundColor: authStep > stepNum ? brandTheme.accent : '#E2E8F0' }} />}
                          </div>
                        );
                      })}
                    </div>
                    {authStep === 1 && (
                      <div className="space-y-4">
                        <div className="text-center space-y-1"><h3 className="text-lg font-bold">ورود یا عضویت</h3></div>
                        <div className="space-y-1.5 pt-4"><label className="text-xs font-bold">تلفن همراه</label><input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full border rounded-xl py-2.5 text-center font-mono" placeholder="09123456789" /></div>
                        <button onClick={() => setAuthStep(2)} className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm mt-2" style={{ backgroundColor: brandTheme.primary }}>ارسال کد تایید</button>
                      </div>
                    )}
                    {authStep === 2 && (
                      <div className="space-y-4">
                        <div className="text-center space-y-1"><h3 className="text-lg font-bold">کد تایید را وارد کنید</h3></div>
                        <input type="number" inputMode="numeric" pattern="[0-9]*" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full border rounded-xl py-3 text-center text-2xl font-bold font-mono" placeholder="۱۲۳۴" />
                        <button onClick={() => setAuthStep(3)} className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm" style={{ backgroundColor: brandTheme.primary }}>تایید کد</button>
                      </div>
                    )}
                    {authStep === 3 && (
                      <div className="space-y-5">
                        <div className="text-center space-y-1"><h3 className="text-lg font-bold">تعیین نقش شما</h3></div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button onClick={() => setUserRole('surveyor')} className="p-4 border-2 rounded-2xl flex flex-col items-center gap-2" style={{ borderColor: userRole === 'surveyor' ? brandTheme.accent : '#E2E8F0', backgroundColor: userRole === 'surveyor' ? brandTheme.accent + '15' : 'transparent' }}><Briefcase className="w-8 h-8" /><span className="font-bold text-sm">نقشه‌بردار</span></button>
                          <button onClick={() => setUserRole('client')} className="p-4 border-2 rounded-2xl flex flex-col items-center gap-2" style={{ borderColor: userRole === 'client' ? brandTheme.accent : '#E2E8F0', backgroundColor: userRole === 'client' ? brandTheme.accent + '15' : 'transparent' }}><Building2 className="w-8 h-8" /><span className="font-bold text-sm">کارفرما</span></button>
                        </div>
                        <button onClick={() => { userRole === 'surveyor' ? setAuthStep(4) : setFlowScreen('estimation'); }} className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm mt-4" style={{ backgroundColor: brandTheme.primary }}>مرحله بعد</button>
                      </div>
                    )}
                    {authStep === 4 && (
                      <div className="space-y-4">
                        <button onClick={() => setAuthStep(3)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-2"><ChevronLeft className="w-4 h-4 rotate-180" />بازگشت</button>
                        <div className="text-center space-y-1"><h3 className="text-base font-bold">مشخصات نقشه بردار</h3></div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 pt-1">
                          <label className="text-[11px] font-bold">نام و نام خانوادگی</label><input type="text" value={fullName} onChange={(e) => handleNameChange(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs" />
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[11px] font-bold">استان</label><select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-xs">{Object.keys(iranProvincesAndCities).map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div><label className="text-[11px] font-bold">شهرستان</label><select value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-xs">{(iranProvincesAndCities[province] || []).map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                          </div>
                          <div><label className="text-[11px] font-bold">سابقه کاری (سال)</label><input type="number" inputMode="numeric" pattern="[0-9]*" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs" /></div>
                        </div>
                        <button onClick={() => { if (!fullName.trim() || !experienceYears.trim()) return; setFlowScreen('estimation'); }} className="w-full text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs" style={{ backgroundColor: brandTheme.primary }}>ثبت‌نام و ورود</button>
                      </div>
                    )}
                  </div>
                )}
                {flowScreen === 'estimation' && (
                  <div className="flex-grow flex flex-col bg-slate-100">
                    <div className="text-white px-4 py-3 flex justify-between items-center shadow-md" style={{ backgroundColor: brandTheme.primary, borderBottom: `1px solid ${brandTheme.accent}` }}><button onClick={() => { estimationTab > 1 ? setEstimationTab((estimationTab - 1) as any) : setFlowScreen('auth'); }} className="p-1"><ArrowLeft className="w-5 h-5 rotate-180" style={{ color: brandTheme.accent }} /></button><h2 className="text-sm font-bold">{brandTheme.brandName}</h2><div className="w-6"/></div>
                    <div className="bg-white flex border-b border-slate-200">
                      <button onClick={() => setEstimationTab(1)} className="flex-1 py-3 text-center text-xs font-bold border-b-2" style={{ borderBottomColor: estimationTab === 1 ? brandTheme.accent : 'transparent', color: estimationTab === 1 ? brandTheme.primary : '#64748B' }}>نوع خدمات</button>
                      <button onClick={() => setEstimationTab(2)} className="flex-1 py-3 text-center text-xs font-bold border-b-2" style={{ borderBottomColor: estimationTab === 2 ? brandTheme.accent : 'transparent', color: estimationTab === 2 ? brandTheme.primary : '#64748B' }}>حجم کار</button>
                      <button onClick={() => setEstimationTab(3)} className="flex-1 py-3 text-center text-xs font-bold border-b-2" style={{ borderBottomColor: estimationTab === 3 ? brandTheme.accent : 'transparent', color: estimationTab === 3 ? brandTheme.primary : '#64748B' }}>هزینه‌ها</button>
                    </div>
                    <div className="p-4 flex-grow overflow-y-auto max-h-[500px]">
                      {estimationTab === 1 && (
                        <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <div><label className="text-xs font-bold">نوع خدمات</label><select value={serviceType} onChange={(e) => { const val = e.target.value; setServiceType(val); const firstMain = Object.keys(surveyingServices[val] || {})[0] || ''; setMainService(firstMain); setSubBranch((surveyingServices[val]?.[firstMain] || [])[0] || ''); }} className="w-full border rounded-lg px-3 py-2 text-xs">{Object.keys(surveyingServices).map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
                          <div><label className="text-xs font-bold">خدمات اصلی</label><select value={mainService} onChange={(e) => { const val = e.target.value; setMainService(val); setSubBranch((surveyingServices[serviceType]?.[val] || [])[0] || ''); }} className="w-full border rounded-lg px-3 py-2 text-xs">{Object.keys(surveyingServices[serviceType] || {}).map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
                          <div><label className="text-xs font-bold">زیر شاخه</label><select value={subBranch} onChange={(e) => setSubBranch(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs">{(surveyingServices[serviceType]?.[mainService] || []).map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
                          <div><label className="text-xs font-bold">استان</label><select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs"><option value="یزد">یزد</option><option value="تهران">تهران</option></select></div>
                          <div><label className="text-xs font-bold">ارگان</label><select value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs"><option value="همه">همه</option><option value="شهرداری یزد">شهرداری یزد</option><option value="نظام مهندسی ساختمان یزد">نظام مهندسی ساختمان یزد</option><option value="انجمن صنفی">انجمن صنفی</option></select></div>
                          <div className="border rounded-xl p-3 text-xs bg-blue-50 text-blue-900 font-bold flex justify-between"><span>تعرفه مصوب پایه:</span><span className="font-mono">{formatPersianCurrency(remoteBaseTariff ?? 0)} ریال</span></div>
                        </div>
                      )}
                      {estimationTab === 2 && (
                        <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <div><label className="text-xs font-bold block mb-1.5">حجم کار ({getUnitForSubservice(subBranch)})</label><input type="number" inputMode="numeric" pattern="[0-9]*" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs" /></div>
                          <div><label className="text-xs font-bold block mb-1.5">تعداد روزهای صحرایی</label><input type="number" inputMode="numeric" pattern="[0-9]*" value={fieldDays} onChange={(e) => setFieldDays(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs font-mono text-center" /></div>
                        </div>
                      )}
                      {estimationTab === 3 && (
                        <div className="space-y-2">
                          {renderCostRow('سرپرست کارگاه', supervisorPrice, setSupervisorPrice, supervisorUnit, setSupervisorUnit, supervisorCount, setSupervisorCount)}
                          {renderCostRow('کمک کارشناس', assistantPrice, setAssistantPrice, assistantUnit, setAssistantUnit, assistantCount, setAssistantCount)}
                          {renderCostRow('توتال استیشن', totalStationPrice, setTotalStationPrice, totalStationUnit, setTotalStationUnit, totalStationCount, setTotalStationCount)}
                          {renderCostRow('گیرنده GPS', gpsPrice, setGpsPrice, gpsUnit, setGpsUnit, gpsCount, setGpsCount)}
                          {renderCostRow('اسکنر سه‌بعدی', scannerPrice, setScannerPrice, scannerUnit, setScannerUnit, scannerCount, setScannerCount)}
                          {renderCostRow('مهندسی پردازش', officePrice, setOfficePrice, officeUnit, setOfficeUnit, officeCount, setOfficeCount)}
                          {renderCostRow('ایاب و ذهاب', logisticsPrice, setLogisticsPrice, logisticsUnit, setLogisticsUnit, undefined, undefined, true)}
                          {renderCostRow('تغذیه پرسنل', feedingPrice, setFeedingPrice, feedingUnit, setFeedingUnit, undefined, undefined, true)}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
                            <span className="text-xs font-bold text-slate-700">ضریب سختی کار میدانی</span>
                            <div className="flex gap-1.5">{[{ label: 'آسان (۱.۰)', val: 1.0 }, { label: 'متوسط (۱.۲)', val: 1.2 }, { label: 'سخت (۱.۵)', val: 1.5 }].map((item) => (<button key={item.val} onClick={() => setHardnessMultiplier(item.val as any)} className={`flex-1 py-1 px-2 border rounded-lg text-xs font-bold ${hardnessMultiplier === item.val ? 'bg-indigo-900 text-white' : 'bg-slate-50 text-slate-600'}`}>{item.label}</button>))}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-white border-t border-slate-200 p-4">
                      {estimationTab < 3 ? (
                        <button onClick={() => setEstimationTab((estimationTab + 1) as any)} className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm flex justify-center gap-2" style={{ backgroundColor: brandTheme.primary }}><Scale className="w-5 h-5 text-amber-500"/>مرحله بعد</button>
                      ) : (
                        <button onClick={runCalculationAndNavigate} className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm flex justify-center gap-2" style={{ backgroundColor: brandTheme.primary }}><CheckCircle2 className="w-5 h-5 text-amber-500"/>محاسبه نهایی</button>
                      )}
                    </div>
                  </div>
                )}
                {flowScreen === 'dashboard' && (
                  <div className="flex-grow flex flex-col bg-slate-100 p-4 space-y-4">
                    <div className="bg-white p-4 rounded-xl border-t-4 shadow-sm" style={{ borderTopColor: brandTheme.accent }}><span className="text-[11px] font-bold text-slate-500 block">کف قیمت تمام شده</span><span className="text-xl font-mono font-black">{formatPersianCurrency(totalCalculatedCost)}</span></div>
                    <div className="bg-indigo-900 p-4 rounded-xl shadow-sm text-white"><span className="text-[11px] font-bold text-amber-400 block">پیشنهاد هوشمندانه سیستم</span><span className="text-2xl font-mono font-black text-amber-400">{formatPersianCurrency(totalCalculatedCost * 1.15)}</span></div>
                    <button onClick={saveProjectFinal} className="mt-auto w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md" style={{ backgroundColor: brandTheme.primary }}>ثبت نهایی پروژه در سیستم</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={`lg:col-span-6 xl:col-span-7 h-full flex flex-col ${activeTab === 'code' ? 'block' : 'hidden lg:flex'}`}>
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[790px]">
            <div className="bg-white px-5 py-4 border-b flex justify-between"><h3 className="font-bold">کد Flutter</h3><button onClick={handleCopy} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold">کپی کد</button></div>
            <div className="flex-1 overflow-y-auto bg-slate-950 p-6 font-mono text-[12px] text-slate-300"><pre>{DART_MAIN_CODE}</pre></div>
          </div>
        </section>
      </main>
    </div>
  );
}