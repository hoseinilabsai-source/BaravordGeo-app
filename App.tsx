import { useState, useEffect } from 'react';
import { 
  Phone as PhoneIcon, 
  User, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  HelpCircle, 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileCode2, 
  Copy, 
  Check, 
  ArrowLeft, 
  AlertTriangle, 
  Coins, 
  Percent, 
  Scale, 
  HelpCircle as InfoIcon,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { DART_MAIN_CODE } from './dartCode';
import { iranProvincesAndCities } from './iran_data';

const surveyingServices: Record<string, Record<string, string[]>> = {
  'نقشه ثبتی ماده (۱۴۷)': {
    'برداشت میدانی': ['برداشت عرصه و اعیان'],
  },
  'عملیات زمینی': {
    'برداشت میدانی': [
      'برداشت عوارض و مبلمان و تاسیسات شهری',
      'برداشت بلوک شهری تا عمق یک پلاک',
      'برداشت ترافیکی و المان های ترافیکی',
      'برداشت پلاک و معابر اطراف',
      'تهیه نقشه تعیین موقعیت ملک',
      'تفکیک آپارتمان',
      'نقشه تک خطی',
      'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک',
      'برداشت توپوگرافی معابر شهری جهت کد گذاری',
      'ازبیلت عمرانی و تاسیسات',
      'تعیین بر و کف پلاک'
    ],
    'طراحی': [
      'دفع آبهای سطحی',
      'طراحی پروفیل طولی و عرضی'
    ],
    'پیاده سازی': [
      'پیاده سازی قطعات تفکیکی',
      'پیاده سازی طرح اجرایی'
    ]
  },
  'عملیات سازه ساختمانی': {
    'برداشت': ['برداشت پلاک جهت منطبق با طرح سازه'],
    'پیاده سازی': ['آکس ستون و فنداسیون', 'کنترل شاغولی ستون']
  },
  'عملیات فتو مپ و تصویر برداری': {
    'برداشت': [
      'برداشت عوارض شهری',
      'برداشت مسطحاتی و توپوگرافی عوارض معدنی',
      'برداشت نما ساختمان'
    ]
  }
};

function formatPersianCurrency(num: number): string {
  return Math.round(num).toLocaleString('fa-IR');
}

function formatEnglishCurrency(num: number): string {
  return Math.round(num).toLocaleString('en-US');
}

function getUnitForSubservice(sub: string): string {
  const units: Record<string, string> = {
    'برداشت عرصه و اعیان': 'نقطه‌ای',
    'برداشت عوارض و مبلمان و تاسیسات شهری': 'هکتار (زیر یک هکتار)',
    'برداشت بلوک شهری تا عمق یک پلاک': 'کیلومتر (زیر یک کیلومتر)',
    'برداشت ترافیکی و المان های ترافیکی': 'کیلومتر (زیر یک کیلومتر)',
    'برداشت پلاک و معابر اطراف': 'کیلومتر (زیر یک کیلومتر)',
    'تهیه نقشه تعیین موقعیت ملک': 'نقطه‌ای',
    'تفکیک آپارتمان': 'متر مربع قیمت ثابت به اضافه مشاعات',
    'نقشه تک خطی': 'متر طول',
    'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک': 'هکتار (زیر یک هکتار)',
    'برداشت توپوگرافی معابر شهری جهت کد گذاری': 'هکتار (زیر یک هکتار)',
    'ازبیلت عمرانی و تاسیسات': 'متر مربع قیمت ثابت به اضافه مشاعات',
    'تعیین بر و کف پلاک': 'نقطه‌ای',
    'دفع آبهای سطحی': 'پروژه (قیمت ثابت)',
    'طراحی پروفیل طولی و عرضی': 'متر طول',
    'پیاده سازی قطعات تفکیکی': 'متر مربع',
    'پیاده سازی طرح اجرایی': 'متر مربع',
    'برداشت پلاک جهت منطبق با طرح سازه': 'متر مربع',
    'آکس ستون و فنداسیون': 'دهنه',
    'کنترل شاغولی ستون': 'شاخه',
    'برداشت عوارض شهری': 'هکتار (زیر یک هکتار)',
    'برداشت مسطحاتی و توپوگرافی عوارض معدنی': 'هکتار (زیر یک هکتار)',
    'برداشت نما ساختمان': 'متر مربع',
  };
  return units[sub] || 'انتخاب نشده';
}

function calculateSmartTariff(basePrice: number, volume: number, unitString: string, subBranch: string = ""): number {
  if (unitString.includes("زیر یک")) {
    const effectiveVolume = Math.max(1.0, volume);
    return basePrice * effectiveVolume;
  }
  
  if (unitString.includes("قیمت ثابت") && !unitString.includes("به اضافه")) {
    return basePrice;
  }
  
  if (unitString.includes("قیمت ثابت به اضافه") || (unitString.includes("قیمت ثابت") && unitString.includes("به اضافه"))) {
    let X = 200.0;
    const match = /([0-9]+)\s+تا\s+([0-9]+)/.exec(unitString);
    if (match) {
      X = parseFloat(match[1]) || 200.0;
    }
    const extraVolume = Math.max(0.0, volume - X);
    
    let baseFixedPrice = basePrice;
    let foundFixed = false;
    
    const tariffDatabase: Record<string, Record<string, number>> = {
      'همه': {
        'برداشت عرصه و اعیان': 3500000,
        'تهیه نقشه تعیین موقعیت ملک': 7600000,
        'دفع آبهای سطحی': 35000000,
        'نقشه تک خطی': 1500000,
        'طراحی پروفیل طولی و عرضی': 2200000,
        'پیاده سازی قطعات تفکیکی': 3000000,
        'پیاده سازی طرح اجرایی': 4000000,
      },
      'شهرداری یزد': {
        'برداشت عوارض و مبلمان و تاسیسات شهری': 6000000,
        'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک': 18000000,
        'برداشت توپوگرافی معابر شهری جهت کد گذاری': 15000000,
        'تعیین بر و کف پلاک': 5000000,
        'برداشت عوارض شهری': 7500000,
      },
      'نظام مهندسی ساختمان یزد': {
        'تفکیک آپارتمان': 4500000,
        'ازبیلت عمرانی و تاسیسات': 8000000,
        'برداشت پلاک جهت منطبق با طرح سازه': 6500000,
        'آکس ستون و فنداسیون': 2500000,
        'کنترل شاغولی ستون': 1800000,
        'برداشت نما ساختمان': 9000000,
      },
      'انجمن صنفی': {
        'برداشت بلوک شهری تا عمق یک پلاک': 12000000,
        'برداشت ترافیکی و المان های ترافیکی': 10000000,
        'برداشت پلاک و معابر اطراف': 11000000,
        'برداشت مسطحاتی و توپوگرافی عوارض معدنی': 14000000,
      },
    };

    for (const org of Object.keys(tariffDatabase)) {
      for (const sub of Object.keys(tariffDatabase[org])) {
        if (sub === subBranch) {
          const unit = getUnitForSubservice(sub);
          if (unit.includes("قیمت ثابت") && !unit.includes("به اضافه")) {
            baseFixedPrice = tariffDatabase[org][sub];
            foundFixed = true;
            break;
          }
        }
      }
      if (foundFixed) break;
    }
    
    return baseFixedPrice + (extraVolume * basePrice);
  }
  
  return basePrice * volume;
}

function formatPriceString(val: number): string {
  if (isNaN(val)) return '';
  return val.toLocaleString('en-US');
}

function parsePriceString(val: string): number {
  const clean = val.replace(/\D/g, '');
  const parsed = parseInt(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  
  const [unlocked, setUnlocked] = useState(false);
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
        const url = `${SUPABASE_URL}/rest/v1/tariffs?select=*`;

        const response = await fetch(url, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          
          if (Array.isArray(data)) {
            // فیلتر فوق‌هوشمند برای نادیده گرفتن تمام فاصله‌ها، پرانتزها و تفاوت اعداد
            const cleanStr = (s: any) => {
              if (!s) return '';
              return String(s)
                .replace(/[\u200B-\u200D\uFEFF\s]/g, '') 
                .replace(/ي/g, 'ی')
                .replace(/ك/g, 'ک')
                .replace(/آ/g, 'ا')
                .replace(/[()]/g, '') 
                .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776))
                .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632))
                .toLowerCase();
            };

            const targetProvince = cleanStr(province);
            const targetOrg = cleanStr(organization);
            const targetSub = cleanStr(subBranch);

            const match = data.find((row: any) => {
              const rowProv = cleanStr(row.province);
              const rowOrg = cleanStr(row.organization);
              const rowSub = cleanStr(row.sub_service);

              const provinceMatches = !rowProv || rowProv === targetProvince || rowProv === cleanStr('همه');
              const subServiceMatches = rowSub === targetSub;
              const orgMatches = targetOrg === cleanStr('همه') || rowOrg === targetOrg || rowOrg === cleanStr('همه');

              return provinceMatches && subServiceMatches && orgMatches;
            });

            if (match && match.price != null) {
              setRemoteBaseTariff(Number(match.price));
            } else {
              // استفاده از دیتابیس جایگزین در صورت پیدا نشدن دقیق در سرور
              const localDatabase: Record<string, Record<string, number>> = {
                'همه': { 'برداشت عرصه و اعیان': 3500000, 'تهیه نقشه تعیین موقعیت ملک': 7600000, 'دفع آبهای سطحی': 35000000, 'نقشه تک خطی': 1500000, 'طراحی پروفیل طولی و عرضی': 2200000, 'پیاده سازی قطعات تفکیکی': 3000000, 'پیاده سازی طرح اجرایی': 4000000 },
                'شهرداری یزد': { 'برداشت عوارض و مبلمان و تاسیسات شهری': 6000000, 'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک': 18000000, 'برداشت توپوگرافی معابر شهری جهت کد گذاری': 15000000, 'تعیین بر و کف پلاک': 5000000, 'برداشت عوارض شهری': 7500000 },
                'نظام مهندسی ساختمان یزد': { 'تفکیک آپارتمان': 4500000, 'ازبیلت عمرانی و تاسیسات': 8000000, 'برداشت پلاک جهت منطبق با طرح سازه': 6500000, 'آکس ستون و فنداسیون': 2500000, 'کنترل شاغولی ستون': 1800000, 'برداشت نما ساختمان': 9000000 },
                'انجمن صنفی': { 'برداشت بلوک شهری تا عمق یک پلاک': 12000000, 'برداشت ترافیکی و المان های ترافیکی': 10000000, 'برداشت پلاک و معابر اطراف': 11000000, 'برداشت مسطحاتی و توپوگرافی عوارض معدنی': 14000000 }
              };
              const orgKey = localDatabase[organization] ? organization : 'همه';
              if (localDatabase[orgKey] && localDatabase[orgKey][subBranch] !== undefined) {
                setRemoteBaseTariff(localDatabase[orgKey][subBranch]);
              } else {
                setRemoteBaseTariff(null);
              }
            }
          } else {
            setRemoteBaseTariff(null);
          }
        } else {
          setRemoteBaseTariff(null);
        }
      } catch (e) {
        setRemoteBaseTariff(null);
      } finally {
        if (active) setIsRemoteLoading(false);
      }
    };

    fetchLivePrice();

    return () => {
      active = false;
    };
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
  const [logisticsCount, setLogisticsCount] = useState(1);
  const [feedingCount, setFeedingCount] = useState(1);

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

  const brandTheme = {
    primary: "#0B1D35", 
    accent: "#C5A059",
    brandName: "برآورد ژئو"
  };

  useEffect(() => {
    if (hasSubmittedPrice) {
      fetch('https://tzmtolgfejpqonjxemgy.supabase.co/rest/v1/projects?select=province,final_price', {
        headers: {
          'apikey': 'sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk',
          'Authorization': 'Bearer sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk'
        }
      })
        .then(res => res.json())
        .then((data: any[]) => {
          if (data && data.length > 0) {
            const provinceGroups: { [key: string]: { total: number; count: number } } = {};
            let totalMarketPrice = 0;
            data.forEach(item => {
              const prov = item.province || 'ناشناس';
              const price = typeof item.final_price === 'number' 
                ? item.final_price 
                : parseFloat(item.final_price as string) || 0;
              
              if (!provinceGroups[prov]) {
                provinceGroups[prov] = { total: 0, count: 0 };
              }
              provinceGroups[prov].total += price;
              provinceGroups[prov].count += 1;
              totalMarketPrice += price;
            });

            const overallAvgPrice = totalMarketPrice / data.length;

            let maxProv = '---';
            let maxPrice = -Infinity;
            let minProv = '---';
            let minPrice = Infinity;

            Object.entries(provinceGroups).forEach(([prov, stats]) => {
              const avg = stats.total / stats.count;
              if (avg > maxPrice) {
                maxPrice = avg;
                maxProv = prov;
              }
              if (avg < minPrice) {
                minPrice = avg;
                minProv = prov;
              }
            });

            setMarketPulse({
              count: data.length,
              maxProv,
              maxPrice: maxPrice === -Infinity ? 0 : Math.round(maxPrice),
              minProv,
              minPrice: minPrice === Infinity ? 0 : Math.round(minPrice),
              avgPrice: overallAvgPrice
            });
          }
        })
        .catch(err => {
          console.error("Error fetching market pulse data:", err);
        });
    }
  }, [hasSubmittedPrice]);

  const parsePersianOrEnglishFloatHelper = (str: string): number => {
    if (!str) return 0;
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    let clean = str;
    for (let i = 0; i < 10; i++) {
      clean = clean.replace(persianNumbers[i], i.toString());
    }
    const dict: Record<string, string> = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    let resolved = '';
    for (const char of clean) {
      resolved += dict[char] !== undefined ? dict[char] : char;
    }
    const val = parseFloat(resolved);
    return isNaN(val) ? 0 : val;
  };

  const derivedBasePrice = Math.round(totalCalculatedCost);
  const baseTariffVal = remoteBaseTariff ?? 0;
  const numVolumeVal = parsePersianOrEnglishFloatHelper(volume);
  const unitStringVal = getUnitForSubservice(subBranch);
  const rawBasePrice = calculateSmartTariff(baseTariffVal, numVolumeVal, unitStringVal, subBranch);
  const derivedOfficialPrice = Math.round(rawBasePrice * hardnessMultiplier * (1 + (overheadProfitPct / 100)) * (1 - (legalDeductionsPct / 100)));
  
  // Calculate system-suggested price using the 3-stage dynamic pricing algorithm (anchor and weighted average)
  const calculateDynamicSuggestedPrice = (): number => {
    const C = totalCalculatedCost;
    
    // Stage 1: Cold Start Check (Check market data maturity)
    if (marketPulse.count < 5) {
      return Math.round(C * 1.15);
    }
    
    // Stage 2: Hybrid Price Calculation (60% actual cost, 40% market average)
    const M = marketPulse.avgPrice; // Market Average
    const pHybrid = (0.6 * C) + (0.4 * M);
    
    // Stage 3: Price Collar / Official Price Anchor (Clamping between 80% and 120% of official tariff)
    const O = derivedOfficialPrice; // Official tariff
    const ceiling = 1.2 * O;
    const floor = 0.8 * O;
    
    let clampedPrice = pHybrid;
    if (pHybrid > ceiling) {
      clampedPrice = ceiling;
    } else if (pHybrid < floor) {
      clampedPrice = floor;
    }
    
    return Math.round(clampedPrice);
  };

  const derivedSuggestedPrice = calculateDynamicSuggestedPrice();

  useEffect(() => {
    if (priceStrategy === 'base') {
      setFinalAgreedPrice(derivedBasePrice.toString());
    } else if (priceStrategy === 'official') {
      setFinalAgreedPrice(derivedOfficialPrice.toString());
    } else if (priceStrategy === 'suggested') {
      setFinalAgreedPrice(derivedSuggestedPrice.toString());
    }
  }, [priceStrategy, derivedBasePrice, derivedOfficialPrice, derivedSuggestedPrice]);

  const handleCopy = () => {
    navigator.clipboard.writeText(DART_MAIN_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (message: string) => {
    setSimulatedToast(message);
    setTimeout(() => {
      setSimulatedToast(null);
    }, 4000);
  };

  const runCalculationAndNavigate = () => {
    const days = parseInt(fieldDays) || 1;
    
    const getItemCost = (price: number, count: number, unit: 'daily' | 'half' | 'flat') => {
      const base = price * count;
      if (unit === 'daily' || unit === 'half') {
        return base * days;
      }
      return base;
    };

    const personnelBaseSum = getItemCost(supervisorPrice, supervisorCount, supervisorUnit) + 
                             getItemCost(assistantPrice, assistantCount, assistantUnit);

    const equipmentBaseSum = getItemCost(totalStationPrice, totalStationCount, totalStationUnit) + 
                             getItemCost(gpsPrice, gpsCount, gpsUnit) + 
                             getItemCost(scannerPrice, scannerCount, scannerUnit);

    const officeBaseSum = getItemCost(officePrice, officeCount, officeUnit);

    const logisticsBaseSum = getItemCost(logisticsPrice, logisticsCount, logisticsUnit) + 
                             getItemCost(feedingPrice, feedingCount, feedingUnit);

    const baseTotalCost = personnelBaseSum + equipmentBaseSum + officeBaseSum + logisticsBaseSum;
    const costWithHardness = baseTotalCost * hardnessMultiplier;
    const batchedRawCost = costWithHardness / batchingFactor;
    const costWithOverhead = batchedRawCost * (1 + (overheadProfitPct / 100));
    const finalBillValue = costWithOverhead * (1 - (legalDeductionsPct / 100));

    setTotalCalculatedCost(finalBillValue);
    setPriceStrategy('suggested');
    
    setFlowScreen('dashboard');
  };

  const saveProjectFinal = async () => {
    try {
      const SUPABASE_URL = 'https://tzmtolgfejpqonjxemgy.supabase.co';
      const SUPABASE_KEY = 'sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk';
      
      const parsedExpYears = parseInt(experienceYears.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776))) || 8;
      
      const payload = {
        phone: mobileNumber,
        surveyor_name: userRole === 'client' ? 'کارفرما' : fullName,
        province: province,
        city: city,
        experience_years: parsedExpYears,
        entity_type: entityType,
        has_license: hasLicense,
        is_official_expert: isOfficialExpert,
        hardness: hardnessMultiplier,
        final_price: parseInt(finalAgreedPrice) || Math.round(totalCalculatedCost),
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`خطای سرور: ${response.status} ${errText}`);
      }

      showToast('برآورد نهایی شما با موفقیت ثبت گردید');
      setHasSubmittedPrice(true);
      setFlowScreen('estimation');
    } catch (error: any) {
      console.error('خطا در ثبت نهایی پروژه در دیتابیس:', error);
      alert(`خطا در ذخیره‌سازی اطلاعات پروژه: ${error.message || error}`);
    }
  };

  const resetSimulator = () => {
    setFlowScreen('auth');
    setAuthStep(1);
    setOtpCode('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
              سامانه هوشمند برآورد بهای نقشه‌برداری
              <span className="text-xs bg-slate-100 text-slate-600 font-normal px-2.5 py-1 rounded-full">نسخه ۱.۰.۰</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">محاسبه تعرفه خدمات، سختی کار، بالاسری و استراتژی قیمت‌گذاری در استان یزد</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'simulator' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            شبیه‌ساز موبایل (محیط ایران)
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'code' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            کد منبع Flutter (main.dart)
          </button>
        </div>
      </header>

      {/* WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* TAB 1: INTERACTIVE EMULATOR */}
        <section className={`lg:col-span-6 xl:col-span-5 flex flex-col items-center justify-center ${activeTab === 'simulator' ? 'block' : 'hidden lg:flex'}`}>
          
          <div className="w-full text-center mb-4 lg:hidden">
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
              در بخش تبلت یا موبایل هستید؛ برای کپی کد می‌توانید تب دوم را کلیک کنید.
            </span>
          </div>

          {/* PHONE FRAME CHASSIS */}
          <div className="w-full max-w-[420px] bg-slate-900 rounded-[50px] p-4 shadow-2xl border-4 border-slate-800 shadow-emerald-950/20 relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 w-32 h-6 rounded-b-3xl z-30 flex justify-center items-center">
              <span className="w-12 h-1 bg-black/60 rounded-full mt-1"></span>
              <span className="w-2.5 h-2.5 bg-sky-950 rounded-full ml-2 border border-slate-800 mt-1"></span>
            </div>

            <div className="w-full h-[740px] bg-slate-50 rounded-[38px] overflow-hidden flex flex-col relative text-slate-900 font-sans" dir="rtl">
              
              <div className="h-10 bg-slate-900 text-slate-200 px-6 flex justify-between items-end pb-1.5 text-xs select-none z-20">
                <span className="font-mono text-[11px] font-bold">19:22</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono opacity-80">LTE</span>
                  <div className="w-5 h-2.5 border border-slate-200/60 rounded-sm p-px flex items-center pr-px">
                    <span className="bg-emerald-500 h-full w-[85%] block rounded-sm"></span>
                  </div>
                </div>
              </div>

              {simulatedToast && (
                <div className="absolute top-12 left-4 right-4 bg-emerald-700 text-white rounded-xl py-3 px-4 shadow-xl text-xs font-bold flex items-center gap-2.5 z-50 border border-emerald-500 animate-slideDown">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
                  <p>{simulatedToast}</p>
                </div>
              )}

              {showSupportSheet && (
                <div className="absolute inset-0 bg-black/60 z-40 flex flex-col justify-end">
                  <div className="flex-1" onClick={() => setShowSupportSheet(false)} />
                  <div className="bg-white rounded-t-[24px] p-5 shadow-2xl flex flex-col max-h-[85%] overflow-y-auto z-50">
                    <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
                    
                    <div className="flex items-center gap-1.5 mb-3">
                      <HelpCircle className="w-5 h-5 text-indigo-900 shrink-0" />
                      <h3 className="text-sm font-bold text-indigo-950 font-sans">پشتیبانی و توسعه سامانه</h3>
                    </div>
                    
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                      برای گزارش مشکلات فنی (باگ)، پیگیری برآوردها و یا ارائه پیشنهادات جهت بهینه‌سازی سامانه، از طریق راه‌های زیر با تیم پشتیبانی در ارتباط باشید.
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <button 
                        onClick={() => showToast("ارتباط با پشتیبانی بله شروع شد (پل هوشمند شبیه‌سازی)")}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        ارتباط از طریق پیام‌رسان بله
                      </button>
                      
                      <button 
                        onClick={() => showToast("ارتباط با پشتیبانی تلگرام شروع شد (پل هوشمند شبیه‌سازی)")}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        ارتباط از طریق تلگرام
                      </button>
                      
                      <button 
                        onClick={() => showToast("فرم ارسال ایمیل باز شد (پل هوشمند شبیه‌سازی)")}
                        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        ارسال ایمیل
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-grow h-px bg-slate-200" />
                      <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">ارسال سریع پیشنهاد یا گزارش</span>
                      <div className="flex-grow h-px bg-slate-200" />
                    </div>
                    
                    <div className="space-y-3 mt-2">
                      <textarea 
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="مشکل یا پیشنهاد خود را اینجا بنویسید..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-900 resize-none"
                      />
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (!feedbackText.trim()) {
                              showToast("لطفاً ابتدا متنی بنویسید");
                              return;
                            }
                            showToast("پیام شما با موفقیت ثبت شد و توسط تیم فنی بررسی می‌گردد.");
                            setFeedbackText('');
                            setShowSupportSheet(false);
                          }}
                          className="flex-1 bg-indigo-900 hover:bg-indigo-950 text-white text-[11px] font-bold py-2 px-4 rounded-lg cursor-pointer text-center"
                        >
                          ارسال پیام
                        </button>
                        <button 
                          onClick={() => setShowSupportSheet(false)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold py-2 px-4 rounded-lg cursor-pointer text-center"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col overflow-y-auto">
                
                {flowScreen === 'auth' && (
                  <div className="flex-grow flex flex-col bg-white p-5 pt-1 justify-start">
                    <div>
                      <div className="text-white -mx-5 -mt-5 p-4 border-b flex justify-between items-center shadow-md relative pl-1" style={{ backgroundColor: brandTheme.primary, borderBottomColor: brandTheme.accent }}>
                        <div className="w-8 shrink-0" />
                        <div className="flex items-center justify-center flex-grow text-center">
                          <Coins className="w-4 h-4 ml-1.5 shrink-0" style={{ color: brandTheme.accent }} />
                          <h2 className="font-bold text-xs tracking-tight truncate" style={{ fontWeight: 'bold' }}>{brandTheme.brandName}</h2>
                        </div>
                        <button 
                          onClick={() => setShowSupportSheet(true)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          style={{ color: brandTheme.accent }}
                          title="پشتیبانی و بازخورد"
                        >
                          <HelpCircle className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <div className="flex justify-center items-center mt-3 mb-5 gap-1.5">
                        {[1, 2, 3, 4].map((stepNum) => {
                          const isActive = authStep >= stepNum;
                          return (
                            <div key={stepNum} className="flex items-center">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                style={{
                                  backgroundColor: authStep === stepNum ? brandTheme.accent : (isActive ? brandTheme.primary : '#E2E8F0'),
                                  color: (authStep === stepNum || isActive) ? '#FFFFFF' : '#64748B',
                                  transform: authStep === stepNum ? 'scale(1.1)' : 'none',
                                }}
                              >
                                {stepNum}
                              </div>
                              {stepNum < 4 && (
                                <div className="w-8 h-1 mx-1 rounded-full transition-all"
                                  style={{
                                    backgroundColor: authStep > stepNum ? brandTheme.accent : '#E2E8F0'
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {authStep === 1 && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-indigo-950" style={{ fontWeight: 'bold' }}>ورود یا عضویت</h3>
                            <p className="text-xs text-slate-500">برای شروع کافیست شماره سیم‌کارت موبایل خود را وارد کنید.</p>
                          </div>
                          <div className="space-y-1.5 pt-4">
                            <label className="text-xs font-bold text-slate-700">تلفن همراه</label>
                            <div className="relative">
                              <PhoneIcon className="absolute right-3.5 top-3 w-5 h-5" style={{ color: brandTheme.accent }} />
                              <input 
                                type="tel" 
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pr-11 pl-4 text-center text-md font-mono tracking-wider focus:outline-none focus:ring-2 focus:border-transparent text-slate-800"
                                style={{ stroke: brandTheme.primary }} 
                                placeholder="09123456789"
                                maxLength={11}
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (mobileNumber.length >= 10) {
                                setAuthStep(2);
                              } else {
                                alert('لطفاً شماره موبایل معتبری وارد کنید.');
                              }
                            }}
                            className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors text-sm mt-2 flex justify-center items-center cursor-pointer"
                            style={{ backgroundColor: brandTheme.primary }}
                          >
                            ارسال کد تایید
                          </button>
                        </div>
                      )}

                      {authStep === 2 && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-indigo-950 font-sans" style={{ fontWeight: 'bold' }}>کد تایید را وارد کنید</h3>
                            <p className="text-xs text-slate-500">رمز یکبار مصرف ۴ رقمی ارسال شده به {mobileNumber} را درج کنید.</p>
                          </div>
                          
                          <div className="pt-4">
                            <input 
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 text-center text-2xl font-bold font-mono tracking-widest focus:outline-none focus:ring-2 text-slate-800"
                              style={{ focusRing: brandTheme.accent }}
                              placeholder="۱۲۳۴"
                              maxLength={4}
                            />
                            <p className="text-[11px] text-center mt-2 font-medium" style={{ color: brandTheme.accent }}>کد پیش‌فرض تست: ۱۲۳۴ یا هر رمز تصادفی</p>
                          </div>

                          <button 
                            onClick={() => {
                              if (otpCode.length === 4 || otpCode === '1234' || otpCode === '') {
                                setAuthStep(3);
                              } else {
                                alert('کد تایید نادرست است؛ مجدد بررسی بفرمایید.');
                              }
                            }}
                            className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors text-sm flex justify-center items-center cursor-pointer"
                            style={{ backgroundColor: brandTheme.primary }}
                          >
                            تایید کد
                          </button>
                          
                          <button 
                            onClick={() => setAuthStep(1)}
                            className="w-full text-center text-xs font-semibold hover:opacity-80"
                            style={{ color: brandTheme.primary }}
                          >
                            اصلاح شماره همراه مجدد
                          </button>
                        </div>
                      )}

                      {authStep === 3 && (
                        <div className="space-y-5">
                          <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-indigo-950 font-sans" style={{ fontWeight: 'bold' }}>تعیین نقش شما در سیستم</h3>
                            <p className="text-xs text-slate-500">با توجه به جایگاه کاری، حساب کاربری را انتخاب نمایید</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <button 
                              onClick={() => setUserRole('surveyor')}
                              className="p-4 border-2 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer"
                              style={{
                                borderColor: userRole === 'surveyor' ? brandTheme.accent : '#E2E8F0',
                                backgroundColor: userRole === 'surveyor' ? brandTheme.accent + '15' : 'transparent',
                                color: userRole === 'surveyor' ? brandTheme.primary : '#64748B'
                              }}
                            >
                              <Briefcase className="w-8 h-8" style={{ color: userRole === 'surveyor' ? brandTheme.accent : '#94A3B8' }} />
                              <span className="font-bold text-sm" style={{ fontWeight: 'bold' }}>نقشه‌بردار</span>
                              <span className="text-[10px] opacity-85">کارشناس و مهندس مجری طرح</span>
                            </button>

                            <button 
                              onClick={() => setUserRole('client')}
                              className="p-4 border-2 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer"
                              style={{
                                borderColor: userRole === 'client' ? brandTheme.accent : '#E2E8F0',
                                backgroundColor: userRole === 'client' ? brandTheme.accent + '15' : 'transparent',
                                color: userRole === 'client' ? brandTheme.primary : '#64748B'
                              }}
                            >
                              <Building2 className="w-8 h-8" style={{ color: userRole === 'client' ? brandTheme.accent : '#94A3B8' }} />
                              <span className="font-bold text-sm" style={{ fontWeight: 'bold' }}>کارفرما</span>
                              <span className="text-[10px] opacity-85">صاحب پروژه و استعلام‌گیرنده</span>
                            </button>
                          </div>

                          <button 
                            onClick={() => {
                              if (userRole === 'surveyor') {
                                setAuthStep(4);
                              } else {
                                setFlowScreen('estimation');
                              }
                            }}
                            className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm mt-4 flex justify-center items-center cursor-pointer"
                            style={{ backgroundColor: brandTheme.primary }}
                          >
                            مرحله بعد و تنظیم مشخصات
                          </button>
                        </div>
                      )}

                      {authStep === 4 && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1">
                            <h3 className="text-base font-bold text-indigo-950 font-sans" style={{ fontWeight: 'bold' }}>مشخصات نقشه بردار</h3>
                            <p className="text-[11px] text-slate-500">لطفاً برای فیلتر تعرفه‌ها، جزئیات مجوز خود را به ثبت برسانید.</p>
                          </div>

                          <button
                            onClick={() => setAuthStep(3)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 w-fit"
                            style={{ color: brandTheme.primary }}
                          >
                            <ArrowLeft className="w-4 h-4" style={{ color: brandTheme.accent }} />
                            بازگشت به مرحله قبل
                          </button>

                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 pt-1">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700">نام و نام خانوادگی نقشه بردار</label>
                              <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^[ \u0600-\u06FF\u200C]*$/.test(val)) {
                                    setFullName(val);
                                  }
                                }}
                                placeholder="مثال: مهندس علیرضا دهقانی"
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1"
                                style={{ stroke: brandTheme.accent }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700">استان فعالیت</label>
                                <select 
                                  value={province}
                                  onChange={(e) => {
                                    const nextProv = e.target.value;
                                    setProvince(nextProv);
                                    const citiesList = iranProvincesAndCities[nextProv] || [];
                                    if (citiesList.length > 0) {
                                      setCity(citiesList[0]);
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                                >
                                  {Object.keys(iranProvincesAndCities).map((prov) => (
                                    <option key={prov} value={prov}>{prov}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700">شهرستان</label>
                                <select 
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                                >
                                  {(iranProvincesAndCities[province] || []).map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 items-center pt-1">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700">سابقه کاری (سال)</label>
                                <input 
                                  type="number" 
                                  value={experienceYears}
                                  onChange={(e) => setExperienceYears(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">نوع شخصیت</label>
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name="entity_type" 
                                      style={{ accentColor: brandTheme.accent }}
                                      checked={entityType === 'حقیقی'} 
                                      onChange={() => setEntityType('حقیقی')} 
                                    />
                                    حقیقی
                                  </label>
                                  <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name="entity_type" 
                                      style={{ accentColor: brandTheme.accent }}
                                      checked={entityType === 'حقوقی'} 
                                      onChange={() => setEntityType('حقوقی')} 
                                    />
                                    حقوقی
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-700">دارای پروانه نظام مهندسی</span>
                                <input 
                                  type="checkbox" 
                                  style={{ accentColor: brandTheme.accent }}
                                  className="w-8 h-4 rounded" 
                                  checked={hasLicense} 
                                  onChange={(e) => setHasLicense(e.target.checked)} 
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-700">کارشناس رسمی دادگستری</span>
                                <input 
                                  type="checkbox" 
                                  style={{ accentColor: brandTheme.accent }}
                                  className="w-8 h-4 rounded" 
                                  checked={isOfficialExpert} 
                                  onChange={(e) => setIsOfficialExpert(e.target.checked)} 
                                />
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              if (!fullName || fullName.trim() === '') {
                                alert('لطفاً نام را وارد نمایید.');
                                return;
                              }
                              if (!/^[ \u0600-\u06FF\u200C]+$/.test(fullName)) {
                                alert('نام و نام خانوادگی فقط باید شامل حروف فارسی و فاصله باشد.');
                                return;
                              }
                              if (!experienceYears || experienceYears.toString().trim() === '') {
                                alert('سابقه کار الزامی است');
                                return;
                              }
                              setFlowScreen('estimation');
                              showToast(`ثبت نام ${fullName} با موفقیت در صنف مهندسان یزد نهایی شد.`);
                            }}
                            className="w-full text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                            style={{ backgroundColor: brandTheme.primary }}
                          >
                            ثبت‌نام و ورود به محیط برآورد قیمت
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-6 text-center">
                      <p className="text-[10px] text-slate-400 font-mono">Powered by Google Flutter Technology & Material UI 3</p>
                    </div>
                  </div>
                )}

                {flowScreen === 'estimation' && (
                  <div className="flex-grow flex flex-col bg-slate-100 text-slate-800">
                    
                    <div className="text-white px-4 py-3 flex justify-between items-center shadow-md" style={{ backgroundColor: brandTheme.primary, borderBottom: `1px solid ${brandTheme.accent}` }}>
                      <button 
                        onClick={() => {
                          if (estimationTab > 1) {
                            setEstimationTab((estimationTab - 1) as 1 | 2 | 3);
                          } else {
                            setFlowScreen('auth');
                          }
                        }}
                        className="p-1 hover:bg-white/10 rounded cursor-pointer"
                        style={{ color: brandTheme.accent }}
                        title="بازگشت به مرحله قبلی"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-sm font-bold tracking-tight text-center flex-grow mx-2" style={{ fontWeight: 'bold' }}>{brandTheme.brandName}</h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={resetSimulator}
                          className="p-1 hover:text-white cursor-pointer"
                          style={{ color: brandTheme.accent }}
                          title="خروج و برگشت زودهنگام"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setShowSupportSheet(true)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          style={{ color: brandTheme.accent }}
                          title="پشتیبانی و بازخورد"
                        >
                          <HelpCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white flex border-b border-slate-200">
                      <button 
                        onClick={() => setEstimationTab(1)}
                        className="flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer"
                        style={{
                          borderBottomColor: estimationTab === 1 ? brandTheme.accent : 'transparent',
                          color: estimationTab === 1 ? brandTheme.primary : '#64748B',
                          backgroundColor: estimationTab === 1 ? brandTheme.accent + '08' : 'transparent',
                        }}
                      >
                        <Settings className="w-4 h-4 shrink-0" style={{ color: estimationTab === 1 ? brandTheme.accent : '#94A3B8' }} />
                        <span style={{ fontWeight: 'bold' }}>نوع خدمات</span>
                      </button>
                      <button 
                        onClick={() => setEstimationTab(2)}
                        className="flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer"
                        style={{
                          borderBottomColor: estimationTab === 2 ? brandTheme.accent : 'transparent',
                          color: estimationTab === 2 ? brandTheme.primary : '#64748B',
                          backgroundColor: estimationTab === 2 ? brandTheme.accent + '08' : 'transparent',
                        }}
                      >
                        <Scale className="w-4 h-4 shrink-0" style={{ color: estimationTab === 2 ? brandTheme.accent : '#94A3B8' }} />
                        <span style={{ fontWeight: 'bold' }}>حجم کار</span>
                      </button>
                      <button 
                        onClick={() => setEstimationTab(3)}
                        className="flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer"
                        style={{
                          borderBottomColor: estimationTab === 3 ? brandTheme.accent : 'transparent',
                          color: estimationTab === 3 ? brandTheme.primary : '#64748B',
                          backgroundColor: estimationTab === 3 ? brandTheme.accent + '08' : 'transparent',
                        }}
                      >
                        <Calculator className="w-4 h-4 shrink-0" style={{ color: estimationTab === 3 ? brandTheme.accent : '#94A3B8' }} />
                        <span style={{ fontWeight: 'bold' }}>هزینه‌ها و محاسبات</span>
                      </button>
                    </div>

                    <div className="p-4 flex-grow overflow-y-auto max-h-[500px]">
                      
                      {estimationTab === 1 && (
                        <div className="space-y-4">
                          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-slate-700 text-[11px] leading-relaxed select-none">
                            <strong className="text-indigo-950 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                              انتخاب قالب و درگاه کاربری
                            </strong>
                          </div>

                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3.5">
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">نوع خدمات (سطح ۱)</label>
                              <select 
                                value={serviceType}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setServiceType(val);
                                  const firstMain = Object.keys(surveyingServices[val] || {})[0] || '';
                                  setMainService(firstMain);
                                  const subList = (surveyingServices[val] && firstMain) ? surveyingServices[val][firstMain] : [];
                                  setSubBranch(subList[0] || '');
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                              >
                                {Object.keys(surveyingServices).map((key) => (
                                  <option key={key} value={key}>{key}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">خدمات اصلی (سطح ۲)</label>
                              <select 
                                value={mainService}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMainService(val);
                                  const subList = surveyingServices[serviceType]?.[val] || [];
                                  setSubBranch(subList[0] || '');
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                              >
                                {Object.keys(surveyingServices[serviceType] || {}).map((key) => (
                                  <option key={key} value={key}>{key}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">زیر شاخه (سطح ۳)</label>
                              <select 
                                value={subBranch}
                                onChange={(e) => setSubBranch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                              >
                                {(surveyingServices[serviceType]?.[mainService] || []).map((val) => (
                                  <option key={val} value={val}>{val}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">استان استخراج قیمتهای مصوب</label>
                              <select 
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                              >
                                <option value="یزد">یزد</option>
                                <option value="تهران">تهران</option>
                                <option value="اصفهان">اصفهان</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">ارگان / سازمان صادرکننده</label>
                              <select 
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                              >
                                <option value="همه">همه</option>
                                <option value="شهرداری یزد">شهرداری یزد</option>
                                <option value="نظام مهندسی ساختمان یزد">نظام مهندسی ساختمان یزد</option>
                                <option value="انجمن صنفی">انجمن صنفی</option>
                              </select>
                            </div>

                            <div className={`border rounded-xl p-3 text-xs mt-2 select-none flex justify-between items-center ${
                              remoteBaseTariff === null && !isRemoteLoading 
                                ? 'bg-red-50 border-red-200 text-red-600' 
                                : 'bg-blue-50 border-blue-200 text-blue-900'
                            }`}>
                              {remoteBaseTariff === null && !isRemoteLoading ? (
                                <div className="text-center w-full font-bold">
                                  تعرفهای برای این خدمات در ارگان انتخابی تعریف نشده است
                                </div>
                              ) : (
                                <>
                                  <span className="font-bold">تعرفه مصوب پایه (استعلام برخط):</span>
                                  {isRemoteLoading ? (
                                    <div className="flex items-center gap-1.5 text-blue-700 font-bold animate-pulse">
                                      <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                                      <span className="text-[10px]">در حال استعلام...</span>
                                    </div>
                                  ) : (
                                    <span className="font-mono font-black text-blue-700">
                                      {formatPersianCurrency(remoteBaseTariff ?? 0)} ریال
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {estimationTab === 2 && (
                        <div className="space-y-4">
                          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-slate-700 text-[11px] leading-relaxed">
                            <strong className="text-indigo-950 flex items-center gap-1 mb-1">
                              <InfoIcon className="w-3.5 h-3.5 text-indigo-600" />
                              حجم فیزیکی و زمان کار میدانى
                            </strong>
                            خدمات روزانه برای نیروها و تجهیزات در فرمول قیمت تمام شده تاثیر مستقیم دارند. تعداد روز به عنوان مبنای ضرب هزینههای روزانه بکار می‌رود.
                          </div>

                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1.5">حجم کار</label>
                              <input 
                                type="number" 
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                                placeholder="مثلاً: ۱۰"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1.5">واحد اندازهگیری</label>
                              <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold flex items-center gap-2 select-none">
                                <span className="bg-white border border-slate-300 px-2 py-0.5 rounded text-[10px] text-slate-600">سیستم فرعی</span>
                                <span>{getUnitForSubservice(subBranch)}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1.5">تعداد روزهای پیشبینی شده برای عملیات میدانی</label>
                              <input 
                                type="number" 
                                value={fieldDays}
                                onChange={(e) => setFieldDays(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono text-center font-bold text-indigo-900"
                                placeholder="مثلا: ۴"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {estimationTab === 3 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">۱. اکیپ صحرایی و پردازش دفتری (ریال)</h4>
                          
                          <div className="bg-slate-100 p-2 rounded-lg text-[10px] font-bold text-slate-500 grid grid-cols-12 gap-2 text-center select-none">
                            <span className="col-span-3 text-right pr-1">آیتم هزینه</span>
                            <span className="col-span-4">قیمت پایه (ریال)</span>
                            <span className="col-span-3">واحد</span>
                            <span className="col-span-2">تعداد</span>
                          </div>

                          <div className="space-y-2">
                            {(() => {
                              const renderCostRow = (
                                label: string,
                                price: number,
                                setPrice: (v: number) => void,
                                unit: 'daily' | 'half' | 'flat',
                                setUnit: (v: 'daily' | 'half' | 'flat') => void,
                                count?: number,
                                setCount?: (v: number) => void,
                                isLogistics: boolean = false
                              ) => {
                                const handleUnitChange = (newUnit: 'daily' | 'half' | 'flat') => {
                                  if (unit === 'daily' && newUnit === 'half') {
                                    setPrice(Math.round(price / 2));
                                  } else if (unit === 'half' && newUnit === 'daily') {
                                    setPrice(price * 2);
                                  }
                                  setUnit(newUnit);
                                };

                                return (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center">
                                    <span className="col-span-3 text-[11px] font-bold text-slate-700 truncate text-right pr-1" title={label}>
                                      {label}
                                    </span>
                                    <div className={isLogistics ? "col-span-5" : "col-span-4"}>
                                      <input 
                                        type="text" 
                                        value={formatPriceString(price)} 
                                        onChange={(e) => setPrice(parsePriceString(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-300 text-xs rounded text-center py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-900 font-mono font-bold text-slate-800"
                                        placeholder="ریال"
                                      />
                                    </div>
                                    <div className={isLogistics ? "col-span-4" : "col-span-3"}>
                                      {isLogistics ? (
                                        <div className="w-full bg-slate-100 border border-slate-200 text-[10px] rounded py-1.5 text-slate-500 font-bold text-center">
                                          مقطع
                                        </div>
                                      ) : (
                                        <select 
                                          value={unit} 
                                          onChange={(e: any) => handleUnitChange(e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-300 text-[10px] rounded px-1 py-1.5 text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-indigo-900"
                                        >
                                          <option value="daily">روزانه</option>
                                          <option value="half">نیم روز</option>
                                          <option value="flat">مقطوع</option>
                                        </select>
                                      )}
                                    </div>
                                    {!isLogistics && count !== undefined && setCount !== undefined && (
                                      <div className="col-span-2">
                                        <input 
                                          type="number" 
                                          value={count} 
                                          min="0"
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setCount(isNaN(val) ? 0 : Math.max(0, val));
                                          }}
                                          className="w-full bg-slate-50 border border-slate-300 text-xs rounded text-center py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-900 font-bold text-indigo-900"
                                          title="تعداد"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {renderCostRow('سرپرست کارگاه / با تجربه', supervisorPrice, setSupervisorPrice, supervisorUnit, setSupervisorUnit, supervisorCount, setSupervisorCount, false)}
                                  {renderCostRow('کمک کارشناس / میر', assistantPrice, setAssistantPrice, assistantUnit, setAssistantUnit, assistantCount, setAssistantCount, false)}
                                  {renderCostRow('توتال استیشن (TS)', totalStationPrice, setTotalStationPrice, totalStationUnit, setTotalStationUnit, totalStationCount, setTotalStationCount, false)}
                                  {renderCostRow('گیرنده سه فرکانسه GPS', gpsPrice, setGpsPrice, gpsUnit, setGpsUnit, gpsCount, setGpsCount, false)}
                                  {renderCostRow('اسکنر سه‌بعدی لیزری', scannerPrice, setScannerPrice, scannerUnit, setScannerUnit, scannerCount, setScannerCount, false)}
                                  {renderCostRow('کارشناس مهندسی پردازش', officePrice, setOfficePrice, officeUnit, setOfficeUnit, officeCount, setOfficeCount, false)}
                                  {renderCostRow('ایاب و ذهاب به سایت', logisticsPrice, setLogisticsPrice, logisticsUnit, setLogisticsUnit, undefined, undefined, true)}
                                  {renderCostRow('تغذیه و تدارکات پرسنل', feedingPrice, setFeedingPrice, feedingUnit, setFeedingUnit, undefined, undefined, true)}
                                </>
                              );
                            })()}
                          </div>

                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider pt-2">۲. موازنه، ضرایب سختی و کسر قانونی</h4>
                          
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                            <div>
                              <span className="text-xs font-bold text-slate-700 block mb-1">ضریب سختی کار میدانی (جغرافیا)</span>
                              <div className="flex gap-1.5">
                                {[
                                  { label: 'آسان (۱.۰)', val: 1.0 },
                                  { label: 'متوسط (۱.۲)', val: 1.2 },
                                  { label: 'سخت (۱.۵)', val: 1.5 }
                                ].map((item) => (
                                  <button 
                                    key={item.val}
                                    onClick={() => setHardnessMultiplier(item.val as any)}
                                    className={`flex-1 py-1 px-2 border rounded-lg text-center text-xs font-bold transition-all ${
                                      hardnessMultiplier === item.val
                                        ? 'bg-indigo-900 border-indigo-950 text-white shadow'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">درصد سود بالاسری مجری</label>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    value={overheadProfitPct}
                                    onChange={(e) => setOverheadProfitPct(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 pr-8 text-xs font-mono text-center text-slate-800"
                                  />
                                  <Percent className="absolute right-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                                </div>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">کسورات قانونی صنف و مالیات</label>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    value={legalDeductionsPct}
                                    onChange={(e) => setLegalDeductionsPct(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 pr-8 text-xs font-mono text-center text-slate-800"
                                  />
                                  <Percent className="absolute right-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                              <span className="text-xs font-bold text-slate-700 block mb-1">سرشکنی هزینه‌ها (مدیریت کارهای خرد)</span>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="flex items-center text-[11px] font-bold text-slate-700">تعداد پروژه‌های همزمان در این اعزام</label>
                                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: brandTheme.accent + '25', color: brandTheme.primary }}>{batchingFactor}</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="1" 
                                  max="10" 
                                  step="1"
                                  value={batchingFactor}
                                  onChange={(e) => setBatchingFactor(parseInt(e.target.value) || 1)}
                                  className="w-full cursor-pointer"
                                  style={{ accentColor: brandTheme.accent }}
                                />
                                <p className="text-[10px] text-slate-400 leading-normal text-right">هزینه کل اکیپ و تجهیزات بر این عدد تقسیم می‌شود.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom main final triggers (Dynamic Based on Tab) */}
                    <div className="bg-white border-t border-slate-200 p-4">
                      {estimationTab === 1 && (
                        <button 
                          onClick={() => setEstimationTab(2)}
                          className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors text-sm flex justify-center items-center gap-2 cursor-pointer"
                          style={{ backgroundColor: brandTheme.primary }}
                        >
                          <Scale className="w-5 h-5 shrink-0" style={{ color: brandTheme.accent }} />
                          تایید و مرحله بعد (حجم کار)
                        </button>
                      )}
                      
                      {estimationTab === 2 && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEstimationTab(1)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-colors text-sm flex justify-center items-center cursor-pointer"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setEstimationTab(3)}
                            className="flex-1 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors text-sm flex justify-center items-center gap-2 cursor-pointer"
                            style={{ backgroundColor: brandTheme.primary }}
                          >
                            <Calculator className="w-5 h-5 shrink-0" style={{ color: brandTheme.accent }} />
                            تایید و مرحله بعد (هزینه‌ها)
                          </button>
                        </div>
                      )}

                      {estimationTab === 3 && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEstimationTab(2)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-colors text-sm flex justify-center items-center cursor-pointer"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={runCalculationAndNavigate}
                            className="flex-1 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors text-sm flex justify-center items-center gap-2 cursor-pointer"
                            style={{ backgroundColor: brandTheme.primary }}
                          >
                            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: brandTheme.accent }} />
                            محاسبه نهایی قیمت
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {flowScreen === 'dashboard' && (
                  <div className="flex-grow flex flex-col bg-slate-100 text-slate-800">
                    
                    <div className="text-white px-4 py-3 flex items-center justify-between gap-2 shadow-md" style={{ backgroundColor: brandTheme.primary, borderBottom: `1px solid ${brandTheme.accent}` }}>
                      <button 
                        onClick={() => setFlowScreen('estimation')}
                        className="p-1 hover:bg-white/10 rounded cursor-pointer"
                        style={{ color: brandTheme.accent }}
                        title="برگشت به صفحه محاسبات"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-sm font-bold text-center flex-grow" style={{ fontWeight: 'bold' }}>{brandTheme.brandName}</h2>
                      <button 
                        onClick={() => setShowSupportSheet(true)}
                        className="p-1 hover:text-white transition-colors cursor-pointer"
                        style={{ color: brandTheme.accent }}
                        title="پشتیبانی و بازخورد"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-4 flex-grow overflow-y-auto space-y-4 max-h-[560px]">
                      
                      <div className="bg-white p-4 rounded-xl border-t-4 shadow-sm space-y-2" style={{ borderTopColor: brandTheme.accent }}>
                        <span className="text-[11px] font-bold text-slate-500 block">کف قیمت تمام شده براساس سود و هزینه</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-mono font-black text-slate-800">{formatPersianCurrency(totalCalculatedCost)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">ریال ایران</span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border-t-4 shadow-sm space-y-3" style={{ borderTopColor: brandTheme.accent }}>
                        <span className="text-[11px] font-bold text-slate-500 block">هزینه بر اساس قیمت های مصوب</span>
                        {(() => {
                          const parsePersianOrEnglishFloat = (str: string): number => {
                            if (!str) return 0;
                            const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
                            let clean = str;
                            for (let i = 0; i < 10; i++) {
                              clean = clean.replace(persianNumbers[i], i.toString());
                            }
                            const dict: Record<string, string> = {
                              '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                              '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
                            };
                            let resolved = '';
                            for (const char of clean) {
                              resolved += dict[char] !== undefined ? dict[char] : char;
                            }
                            const val = parseFloat(resolved);
                            return isNaN(val) ? 0 : val;
                          };

                          const baseTariff = remoteBaseTariff ?? 0;
                          const numVolume = parsePersianOrEnglishFloat(volume);
                          const unitString = getUnitForSubservice(subBranch);
                          const rawBasePrice = calculateSmartTariff(baseTariff, numVolume, unitString, subBranch);
                          const approvedTariff = Math.round(rawBasePrice * hardnessMultiplier * (1 + (overheadProfitPct / 100)) * (1 - (legalDeductionsPct / 100)));

                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs text-slate-600">
                                <span>مبلغ پایه (بدون ضریب):</span>
                                <span className="font-mono font-bold">{formatPersianCurrency(Math.round(rawBasePrice))} ریال</span>
                              </div>
                              <div className="border-t border-slate-100 my-1" />
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold" style={{ color: brandTheme.primary }}>مبلغ نهایی (با اعمال ضرایب و کسورات):</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-mono font-black" style={{ color: brandTheme.primary }}>{formatPersianCurrency(approvedTariff)}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">ریال</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {!hasSubmittedPrice && (
                        <button
                          id="submit-estimate-btn"
                          onClick={() => {
                            showToast("برآورد نهایی شما ثبت و در داد های آماریی جهت انالیز استفاده خواهد شد");
                            setHasSubmittedPrice(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 border-2 border-dashed font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer"
                          style={{ borderColor: brandTheme.accent, color: brandTheme.primary }}
                        >
                          <Users className="w-4 h-4 text-emerald-600" style={{ color: brandTheme.accent }} />
                          ثبت برآورد من و مشاهده آمار کشوری
                        </button>
                      )}

                      {hasSubmittedPrice && (
                        <div id="market-pulse-card-3" className="bg-white p-4 rounded-xl shadow-sm space-y-3.5 border border-slate-200 select-none animate-fade-in text-right">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">۳. نبض بازار کشوری (آمار لحظهای)</span>
                          
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex-row-reverse text-right">
                              <Users className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="text-[10px] text-slate-700 font-medium font-sans w-full">
                                تعداد کل برآوردها: <strong className="text-slate-900 font-mono">{marketPulse.count}</strong> مورد
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex-row-reverse text-right">
                              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-[10px] text-emerald-800 font-bold font-sans w-full">
                                بالاترین میانگین: <span className="underline decoration-emerald-200">{marketPulse.maxProv}</span> ({formatPersianCurrency(marketPulse.maxPrice)} ریال)
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex-row-reverse text-right">
                              <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                              <span className="text-[10px] text-rose-800 font-bold font-sans w-full">
                                پایینترین میانگین: <span className="underline decoration-rose-200">{marketPulse.minProv}</span> ({formatPersianCurrency(marketPulse.minPrice)} ریال)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-xl text-white shadow-lg space-y-3 relative overflow-hidden" style={{ backgroundColor: brandTheme.primary, boxShadow: `0 10px 15px -3px ${brandTheme.primary}20` }}>
                        <span className="text-[10px] font-bold block uppercase pt-2" style={{ color: brandTheme.accent }}>۴. پیشنهاد هوشمندانه سیستم</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-mono font-black" style={{ color: brandTheme.accent }}>{formatPersianCurrency(totalCalculatedCost * 1.15)}</span>
                          <span className="text-[10px] font-bold" style={{ color: brandTheme.accent }}>ریال ایران</span>
                        </div>
                        <p className="text-[10px] leading-normal opacity-90 text-slate-100">
                          حاشیه سود ایمن ۱۵٪: دارای بالاترین درصد شانس پذیرش مشتری بدون فدا کردن کیفیت فنی پروژه.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 select-none text-right">
                        <div className="flex items-center gap-1.5 flex-row-reverse" style={{ color: brandTheme.primary }}>
                          <Briefcase className="w-5 h-5 shrink-0" style={{ color: brandTheme.accent }} />
                          <span className="text-xs font-bold" style={{ fontWeight: 'bold' }}>۵. تصمیم قیمت‌گذاری توافقی پیش‌نویس (استراتژی قیمت‌گذاری)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          یکی از سه استراتژی قیمت‌گذاری زیر را برای ارزش‌گذاری پیش‌نویس قرارداد نهایی انتخاب کنید:
                        </p>
                        
                        <div className="space-y-2 pt-1">
                          {/* 1. Base Price Option */}
                          <div 
                            onClick={() => setPriceStrategy('base')}
                            className="p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between"
                            style={{
                              borderColor: priceStrategy === 'base' ? brandTheme.accent : '#e2e8f0',
                              backgroundColor: priceStrategy === 'base' ? brandTheme.accent + '15' : 'transparent'
                            }}
                          >
                            <div className="flex items-center justify-between flex-row-reverse leading-none">
                              <span className="text-[11px] font-bold font-sans" style={{ color: priceStrategy === 'base' ? brandTheme.primary : '#475569', fontWeight: 'bold' }}>کف قیمت تمام شده</span>
                              <input 
                                type="radio" 
                                name="priceStrategy"
                                checked={priceStrategy === 'base'} 
                                onChange={() => setPriceStrategy('base')} 
                                className="cursor-pointer h-3.5 w-3.5"
                                style={{ accentColor: brandTheme.accent }}
                              />
                            </div>
                            <div className="flex items-baseline justify-between mt-1.5 font-mono">
                              <span className="text-[9px] text-slate-400 font-sans">بر اساس هزینه و سود برآورد شده</span>
                              <span className="text-sm font-black" style={{ color: priceStrategy === 'base' ? brandTheme.primary : '#1e293b' }}>
                                {formatPersianCurrency(derivedBasePrice)} <span className="text-[10px] font-sans font-bold">ریال</span>
                              </span>
                            </div>
                          </div>

                          {/* 2. Official Price Option */}
                          <div 
                            onClick={() => setPriceStrategy('official')}
                            className="p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between"
                            style={{
                              borderColor: priceStrategy === 'official' ? brandTheme.accent : '#e2e8f0',
                              backgroundColor: priceStrategy === 'official' ? brandTheme.accent + '15' : 'transparent'
                            }}
                          >
                            <div className="flex items-center justify-between flex-row-reverse leading-none">
                              <span className="text-[11px] font-bold font-sans" style={{ color: priceStrategy === 'official' ? brandTheme.primary : '#475569', fontWeight: 'bold' }}>مبلغ نهایی با اعمال ضرایب (تعرفه مصوب)</span>
                              <input 
                                type="radio" 
                                name="priceStrategy"
                                checked={priceStrategy === 'official'} 
                                onChange={() => setPriceStrategy('official')} 
                                className="cursor-pointer h-3.5 w-3.5"
                                style={{ accentColor: brandTheme.accent }}
                              />
                            </div>
                            <div className="flex items-baseline justify-between mt-1.5 font-mono">
                              <span className="text-[9px] text-slate-400 font-sans">بر اساس قیمت مصوب استعلام شده</span>
                              <span className="text-sm font-black" style={{ color: priceStrategy === 'official' ? brandTheme.primary : '#1e293b' }}>
                                {formatPersianCurrency(derivedOfficialPrice)} <span className="text-[10px] font-sans font-bold">ریال</span>
                              </span>
                            </div>
                          </div>

                          {/* 3. Suggested Price Option */}
                          <div 
                            onClick={() => setPriceStrategy('suggested')}
                            className="p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between"
                            style={{
                              borderColor: priceStrategy === 'suggested' ? brandTheme.accent : '#e2e8f0',
                              backgroundColor: priceStrategy === 'suggested' ? brandTheme.accent + '15' : 'transparent'
                            }}
                          >
                            <div className="flex items-center justify-between flex-row-reverse leading-none">
                              <span className="text-[11px] font-bold font-sans" style={{ color: priceStrategy === 'suggested' ? brandTheme.primary : '#475569', fontWeight: 'bold' }}>پیشنهاد هوشمندانه سیستم</span>
                              <input 
                                type="radio" 
                                name="priceStrategy"
                                checked={priceStrategy === 'suggested'} 
                                onChange={() => setPriceStrategy('suggested')} 
                                className="cursor-pointer h-3.5 w-3.5"
                                style={{ accentColor: brandTheme.accent }}
                              />
                            </div>
                            <div className="flex items-baseline justify-between mt-1.5 font-mono">
                              <span className="text-[9px] text-slate-400 font-sans font-medium">سود بهینه با شانس حداکثری توافق</span>
                              <span className="text-sm font-black" style={{ color: priceStrategy === 'suggested' ? brandTheme.primary : '#1e293b' }}>
                                {formatPersianCurrency(derivedSuggestedPrice)} <span className="text-[10px] font-sans font-bold">ریال</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Selected Price indicator bar */}
                        <div className="mt-1 bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center flex-row-reverse">
                          <span className="text-[9px] font-bold text-slate-400">مبلغ انتخاب شده پیش‌نویس:</span>
                          <span className="text-sm font-mono font-black animate-pulse" style={{ color: brandTheme.primary }}>
                            {formatPersianCurrency(parseInt(finalAgreedPrice) || 0)} <span className="text-[10px] font-sans font-bold text-slate-400">ریال</span>
                          </span>
                        </div>
                      </div>

                    </div>

                    <div className="bg-white border-t border-slate-200 p-4">
                      <button 
                        onClick={saveProjectFinal}
                        className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-xs flex justify-center items-center gap-1.5 cursor-pointer hover:scale-[1.01] transition-all"
                        style={{ backgroundColor: brandTheme.primary, fontWeight: 'bold' }}
                      >
                        ثبت نهایی پروژه در سیستم مالکیتی
                      </button>
                    </div>

                  </div>
                )}

              </div>

              <div className="h-4 bg-slate-900 flex justify-center items-center pb-1">
                <span className="w-24 h-1 bg-slate-300/40 rounded-full"></span>
              </div>

            </div>
          </div>
        </section>

        {/* TAB 2: FLUTTER CODE EXPORTER */}
        <section className={`lg:col-span-6 xl:col-span-7 h-full flex flex-col justify-stretch ${activeTab === 'code' ? 'block' : 'hidden lg:flex'}`}>
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[790px]">
            
            <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">کد کامل Flutter (یکپارچه تک فایل)</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">آماده ایجاد پروژه‌ در فلوتر دسکتاپ، اندروید و وب با کپی یکباره</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                  بدون وابستگی اضافه
                </span>
                <button 
                  onClick={handleCopy}
                  className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 duration-100 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      کپی کد کامل Dart
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <strong className="text-slate-900 block font-bold">💡 راهنمای پیاده‌سازی سریع:</strong>
                <p className="leading-relaxed">
                  یک پروژه فلوتر جدید بسازید و تمام محتوای این کد را جایگزین فایل <code className="text-emerald-600 bg-emerald-100/40 px-1 py-0.5 rounded font-mono">lib/main.dart</code> کنید. این برنامه‌ی باارزش، مستقل طراحی شده است.
                </p>
              </div>
              <div className="space-y-1.5">
                <strong className="text-slate-900 block font-bold">⚙️ منطق‌های پیاده‌سازی شده:</strong>
                <p className="leading-relaxed">
                  مکانیزم‌های احراز هویت چند مرحله‌ای، فیلتر اکیپ و سختی کار، بالاسری پیشرفته و کسر قانونی در قالب یک <code className="text-emerald-400 font-mono">StatefulWidget</code> یکپارچه.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-6 font-mono text-[12px] leading-relaxed text-slate-300 relative select-text" dir="ltr">
              <pre className="whitespace-pre">
                {DART_MAIN_CODE}
              </pre>
            </div>

            <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>فایل تولید شده با موفقیت در مخزن کانتینر ذخیره شد: <code className="text-slate-800 bg-slate-100 font-mono px-1 py-0.5 rounded">/main.dart</code></span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">Lines: ~1100</span>
            </div>

          </div>
        </section>

      </main>

      {/* COMPREHENSIVE DETAILED INSTRUCTION SECTION */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-12 text-slate-600 text-xs">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 leading-relaxed">
          
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-500" />
              منطق محاسبات صنف (استان یزد)
            </h4>
            <p>
              فرمول اصلی بر اساس فیلتر اکیپ‌ها اعمال شده است. اگر آیتمی روزانه انتخاب شده باشد، مقدار کارکرد در روزهای وارد شده ضرب می‌گردد و هزینه‌های مقطوع به صورت ثابت جمع می‌شوند. کل قیمت تمام شده با در نظر گرفتن ضریب سختی (آسان ۱.۰ تا سخت ۱.۵) تشدید شده و سپس در ضریب بالاسری و سود (مثلا ۱۵٪) ضرب و در نهایت سهم کسورات مجری کسر می‌شود تا تراز خالص برآورد گردد.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ساختار فایل‌های فلوتر (Flutter)
            </h4>
            <p>
              کد شامل سه ویوی مجزا است که رفت‌و‌آمد به هرکدام توسط مدیریت وضعیت ساده اداره می‌شود. تب لایوت بخش برآمد هزینه از کنترلر توکار فلوتر بهره می‌جوید و تمام ورودی‌های محاسباتی به صورت عددی قابل تنظیم و کالیبره‌شدن هستند. برنامه بدون نیاز به هیچ وابستگی در بسته‌های خارجی کامپایل شده و آماده بهره برداری در محیط واقعی است.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-emerald-500" />
              پشتیبانی از زبان شیرین فارسی (RTL Fa)
            </h4>
            <p>
              یک ویجت <code className="text-slate-700 bg-slate-100 font-mono px-1 py-0.5 rounded">Directionality</code> با پیکربندی <code className="text-slate-705 bg-slate-100 font-mono px-1 py-0.5 rounded">textDirection: TextDirection.rtl</code> به عنوان پوشش‌دهنده ریشه‌ای تمام فرم‌ها طراحی شده تا ناترازی ها از ریشه مرتفع گردیده و متون فارسی، فرم‌ها و منوها کاملاً بومی نمایش داده شوند.
            </p>
          </div>

        </div>
        <div className="text-center mt-8 pt-4 border-t border-slate-200 max-w-7xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© ۱۳۹۶ - ۱۴۰۵ سامانه مدیریت بها و قیمت گزاری مهندسی نقشه‌برداران</span>
          <span className="text-slate-500 font-mono text-[10px]">Dart 3.x Compliant | Material Design 3 Spec</span>
        </div>
      </footer>

    </div>
  );
}