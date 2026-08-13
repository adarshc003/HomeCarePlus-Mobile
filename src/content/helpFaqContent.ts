export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export const HELP_FAQ_CONTENT: Record<'en' | 'ar', FaqEntry[]> = {
  en: [
    {
      id: 'booking',
      question: 'How do I book a service?',
      answer:
        'Choose a service, review the available packages, and tap Book Now to complete your booking in a few steps.',
    },
    {
      id: 'cancel',
      question: 'How can I cancel my booking?',
      answer:
        'Open My Bookings, select the booking, and choose Cancel before a technician has been dispatched.',
    },
    {
      id: 'payments',
      question: 'How do online payments work?',
      answer:
        'We support secure online payments as well as cash on delivery, depending on your location. Your payment is only confirmed once the booking is successfully processed.',
    },
    {
      id: 'updateProfile',
      question: 'How can I update my profile?',
      answer:
        'Go to Profile from the bottom navigation and edit your name, phone number, or other details from there.',
    },
    {
      id: 'technicianDelayed',
      question: 'What should I do if my technician is delayed?',
      answer:
        'You can track your technician’s status from Booking Details. If the delay continues, contact our support team using the details below.',
    },
    {
      id: 'contactSupport',
      question: 'How can I contact customer support?',
      answer:
        'You can reach us by email or phone using the contact details on this page, or use the buttons below to get in touch directly.',
    },
  ],
  ar: [
    {
      id: 'booking',
      question: 'كيف يمكنني حجز خدمة؟',
      answer:
        'اختر خدمة، وراجع الباقات المتاحة، ثم اضغط على "احجز الآن" لإتمام حجزك في خطوات بسيطة.',
    },
    {
      id: 'cancel',
      question: 'كيف يمكنني إلغاء حجزي؟',
      answer:
        'افتح "حجوزاتي"، اختر الحجز، ثم اختر "إلغاء" قبل أن يتم إرسال الفني.',
    },
    {
      id: 'payments',
      question: 'كيف تعمل المدفوعات الإلكترونية؟',
      answer:
        'ندعم الدفع الإلكتروني الآمن بالإضافة إلى الدفع عند الاستلام، حسب موقعك. يتم تأكيد الدفع فقط بعد معالجة الحجز بنجاح.',
    },
    {
      id: 'updateProfile',
      question: 'كيف يمكنني تحديث ملفي الشخصي؟',
      answer:
        'انتقل إلى "الملف الشخصي" من شريط التنقل السفلي وقم بتعديل اسمك أو رقم هاتفك أو بياناتك الأخرى من هناك.',
    },
    {
      id: 'technicianDelayed',
      question: 'ماذا أفعل إذا تأخر الفني؟',
      answer:
        'يمكنك متابعة حالة الفني من تفاصيل الحجز. إذا استمر التأخير، تواصل مع فريق الدعم باستخدام البيانات أدناه.',
    },
    {
      id: 'contactSupport',
      question: 'كيف يمكنني التواصل مع خدمة العملاء؟',
      answer:
        'يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف باستخدام بيانات التواصل في هذه الصفحة، أو استخدام الأزرار أدناه للتواصل المباشر.',
    },
  ],
};
