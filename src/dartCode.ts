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
  Widget build(BuildContext context) {
    return const SizedBox();
  }

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
  final Function(
    String phone,
    String name,
    String province,
    String city,
    int experienceYears,
    String entityType,
    bool hasLicense,
    bool isOfficialExpert,
  ) onLoginSuccess;

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
        if (_phoneController.text.length >= 10) {
          _currentStep = 2;
        } else {
          _showError('شماره موبایل وارد شده معتبر نیست');
        }
      } else if (_currentStep == 2) {
        if (_otpController.text.length == 4 || _otpController.text == '1234' || _otpController.text.isEmpty) {
          _currentStep = 3;
        } else {
          _showError('کد تأیید نادرست است');
        }
      } else if (_currentStep == 3) {
        if (_selectedRole == 'نقشه‌بردار') {
          _currentStep = 4;
        } else {
          widget.onLoginSuccess(
            _phoneController.text,
            'کارفرما',
            _selectedProvince,
            _selectedCity,
            0,
            'حقیقی',
            false,
            false,
          );
        }
      }
    });
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg, textAlign: TextAlign.right, style: const TextStyle(fontFamily: 'Vazirmatn')), backgroundColor: Colors.redAccent),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('برآورد ژئو', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        centerTitle: true,
        backgroundColor: theme.primaryColor,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 4,
              color: Colors.white,
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
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: isActive ? theme.colorScheme.secondary : Colors.grey.shade300,
                              child: Text('\$stepNum', style: const TextStyle(color: Colors.white)),
                            ),
                            if (index < 3) Container(width: 20, height: 3, color: _currentStep > stepNum ? theme.colorScheme.secondary : Colors.grey.shade300),
                          ],
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    if (_currentStep == 1) ...[
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        textAlign: TextAlign.center,
                        decoration: InputDecoration(
                          labelText: 'شماره تلفن همراه',
                          hintText: '09123456789',
                          hintStyle: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.normal, fontSize: 14),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _nextStep,
                        style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white),
                        child: const Text('ارسال کد تایید')
                      ),
                    ],
                    if (_currentStep == 2) ...[
                      TextFormField(
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        decoration: InputDecoration(
                          labelText: 'کد تایید ۴ رقمی',
                          hintText: '1234',
                          hintStyle: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.normal, fontSize: 14),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _nextStep, 
                        style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white),
                        child: const Text('تایید کد')
                      ),
                    ],
                    if (_currentStep == 3) ...[
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('نقشه‌بردار'),
                              selected: _selectedRole == 'نقشه‌بردار',
                              selectedColor: theme.colorScheme.secondary.withOpacity(0.2),
                              onSelected: (val) => setState(() => _selectedRole = 'نقشه‌بردار'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('کارفرما'),
                              selected: _selectedRole == 'کارفرما',
                              selectedColor: theme.colorScheme.secondary.withOpacity(0.2),
                              onSelected: (val) => setState(() => _selectedRole = 'کارفرما'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _nextStep, 
                        style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white),
                        child: const Text('مرحله بعد')
                      ),
                    ],
                    if (_currentStep == 4) ...[
                      TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'نام و نام خانوادگی', border: OutlineInputBorder())),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedProvince,
                        decoration: const InputDecoration(labelText: 'استان فعالیت', border: OutlineInputBorder()),
                        items: _iranProvincesAndCities.keys.map((k) => DropdownMenuItem(value: k, child: Text(k))).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedProvince = val;
                              _cities = List.from(_iranProvincesAndCities[val]!);
                              _selectedCity = _cities.first;
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedCity,
                        decoration: const InputDecoration(labelText: 'شهرستان', border: OutlineInputBorder()),
                        items: _cities.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                        onChanged: (val) => setState(() => _selectedCity = val!),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          if (_nameController.text.isEmpty) {
                            _showError('نام و نام خانوادگی را وارد نمایید');
                            return;
                          }
                          widget.onLoginSuccess(
                            _phoneController.text,
                            _nameController.text,
                            _selectedProvince,
                            _selectedCity,
                            int.tryParse(_experienceController.text) ?? 8,
                            _entityType,
                            _hasLicense,
                            _isOfficialExpert,
                          );
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.secondary, foregroundColor: Colors.white),
                        child: const Text('ثبت‌نام و ورود به برآورد ژئو'),
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
      'تهیه نقشه تعیین موقعیت ملک': {'price': 7600000.0, 'unit': 'نقطه‌ای'},
      'دفع آبهای سطحی': {'price': 35000000.0, 'unit': 'پروژه (قیمت ثابت)'},
    },
    'انجمن صنفی': {
      'برداشت عرصه و اعیان': {'price': 1500000.0, 'unit': 'نقطه‌ای'},
    }
  };

  static Future<Map<String, dynamic>?> fetchApprovedTariff({
    required String province,
    required String organization,
    required String subBranch,
  }) async {
    await Future.delayed(const Duration(milliseconds: 1000));
    if (tariffDatabase.containsKey(organization) && tariffDatabase[organization]!.containsKey(subBranch)) {
      return tariffDatabase[organization]![subBranch];
    }
    if (tariffDatabase['همه']!.containsKey(subBranch)) {
      return tariffDatabase['همه']![subBranch];
    }
    return null;
  }

  static Future<bool> submitProjectToSupabase({
    required String phone,
    required String surveyorName,
    required String province,
    required String city,
    required int experienceYears,
    required String entityType,
    required bool hasLicense,
    required bool isOfficialExpert,
    required double hardness,
    required int finalPrice,
  }) async {
    try {
      final url = Uri.parse('https://tzmtolgfejpqonjxemgy.supabase.co/rest/v1/projects');
      final response = await http.post(
        url,
        headers: {
          'apikey':