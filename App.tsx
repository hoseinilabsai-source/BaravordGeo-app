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

function formatPriceString(val: number): string {
  if (isNaN(val) || val === 0) return '';
  return val.toLocaleString('en-US');
}

function parsePriceString(val: string): number {
  const clean = val.replace(/\D/g, '');
  const parsed = parseInt(clean);
  return isNaN(parsed) ? 0 : parsed;
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
    return basePrice * Math.max(1.0, volume);
  }
  if (unitString.includes("قیمت ثابت") && !unitString.includes("به اضافه")) {
    return basePrice;
  }
  if (unitString.includes("قیمت ثابت به اضافه") || (unitString.includes("قیمت ثابت") && unitString.includes("به اضافه"))) {
    let X = 200.0;
    const match = /([0-9]+)\s+تا\s+([0-9]+)/.exec(unitString);
    if (match) X = parseFloat(match[1]) || 200.0;
    const extraVolume = Math.max(0.0, volume - X);
    
    let baseFixedPrice = basePrice;
    let foundFixed = false;
    
    const tariffDatabase: Record<string, Record<string, number>> = {
      'همه': { 'برداشت عرصه و اعیان': 3500000, 'تهیه نقشه تعیین موقعیت ملک': 7600000, 'دفع آبهای سطحی': 35000000, 'نقشه تک خطی': 1500000, 'طراحی پروفیل طولی و عرضی': 2200000, 'پیاده سازی قطعات تفکیکی': 3000000, 'پیاده سازی طرح اجرایی': 4000000 },
      'شهرداری یزد': { 'برداشت عوارض و مبلمان و تاسیسات شهری': 6000000, 'برداشت مسطحاتی و توپوگرافی معابر شهری جهت تفکیک': 18000000, 'برداشت توپوگرافی معابر شهری جهت کد گذاری': 15000000, 'تعیین بر و کف پلاک': 5000000, 'برداشت عوارض شهری': 7500000 },
      'نظام مهندسی ساختمان یزد': { 'تفکیک آپارتمان': 4500000, 'ازبیلت عمرانی و تاسیسات': 8000000, 'برداشت پلاک جهت منطبق با طرح سازه': 6500000, 'آکس ستون و فنداسیون': 2500000, 'کنترل شاغولی ستون': 1800000, 'برداشت نما ساختمان': 9000000 },
      'انجمن صنفی': { 'برداشت بلوک شهری تا عمق یک پلاک': 12000000, 'برداشت ترافیکی و المان های ترافیکی': 10000000, 'برداشت پلاک و معابر اطراف': 11000000, 'برداشت مسطحاتی و توپوگرافی عوارض معدنی': 14000000 },
    };

    for (const org of Object.keys(tariffDatabase)) {
      if (tariffDatabase[org][subBranch]) {
        if (getUnitForSubservice(subBranch).includes("قیمت ثابت") && !getUnitForSubservice(subBranch).includes("به اضافه")) {
          baseFixedPrice = tariffDatabase[org][subBranch];
          foundFixed = true;
          break;
        }
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
  const [city, set