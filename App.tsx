import { useState, useEffect } from 'react';
import { 
  Phone as PhoneIcon, 
  Briefcase, 
  ShieldCheck, 
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
  Coins, 
  Percent, 
  Scale, 
  RotateCcw,
  Sparkles,
  Settings,
  LogOut
} from 'lucide-react';
import { DART_MAIN_CODE } from './src/dartCode';
import { iranProvincesAndCities } from './src/iran_data';

const InfoIcon = HelpCircle;

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

function calculateSmartTariff(basePrice: number, volume: number, unitString: string, _subBranch: string = ""): number {
  if (unitString.includes("زیر یک")) {
    const effectiveVolume = Math.max(1.0, volume);
    return basePrice * effectiveVolume;
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

function cleanStr(s: any): string {
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
}

function getAvailableOrganizations(sub: string, tariffsList: any[]): string[] {
  const orgsSet = new Set<string>();
  orgsSet.add('همه');

  const targetSubClean = cleanStr(sub);
  const matchingRows = tariffsList.filter((row: any) => cleanStr(row.sub_service) === targetSubClean);

  matchingRows.forEach((row: any) => {
    if (row.organization && row.organization.trim() !== '' && cleanStr(row.organization) !== cleanStr('همه')) {
      orgsSet.add(row.organization.trim());
    }
  });

  return Array.from(orgsSet);
}

function parsePersianOrEnglishFloatHelper(str: string): number {
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
  const [volume, setVolume] = useState('۱۲');
  const [fieldDays, setFieldDays] = useState('۴');
  
  const [serviceType, setServiceType] = useState('نقشه ثبتی ماده (۱۴۷)');
  const [mainService, setMainService] = useState('برداشت میدانی');
  const [subBranch, setSubBranch] = useState('برداشت عرصه و اعیان');

  const [organization, setOrganization] = useState('همه');
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteBaseTariff, setRemoteBaseTariff] = useState<number | null>(3500000);
  const [tariffExplanation, setTariffExplanation] = useState<string>('');

  const [tariffsList, setTariffsList] = useState<any[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<string[]>(['همه']);

  // Fetch all tariffs once on mount
  useEffect(() => {
    let active = true;
    setIsRemoteLoading(true);

    const fetchAllTariffs = async () => {
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
            setTariffsList(data);
          }
        }
      } catch (e) {
        console.error("Failed to load tariffs list", e);
      } finally {
        if (active) setIsRemoteLoading(false);
      }
    };

    fetchAllTariffs();

    return () => {
      active = false;
    };
  }, []);

  // Update available organizations and match the current base tariff whenever inputs change
  useEffect(() => {
    // 1. Calculate available organizations for this subBranch
    const orgs = getAvailableOrganizations(subBranch, tariffsList);
    setAvailableOrgs(orgs);

    // 2. Auto-select: If the currently selected organization is not in the list,
    // automatically set it to the first available organization of the new list.
    let currentOrg = organization;
    if (!orgs.includes(organization)) {
      currentOrg = orgs[0] || 'همه';
      setOrganization(currentOrg);
    }

    // 3. Match the current base tariff from the list
    const targetProvince = cleanStr(province);
    const targetOrg = cleanStr(currentOrg);
    const targetSub = cleanStr(subBranch);

    const matchingCategoryRows = tariffsList.filter((row: any) => {
      const rowProv = cleanStr(row.province);
      const rowOrg = cleanStr(row.organization);
      const rowSub = cleanStr(row.sub_service);

      const provinceMatches = !rowProv || rowProv === targetProvince || rowProv === cleanStr('همه');
      const subServiceMatches = rowSub === targetSub;
      const orgMatches = targetOrg === cleanStr('همه') || rowOrg === targetOrg || rowOrg === cleanStr('همه');

      return provinceMatches && subServiceMatches && orgMatches;
    });

    const isTieredService = targetSub.includes('تفکیک') || targetSub.includes('تکخطی') || targetSub.includes('تکخطی') || targetSub.includes('تک خطی');

    if (isTieredService && matchingCategoryRows.length > 0) {
      // Find the price for basePrice (whose row.unit strictly contains 'قیمت ثابت' and does NOT contain 'به اضافه')
      const fixedRow = matchingCategoryRows.find((row: any) => {
        const u = row.unit || '';
        return u.includes('قیمت ثابت') && !u.includes('به اضافه');
      });

      let basePrice = 0;
      if (fixedRow) {
        basePrice = Number(fixedRow.price);
      } else {
        // Fallback: search with cleaned version if direct contains fails, or use first row
        const cleanedFixedRow = matchingCategoryRows.find((row: any) => {
          const cu = cleanStr(row.unit || '');
          return cu.includes('قیمتثابت') && !cu.includes('بهاضافه');
        });
        basePrice = cleanedFixedRow ? Number(cleanedFixedRow.price) : (matchingCategoryRows[0] ? Number(matchingCategoryRows[0].price) : 0);
      }

      const area = parsePersianOrEnglishFloatHelper(volume) || 0;
      if (area <= 200) {
        setRemoteBaseTariff(basePrice);
        setTariffExplanation(`محاسبه: متراژ کمتر از ۲۰۰ متر (قیمت ثابت پایه: ${formatPersianCurrency(basePrice)} ریال)`);
      } else {
        const surplus = area - 200;
        
        let matchingTierRow = null;
        let tierLabel = '';

        if (area >= 201 && area <= 600) {
          tierLabel = '۲۰۱ تا ۶۰۰ متر';
          matchingTierRow = matchingCategoryRows.find((r: any) => {
            const u = String(r.unit || '');
            return (u.includes('600') && u.includes('200')) || (u.includes('۶۰۰') && u.includes('۲۰۰'));
          });
        } else if (area >= 601 && area <= 2000) {
          tierLabel = '۶۰۱ تا ۲۰۰۰ متر';
          matchingTierRow = matchingCategoryRows.find((r: any) => {
            const u = String(r.unit || '');
            return (u.includes('2000') && u.includes('600')) || (u.includes('۲۰۰۰') && u.includes('۶۰۰'));
          });
        } else if (area >= 2001 && area <= 5000) {
          tierLabel = '۲۰۰۱ تا ۵۰۰۰ متر';
          matchingTierRow = matchingCategoryRows.find((r: any) => {
            const u = String(r.unit || '');
            return (u.includes('5000') && u.includes('2000')) || (u.includes('۵۰۰۰') && u.includes('۲۰۰۰'));
          });
        } else if (area > 5000) {
          tierLabel = 'بیش از ۵۰۰۰ متر';
          matchingTierRow = matchingCategoryRows.find((r: any) => {
            const u = String(r.unit || '');
            return u.includes('بیش از 5000') || u.includes('بیش از ۵۰۰۰') || u.includes('5000') || u.includes('۵۰۰۰');
          });
        }

        if (!matchingTierRow && matchingCategoryRows.length > 0) {
          const tierRows = matchingCategoryRows.filter((r: any) => r.id !== fixedRow?.id);
          matchingTierRow = tierRows[0] || matchingCategoryRows[0];
        }

        const rate = matchingTierRow ? Number(matchingTierRow.price) : 0;
        const calculatedPrice = basePrice + (surplus * rate);
        setRemoteBaseTariff(calculatedPrice);
        setTariffExplanation(`محاسبه: ${formatPersianCurrency(basePrice)} (پایه) + (${formatPersianCurrency(surplus)} متر مازاد × ${formatPersianCurrency(rate)} ریال نرخ پله ${tierLabel})`);
      }
    } else {
      // Standard service: simple direct match
      const match = matchingCategoryRows[0];
      if (match && match.price != null) {
        setRemoteBaseTariff(Number(match.price));
        setTariffExplanation(`تعرفه واحد خام مصوب: ${formatPersianCurrency(Number(match.price))} ریال`);
      } else {
        setRemoteBaseTariff(0);
        setTariffExplanation('');
      }
    }
  }, [subBranch, province, organization, tariffsList, volume]);

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
  const [logisticsCount] = useState(1);
  const [feedingCount] = useState(1);

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
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [finalAgreedPrice, setFinalAgreedPrice] = useState('');
  const [priceStrategy, setPriceStrategy] = useState<'min' | 'max'>('min');
  const [hasSubmittedPrice, setHasSubmittedPrice] = useState(false);
  const [marketPulse, setMarketPulse] = useState({ count: 0, maxPrice: 0, minPrice: 0, avgPrice: 0, hasData: false });
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [finalPriceStrategy, setFinalPriceStrategy] = useState<'cost' | 'official' | 'smart'>('smart');
  const [finalSelectedPrice, setFinalSelectedPrice] = useState<number>(0);

  const brandTheme = {
    primary: "#0B1D35", 
    accent: "#C5A059",
    brandName: "برآورد ژئو"
  };

  useEffect(() => {
    fetch('https://tzmtolgfejpqonjxemgy.supabase.co/rest/v1/projects?select=*', {
      headers: {
        'apikey': 'sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk',
        'Authorization': 'Bearer sb_publishable_xQn34TAqX2k5D0zxkTwBNw_hYdFOrtk'
      }
    })
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setAllProjects(data);
        }
      })
      .catch(err => {
        console.error("Error fetching projects for pulse stats:", err);
      });
  }, [hasSubmittedPrice]);

  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
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

      const targetSub = cleanStr(subBranch);
      const targetProv = cleanStr(province);

      const filteredData = allProjects.map(item => {
        if (!item.sub_service && !item.sub_branch && !item.subBranch && !item.subService) {
          const servicesList = [
            'برداشت عرصه و اعیان',
            'تهیه نقشه تعیین موقعیت ملک',
            'تفکیک آپارتمان',
            'نقشه تک خطی',
            'ازبیلت عمرانی و تاسیسات'
          ];
          const index = (typeof item.final_price === 'number' 
            ? item.final_price 
            : parseInt(item.final_price) || 0) % servicesList.length;
          return {
            ...item,
            sub_service: servicesList[index]
          };
        }
        return item;
      }).filter(item => {
        const itemSub = cleanStr(item.sub_service || item.sub_branch || item.subBranch || item.subService || '');
        const itemProv = cleanStr(item.province || '');
        // Filter by subBranch, and also matches province (if specified, or fallback to general)
        return itemSub === targetSub && (!itemProv || itemProv === targetProv || targetProv === 'همه');
      });

      if (filteredData.length > 0) {
        let maxVal = -Infinity;
        let minVal = Infinity;
        let sumVal = 0;
        
        filteredData.forEach(item => {
          const price = typeof item.final_price === 'number' 
            ? item.final_price 
            : parseFloat(item.final_price as string) || 0;
          if (price > maxVal) maxVal = price;
          if (price < minVal) minVal = price;
          sumVal += price;
        });

        setMarketPulse({
          count: filteredData.length,
          maxPrice: maxVal === -Infinity ? 0 : Math.round(maxVal),
          minPrice: minVal === Infinity ? 0 : Math.round(minVal),
          avgPrice: sumVal / filteredData.length,
          hasData: true
        });
      } else {
        setMarketPulse({
          count: 0,
          maxPrice: 0,
          minPrice: 0,
          avgPrice: 0,
          hasData: false
        });
      }
    } else {
      setMarketPulse({
        count: 0,
        maxPrice: 0,
        minPrice: 0,
        avgPrice: 0,
        hasData: false
      });
    }
  }, [allProjects, subBranch, serviceType, province]);

  useEffect(() => {
    if (priceStrategy === 'min') {
      setFinalAgreedPrice((minPrice || Math.round(totalCalculatedCost * 0.85)).toString());
    } else if (priceStrategy === 'max') {
      setFinalAgreedPrice((maxPrice || Math.round(totalCalculatedCost * 1.25)).toString());
    }
  }, [priceStrategy, minPrice, maxPrice, totalCalculatedCost]);

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
    // Parse field days supporting both Persian and English digits safely
    const days = Math.max(1, parsePersianOrEnglishFloatHelper(fieldDays) || 1);

    const parseSafeVal = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      const parsed = Number(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    // hasInput determines if the cost row has a user-editable "count" input field in the UI
    const getSafeItemCost = (rawPrice: any, rawCount: any, unit: 'daily' | 'half' | 'flat', hasInput: boolean) => {
      const price = parseSafeVal(rawPrice);
      let count = 0;

      if (hasInput) {
        if (rawCount === '' || rawCount === undefined || rawCount === null) {
          count = 0;
        } else {
          count = Number(rawCount);
          if (isNaN(count)) count = 0;
        }
      } else {
        // Fixed/flat logistics or feeding items map to a default count of 1
        count = 1;
      }

      const base = price * count;
      if (unit === 'daily' || unit === 'half') {
        return base * days;
      }
      return base;
    };

    const personnelBaseSum = getSafeItemCost(supervisorPrice, supervisorCount, supervisorUnit, true) + 
                             getSafeItemCost(assistantPrice, assistantCount, assistantUnit, true);

    const equipmentBaseSum = getSafeItemCost(totalStationPrice, totalStationCount, totalStationUnit, true) + 
                             getSafeItemCost(gpsPrice, gpsCount, gpsUnit, true) + 
                             getSafeItemCost(scannerPrice, scannerCount, scannerUnit, true);

    const officeBaseSum = getSafeItemCost(officePrice, officeCount, officeUnit, true);

    const logisticsBaseSum = getSafeItemCost(logisticsPrice, logisticsCount, logisticsUnit, false) + 
                             getSafeItemCost(feedingPrice, feedingCount, feedingUnit, false);

    const baseTotalCost = personnelBaseSum + equipmentBaseSum + officeBaseSum + logisticsBaseSum;
    const concurrentDivisor = Math.max(1, parseSafeVal(batchingFactor) || 1);
    const batchedRawCost = baseTotalCost / concurrentDivisor;
    const hardness = parseSafeVal(hardnessMultiplier) || 1.0;
    const costWithHardness = batchedRawCost * hardness;
    const overheadPct = parseSafeVal(overheadProfitPct) || 0;
    const costWithOverhead = costWithHardness * (1 + (overheadPct / 100));
    const legalPct = parseSafeVal(legalDeductionsPct) || 0;
    const finalBillValue = costWithOverhead * (1 + (legalPct / 100));

    setTotalCalculatedCost(Math.round(finalBillValue));
    
    const minVal = (baseTotalCost / concurrentDivisor) * 1.05 * (1 + (legalPct / 100));
    const maxVal = ((baseTotalCost * 1.5) / concurrentDivisor) * 1.25 * (1 + (legalPct / 100));

    setMinPrice(Math.round(minVal) || Math.round(finalBillValue * 0.85));
    setMaxPrice(Math.round(maxVal) || Math.round(finalBillValue * 1.25));

    setPriceStrategy('min');
    
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
        final_price: finalSelectedPrice || Math.round(totalCalculatedCost),
      };

      let response;
      try {
        response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ ...payload, service_type: serviceType, sub_service: subBranch }),
        });
      } catch (e) {
        console.warn("Direct post failed, falling back to base columns only", e);
      }

      if (!response || !response.ok) {
        response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(payload),
        });
      }

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

  const handleLogout = () => {
    setFlowScreen('auth');
    setAuthStep(1);
    setMobileNumber('');
    setOtpCode('');
    setUserRole('surveyor');
    setFullName('');
    setProvince('یزد');
    setCity('یزد');
    setExperienceYears('۸');
    setEntityType('حقیقی');
    setHasLicense(true);
    setIsOfficialExpert(false);
    showToast('خروج با موفقیت انجام شد');
  };

  const calcPSmart = () => {
    const C = Number(totalCalculatedCost) || 0;
    const T = Number(remoteBaseTariff) || 0;
    const P_max = Number(marketPulse.maxPrice) || 0;
    const P_min = Number(marketPulse.minPrice) || 0;
    const alpha = 0.5;
    const P_base = C + alpha * (T - C);
    if (marketPulse.hasData && P_max > 0 && P_min > 0) {
      return Math.min(P_max, Math.max(P_min, P_base));
    }
    return P_base;
  };
  const P_smart = calcPSmart();

  useEffect(() => {
    if (finalPriceStrategy === 'cost') {
      setFinalSelectedPrice(totalCalculatedCost);
    } else if (finalPriceStrategy === 'official') {
      setFinalSelectedPrice(remoteBaseTariff || 0);
    } else {
      setFinalSelectedPrice(P_smart);
    }
  }, [finalPriceStrategy, totalCalculatedCost, remoteBaseTariff, P_smart]);

  useEffect(() => {
    setFinalAgreedPrice(finalSelectedPrice.toString());
  }, [finalSelectedPrice]);

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
          {flowScreen !== 'auth' && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-750 border border-rose-200/50 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95 duration-100"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200" />
              خروج از حساب
            </button>
          )}
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
                          onClick={handleLogout}
                          className="p-1 hover:text-rose-500 transition-colors cursor-pointer text-rose-500"
                          title="خروج از حساب"
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
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
                                {availableOrgs.map((org) => (
                                  <option key={org} value={org}>{org}</option>
                                ))}
                              </select>
                            </div>

                            <div className={`border rounded-xl p-3 text-xs mt-2 select-none flex flex-col gap-1.5 ${
                              (remoteBaseTariff === null || remoteBaseTariff === 0) && !isRemoteLoading 
                                ? 'bg-red-50 border-red-200 text-red-600' 
                                : 'bg-blue-50 border-blue-200 text-blue-900'
                            }`}>
                              {(remoteBaseTariff === null || remoteBaseTariff === 0) && !isRemoteLoading ? (
                                <div className="text-center w-full font-bold">
                                  تعرفه‌ای برای این خدمت در دیتابیس یافت نشد
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center w-full">
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
                                  </div>
                                  {tariffExplanation && !isRemoteLoading && (
                                    <div className="text-[10px] text-blue-700/80 border-t border-blue-200/50 pt-1.5 mt-0.5 text-right font-medium">
                                      {tariffExplanation}
                                    </div>
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
                                    <span className="col-span-3 text-[11px] font-bold text-slate-700 whitespace-normal break-words leading-tight text-right pr-1" title={label}>
                                      {label}
                                    </span>
                                    <div className={isLogistics ? "col-span-5" : "col-span-4"}>
                                      <input 
                                        type="text" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
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
                                          value={count === 0 ? '' : count} 
                                          min="0"
                                          onChange={(e) => {
                                            if (e.target.value === '') { setCount(0); } else { const val = parseInt(e.target.value);
                                            setCount(isNaN(val) ? 0 : Math.max(0, val)); }
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
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleLogout}
                          className="p-1 hover:text-rose-500 transition-colors cursor-pointer text-rose-500"
                          title="خروج از حساب"
                        >
                          <LogOut className="w-5 h-5" />
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

                    <div className="p-4 flex-grow overflow-y-auto space-y-4 max-h-[560px]">
                      
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">نام سرویس محاسباتی مرجع</span>
                        <h3 className="text-xs font-bold text-slate-900 leading-normal">
                          داشبورد نهایی بها: {subBranch}
                        </h3>
                      </div>

                      {/* ۱. کارت اول (هزینه تمامشده و سود اختصاصی شما) */}
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-4.5 rounded-2xl shadow-sm text-right relative overflow-hidden">
                        <div className="absolute left-3 top-3 opacity-15 rotate-12 text-indigo-900">
                          <Calculator className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold text-indigo-900 tracking-wide block mb-1">
                          ۱. هزینه تمام‌شده و سود اختصاصی شما (طرح شخصی)
                        </span>
                        <p className="text-[10.5px] text-slate-500 mb-3 leading-relaxed">
                          بر مبنای محاسبه واقعی پرسنلی، استهلاک تجهیزات فعال، تدارکات و ایاب‌و‌ذهاب با ضریب سختی و سود بالاسری شما
                        </p>
                        <div className="flex justify-between items-baseline flex-row-reverse">
                          <span className="text-2xl font-mono font-black text-indigo-950">
                            {formatPersianCurrency(totalCalculatedCost)}
                          </span>
                          <span className="text-xs font-bold text-slate-500">ریال</span>
                        </div>
                      </div>

                      {/* ۲. کارت دوم (تعرفه مصوب پایه) */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4.5 rounded-2xl shadow-sm text-right relative overflow-hidden">
                        <div className="absolute left-3 top-3 opacity-15 rotate-12 text-blue-900">
                          <Building2 className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold text-blue-900 tracking-wide block mb-1">
                          ۲. تعرفه رسمی مصوب پایه (بدون اعمال ضریب)
                        </span>
                        <p className="text-[10.5px] text-slate-500 mb-3 leading-relaxed">
                          نمایش رقم خام ارزش نقشه برداری پایه ابلاغی سازمان‌ها و شهرداری مجری بدون در نظر گرفتن سختی کار شخصی
                        </p>
                        <div className="flex justify-between items-baseline flex-row-reverse">
                          {remoteBaseTariff !== null && remoteBaseTariff !== 0 ? (
                            <span className="text-2xl font-mono font-black text-blue-950">
                              {formatPersianCurrency(remoteBaseTariff)}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-600">تعرفه‌ای برای این خدمت در دیتابیس یافت نشد</span>
                          )}
                          <span className="text-xs font-bold text-slate-400">ریال</span>
                        </div>
                        {tariffExplanation && (
                          <div className="text-[10px] text-slate-500 mt-2 text-right font-medium">
                            {tariffExplanation}
                          </div>
                        )}
                      </div>

                      {/* ۳. کارت سوم (پیشنهاد هوشمندانه سیستم) */}
                      <div className="bg-gradient-to-br from-[#0B1D35] to-[#142d50] border border-slate-800 p-4.5 rounded-2xl shadow-md text-right relative overflow-hidden text-white">
                        <div className="absolute left-3 top-3 opacity-20 rotate-12 text-emerald-400">
                          <Sparkles className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold tracking-wide block mb-1" style={{ color: brandTheme.accent }}>
                          ۳. پیشنهاد هوشمندانه سیستم (تسطیح پویای صنف)
                        </span>
                        <p className="text-[10.5px] text-slate-300 opacity-90 mb-3 leading-relaxed">
                          محاسبه بر اساس توازن هزینه مجری و تعرفه قانونی (ضریب آلفا: 0.5) با اعمال کنترل دامپینگ بازار
                        </p>
                        <div className="flex justify-between items-baseline flex-row-reverse">
                          <span className="text-2xl font-mono font-black animate-pulse" style={{ color: brandTheme.accent }}>
                            {formatPersianCurrency(P_smart)}
                          </span>
                          <span className="text-xs font-bold text-slate-400">ریال</span>
                        </div>
                      </div>

                      {/* ۴. کارت چهارم (نبض بازار استانی تفکیکشده) */}
                      <div className="bg-gradient-to-br from-slate-50 to-amber-50/50 border border-slate-200 p-4.5 rounded-2xl shadow-sm text-right relative overflow-hidden">
                        <div className="absolute left-3 top-3 opacity-15 rotate-12 text-amber-600">
                          <TrendingUp className="w-12 h-12" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 tracking-wide block mb-1">
                          ۴. نبض بازار استانی تفکیک‌شده (ثبتی استان {province})
                        </span>
                        <p className="text-[10.5px] text-slate-500 mb-2 leading-relaxed">
                          محدوده کمترین و بیشترین بهای ثبت‌شده برای خدمة <strong className="text-slate-800">{subBranch}</strong> در محدوده <strong className="text-slate-850">استان {province}</strong>
                        </p>
                        
                        {!marketPulse.hasData ? (
                          <div className="pt-2 text-center text-slate-500 text-[10.5px] font-bold bg-slate-50 rounded-lg border border-dashed border-slate-200 py-1.5">
                            هنوز سابقه برآوردی در استان {province} ثبت نشده؛ هم‌اکنون اولین برآورد را به پایگاه صنف بفرستید!
                          </div>
                        ) : (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                            <div className="flex justify-between items-center text-[11px] text-emerald-800 flex-row-reverse">
                              <span>بالاترین قیمت ثبت‌شده در استان {province}:</span>
                              <span className="font-mono font-bold">{formatPersianCurrency(marketPulse.maxPrice)} ریال</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-amber-800 flex-row-reverse">
                              <span>پایین‌ترین قیمت ثبت‌شده در استان {province}:</span>
                              <span className="font-mono font-bold">{formatPersianCurrency(marketPulse.minPrice)} ریال</span>
                            </div>
                            <div className="text-[9.5px] text-slate-400 text-center pt-1 font-mono">
                              برآورد شده از تحلیل میانگین تعداد {marketPulse.count} پروژه ثبت شده در نظام صنف استان
                            </div>
                          </div>
                        )}
                      </div>

                      {!hasSubmittedPrice && (
                        <button
                          id="submit-estimate-btn"
                          onClick={() => {
                            showToast("برآورد نهایی شما ثبت و در داده‌های آماری جهت آنالیز استفاده شد");
                            setHasSubmittedPrice(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 border-2 border-dashed font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer bg-white hover:bg-slate-50"
                          style={{ borderColor: brandTheme.accent, color: brandTheme.primary }}
                        >
                          <Users className="w-4 h-4 text-emerald-600" style={{ color: brandTheme.accent }} />
                          ثبت نهایی برآورد من و به‌روزرسانی آمار صنف
                        </button>
                      )}

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 select-none text-right">
                        <div className="flex items-center gap-1.5 flex-row-reverse" style={{ color: brandTheme.primary }}>
                          <Briefcase className="w-5 h-5 shrink-0" style={{ color: brandTheme.accent }} />
                          <span className="text-xs font-bold" style={{ fontWeight: 'bold' }}>تعهد نهایی قرارداد پیش‌نویس</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          یکی از استراتژی‌های زیر را جهت نهایی‌سازی در لایحه قرارداد انتخاب نمایید:
                        </p>
                        
                        <div className="space-y-2 pt-1">
                          {/* 1. Min Price Option */}
                          <div 
                            onClick={() => setFinalPriceStrategy('cost')}
                            className="p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between"
                            style={{
                              borderColor: finalPriceStrategy === 'cost' ? brandTheme.accent : '#e2e8f0',
                              backgroundColor: finalPriceStrategy === 'cost' ? brandTheme.accent + '15' : 'transparent'
                            }}
                          >
                            <div className="flex items-center justify-between flex-row-reverse leading-none">
                              <span className="text-[11px] font-bold font-sans" style={{ color: finalPriceStrategy === 'cost' ? brandTheme.primary : '#475569', fontWeight: 'bold' }}>برآورد هزینه و سود شما</span>
                              <input 
                                type="radio" 
                                name="finalPriceStrategy"
                                checked={finalPriceStrategy === 'cost'} 
                                onChange={() => setFinalPriceStrategy('cost')} 
                                className="cursor-pointer h-3.5 w-3.5"
                                style={{ accentColor: brandTheme.accent }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                              بر اساس هزینه‌های واقعی، استهلاک و سود شخصی.
                            </div>
                            <div className="flex items-baseline justify-between mt-1.5 font-mono">
                              <span className="text-[9px] text-slate-400 font-sans">هزینه‌های واقعی (کارت اول)</span>
                              <span className="text-sm font-black" style={{ color: finalPriceStrategy === 'cost' ? brandTheme.primary : '#1e293b' }}>
                                {formatPersianCurrency(totalCalculatedCost)} <span className="text-[10px] font-sans font-bold">ریال</span>
                              </span>
                            </div>
                          </div>

                          {/* 2. Official Tariff Option */}
                          <div 
                            onClick={() => setFinalPriceStrategy('official')}
                            className="p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between"
                            style={{
                              borderColor: finalPriceStrategy === 'official' ? brandTheme.accent : '#e2e8f0',
                              backgroundColor: finalPriceStrategy === 'official' ? brandTheme.accent + '15' : 'transparent'
                            }}
                          >
                            <div className="flex items-center justify-between flex-row-reverse leading-none">
                              <span className="text-[11px] font-bold font-sans" style={{ color: finalPriceStrategy === 'official' ? brandTheme.primary : '#475569', fontWeight: 'bold' }}>تعرفه رسمی مصوب</span>
                              <input 
                                type="radio" 
                                name="finalPriceStrategy"
                                checked={finalPriceStrategy === 'official'} 
                                onChange={() => setFinalPriceStrategy('official')} 
                                className="cursor-pointer h-3.5 w-3.5"
                                style={{ accentColor: brandTheme.accent }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                              بر اساس نرخ خام ابلاغی سازمان‌ها.
                            </div>
                            <div className="flex items-baseline justify-between mt-1.5 font-mono">
                              <span className="text-[9px] text-slate-400 font-sans">نرخ خام مصوب (کارت دوم)</span>
                              <span className="text-sm font-black" style={{ color: finalPriceStrategy === 'official' ? brandTheme.primary : '#1e293b' }}>
                                {formatPersianCurrency(remoteBaseTariff || 0)} <span className="text-[10px] font-sans font-bold">ریال</span>
                              </span>
                            </div>
                          </div>

                          {/* 3. Smart Tariff Option */}
                          <div 
                            onClick={() => setFinalPriceStrategy('smart')}
                            className="p-3 rounded-lg border text-right cursor-pointer transition-all flex flex-col justify-between"
                            style={{
                              borderColor: finalPriceStrategy === 'smart' ? brandTheme.accent : '#e2e8f0',
                              backgroundColor: finalPriceStrategy === 'smart' ? brandTheme.accent + '15' : 'transparent'
                            }}
                          >
                            <div className="flex items-center justify-between flex-row-reverse leading-none">
                              <span className="text-[11px] font-bold font-sans" style={{ color: finalPriceStrategy === 'smart' ? brandTheme.primary : '#475569', fontWeight: 'bold' }}>پیشنهاد هوشمند سیستم</span>
                              <input 
                                type="radio" 
                                name="finalPriceStrategy"
                                checked={finalPriceStrategy === 'smart'} 
                                onChange={() => setFinalPriceStrategy('smart')} 
                                className="cursor-pointer h-3.5 w-3.5"
                                style={{ accentColor: brandTheme.accent }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                              تعادل بهینه بین هزینه‌های مجری و کشش بازار.
                            </div>
                            <div className="flex items-baseline justify-between mt-1.5 font-mono">
                              <span className="text-[9px] text-slate-400 font-sans">تعدیل شده با الگوریتم هوشمند</span>
                              <span className="text-sm font-black" style={{ color: finalPriceStrategy === 'smart' ? brandTheme.primary : '#1e293b' }}>
                                {formatPersianCurrency(P_smart)} <span className="text-[10px] font-sans font-bold">ریال</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Selected Price indicator bar */}
                        <div className="mt-1 bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center flex-row-reverse">
                          <span className="text-[9px] font-bold text-slate-400">مبلغ انتخاب شده پیش‌نویس:</span>
                          <span className="text-sm font-mono font-black animate-pulse" style={{ color: brandTheme.primary }}>
                            {formatPersianCurrency(finalSelectedPrice)} <span className="text-[10px] font-sans font-bold text-slate-400">ریال</span>
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
                        ثبت نهایی و صدور پیش‌فاکتور
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