export const DART_MAIN_CODE = `import 'package:flutter/material';
import 'package:flutter/services.dart';
import 'dart:math' as math;
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const LandSurveyorApp());
}

class LandSurveyorApp extends StatelessWidget {
  const LandSurveyorApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'برآورد ژئو',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF0B192C),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0B192C),
          primary: const Color(0xFF0B192C),
          secondary: const Color(0xFFFF6600),
        ),
        fontFamily: 'Vazirmatn', 
        useMaterial3: true,
      ),
      home: const Directionality(
        textDirection: TextDirection.rtl,
        child: AppMainNavigation(),
      ),
    );
  }
}

enum FlowScreen {
  auth,
  costEstimation,
  pricingDashboard,
}

class AppMainNavigation extends StatefulWidget {
  const AppMainNavigation({Key? key}) : super(key: key);

  @override
  State<AppMainNavigation> createState() => _AppMainNavigationState();
}

class _AppMainNavigationState extends State<AppMainNavigation> {
  FlowScreen _currentScreen = FlowScreen.auth;

  double _totalCalculatedCost = 0.0;
  int _predictedDays = 1;
  double _selectedVolume = 1.0;
  String _selectedSubBranch = 'برداشت عرصه و اعیان';
  double _fetchedBaseTariffFromApi = 3500000.0;
  String _selectedProvince = 'یزد';
  String _selectedOrganization = 'همه';
  double _hardnessMultiplier = 1.2;
  double _overheadProfitPct = 15.0;
  double _legalDeductionsPct = 10.0;

  String _phone = '';
  String _surveyorName = '';
  String _city = '';
  int _experienceYears = 8;
  String _entityType = 'حقیقی';
  bool _hasLicense = true;
  bool _isOfficialExpert = false;

  void _navigateToScreen(FlowScreen screen, {
    double calculatedCost = 0.0,
    int days = 1,
    double volume = 1.0,
    String subBranch = 'برداشت عرصه و اعیان',
    double baseTariff = 3500000.0,
    String province = 'یزد',
    String organization = 'همه',
    double hardnessMultiplier = 1.2,
    double overheadProfitPct = 15.0,
    double legalDeductionsPct = 10.0,
  }) {
    setState(() {
      _currentScreen = screen;
      if (calculatedCost > 0) _totalCalculatedCost = calculatedCost;
      if (days > 0) _predictedDays = days;
      _selectedVolume = volume;
      _selectedSubBranch = subBranch;
      _fetchedBaseTariffFromApi = baseTariff;
      _selectedProvince = province;
      _selectedOrganization = organization;
      _hardnessMultiplier = hardnessMultiplier;
      _overheadProfitPct = overheadProfitPct;
      _legalDeductionsPct = legalDeductionsPct;
    });
  }

  @override
  Widget build(BuildContext context) {
    switch (_currentScreen) {
      case FlowScreen.auth:
        return AuthScreen(onLoginSuccess: (phone, name, province, city, expYears, entityType, hasLicense, isOfficial) {
          setState(() {
            _phone = phone;
            _surveyorName = name;
            _selectedProvince = province;
            _city = city;
            _experienceYears = expYears;
            _entityType = entityType;
            _hasLicense = hasLicense;
            _isOfficialExpert = isOfficial;
          });
          _navigateToScreen(FlowScreen.costEstimation);
        });
      case FlowScreen.costEstimation:
        return CostEstimationScreen(onCalculate: (cost, days, volume, subBranch, baseTariff, province, organization, hardness, overhead, deduction) {
          _navigateToScreen(
            FlowScreen.pricingDashboard,
            calculatedCost: cost,
            days: days,
            volume: volume,
            subBranch: subBranch,
            baseTariff: baseTariff,
            province: province,
            organization: organization,
            hardnessMultiplier: hardness,
            overheadProfitPct: overhead,
            legalDeductionsPct: deduction,
          );
        });
      case FlowScreen.pricingDashboard:
        return PricingDashboardScreen(
          totalCalculatedCost: _totalCalculatedCost,
          predictedDays: _predictedDays,
          selectedVolume: _selectedVolume,
          selectedSubBranch: _selectedSubBranch,
          baseTariffFromApi: _fetchedBaseTariffFromApi,
          selectedProvince: _selectedProvince,
          selectedOrganization: _selectedOrganization,
          hardnessMultiplier: _hardnessMultiplier,
          overheadProfitPct: _overheadProfitPct,
          legalDeductionsPct: _legalDeductionsPct,
          onSaveProject: () async {
            final success = await TariffApiService.submitProjectToSupabase(
              phone: _phone,
              surveyorName: _surveyorName,
              province: _selectedProvince,
              city: _city,
              experienceYears: _experienceYears,
              entityType: _entityType,
              hasLicense: _hasLicense,
              isOfficialExpert: _isOfficialExpert,
              hardness: _hardnessMultiplier,
              finalPrice: _totalCalculatedCost.round(),
            );

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  success 
                    ? 'برآورد نهایی شما با موفقیت ثبت شد' 
                    : 'خطا در ثبت نهایی پروژه در سرور',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Vazirmatn'),
                  textAlign: TextAlign.right,
                ),
                backgroundColor: success ? Colors.green : Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
            if (success) {
              _navigateToScreen(FlowScreen.costEstimation);
            }
          },
        );
    }
  }
}

double calculateSmartTariff(double basePrice, double volume, String unitString, {String subBranch = ""}) {
  if (unitString.contains("زیر یک")) {
    double effectiveVolume = math.max(1.0, volume);
    return basePrice * effectiveVolume;
  }
  if (unitString.contains("قیمت ثابت") && !unitString.contains("به اضافه")) {
    return basePrice;
  }
  if (unitString.contains("قیمت ثابت به اضافه") || (unitString.contains("قیمت ثابت") && unitString.contains("به اضافه"))) {
    double X = 200.0;
    final match = RegExp(r"\\(?(\\d+)\\s+تا\\s+(\\d+)\\)?").firstMatch(unitString);
    if (match != null) {
      X = double.tryParse(match.group(1)!) ?? 200.0;
    }
    double extraVolume = math.max(0.0, volume - X);
    double baseFixedPrice = basePrice;
    bool foundFixed = false;
    for (var org in TariffApiService.tariffDatabase.keys) {
      for (var sub in TariffApiService.tariffDatabase[org]!.keys) {
        var entry = TariffApiService.tariffDatabase[org]![sub]!;
        String entryUnit = entry['unit'] as String? ?? '';
        if (entryUnit.contains("قیمت ثابت") && !entryUnit.contains("به اضافه")) {
          if (sub == subBranch) {
            baseFixedPrice = (entry['price'] as num).toDouble();
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

class AuthScreen extends StatefulWidget {
  final Function(String, String, String, String, int, String, bool, bool) onLoginSuccess;
  const AuthScreen({Key? key, required this.onLoginSuccess}) : super(key: key);
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final Map<String, List<String>> _iranProvincesAndCities = {
    'تهران': ['تهران', 'شهریار', 'ورامین'],
    'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد'],
    'یزد': ['یزد', 'میبد', 'اردکان'],
  };

  int _currentStep = 1;
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _experienceController = TextEditingController(text: '8');

  String _selectedRole = 'نقشه‌بردار';
  String _selectedProvince = 'یزد';
  String _selectedCity = 'یزد';
  String _entityType = 'حقیقی';
  bool _hasLicense = true;
  bool _isOfficialExpert = false;
  late List<String> _cities;

  @override
  void initState() {
    super.initState();
    _cities = List.from(_iranProvincesAndCities[_selectedProvince]!);
    _selectedCity = _cities.first;
  }

  void _nextStep() {
    setState(() {
      if (_currentStep == 1) {
        if (_phoneController.text.length >= 10) _currentStep = 2;
      } else if (_currentStep == 2) {
        if (_otpController.text.length == 4 || _otpController.text == '1234' || _otpController.text.isEmpty) _currentStep = 3;
      } else if (_currentStep == 3) {
        if (_selectedRole == 'نقشه‌بردار') _currentStep = 4;
        else widget.onLoginSuccess(_phoneController.text, 'کارفرما', _selectedProvince, _selectedCity, 0, 'حقیقی', false, false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('برآورد ژئو', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)), centerTitle: true, backgroundColor: theme.primaryColor),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 4, color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.map, size: 60, color: theme.colorScheme.secondary),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(4, (index) {
                        final stepNum = index + 1;
                        final isActive = _currentStep >= stepNum;
                        return Row(
                          children: [
                            CircleAvatar(radius: 16, backgroundColor: isActive ? theme.colorScheme.secondary : Colors.grey.shade300, child: Text('\$stepNum', style: const TextStyle(color: Colors.white))),
                            if (index < 3) Container(width: 20, height: 3, color: _currentStep > stepNum ? theme.colorScheme.secondary : Colors.grey.shade300),
                          ],
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    if (_currentStep == 1) ...[
                      TextFormField(controller: _phoneController, keyboardType: TextInputType.phone, textAlign: TextAlign.center, decoration: const InputDecoration(labelText: 'شماره تلفن همراه', border: OutlineInputBorder())),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _nextStep, style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white), child: const Text('ارسال کد تایید')),
                    ],
                    if (_currentStep == 2) ...[
                      TextFormField(controller: _otpController, keyboardType: TextInputType.number, textAlign: TextAlign.center, decoration: const InputDecoration(labelText: 'کد تایید ۴ رقمی', border: OutlineInputBorder())),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _nextStep, style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white), child: const Text('تایید کد')),
                    ],
                    if (_currentStep == 3) ...[
                      Row(
                        children: [
                          Expanded(child: ChoiceChip(label: const Text('نقشه‌بردار'), selected: _selectedRole == 'نقشه‌بردار', onSelected: (val) => setState(() => _selectedRole = 'نقشه‌بردار'))),
                          const SizedBox(width: 8),
                          Expanded(child: ChoiceChip(label: const Text('کارفرما'), selected: _selectedRole == 'کارفرما', onSelected: (val) => setState(() => _selectedRole = 'کارفرما'))),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _nextStep, style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white), child: const Text('مرحله بعد')),
                    ],
                    if (_currentStep == 4) ...[
                      TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'نام و نام خانوادگی', border: OutlineInputBorder())),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          if (_nameController.text.isNotEmpty) {
                            widget.onLoginSuccess(_phoneController.text, _nameController.text, _selectedProvince, _selectedCity, int.tryParse(_experienceController.text) ?? 8, _entityType, _hasLicense, _isOfficialExpert);
                          }
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white),
                        child: const Text('ثبت‌نام و ورود'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TariffApiService {
  static final Map<String, Map<String, Map<String, dynamic>>> tariffDatabase = {
    'همه': {
      'برداشت عرصه و اعیان': {'price': 3500000.0, 'unit': 'نقطه‌ای'},
    }
  };
  static Future<Map<String, dynamic>?> fetchApprovedTariff({required String province, required String organization, required String subBranch}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return tariffDatabase['همه']?[subBranch];
  }
  static Future<bool> submitProjectToSupabase({required String phone, required String surveyorName, required String province, required String city, required int experienceYears, required String entityType, required bool hasLicense, required bool isOfficialExpert, required double hardness, required int finalPrice}) async {
    return true; 
  }
}

class CostEstimationScreen extends StatefulWidget {
  final Function(double, int, double, String, double, String, String, double, double, double) onCalculate;
  const CostEstimationScreen({Key? key, required this.onCalculate}) : super(key: key);
  @override
  State<CostEstimationScreen> createState() => _CostEstimationScreenState();
}

class _CostEstimationScreenState extends State<CostEstimationScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Map<String, Map<String, List<String>>> surveyingServices = {
    'نقشه ثبتی ماده (۱۴۷)': {'برداشت میدانی': ['برداشت عرصه و اعیان']},
  };

  late String _selectedServiceType;
  late String _selectedMainService;
  late String _selectedSubBranch;
  String _selectedProvince = 'یزد';
  String _selectedOrganization = 'همه';
  bool _isLoadingTariff = false;
  double? _fetchedBaseTariff = 3500000.0;

  final TextEditingController _volumeController = TextEditingController(text: '12');
  final TextEditingController _daysController = TextEditingController(text: '4');
  double _hardnessMultiplier = 1.2;
  final TextEditingController _overheadProfitController = TextEditingController(text: '15');
  final TextEditingController _legalDeductionController = TextEditingController(text: '10');
  int _batchingFactor = 1;

  String _supervisorUnit = 'روزانه';
  String _assistantUnit = 'روزانه';
  String _totalStationUnit = 'روزانه';
  String _gpsUnit = 'روزانه';
  String _scannerUnit = 'مقطوع';
  String _officeUnit = 'مقطوع';
  String _logisticsUnit = 'مقطوع';
  String _feedingUnit = 'مقطوع';

  final TextEditingController _supervisorCountCtrl = TextEditingController(text: '1');
  final TextEditingController _assistantCountCtrl = TextEditingController(text: '1');
  final TextEditingController _totalStationCountCtrl = TextEditingController(text: '1');
  final TextEditingController _gpsCountCtrl = TextEditingController(text: '1');
  final TextEditingController _scannerCountCtrl = TextEditingController(text: '1');
  final TextEditingController _officeCountCtrl = TextEditingController(text: '1');

  final TextEditingController _supervisorPriceCtrl = TextEditingController(text: '50,000,000');
  final TextEditingController _assistantPriceCtrl = TextEditingController(text: '25,000,000');
  final TextEditingController _totalStationPriceCtrl = TextEditingController(text: '30,000,000');
  final TextEditingController _gpsPriceCtrl = TextEditingController(text: '35,000,000');
  final TextEditingController _scannerPriceCtrl = TextEditingController(text: '80,000,000');
  final TextEditingController _officePriceCtrl = TextEditingController(text: '15,000,000');
  final TextEditingController _logisticsPriceCtrl = TextEditingController(text: '5,000,000');
  final TextEditingController _feedingPriceCtrl = TextEditingController(text: '4,000,000');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() => setState(() {})); 
    _selectedServiceType = surveyingServices.keys.first;
    _selectedMainService = surveyingServices[_selectedServiceType]!.keys.first;
    _selectedSubBranch = surveyingServices[_selectedServiceType]![_selectedMainService]!.first;
  }

  void _calculatePricing() {
    int days = int.tryParse(_daysController.text) ?? 1;
    double parsePrice(TextEditingController c) => double.tryParse(c.text.replaceAll(',', '')) ?? 0.0;
    double parseCount(TextEditingController c) => double.tryParse(c.text) ?? 0.0;

    double computeItemCost(double p, double c, String u) => (u == 'روزانه' || u == 'نیم روز') ? (p * c * days) : (p * c);

    double total = computeItemCost(parsePrice(_supervisorPriceCtrl), parseCount(_supervisorCountCtrl), _supervisorUnit) +
                   computeItemCost(parsePrice(_assistantPriceCtrl), parseCount(_assistantCountCtrl), _assistantUnit) +
                   computeItemCost(parsePrice(_totalStationPriceCtrl), parseCount(_totalStationCountCtrl), _totalStationUnit) +
                   computeItemCost(parsePrice(_gpsPriceCtrl), parseCount(_gpsCountCtrl), _gpsUnit) +
                   computeItemCost(parsePrice(_scannerPriceCtrl), parseCount(_scannerCountCtrl), _scannerUnit) +
                   computeItemCost(parsePrice(_officePriceCtrl), parseCount(_officeCountCtrl), _officeUnit) +
                   parsePrice(_logisticsPriceCtrl) + parsePrice(_feedingPriceCtrl);

    double costWithHardness = (total * _hardnessMultiplier) / _batchingFactor;
    double overhead = double.tryParse(_overheadProfitController.text) ?? 15.0;
    double deduction = double.tryParse(_legalDeductionController.text) ?? 10.0;
    double finalCost = costWithHardness * (1 + (overhead / 100)) * (1 - (deduction / 100));

    widget.onCalculate(finalCost, days, double.tryParse(_volumeController.text) ?? 1.0, _selectedSubBranch, _fetchedBaseTariff ?? 0.0, _selectedProvince, _selectedOrganization, _hardnessMultiplier, overhead, deduction);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(title: const Text('تخمین هوشمند', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), backgroundColor: theme.primaryColor, centerTitle: true),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: theme.colorScheme.secondary,
              indicatorColor: theme.colorScheme.secondary,
              unselectedLabelColor: Colors.grey,
              tabs: const [Tab(text: 'نوع خدمات'), Tab(text: 'حجم کار'), Tab(text: 'محاسبات خرد')],
            ),
          ),
          Expanded(child: TabBarView(controller: _tabController, children: [_buildServiceTypeTab(), _buildWorkVolumeTab(), _buildCostMatrixTab()])),
          Container(padding: const EdgeInsets.all(16), color: Colors.white, child: _buildDynamicFooter(theme))
        ],
      ),
    );
  }

  Widget _buildDynamicFooter(ThemeData theme) {
    if (_tabController.index == 0) {
      return ElevatedButton(onPressed: () => _tabController.animateTo(1), style: ElevatedButton.styleFrom(backgroundColor: theme.primaryColor, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)), child: const Text('تایید و مرحله بعد (حجم کار)'));
    } else if (_tabController.index == 1) {
      return Row(children: [
        OutlinedButton(onPressed: () => _tabController.animateTo(0), style: OutlinedButton.styleFrom(minimumSize: const Size(50, 50)), child: const Icon(Icons.arrow_back)),
        const SizedBox(width: 8),
        Expanded(child: ElevatedButton(onPressed: () => _tabController.animateTo(2), style: ElevatedButton.styleFrom(backgroundColor: theme.primaryColor, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)), child: const Text('تایید و مرحله بعد (هزینه‌ها)'))),
      ]);
    } else {
      return Row(children: [
        OutlinedButton(onPressed: () => _tabController.animateTo(1), style: OutlinedButton.styleFrom(minimumSize: const Size(50, 50)), child: const Icon(Icons.arrow_back)),
        const SizedBox(width: 8),
        Expanded(child: ElevatedButton(onPressed: _calculatePricing, style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)), child: const Text('محاسبه نهایی قیمت'))),
      ]);
    }
  }

  Widget _buildServiceTypeTab() {
    return SingleChildScrollView(padding: const EdgeInsets.all(16.0), child: Column(children: [DropdownButtonFormField<String>(value: _selectedProvince, items: const [DropdownMenuItem(value: 'یزد', child: Text('یزد'))], onChanged: (v) {})]));
  }

  Widget _buildWorkVolumeTab() {
    return SingleChildScrollView(padding: const EdgeInsets.all(16.0), child: Column(children: [
      TextFormField(controller: _volumeController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'حجم کار', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextFormField(controller: _daysController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'تعداد روزهای پیش‌بینی شده اکیپ صحرایی', border: OutlineInputBorder())),
    ]));
  }

  Widget _buildCostMatrixTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          _buildCostItemRow('سرپرست کارگاه', _supervisorPriceCtrl, _supervisorCountCtrl, _supervisorUnit, (v) => setState(() => _supervisorUnit = v)),
          _buildCostItemRow('کمک کارشناس / میر', _assistantPriceCtrl, _assistantCountCtrl, _assistantUnit, (v) => setState(() => _assistantUnit = v)),
          _buildCostItemRow('توتال استیشن (TS)', _totalStationPriceCtrl, _totalStationCountCtrl, _totalStationUnit, (v) => setState(() => _totalStationUnit = v)),
          _buildCostItemRow('گیرنده سه فرکانسه GPS', _gpsPriceCtrl, _gpsCountCtrl, _gpsUnit, (v) => setState(() => _gpsUnit = v)),
          _buildCostItemRow('اسکنر سه‌بعدی لیزری', _scannerPriceCtrl, _scannerCountCtrl, _scannerUnit, (v) => setState(() => _scannerUnit = v)),
          _buildCostItemRow('کارشناس مهندسی پردازش', _officePriceCtrl, _officeCountCtrl, _officeUnit, (v) => setState(() => _officeUnit = v)),
          _buildCostItemRow('ایاب و ذهاب به سایت', _logisticsPriceCtrl, TextEditingController(text: '1'), _logisticsUnit, (v) => setState(() => _logisticsUnit = v), isLogistics: true),
          _buildCostItemRow('تغذیه و تدارکات پرسنل', _feedingPriceCtrl, TextEditingController(text: '1'), _feedingUnit, (v) => setState(() => _feedingUnit = v), isLogistics: true),
        ],
      ),
    );
  }

  // ✅ این بخش به طور کامل با رعایت کیبورد عددی، کاما گذاری، فیلد تعداد و نشکستن متن اصلاح شد
  Widget _buildCostItemRow(String label, TextEditingController pCtrl, TextEditingController cCtrl, String unit, Function(String) onUnitChanged, {bool isLogistics = false}) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade300)),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            Expanded(
              flex: 4, 
              child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87), softWrap: true)
            ),
            const SizedBox(width: 4),
            Expanded(
              flex: 4, 
              child: TextFormField(
                controller: pCtrl, 
                keyboardType: TextInputType.number, // ✅ فعال‌سازی کیبورد عددی برای قیمت
                inputFormatters: [ThousandsSeparatorFormatter()], // ✅ کاما گذاری خودکار
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.grey.shade300)),
                )
              )
            ),
            const SizedBox(width: 4),
            Expanded(
              flex: 3, 
              child: isLogistics 
                ? Container(
                    height: 34,
                    decoration: BoxDecoration(color: Colors.grey.shade100, border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(4)),
                    alignment: Alignment.center,
                    child: const Text('مقطع', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  )
                : Container(
                    height: 34,
                    decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(4), color: Colors.grey.shade50),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: unit, 
                        iconSize: 16,
                        style: const TextStyle(fontSize: 10, color: Colors.black87, fontFamily: 'Vazirmatn'),
                        items: const [
                          DropdownMenuItem(value: 'روزانه', child: Text('روزانه')), 
                          DropdownMenuItem(value: 'نیم روز', child: Text('نیم روز')), 
                          DropdownMenuItem(value: 'مقطوع', child: Text('مقطوع'))
                        ], 
                        onChanged: (v) => onUnitChanged(v!)
                      )
                    )
                  )
            ),
            if (!isLogistics) ...[
              const SizedBox(width: 4),
              Expanded(
                flex: 2, 
                child: TextFormField(
                  controller: cCtrl, 
                  keyboardType: TextInputType.number, // ✅ فعال‌سازی کیبورد عددی برای فیلد تعداد
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.indigo),
                  decoration: InputDecoration(
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.grey.shade300)),
                  )
                )
              ),
            ]
          ],
        ),
      ),
    );
  }
}

class PricingDashboardScreen extends StatelessWidget {
  final double totalCalculatedCost;
  final int predictedDays;
  final double selectedVolume;
  final String selectedSubBranch;
  final double baseTariffFromApi;
  final String selectedProvince;
  final String selectedOrganization;
  final double hardnessMultiplier;
  final double overheadProfitPct;
  final double legalDeductionsPct;
  final Future<void> Function() onSaveProject;

  const PricingDashboardScreen({
    Key? key, required this.totalCalculatedCost, required this.predictedDays, required this.selectedVolume, required this.selectedSubBranch,
    required this.baseTariffFromApi, required this.selectedProvince, required this.selectedOrganization, required this.hardnessMultiplier,
    required this.overheadProfitPct, required this.legalDeductionsPct, required this.onSaveProject,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('داشبورد نهایی')),
      body: Center(child: Text('قیمت نهایی: \${totalCalculatedCost.round()}')),
    );
  }
}

class ThousandsSeparatorFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, newValue) {
    if (newValue.text.isEmpty) return newValue.copyWith(text: '');
    String cleanText = newValue.text.replaceAll(',', '');
    final intValue = int.tryParse(cleanText);
    if (intValue == null) return oldValue;
    final buffer = StringBuffer();
    final chars = cleanText.split('');
    int count = 0;
    for (int i = chars.length - 1; i >= 0; i--) {
      buffer.write(chars[i]);
      count++;
      if (count % 3 == 0 && i > 0) buffer.write(',');
    }
    final formattedText = buffer.toString().split('').reversed.join('');
    return newValue.copyWith(
      text: formattedText,
      selection: TextSelection.collapsed(offset: formattedText.length),
    );
  }
}
`;