import { Account, AppSettings, Category, Profile, Transaction } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'day2day_transactions_v2',
  PROFILES: 'day2day_profiles_v2',
  CATEGORIES: 'day2day_categories_v2',
  ACCOUNTS: 'day2day_accounts_v2',
  SETTINGS: 'day2day_settings_v2',
  LAST_DELETED: 'day2day_last_deleted_v2',
  DESC_CATEGORY_MAP: 'day2day_desc_category_map_v2',
};

export const DEFAULT_KEYWORD_MAPPINGS: Record<string, string> = {
  // Milk
  milk: 'cat_milk',
  dudh: 'cat_milk',
  dairy: 'cat_milk',
  curd: 'cat_milk',
  paneer: 'cat_milk',
  butter: 'cat_milk',

  // Vegetables
  vegetables: 'cat_vegetables',
  vegetable: 'cat_vegetables',
  sabji: 'cat_vegetables',
  sabzi: 'cat_vegetables',
  tarkari: 'cat_vegetables',
  potato: 'cat_vegetables',
  tomato: 'cat_vegetables',
  onion: 'cat_vegetables',

  // Fruits
  fruits: 'cat_fruits',
  fruit: 'cat_fruits',
  apple: 'cat_fruits',
  banana: 'cat_fruits',
  mango: 'cat_fruits',
  orange: 'cat_fruits',

  // Petrol
  petrol: 'cat_petrol',
  fuel: 'cat_petrol',
  diesel: 'cat_petrol',

  // Bills & Utilities
  bill: 'cat_bills_utilities',
  bills: 'cat_bills_utilities',
  utility: 'cat_bills_utilities',
  utilities: 'cat_bills_utilities',

  // Coffee
  coffee: 'cat_coffee',
  cafe: 'cat_coffee',
  cappuccino: 'cat_coffee',
  espresso: 'cat_coffee',
  tea: 'cat_coffee',
  chai: 'cat_coffee',

  // Bike
  bike: 'cat_bike',
  motorcycle: 'cat_bike',
  scooter: 'cat_bike',
  scooty: 'cat_bike',

  // Salon
  salon: 'cat_salon',
  saloon: 'cat_salon',
  parlour: 'cat_salon',
  parlor: 'cat_salon',
  haircut: 'cat_salon',
  shave: 'cat_salon',
  facial: 'cat_salon',
  spa: 'cat_salon',

  // Investment
  investment: 'cat_investment',
  invest: 'cat_investment',
  shares: 'cat_investment',
  stocks: 'cat_investment',
  mutual: 'cat_investment',
  sip: 'cat_investment',
  fd: 'cat_investment',

  // Pet Care
  pet: 'cat_pet_care',
  pets: 'cat_pet_care',
  dog: 'cat_pet_care',
  cat: 'cat_pet_care',
  puppy: 'cat_pet_care',
  vet: 'cat_pet_care',

  // Gas
  gas: 'cat_gas',
  lpg: 'cat_gas',
  cylinder: 'cat_gas',

  // Clothing
  clothing: 'cat_clothing',
  clothes: 'cat_clothing',
  cloth: 'cat_clothing',
  shirt: 'cat_clothing',
  pants: 'cat_clothing',
  jeans: 'cat_clothing',
  dress: 'cat_clothing',
  sari: 'cat_clothing',
  kurta: 'cat_clothing',
  shoes: 'cat_clothing',

  // Personal Care
  personal: 'cat_personal_care',
  cosmetics: 'cat_personal_care',
  skincare: 'cat_personal_care',
  soap: 'cat_personal_care',
  shampoo: 'cat_personal_care',
  cream: 'cat_personal_care',

  // Electronics
  electronics: 'cat_electronics',
  mobile: 'cat_electronics',
  phone: 'cat_electronics',
  laptop: 'cat_electronics',
  gadget: 'cat_electronics',
  charger: 'cat_electronics',

  // Saving
  saving: 'cat_saving',
  savings: 'cat_saving',
  bachat: 'cat_saving',

  // Misc.
  misc: 'cat_misc',
  miscellaneous: 'cat_misc',
  other: 'cat_misc',

  // Gift and Donations
  gift: 'cat_gift_donations',
  gifts: 'cat_gift_donations',
  donation: 'cat_gift_donations',
  donations: 'cat_gift_donations',
  charity: 'cat_gift_donations',
  shagun: 'cat_gift_donations',
  dakshina: 'cat_gift_donations',

  // Ice Cream
  icecream: 'cat_ice_cream',
  'ice cream': 'cat_ice_cream',
  kulfi: 'cat_ice_cream',
  dessert: 'cat_ice_cream',

  // Medicines
  medicine: 'cat_medicines',
  medicines: 'cat_medicines',
  dawa: 'cat_medicines',
  pharmacy: 'cat_medicines',
  tablet: 'cat_medicines',
  capsule: 'cat_medicines',

  // Flowers
  flowers: 'cat_flowers',
  flower: 'cat_flowers',
  phool: 'cat_flowers',
  puja: 'cat_flowers',
  pooja: 'cat_flowers',

  // Air Tickets
  flight: 'cat_air_tickets',
  plane: 'cat_air_tickets',
  air: 'cat_air_tickets',
  ticket: 'cat_air_tickets',
  airline: 'cat_air_tickets',
  aeroplane: 'cat_air_tickets',

  // Fitness
  fitness: 'cat_fitness',
  gym: 'cat_fitness',
  workout: 'cat_fitness',
  yoga: 'cat_fitness',

  // Kids
  kids: 'cat_kids',
  baby: 'cat_kids',
  child: 'cat_kids',
  diaper: 'cat_kids',

  // Taxes
  tax: 'cat_taxes',
  taxes: 'cat_taxes',
  gst: 'cat_taxes',
  tds: 'cat_taxes',

  // Books
  book: 'cat_books',
  books: 'cat_books',
  novel: 'cat_books',
  textbook: 'cat_books',

  // Cable
  cable: 'cat_cable',
  dth: 'cat_cable',
  dish: 'cat_cable',
  tatasky: 'cat_cable',

  // Hotel
  hotel: 'cat_hotel',
  stay: 'cat_hotel',
  resort: 'cat_hotel',
  lodge: 'cat_hotel',

  // Maid / Driver
  maid: 'cat_maid_driver',
  driver: 'cat_maid_driver',
  kamwali: 'cat_maid_driver',
  helper: 'cat_maid_driver',
  servant: 'cat_maid_driver',

  // Shopping
  shopping: 'cat_shopping',
  mall: 'cat_shopping',

  // Toys
  toy: 'cat_toys',
  toys: 'cat_toys',
  game: 'cat_toys',

  // Stationery
  stationery: 'cat_stationery',
  pen: 'cat_stationery',
  pencil: 'cat_stationery',
  notebook: 'cat_stationery',
  paper: 'cat_stationery',

  // Train
  train: 'cat_train',
  railway: 'cat_train',
  irctc: 'cat_train',
  metro: 'cat_train',

  // Loans
  'home loan': 'cat_home_loan',
  homeloan: 'cat_home_loan',
  'personal loan': 'cat_personal_loan',
  'education loan': 'cat_education_loan',
  'car loan': 'cat_car_loan',
  loan: 'cat_personal_loan',

  // Festivals
  festival: 'cat_festivals',
  festivals: 'cat_festivals',
  diwali: 'cat_festivals',
  dashain: 'cat_festivals',
  tihar: 'cat_festivals',
  holi: 'cat_festivals',
  eid: 'cat_festivals',
  christmas: 'cat_festivals',

  // Laundry
  laundry: 'cat_laundry',
  dhobi: 'cat_laundry',
  dryclean: 'cat_laundry',
  washing: 'cat_laundry',

  // EMI
  emi: 'cat_emi',
  kist: 'cat_emi',
  installment: 'cat_emi',

  // ATM
  atm: 'cat_atm',
  withdrawal: 'cat_atm',

  // Toll
  toll: 'cat_toll',
  fastag: 'cat_toll',

  // Groceries / Food / Utilities
  groceries: 'cat_groceries',
  grocery: 'cat_groceries',
  ration: 'cat_groceries',
  rice: 'cat_groceries',
  flour: 'cat_groceries',
  oil: 'cat_groceries',
  dinner: 'cat_food_dining',
  lunch: 'cat_food_dining',
  breakfast: 'cat_food_dining',
  restaurant: 'cat_food_dining',
  food: 'cat_food_dining',
  khaja: 'cat_food_dining',
  swiggy: 'cat_food_dining',
  zomato: 'cat_food_dining',
  electricity: 'cat_electricity',
  bijli: 'cat_electricity',
  water: 'cat_water',
  pani: 'cat_water',
  internet: 'cat_internet_mobile',
  wifi: 'cat_internet_mobile',
  recharge: 'cat_recharge',
  rent: 'cat_rent',
  kiraya: 'cat_rent',
  maintenance: 'cat_maintenance',
  doctor: 'cat_doctor_hospital',
  hospital: 'cat_doctor_hospital',
  insurance: 'cat_insurance',

  // Income keywords
  salary: 'cat_salary',
  vetan: 'cat_salary',
  bonus: 'cat_salary',
  sales: 'cat_sales',
  freelance: 'cat_other_income',
};

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'home',
    name: 'Home',
    nameHi: 'घर (Home)',
    icon: 'Home',
    color: '#10b981', // Emerald
    isArchived: false,
    isDefault: true,
  },
  {
    id: 'office',
    name: 'Office / Business',
    nameHi: 'कार्यालय / व्यापार',
    icon: 'Briefcase',
    color: '#3b82f6', // Blue
    isArchived: false,
    isDefault: false,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // 1. Milk (renamed from "Milk and Dairy")
  { id: 'cat_milk', name: 'Milk', nameHi: 'दूध (Milk)', type: 'expense', icon: 'Milk', color: '#06b6d4', isArchived: false, isSystem: true, subcategories: ['Cow Milk', 'Buffalo Milk', 'Packet Milk', 'Curd & Paneer'] },

  // 2. Vegetables (separated from Fruits)
  { id: 'cat_vegetables', name: 'Vegetables', nameHi: 'सब्जियां (Vegetables)', type: 'expense', icon: 'Carrot', color: '#84cc16', isArchived: false, isSystem: true, subcategories: ['Fresh Vegetables', 'Potatoes & Onions', 'Leafy Greens', 'Herbs & Chilies'] },

  // 3. Fruits (separated from Vegetables)
  { id: 'cat_fruits', name: 'Fruits', nameHi: 'फल (Fruits)', type: 'expense', icon: 'Apple', color: '#e11d48', isArchived: false, isSystem: true, subcategories: ['Apples & Bananas', 'Seasonal Fruits', 'Citrus & Berries', 'Dry Fruits'] },

  // 4. Petrol (renamed from "Petrol and Fuel")
  { id: 'cat_petrol', name: 'Petrol', nameHi: 'पेट्रोल (Petrol)', type: 'expense', icon: 'Fuel', color: '#ef4444', isArchived: false, isSystem: true, subcategories: ['Bike Petrol', 'Car Petrol', 'Engine Oil'] },

  // User Requested Categories
  { id: 'cat_bills_utilities', name: 'Bills and Utilities', nameHi: 'बिल व उपयोगिताएँ', type: 'expense', icon: 'Receipt', color: '#0284c7', isArchived: false, isSystem: true, subcategories: ['Electricity', 'Water', 'Gas', 'Garbage Fee'] },
  { id: 'cat_coffee', name: 'Coffee', nameHi: 'कॉफ़ी व कैफ़े', type: 'expense', icon: 'Coffee', color: '#78350f', isArchived: false, isSystem: true, subcategories: ['Cafe & Espresso', 'Tea & Chai', 'Snacks', 'Beverages'] },
  { id: 'cat_bike', name: 'Bike', nameHi: 'बाइक व दोपहिया', type: 'expense', icon: 'Bike', color: '#ea580c', isArchived: false, isSystem: true, subcategories: ['Bike Service', 'Bike Wash', 'Spare Parts', 'Helmet & Accessories'] },
  { id: 'cat_salon', name: 'Salon', nameHi: 'सैलून व पार्लर', type: 'expense', icon: 'Scissors', color: '#db2777', isArchived: false, isSystem: true, subcategories: ['Haircut', 'Beard & Shave', 'Facial & Spa', 'Grooming'] },
  { id: 'cat_investment', name: 'Investment', nameHi: 'निवेश व शेयर', type: 'expense', icon: 'TrendingUp', color: '#059669', isArchived: false, isSystem: true, subcategories: ['Mutual Funds / SIP', 'Stock Market', 'Gold / Silver', 'Fixed Deposit'] },
  { id: 'cat_pet_care', name: 'Pet Care', nameHi: 'पालतू जानवर की देखभाल', type: 'expense', icon: 'Dog', color: '#ca8a04', isArchived: false, isSystem: true, subcategories: ['Pet Food', 'Vet & Doctor', 'Grooming & Shampoo', 'Medicines & Vaccines'] },
  { id: 'cat_gas', name: 'Gas', nameHi: 'रसोई गैस (LPG / Gas)', type: 'expense', icon: 'Flame', color: '#dc2626', isArchived: false, isSystem: true, subcategories: ['LPG Cylinder', 'Piped Natural Gas', 'Gas Stove Repair', 'Refill'] },
  { id: 'cat_clothing', name: 'Clothing', nameHi: 'कपड़े व परिधान', type: 'expense', icon: 'Shirt', color: '#9333ea', isArchived: false, isSystem: true, subcategories: ['Men Clothing', 'Women Clothing', 'Kids Wear', 'Shoes & Footwear'] },
  { id: 'cat_personal_care', name: 'Personal Care', nameHi: 'व्यक्तिगत देखभाल', type: 'expense', icon: 'Sparkles', color: '#c026d3', isArchived: false, isSystem: true, subcategories: ['Skincare & Creams', 'Hair Care', 'Hygiene & Toiletries', 'Perfume & Deo'] },
  { id: 'cat_electronics', name: 'Electronics', nameHi: 'इलेक्ट्रॉनिक्स व गैजेट्स', type: 'expense', icon: 'Smartphone', color: '#4f46e5', isArchived: false, isSystem: true, subcategories: ['Mobile & Accessories', 'Computer & Laptop', 'Home Appliances', 'Repairs'] },
  { id: 'cat_saving', name: 'Saving', nameHi: 'बचत (Savings Fund)', type: 'expense', icon: 'PiggyBank', color: '#16a34a', isArchived: false, isSystem: true, subcategories: ['Emergency Fund', 'Recurring Savings', 'Goal Savings', 'Chit Fund'] },
  { id: 'cat_misc', name: 'Misc.', nameHi: 'विविध खर्च (Misc.)', type: 'expense', icon: 'HelpCircle', color: '#64748b', isArchived: false, isSystem: true, subcategories: ['General Expenses', 'One-off Expenses', 'Others'] },
  { id: 'cat_gift_donations', name: 'Gift and Donations', nameHi: 'उपहार व दान', type: 'expense', icon: 'Gift', color: '#e11d48', isArchived: false, isSystem: true, subcategories: ['Temple / Charity', 'Birthday Gift', 'Wedding Shagun', 'Family Support'] },
  { id: 'cat_ice_cream', name: 'Ice Cream', nameHi: 'आइसक्रीम व डेज़र्ट', type: 'expense', icon: 'IceCream', color: '#f472b6', isArchived: false, isSystem: true, subcategories: ['Cone & Cup', 'Family Tub', 'Kulfi', 'Sweets & Desserts'] },
  { id: 'cat_medicines', name: 'Medicines', nameHi: 'दवाइयाँ (Medicines)', type: 'expense', icon: 'Pill', color: '#ef4444', isArchived: false, isSystem: true, subcategories: ['Prescription Medicines', 'Daily Supplements', 'First Aid & Ointment', 'Ayurvedic'] },
  { id: 'cat_flowers', name: 'Flowers', nameHi: 'फूल व पूजा', type: 'expense', icon: 'Flower2', color: '#f59e0b', isArchived: false, isSystem: true, subcategories: ['Puja Flowers & Mala', 'Bouquet', 'Plants & Nursery', 'Festival Flowers'] },
  { id: 'cat_air_tickets', name: 'Air Tickets', nameHi: 'हवाई टिकट (Air Tickets)', type: 'expense', icon: 'Plane', color: '#0284c7', isArchived: false, isSystem: true, subcategories: ['Domestic Flight', 'International Flight', 'Baggage & Seat Selection'] },
  { id: 'cat_fitness', name: 'Fitness', nameHi: 'फ़िटनेस व जिम', type: 'expense', icon: 'Dumbbell', color: '#0d9488', isArchived: false, isSystem: true, subcategories: ['Gym Membership', 'Yoga & Aerobics', 'Protein & Supplements', 'Sports Gear'] },
  { id: 'cat_kids', name: 'Kids', nameHi: 'बच्चों का खर्च', type: 'expense', icon: 'Baby', color: '#ec4899', isArchived: false, isSystem: true, subcategories: ['Baby Food & Formula', 'Diapers & Wipes', 'Kids Clothing', 'Activity & Care'] },
  { id: 'cat_taxes', name: 'Taxes', nameHi: 'कर व टैक्स (Taxes)', type: 'expense', icon: 'Landmark', color: '#475569', isArchived: false, isSystem: true, subcategories: ['Income Tax', 'Property Tax', 'GST / VAT', 'TDS / Advance Tax'] },
  { id: 'cat_books', name: 'Books', nameHi: 'किताबें व पत्रिकाएँ', type: 'expense', icon: 'BookOpen', color: '#2563eb', isArchived: false, isSystem: true, subcategories: ['Educational Books', 'Novels & Literature', 'Religious Books', 'Magazines'] },
  { id: 'cat_cable', name: 'Cable', nameHi: 'केबल टीवी व डीटीएच', type: 'expense', icon: 'Tv', color: '#7c3aed', isArchived: false, isSystem: true, subcategories: ['DTH Recharge', 'Cable TV Operator', 'Set Top Box', 'Add-on Channels'] },
  { id: 'cat_hotel', name: 'Hotel', nameHi: 'होटल व स्टे', type: 'expense', icon: 'Hotel', color: '#b45309', isArchived: false, isSystem: true, subcategories: ['Hotel Room', 'Resort Stay', 'Homestay / Airbnb', 'Room Service'] },
  { id: 'cat_maid_driver', name: 'Maid / Driver', nameHi: 'घरेलू सहायक / ड्राइवर', type: 'expense', icon: 'UserCheck', color: '#0891b2', isArchived: false, isSystem: true, subcategories: ['Maid Salary', 'Cook Salary', 'Driver Salary', 'House Cleaner'] },
  { id: 'cat_shopping', name: 'Shopping', nameHi: 'शॉपिंग', type: 'expense', icon: 'ShoppingBag', color: '#d946ef', isArchived: false, isSystem: true, subcategories: ['Online Orders', 'Market & Mall', 'Footwear & Bags', 'Household Items'] },
  { id: 'cat_toys', name: 'Toys', nameHi: 'खिलौने (Toys)', type: 'expense', icon: 'Gamepad2', color: '#f97316', isArchived: false, isSystem: true, subcategories: ['Board Games', 'Action Figures & Dolls', 'Remote Cars', 'Puzzles & Lego'] },
  { id: 'cat_stationery', name: 'Stationery', nameHi: 'स्टेशनरी सामग्री', type: 'expense', icon: 'PenTool', color: '#6366f1', isArchived: false, isSystem: true, subcategories: ['Notebooks & Registers', 'Pens, Pencils & Markers', 'Folders & Files', 'Glue & Tape'] },
  { id: 'cat_train', name: 'Train', nameHi: 'ट्रेन व रेलवे टिकट', type: 'expense', icon: 'Train', color: '#4338ca', isArchived: false, isSystem: true, subcategories: ['IRCTC Railway Ticket', 'Metro Card Recharge', 'Local Train Ticket', 'Platform Ticket'] },
  { id: 'cat_home_loan', name: 'Home Loan', nameHi: 'होम लोन (Home Loan EMI)', type: 'expense', icon: 'Home', color: '#0f766e', isArchived: false, isSystem: true, subcategories: ['Monthly Home EMI', 'Principal Repayment', 'Processing Fee'] },
  { id: 'cat_personal_loan', name: 'Personal Loan', nameHi: 'पर्सनल लोन ईएमआई', type: 'expense', icon: 'CreditCard', color: '#be185d', isArchived: false, isSystem: true, subcategories: ['Bank Loan EMI', 'Instant Loan EMI', 'Prepayment'] },
  { id: 'cat_education_loan', name: 'Education Loan', nameHi: 'एजुकेशन लोन ईएमआई', type: 'expense', icon: 'GraduationCap', color: '#0284c7', isArchived: false, isSystem: true, subcategories: ['Student Loan EMI', 'Interest Payment'] },
  { id: 'cat_festivals', name: 'Festivals', nameHi: 'त्योहार व उत्सव', type: 'expense', icon: 'PartyPopper', color: '#e11d48', isArchived: false, isSystem: true, subcategories: ['Diwali', 'Dashain / Tihar', 'Holi & Colors', 'Eid / Christmas', 'Puja Samagri'] },
  { id: 'cat_car_loan', name: 'Car Loan', nameHi: 'कार लोन (Car Loan EMI)', type: 'expense', icon: 'Car', color: '#374151', isArchived: false, isSystem: true, subcategories: ['Car EMI', 'Vehicle Down Payment', 'Finance Charge'] },
  { id: 'cat_laundry', name: 'Laundry', nameHi: 'लॉन्ड्री व ड्राई क्लीनिंग', type: 'expense', icon: 'Shirt', color: '#0284c7', isArchived: false, isSystem: true, subcategories: ['Dry Cleaning', 'Washing & Press', 'Ironing', 'Detergent'] },
  { id: 'cat_emi', name: 'EMI', nameHi: 'किस्त व ईएमआई (EMI)', type: 'expense', icon: 'CalendarClock', color: '#b91c1c', isArchived: false, isSystem: true, subcategories: ['Credit Card EMI', 'Mobile / Laptop EMI', 'Appliance EMI'] },
  { id: 'cat_atm', name: 'ATM', nameHi: 'एटीएम निकासी (ATM Cash)', type: 'expense', icon: 'Banknote', color: '#15803d', isArchived: false, isSystem: true, subcategories: ['ATM Cash Withdrawal', 'Card Fee', 'Bank Withdrawal'] },
  { id: 'cat_toll', name: 'Toll', nameHi: 'टोल टैक्स (Toll & FASTag)', type: 'expense', icon: 'Milestone', color: '#d97706', isArchived: false, isSystem: true, subcategories: ['FASTag Recharge', 'Highway Toll Plaza', 'Parking Fee'] },

  // Additional Essential Categories
  { id: 'cat_groceries', name: 'Groceries', nameHi: 'किराना व राशन', type: 'expense', icon: 'ShoppingCart', color: '#10b981', isArchived: false, isSystem: true, subcategories: ['Spices & Masala', 'Flour & Rice', 'Dal & Pulses', 'Cooking Oil'] },
  { id: 'cat_food_dining', name: 'Food and Dining', nameHi: 'खानपान व रेस्टोरेंट', type: 'expense', icon: 'Utensils', color: '#f97316', isArchived: false, isSystem: true, subcategories: ['Restaurant', 'Takeaway', 'Street Food', 'Snacks'] },
  { id: 'cat_fast_food', name: 'Fast Food & Snacks', nameHi: 'फास्ट फूड व स्नैक्स', type: 'expense', icon: 'Pizza', color: '#ea580c', isArchived: false, isSystem: true, subcategories: ['Pizza & Burgers', 'Chowmein & Momos', 'Samosa & Tea', 'Bakeries'] },
  { id: 'cat_electricity', name: 'Electricity Bill', nameHi: 'बिजली बिल', type: 'expense', icon: 'Zap', color: '#eab308', isArchived: false, isSystem: true, subcategories: ['NEA Bill', 'Solar Maintenance'] },
  { id: 'cat_water', name: 'Water Bill', nameHi: 'पानी बिल', type: 'expense', icon: 'Droplets', color: '#38bdf8', isArchived: false, isSystem: true, subcategories: ['Supply Water', 'Water Jar/Tanker'] },
  { id: 'cat_internet_mobile', name: 'Internet and Mobile', nameHi: 'इंटरनेट व मोबाइल', type: 'expense', icon: 'Wifi', color: '#6366f1', isArchived: false, isSystem: true, subcategories: ['Fiber Net', 'Mobile Recharge', 'Postpaid'] },
  { id: 'cat_rent', name: 'Rent', nameHi: 'मकान / ऑफिस किराया', type: 'expense', icon: 'Building', color: '#8b5cf6', isArchived: false, isSystem: true, subcategories: ['Flat Rent', 'Shop Rent', 'Warehouse'] },
  { id: 'cat_maintenance', name: 'House Maintenance', nameHi: 'घर का रख-रखाव', type: 'expense', icon: 'Wrench', color: '#a855f7', isArchived: false, isSystem: true, subcategories: ['Plumber', 'Electrician', 'Paint & Repairs'] },
  { id: 'cat_transport', name: 'Transport and Travel', nameHi: 'यातायात व यात्रा', type: 'expense', icon: 'Bus', color: '#ec4899', isArchived: false, isSystem: true, subcategories: ['Bus/Metro', 'Taxi/Ride-share', 'Flight'] },
  { id: 'cat_doctor_hospital', name: 'Doctor & Hospital', nameHi: 'डॉक्टर व अस्पताल', type: 'expense', icon: 'Stethoscope', color: '#f43f5e', isArchived: false, isSystem: true, subcategories: ['Doctor Consultation', 'Blood Test / Lab', 'Hospital Admission', 'Dental Care'] },
  { id: 'cat_insurance', name: 'Insurance', nameHi: 'बीमा व इंश्योरेंस', type: 'expense', icon: 'ShieldCheck', color: '#1d4ed8', isArchived: false, isSystem: true, subcategories: ['Health Insurance', 'Life Insurance', 'Bike / Car Insurance', 'Term Plan'] },
  { id: 'cat_recharge', name: 'Recharge & DTH', nameHi: 'मोबाइल व टीवी रिचार्ज', type: 'expense', icon: 'Smartphone', color: '#0d9488', isArchived: false, isSystem: true, subcategories: ['Prepaid Recharge', 'Postpaid Bill', 'DTH Top-up'] },
  { id: 'cat_education', name: 'Education', nameHi: 'शिक्षा व फीस', type: 'expense', icon: 'GraduationCap', color: '#14b8a6', isArchived: false, isSystem: true, subcategories: ['School Fee', 'Books & Stationery', 'Courses'] },
  { id: 'cat_entertainment', name: 'Entertainment', nameHi: 'मनोरंजन व मूवी', type: 'expense', icon: 'Film', color: '#f59e0b', isArchived: false, isSystem: true, subcategories: ['Cinema', 'OTT Subscription', 'Outing'] },
  { id: 'cat_office_supplies', name: 'Office Supplies', nameHi: 'कार्यालय सामग्री', type: 'expense', icon: 'FileText', color: '#64748b', isArchived: false, isSystem: true, subcategories: ['Paper & Printer', 'Desks & Chairs', 'Stationery'] },
  { id: 'cat_staff_business', name: 'Staff and Business Expenses', nameHi: 'कर्मचारी व व्यापार खर्च', type: 'expense', icon: 'Users', color: '#475569', isArchived: false, isSystem: true, subcategories: ['Staff Meals', 'Client Meeting', 'Courier'] },

  // Income categories from prompt requirements
  { id: 'cat_salary', name: 'Salary', nameHi: 'वेतन (Salary)', type: 'income', icon: 'Wallet', color: '#10b981', isArchived: false, isSystem: true, subcategories: ['Monthly Pay', 'Bonus', 'Overtime'] },
  { id: 'cat_business_income', name: 'Business Income', nameHi: 'व्यापारिक आय', type: 'income', icon: 'TrendingUp', color: '#0ea5e9', isArchived: false, isSystem: true, subcategories: ['Client Retainer', 'Consulting', 'Project Fee'] },
  { id: 'cat_sales', name: 'Sales', nameHi: 'बिक्री (Sales)', type: 'income', icon: 'BarChart2', color: '#8b5cf6', isArchived: false, isSystem: true, subcategories: ['Retail Sales', 'Direct Orders'] },
  { id: 'cat_interest', name: 'Interest', nameHi: 'ब्याज व लाभांश', type: 'income', icon: 'Percent', color: '#f59e0b', isArchived: false, isSystem: true, subcategories: ['Bank Interest', 'Fixed Deposit', 'Mutual Fund'] },
  { id: 'cat_gifts', name: 'Gifts', nameHi: 'उपहार / दक्षिणा', type: 'income', icon: 'Gift', color: '#ec4899', isArchived: false, isSystem: true, subcategories: ['Festival Shagun', 'Family Support'] },
  { id: 'cat_other_income', name: 'Other Income', nameHi: 'अन्य आय', type: 'income', icon: 'DollarSign', color: '#14b8a6', isArchived: false, isSystem: true, subcategories: ['Cashback', 'Refund', 'Freelancing'] },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Cash in Hand', nameHi: 'नकद (Cash)', type: 'cash', initialBalance: 12500, color: '#10b981', icon: 'Banknote' },
  { id: 'acc_bank', name: 'Bank Account (Primary)', nameHi: 'बैंक खाता', type: 'bank', initialBalance: 95000, color: '#3b82f6', icon: 'Landmark', accountNumberMasked: '••• 8291' },
  { id: 'acc_wallet', name: 'Digital Wallet (eSewa / UPI)', nameHi: 'डिजिटल वॉलेट', type: 'wallet', initialBalance: 6800, color: '#8b5cf6', icon: 'Smartphone' },
  { id: 'acc_card', name: 'Credit Card', nameHi: 'क्रेडिट कार्ड', type: 'credit_card', initialBalance: 0, color: '#f59e0b', icon: 'CreditCard', accountNumberMasked: '••• 4402' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  currency: 'NPR', // Default currency: Nepalese Rupee as requested
  financialYearStartMonth: 7, // Default July/Shrawan for Nepal, configurable to 4 for India or 1 for Calendar
  theme: 'system',
  themeContrast: 'normal',
  defaultProfileId: 'home',
  dateFormat: 'DD MMMM, YYYY',
  isAppLocked: false,
  biometricEnabled: false,
  autoLockMinutes: 5,
  carryForwardMonthlyBalance: false,
  showCalculatorInAmount: false,
  disableAutoSuggestions: false,
  googleAccountEmail: 'anshul.kumar012@gmail.com',
  lastBackupTimestamp: '30 October 2026, 08:37 PM',
  lastBackupSize: '240 KB',
};

// Generate realistic starter data relative to today so demo is vibrant
function getStarterTransactions(): Transaction[] {
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];
  
  const dToday = formatYMD(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dYesterday = formatYMD(yesterday);

  const d4DaysAgo = new Date(today);
  d4DaysAgo.setDate(today.getDate() - 4);

  const d8DaysAgo = new Date(today);
  d8DaysAgo.setDate(today.getDate() - 8);

  const d12DaysAgo = new Date(today);
  d12DaysAgo.setDate(today.getDate() - 12);

  return [
    // Today's Home transactions
    {
      id: 'tx_seed_1',
      type: 'expense',
      amount: 480,
      currency: 'NPR',
      date: dToday,
      time: '08:30',
      profileId: 'home',
      categoryId: 'cat_milk',
      subCategory: 'Milk',
      accountId: 'acc_wallet',
      description: 'Morning milk & curd packet',
      notes: 'Daily dairy supply',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_2',
      type: 'expense',
      amount: 850,
      currency: 'NPR',
      date: dToday,
      time: '11:15',
      profileId: 'home',
      categoryId: 'cat_vegetables',
      subCategory: 'Fresh Vegetables',
      accountId: 'acc_cash',
      description: 'Weekly fresh vegetables & potatoes',
      notes: 'Local vegetable bazaar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_2b',
      type: 'expense',
      amount: 600,
      currency: 'NPR',
      date: dToday,
      time: '11:30',
      profileId: 'home',
      categoryId: 'cat_fruits',
      subCategory: 'Seasonal Fruits',
      accountId: 'acc_cash',
      description: 'Fresh apples & bananas',
      notes: 'Fruit stall',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_3',
      type: 'income',
      amount: 15000,
      currency: 'NPR',
      date: dToday,
      time: '14:00',
      profileId: 'home',
      categoryId: 'cat_other_income',
      subCategory: 'Freelancing',
      accountId: 'acc_bank',
      description: 'Freelance UI design milestone payment',
      referenceNo: 'TXN-9021-NP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Yesterday's Office transactions
    {
      id: 'tx_seed_4',
      type: 'expense',
      amount: 3200,
      currency: 'NPR',
      date: dYesterday,
      time: '10:45',
      profileId: 'office',
      categoryId: 'cat_office_supplies',
      subCategory: 'Paper & Printer',
      accountId: 'acc_bank',
      description: 'A4 printing paper boxes & pen pack',
      referenceNo: 'INV-4821',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_5',
      type: 'income',
      amount: 42000,
      currency: 'NPR',
      date: dYesterday,
      time: '16:30',
      profileId: 'office',
      categoryId: 'cat_business_income',
      subCategory: 'Client Retainer',
      accountId: 'acc_bank',
      description: 'Monthly business consulting retainer from client',
      referenceNo: 'BANK-CR-882',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Recent days Home & Office
    {
      id: 'tx_seed_6',
      type: 'expense',
      amount: 2500,
      currency: 'NPR',
      date: formatYMD(d4DaysAgo),
      time: '18:20',
      profileId: 'home',
      categoryId: 'cat_petrol',
      subCategory: 'Bike Petrol',
      accountId: 'acc_wallet',
      description: 'Full tank fuel for commute',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_7',
      type: 'expense',
      amount: 1750,
      currency: 'NPR',
      date: formatYMD(d4DaysAgo),
      time: '19:40',
      profileId: 'home',
      categoryId: 'cat_food_dining',
      subCategory: 'Restaurant',
      accountId: 'acc_card',
      description: 'Family dinner at Thakali Kitchen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_8',
      type: 'expense',
      amount: 1800,
      currency: 'NPR',
      date: formatYMD(d8DaysAgo),
      time: '12:00',
      profileId: 'home',
      categoryId: 'cat_electricity',
      subCategory: 'NEA Bill',
      accountId: 'acc_wallet',
      description: 'Monthly electricity bill payment',
      referenceNo: 'NEA-837482',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_9',
      type: 'expense',
      amount: 1500,
      currency: 'NPR',
      date: formatYMD(d8DaysAgo),
      time: '14:20',
      profileId: 'office',
      categoryId: 'cat_internet_mobile',
      subCategory: 'Fiber Net',
      accountId: 'acc_bank',
      description: 'High-speed office fiber internet renewal',
      referenceNo: 'WLINK-9938',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_10',
      type: 'income',
      amount: 85000,
      currency: 'NPR',
      date: formatYMD(d12DaysAgo),
      time: '09:00',
      profileId: 'home',
      categoryId: 'cat_salary',
      subCategory: 'Monthly Pay',
      accountId: 'acc_bank',
      description: 'Monthly professional salary credited',
      referenceNo: 'SAL-OCT-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Storage Repository Implementation
export const StorageService = {
  // --- TRANSACTIONS ---
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        const initial = getStarterTransactions();
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initial));
        return initial;
      }
      const parsed: Transaction[] = JSON.parse(data);
      let migrated = false;
      const updated = parsed.map((tx) => {
        if (tx.categoryId === 'cat_veg_fruits') {
          migrated = true;
          return { ...tx, categoryId: 'cat_vegetables' };
        }
        return tx;
      });
      if (migrated) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Failed to read transactions from storage:', e);
      return getStarterTransactions();
    }
  },

  saveTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Transaction {
    const all = this.getTransactions();
    const now = new Date().toISOString();

    if (tx.id) {
      // Update existing
      const index = all.findIndex((t) => t.id === tx.id);
      if (index !== -1) {
        const updated: Transaction = {
          ...all[index],
          ...tx,
          id: tx.id,
          updatedAt: now,
        };
        all[index] = updated;
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
        if (updated.type !== 'transfer' && updated.categoryId && updated.description) {
          this.learnDescriptionCategory(updated.description, updated.categoryId);
        }
        return updated;
      }
    }

    // Insert new
    const newTx: Transaction = {
      ...tx,
      id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
    if (newTx.type !== 'transfer' && newTx.categoryId && newTx.description) {
      this.learnDescriptionCategory(newTx.description, newTx.categoryId);
    }
    return newTx;
  },

  deleteTransaction(id: string): { success: boolean; deletedTx?: Transaction } {
    const all = this.getTransactions();
    const target = all.find((t) => t.id === id);
    if (!target) return { success: false };

    const remaining = all.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remaining));
    localStorage.setItem(STORAGE_KEYS.LAST_DELETED, JSON.stringify(target));
    return { success: true, deletedTx: target };
  },

  undoDeleteTransaction(): Transaction | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_DELETED);
      if (!raw) return null;
      const tx: Transaction = JSON.parse(raw);
      const all = this.getTransactions();
      all.unshift(tx);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
      localStorage.removeItem(STORAGE_KEYS.LAST_DELETED);
      return tx;
    } catch {
      return null;
    }
  },

  moveTransactionProfile(txId: string, newProfileId: string): Transaction | null {
    const all = this.getTransactions();
    const index = all.findIndex((t) => t.id === txId);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      profileId: newProfileId,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
    return all[index];
  },

  duplicateTransaction(txId: string): Transaction | null {
    const all = this.getTransactions();
    const source = all.find((t) => t.id === txId);
    if (!source) return null;

    const copy: Transaction = {
      ...source,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      description: `${source.description} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(copy);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
    return copy;
  },

  // --- PROFILES ---
  getProfiles(): Profile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
        return DEFAULT_PROFILES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROFILES;
    }
  },

  saveProfile(profile: Profile): Profile[] {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    return profiles;
  },

  deleteProfile(id: string): { success: boolean; message?: string } {
    if (id === 'home' || id === 'office') {
      return { success: false, message: 'Default Home and Office profiles cannot be deleted.' };
    }
    const transactions = this.getTransactions();
    const hasTransactions = transactions.some((t) => t.profileId === id);
    if (hasTransactions) {
      return { success: false, message: 'This profile contains transactions. Archive it or move transactions first.' };
    }
    const remaining = this.getProfiles().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(remaining));
    return { success: true };
  },

  // --- CATEGORIES ---
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      let list: Category[] = JSON.parse(data);
      let hasChanges = false;

      // Migrate existing categories (Milk, Vegetables, Fruits, Petrol)
      list = list.map((cat) => {
        if (cat.id === 'cat_veg_fruits') {
          hasChanges = true;
          return {
            ...cat,
            id: 'cat_vegetables',
            name: 'Vegetables',
            nameHi: 'सब्जियां (Vegetables)',
            icon: 'Carrot',
          };
        }
        if (cat.id === 'cat_milk' && cat.name !== 'Milk') {
          hasChanges = true;
          return {
            ...cat,
            name: 'Milk',
            nameHi: 'दूध (Milk)',
            icon: 'Milk',
          };
        }
        if (cat.id === 'cat_petrol' && cat.name !== 'Petrol') {
          hasChanges = true;
          return {
            ...cat,
            name: 'Petrol',
            nameHi: 'पेट्रोल (Petrol)',
            icon: 'Fuel',
          };
        }
        return cat;
      });

      // Add any missing categories from DEFAULT_CATEGORIES
      const existingIds = new Set(list.map((c) => c.id));
      for (const def of DEFAULT_CATEGORIES) {
        if (!existingIds.has(def.id)) {
          list.push(def);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
      }
      return list;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategory(cat: Category): Category[] {
    const list = this.getCategories();
    const index = list.findIndex((c) => c.id === cat.id);
    if (index >= 0) {
      list[index] = cat;
    } else {
      list.push(cat);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return list;
  },

  deleteCategory(id: string): { success: boolean; message?: string } {
    const transactions = this.getTransactions();
    const inUse = transactions.some((t) => t.categoryId === id);
    if (inUse) {
      return {
        success: false,
        message: 'Category cannot be deleted because historical transactions use it. You can Archive it instead.',
      };
    }
    const remaining = this.getCategories().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(remaining));
    return { success: true };
  },

  // --- ACCOUNTS ---
  getAccounts(): Account[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        return DEFAULT_ACCOUNTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  },

  saveAccount(acc: Account): Account[] {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === acc.id);
    if (index >= 0) {
      accounts[index] = acc;
    } else {
      accounts.push(acc);
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return accounts;
  },

  // --- APP SETTINGS ---
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  },

  // --- FULL DATA RESET & RESTORE ---
  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.LAST_DELETED);
    // Reload initial defaults
    this.getProfiles();
    this.getCategories();
    this.getAccounts();
    this.getTransactions();
    this.getSettings();
  },

  exportDatabaseSnapshot() {
    return {
      version: 2,
      exportTimestamp: new Date().toISOString(),
      appName: 'Day-to-day Expenses',
      profiles: this.getProfiles(),
      categories: this.getCategories(),
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      settings: this.getSettings(),
    };
  },

  restoreDatabaseSnapshot(snapshot: any): { success: boolean; message?: string; count?: number } {
    if (!snapshot || typeof snapshot !== 'object') {
      return { success: false, message: 'Invalid backup format' };
    }
    if (!Array.isArray(snapshot.transactions) || !Array.isArray(snapshot.categories)) {
      return { success: false, message: 'Missing transaction or category tables in backup file' };
    }

    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(snapshot.profiles || DEFAULT_PROFILES));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(snapshot.categories || DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(snapshot.accounts || DEFAULT_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(snapshot.transactions));
    if (snapshot.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...snapshot.settings }));
    }
    return { success: true, count: snapshot.transactions.length };
  },

  // --- SMART DESCRIPTION -> CATEGORY AUTO LEARNING ---
  getDescriptionCategoryMap(): Record<string, string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DESC_CATEGORY_MAP);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.DESC_CATEGORY_MAP, JSON.stringify(DEFAULT_KEYWORD_MAPPINGS));
        return { ...DEFAULT_KEYWORD_MAPPINGS };
      }
      return { ...DEFAULT_KEYWORD_MAPPINGS, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_KEYWORD_MAPPINGS };
    }
  },

  learnDescriptionCategory(description: string, categoryId: string) {
    if (!description || !categoryId || categoryId === 'transfer_internal') return;
    const cleanDesc = description.trim().toLowerCase();
    if (!cleanDesc) return;

    const currentMap = this.getDescriptionCategoryMap();
    currentMap[cleanDesc] = categoryId;

    // Also learn significant keywords
    const words = cleanDesc.split(/[\s,.\-_/]+/).filter((w) => w.length >= 3);
    for (const w of words) {
      currentMap[w] = categoryId;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.DESC_CATEGORY_MAP, JSON.stringify(currentMap));
    } catch (e) {
      console.warn('Failed to save description category mapping:', e);
    }
  },

  suggestCategoryForDescription(text: string): string | null {
    if (!text) return null;
    const clean = text.trim().toLowerCase();
    if (!clean) return null;

    const map = this.getDescriptionCategoryMap();

    // 1. Exact match
    if (map[clean]) return map[clean];

    // 2. Keyword match
    const words = clean.split(/[\s,.\-_/]+/).filter((w) => w.length >= 3);
    for (const w of words) {
      if (map[w]) return map[w];
    }

    // 3. Substring match
    for (const [key, catId] of Object.entries(map)) {
      if (clean.includes(key) || (key.length >= 4 && key.includes(clean))) {
        return catId;
      }
    }

    return null;
  },
};
