import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { QuestionCard } from './components/QuestionCard';
import { EligibilityResult } from './components/EligibilityResult';
import { DocumentAssistant } from './components/DocumentAssistant';
import { PortalGuide } from './components/PortalGuide';
import { HumanHelpModal } from './components/HumanHelpModal';
import { BottomControls } from './components/BottomControls';
import { DemoTour } from './components/DemoTour';
import { SCHEMES } from './data/schemes';
import { Scheme, Language, ScreenState, SchemeQuestionOption, DocumentItem, PortalStep } from './types';
import { speechService } from './services/speechService';
import { geminiService } from './services/geminiService';

export const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<Language>('te');
  const [screenState, setScreenState] = useState<ScreenState>('HOME');
  const [selectedScheme, setSelectedScheme] = useState<Scheme>(SCHEMES[0]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  // Audio & Speech States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Accessibility States
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [isSlowVoice, setIsSlowVoice] = useState<boolean>(true);
  const [showHelpline, setShowHelpline] = useState<boolean>(false);

  // Demo Mode State
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);

  // Keep reference of current speakable text for repetition
  const lastSpokenTextRef = useRef<string>('');
  const speechTimeoutRef = useRef<any>(null);

  useEffect(() => {
    speechService.setRate(isSlowVoice ? 0.82 : 0.98);
  }, [isSlowVoice]);

  // Clean timer cleanup
  const clearSpeechTimeout = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };

  // Safe voice speaker helper - guarantees exactly ONE voice plays at a time
  const speakText = (text: string) => {
    clearSpeechTimeout();
    lastSpokenTextRef.current = text;
    speechService.speak(
      text,
      currentLang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Welcome Audio Prompt localized for all 7 languages
  const handleSpeakGreeting = () => {
    clearSpeechTimeout();
    let greeting = 'నమస్కారం అమ్మా! నేను సహాయిని. మీకు ప్రభుత్వం నుంచి ఎలాంటి సహాయం కావాలో మైక్ నొక్కి మాట్లాడండి లేదా కింద ఉన్న బటన్ తాకండి.';
    if (currentLang === 'hi') {
      greeting = 'नमस्ते माता जी! मैं सहाई हूँ। आपको सरकार से क्या सहायता चाहिए, बोलिए या नीचे दिए बटन को छुएं।';
    } else if (currentLang === 'ta') {
      greeting = 'வணக்கம் அம்மா! நான் சஹாயி. உங்களுக்கு என்ன அரசு உதவி வேண்டும் என்று பேசுங்கள் அல்லது பொத்தானை அழுத்தவும்.';
    } else if (currentLang === 'kn') {
      greeting = 'ನಮಸ್ಕಾರ ತಾಯಿ! ನಾನು ಸಹಾಯಿ. ಸರ್ಕಾರದಿಂದ ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು ಎಂಬುದನ್ನು ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್ ಮುಟ್ಟಿ.';
    } else if (currentLang === 'ml') {
      greeting = 'നമസ്കാരം അമ്മേ! ഞാൻ സഹായി. സർക്കാരിൽ നിന്ന് എന്ത് സഹായമാണ് വേണ്ടതെന്ന് മൈക്കിൽ സംസാരിക്കുക അല്ലെങ്കിൽ താഴെയുള്ള ബട്ടൺ അമർത്തുക.';
    } else if (currentLang === 'bn') {
      greeting = 'নমস্কার মা! আমি সাহায়ী। সরকার থেকে আপনার কী সাহায্য দরকার তা মাইকে বলুন অথবা নিচের বোতামে চাপ দিন।';
    } else if (currentLang === 'en') {
      greeting = 'Greetings! I am SahayI. Please speak or tap an option to discover government welfare schemes.';
    }
    speakText(greeting);
  };

  // Category or Scheme selection handler
  const handleSelectCategory = (categoryOrSchemeId: string) => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    setErrorMessage(null);

    // If user tapped "unknown", reassure first in selected language and invite them to pick or speak
    if (categoryOrSchemeId === 'unknown') {
      let reassurance = 'పర్లేదు అమ్మా. నేను మీకు సరిపోయే పథకాన్ని కనుగొంటాను. మీకు వంట గ్యాస్ కావాలా, గర్భిణీ స్త్రీల సహాయం కావాలా, లేక డ్వాక్రా వ్యాపార రుణం కావాలా? కింద ఉన్న బటన్లలో ఒకదాన్ని తాకండి లేదా మాట్లాడండి.';
      if (currentLang === 'hi') {
        reassurance = 'कोई बात नहीं। मैं आपकी उपयुक्त योजना ढूंढूंगी। आपको गैस कनेक्शन चाहिए, गर्भवती महिला सहायता चाहिए, या समूह व्यापार ऋण? नीचे दिए गए विकल्पों में से एक चुनें या बोलें।';
      } else if (currentLang === 'ta') {
        reassurance = 'கவலைப்பட வேண்டாம் அம்மா. உங்களுக்கு எரிவாயு தேவையா, கர்ப்பிணி நிதி உதவி தேவையா, அல்லது தொழில் கடன் தேவையா? கீழே உள்ள ஒரு தேர்வை அழுத்தவும்.';
      } else if (currentLang === 'kn') {
        reassurance = 'ಚಿಂತಿಸಬೇಡಿ ತಾಯಿ. ನಿಮಗೆ ಅಡುಗೆ ಅನಿಲ ಬೇಕೆ, ಗರ್ಭಿಣಿ ಮಹಿಳೆಯರ ನೆರವು ಬೇಕೆ, ಅಥವಾ ವ್ಯಾಪಾರ ಸಾಲ ಬೇಕೆ? ಕೆಳಗಿನ ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಮುಟ್ಟಿ ಅಥವಾ ಮಾತನಾಡಿ.';
      } else if (currentLang === 'ml') {
        reassurance = 'വിഷമിക്കേണ്ട അമ്മേ. നിങ്ങൾക്ക് പാചകവാതകം വേണമോ, ഗർഭിണി സഹായം വേണമോ, അതോ തൊഴിൽ വായ്പ വേണമോ? താഴെയുള്ള ഒന്നിൽ തൊടൂ അല്ലെങ്കിൽ സംസാരിക്കൂ.';
      } else if (currentLang === 'bn') {
        reassurance = 'কোনো চিন্তা করবেন না দিদি। আপনার রান্নার গ্যাস দরকার, গর্ভবতী সহায়তা দরকার, নাকি ব্যবসার ঋণ দরকার? নিচের একটি বোতাম চাপুন বা বলুন।';
      } else if (currentLang === 'en') {
        reassurance = 'No problem at all. Do you need cooking gas, pregnant mother assistance, or a business loan? Please tap an option below or speak.';
      }
      speakText(reassurance);
      return;
    }

    const target = SCHEMES.find((s) => s.id === categoryOrSchemeId || s.category === categoryOrSchemeId);
    if (!target) return;
    
    setSelectedScheme(target);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setScreenState('QUESTIONS');

    if (target.questions.length > 0) {
      const text = target.questions[0].spokenAudioText[currentLang];
      speakText(text);
    }
  };

  // Mic Speech Recognition Handler
  const handleStartListening = () => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    setErrorMessage(null);
    setTranscript('');
    setIsListening(true);

    speechService.startListening(
      currentLang,
      async (spokenText) => {
        setIsListening(false);
        setTranscript(spokenText);

        // Process user speech via Gemini / Semantic Engine
        if (screenState === 'HOME') {
          const aiResult = await geminiService.analyzeUserVoice(spokenText, currentLang);
          if (aiResult.matchedSchemeId && aiResult.matchedSchemeId !== 'unknown') {
            const matched = SCHEMES.find((s) => s.id === aiResult.matchedSchemeId);
            if (matched) {
              setSelectedScheme(matched);
              setCurrentQuestionIndex(0);
              setUserAnswers({});
              setScreenState('QUESTIONS');
              speakText(aiResult.spokenResponse);
            } else {
              speakText(aiResult.spokenResponse);
            }
          } else {
            // General discovery / unknown / question: speak guidance and remain on HOME
            speakText(aiResult.spokenResponse);
          }
        } else if (screenState === 'QUESTIONS') {
          const lower = spokenText.toLowerCase();
          const activeQ = selectedScheme.questions[currentQuestionIndex];
          if (!activeQ) return;

          let chosenOption = activeQ.options[0];
          if (
            lower.includes('లేదు') || lower.includes('no') || lower.includes('नहीं') ||
            lower.includes('இல்லை') || lower.includes('ಇಲ್ಲ') || lower.includes('ഇല്ല') ||
            lower.includes('না') || lower.includes('নেই')
          ) {
            chosenOption = activeQ.options.find((o) => o.value === 'no') || activeQ.options[0];
          } else if (
            lower.includes('అవును') || lower.includes('yes') || lower.includes('हाँ') ||
            lower.includes('ஆம்') || lower.includes('ಹೌದು') || lower.includes('ಅതെ') ||
            lower.includes('হ্যাঁ')
          ) {
            chosenOption = activeQ.options.find((o) => o.value === 'yes') || activeQ.options[0];
          }

          handleSelectOption(chosenOption);
        }
      },
      (err) => {
        setIsListening(false);
        setErrorMessage(err);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleStopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  // Manual query submission / Voice Test Simulation
  const handleManualSubmit = async (query: string) => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    setTranscript(query);
    const aiResult = await geminiService.analyzeUserVoice(query, currentLang);
    if (aiResult.matchedSchemeId && aiResult.matchedSchemeId !== 'unknown') {
      const matched = SCHEMES.find((s) => s.id === aiResult.matchedSchemeId);
      if (matched) {
        setSelectedScheme(matched);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setScreenState('QUESTIONS');
        speakText(aiResult.spokenResponse);
      } else {
        speakText(aiResult.spokenResponse);
      }
    } else {
      // General discovery / unknown / question: stay on HOME and speak guidance
      speakText(aiResult.spokenResponse);
    }
  };

  // Question Answer Selection
  const handleSelectOption = (option: SchemeQuestionOption) => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    const currentQ = selectedScheme.questions[currentQuestionIndex];
    const newAnswers = { ...userAnswers, [currentQ.id]: option.value };
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < selectedScheme.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = selectedScheme.questions[nextIndex];
      const audioText = nextQ.spokenAudioText[currentLang];
      speakText(audioText);
    } else {
      setScreenState('ELIGIBILITY_RESULT');
      let conclusionAudio = '';
      if (selectedScheme.id === 'pm-ujjwala') {
        const ujjwalaMap: Record<Language, string> = {
          te: 'చాలా సంతోషం అమ్మా! మీరు ఇచ్చిన వివరాల ప్రకారం ప్రధాన మంత్రి ఉజ్జ్వల 2.0 పథకానికి మీరు అర్హత ఉండే అవకాశం ఉంది. మీకు ఉచిత గ్యాస్ కనెక్షన్, స్టవ్ మరియు రాయితీ లభిస్తాయి. తుది అర్హతను ప్రభుత్వం నిర్ధారిస్తుంది.',
          hi: 'बधाई हो! आपकी जानकारी के अनुसार आप प्रधानमंत्री उज्ज्वला 2.0 योजना के लिए पात्र हो सकती हैं। मुफ्त गैस कनेक्शन, चूल्हा और सब्सिडी मिलेगी। अंतिम पात्रता सरकार द्वारा निर्धारित की जाएगी।',
          ta: 'வாழ்த்துகள் அம்மா! உங்கள் தகவல்படி நீங்கள் உஜ்வாலா 2.0 திட்டத்திற்கு தகுதி பெற வாய்ப்புள்ளது. இலவச எரிவாயு இணைப்பு மற்றும் அடுப்பு கிடைக்கும். இறுதி தகுதியை அரசு தீர்மானிக்கும்.',
          kn: 'ಅಭಿನಂದನೆಗಳು ತಾಯಿ! ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ ನೀವು ಉಜ್ವಲಾ 2.0 ಯೋಜನೆಗೆ ಅರ್ಹರಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಉಚಿತ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ ಮತ್ತು ಒಲೆ ದೊರೆಯುತ್ತದೆ. ಅಂತಿಮ ಅರ್ಹತೆಯನ್ನು ಸರ್ಕಾರ ನಿರ್ಧರಿಸುತ್ತದೆ.',
          ml: 'അഭിനന്ദനങ്ങൾ! നിങ്ങളുടെ വിവരങ്ങൾ പ്രകാരം ഉജ്ജ്വല 2.0 പദ്ധതിക്ക് അർഹതയുണ്ടാകാൻ സാധ്യതയുണ്ട്. സൗജന്യ കണക്ഷനും അടുപ്പും ലഭിക്കും. അന്തിമ അർഹത സർക്കാർ നിർണ്ണയിക്കും.',
          bn: 'অভিনন্দন! আপনার দেওয়া তথ্যের ভিত্তিতে আপনি উজ্জ্বলা ২.০ প্রকল্পের জন্য যোগ্য হতে পারেন। বিনামূল্যে গ্যাস সংযোগ ও চুলা পাবেন। চূড়ান্ত যোগ্যতা সরকার নির্ধারণ করবে।',
          en: 'Congratulations! Based on your details, you are likely eligible for Pradhan Mantri Ujjwala 2.0. You can receive a deposit-free gas connection, stove, and refill subsidy. Final eligibility is approved by the Government.'
        };
        conclusionAudio = ujjwalaMap[currentLang] || ujjwalaMap.te;
      } else if (selectedScheme.id === 'pmmvy') {
        const pmmvyMap: Record<Language, string> = {
          te: 'చాలా సంతోషం అమ్మా! మీరు ఇచ్చిన వివరాల ప్రకారం ప్రధాన మంత్రి మాతృ వందన యోజన పథకానికి మీరు అర్హత ఉండే అవకాశం ఉంది. గర్భిణీ మరియు బాలింత మహిళలకు రూ. 5,000 నుండి రూ. 6,000 వరకు నేరుగా బ్యాంక్ ఖాతాలో జమ అవుతాయి. తుది అర్హతను ప్రభుత్వం నిర్ధారిస్తుంది.',
          hi: 'बधाई हो! आपकी जानकारी के अनुसार आप प्रधानमंत्री मातृ वंदना योजना (PMMVY) के लिए पात्र हो सकती हैं। गर्भवती एवं धात्री माताओं को ₹5,000 से ₹6,000 सीधे बैंक खाते में मिलेंगे। अंतिम पात्रता सरकार द्वारा निर्धारित की जाएगी।',
          ta: 'வாழ்த்துகள் அம்மா! உங்கள் தகவல்படி நீங்கள் பிரதான் மந்திரி மாத்ரு வந்தனா யோஜனா திட்டத்திற்கு தகுதி பெற வாய்ப்புள்ளது. கர்ப்பிணி தாய்மார்களுக்கு ₹5,000 முதல் ₹6,000 வரை வங்கி கணக்கில் செலுத்தப்படும். இறுதி தகுதியை அரசு தீர்மானிக்கும்.',
          kn: 'ಅಭಿನಂದನೆಗಳು ತಾಯಿ! ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ ನೀವು ಪ್ರಧಾನ ಮಂತ್ರಿ ಮಾತೃ ವಂದನಾ ಯೋಜನೆಗೆ ಅರ್ಹರಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಗರ್ಭಿಣಿ ಮತ್ತು ಬಾಣಂತಿ ತಾಯಂದಿರಿಗೆ ₹5,000 ದಿಂದ ₹6,000 ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗುತ್ತದೆ. ಅಂತಿಮ ಅರ್ಹತೆಯನ್ನು ಸರ್ಕಾರ ನಿರ್ಧರಿಸುತ್ತದೆ.',
          ml: 'അഭിനന്ദനങ്ങൾ! നിങ്ങളുടെ വിവരങ്ങൾ പ്രകാരം പ്രധാനമന്ത്രി മാതൃ വന്ദന യോജനയ്ക്ക് അർഹതയുണ്ടാകാൻ സാധ്യതയുണ്ട്. ഗർഭിണികൾക്കും മുലയൂട്ടുന്ന അമ്മമാർക്കും ₹5,000 മുതൽ ₹6,000 വരെ ബാങ്ക് അക്കൗണ്ടിൽ നേരിട്ട് ലഭിക്കും. അന്തിമ അർഹത സർക്കാർ നിർണ്ണയിക്കും.',
          bn: 'অভিনন্দন! আপনার দেওয়া তথ্যের ভিত্তিতে আপনি প্রধানমন্ত্রী মাতৃ বন্দনা যোজনার জন্য যোগ্য হতে পারেন। গর্ভবতী ও মায়েদের সরাসরি ব্যাংক অ্যাকাউন্টে ₹৫,০০০ থেকে ₹৬,০০০ টাকা দেওয়া হয়। চূড়ান্ত যোগ্যতা সরকার নির্ধারণ করবে।',
          en: 'Congratulations! Based on your details, you are likely eligible for Pradhan Mantri Matru Vandana Yojana (PMMVY). Direct financial benefit of ₹5,000 to ₹6,000 will be credited directly to your bank account. Final eligibility is approved by the Government.'
        };
        conclusionAudio = pmmvyMap[currentLang] || pmmvyMap.te;
      } else if (selectedScheme.id === 'lakhpati-didi') {
        const didiMap: Record<Language, string> = {
          te: 'చాలా సంతోషం అమ్మా! మీరు ఇచ్చిన వివరాల ప్రకారం లఖ్‌పతి దీదీ స్వయం సహాయక సంఘాల పథకానికి మీరు అర్హత ఉండే అవకాశం ఉంది. మహిళలు నెలకు ₹10,000 పైగా సంపాదించేలా ఉచిత శిక్షణ మరియు పూచీకత్తు లేని బ్యాంకు రుణాలు లభిస్తాయి. తుది అర్హతను ప్రభుత్వం నిర్ధారిస్తుంది.',
          hi: 'बधाई हो! आपकी जानकारी के अनुसार आप लखपति दीदी योजना के लिए पात्र हो सकती हैं। स्वयं सहायता समूह की महिलाओं को मुफ्त कौशल प्रशिक्षण और बिना गारंटी बैंक ऋण मिलता है। अंतिम पात्रता सरकार द्वारा निर्धारित की जाएगी।',
          ta: 'வாழ்த்துகள் அம்மா! உங்கள் தகவல்படி நீங்கள் லக்பதி தீதி திட்டத்திற்கு தகுதி பெற வாய்ப்புள்ளது. சுயஉதவி குழு பெண்களுக்கு திறன் பயிற்சி மற்றும் பிணையில்லா வங்கி கடன் கிடைக்கும். இறுதி தகுதியை அரசு தீர்மானிக்கும்.',
          kn: 'ಅಭಿನಂದನೆಗಳು ತಾಯಿ! ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ ನೀವು ಲಖ್‌ಪತಿ ದೀದಿ ಯೋಜನೆಗೆ ಅರ್ಹರಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಸ್ವಸಹಾಯ ಸಂಘದ ಮಹಿಳೆಯರಿಗೆ ಉಚಿತ ತರಬೇತಿ ಮತ್ತು ಜಾಮೀನು ರಹಿತ ಸುಲಭ ಬ್ಯಾಂಕ್ ಸಾಲ ದೊರೆಯುತ್ತದೆ. ಅಂತಿಮ ಅರ್ಹತೆಯನ್ನು ಸರ್ಕಾರ ನಿರ್ಧರಿಸುತ್ತದೆ.',
          ml: 'അഭിനന്ദനങ്ങൾ! നിങ്ങളുടെ വിവരങ്ങൾ പ്രകാരം ലഖ്പതി ദീദി പദ്ധതിക്ക് അർഹതയുണ്ടാകാൻ സാധ്യതയുണ്ട്. വനിതകൾക്ക് സൗജന്യ നൈപുണ്യ പരിശീലനവും ഈടില്ലാത്ത ബാങ്ക് വായ്പയും ലഭിക്കും. അന്തിമ അർഹത സർക്കാർ നിർണ്ണയിക്കും.',
          bn: 'অভিনন্দন! আপনার দেওয়া তথ্যের ভিত্তিতে আপনি লাখপতি দিদি প্রকল্পের জন্য যোগ্য হতে পারেন। স্বনির্ভর দলের মহিলাদের বিনামূল্যে দক্ষতা প্রশিক্ষণ ও জামানতবিহীন সহজ ব্যাঙ্ক ঋণ দেওয়া হয়। চূড়ান্ত যোগ্যতা সরকার নির্ধারণ করবে।',
          en: 'Congratulations! Based on your details, you are likely eligible for the Lakhpati Didi Initiative. SHG women receive skill training and collateral-free enterprise credit. Final eligibility is approved by the Government.'
        };
        conclusionAudio = didiMap[currentLang] || didiMap.te;
      } else {
        conclusionAudio = `${selectedScheme.name[currentLang]}. ${selectedScheme.benefits[currentLang].join('. ')}.`;
      }
      speakText(conclusionAudio);
    }
  };

  // Eligibility summary audio
  const handleSpeakEligibilitySummary = () => {
    clearSpeechTimeout();
    const schemeName = selectedScheme.name[currentLang];
    const benefits = selectedScheme.benefits[currentLang];
    let summary = `${schemeName}. ప్రభుత్వం అందించే ప్రయోజనాలు: ${benefits.join('. ')}. మీరు ఇచ్చిన వివరాల ప్రకారం మీకు అర్హత ఉండే అవకాశం ఉంది. తుది నిర్ణయం ప్రభుత్వం తీసుకుంటుంది.`;
    if (currentLang === 'hi') {
      summary = `${schemeName}। सरकारी लाभ: ${benefits.join('. ')}। आपकी जानकारी के अनुसार आप पात्र हो सकती हैं।`;
    } else if (currentLang === 'ta') {
      summary = `${schemeName}। அரசு பலன்கள்: ${benefits.join('. ')}। நீங்கள் தகுதி பெற வாய்ப்புள்ளது.`;
    } else if (currentLang === 'kn') {
      summary = `${schemeName}. ಸರ್ಕಾರದ ಪ್ರಯೋಜನಗಳು: ${benefits.join('. ')}. ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ ನೀವು ಅರ್ಹರಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಅಂತಿಮ ನಿರ್ಧಾರ ಸರ್ಕಾರ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.`;
    } else if (currentLang === 'ml') {
      summary = `${schemeName}. സർക്കാർ ആനുകൂಲ್ಯങ്ങൾ: ${benefits.join('. ')}. നൽകിയ വിവരങ്ങൾ പ്രകാരം അർಹതയുണ്ടാകാം. അന്തിമ തീരുമാനം സർക്കാരിന്റೇതാണ്.`;
    } else if (currentLang === 'bn') {
      summary = `${schemeName}। সরকারি সুযোগ-সুবিধা: ${benefits.join('. ')}। আপনার তথ্যের ভিত্তিতে আপনি যোগ্য হতে পারেন। চূড়ান্ত সিদ্ধান্ত সরকার নেবে।`;
    } else if (currentLang === 'en') {
      summary = `${schemeName}. Government benefits: ${benefits.join('. ')}. Based on your responses, you are likely eligible. Final approval rests with the Government.`;
    }
    speakText(summary);
  };

  // Document explanation audio
  const handleSpeakDocExplanation = (doc: DocumentItem) => {
    clearSpeechTimeout();
    const docName = doc.name[currentLang];
    const why = doc.whyNeeded[currentLang];
    const text = `${docName}. ${why}`;
    speakText(text);
  };

  // Step instruction audio
  const handleSpeakStep = (step: PortalStep) => {
    clearSpeechTimeout();
    const text = step.voiceInstruction[currentLang];
    speakText(text);
  };

  // Repeat current audio instruction
  const handleRepeatAudio = () => {
    clearSpeechTimeout();
    if (lastSpokenTextRef.current) {
      speakText(lastSpokenTextRef.current);
    } else {
      handleSpeakGreeting();
    }
  };

  // Navigation: Go Back
  const handleGoBack = () => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    if (screenState === 'QUESTIONS') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
        setScreenState('HOME');
      }
    } else if (screenState === 'ELIGIBILITY_RESULT') {
      setScreenState('QUESTIONS');
    } else if (screenState === 'DOCUMENTS') {
      setScreenState('ELIGIBILITY_RESULT');
    } else if (screenState === 'PORTAL_GUIDE') {
      setScreenState('DOCUMENTS');
    }
  };

  // Navigation: Go Home
  const handleGoHome = () => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    setScreenState('HOME');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTranscript('');
    setErrorMessage(null);
  };

  // Toggle Text Size
  const handleToggleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('huge');
    else setTextSize('normal');
  };

  // Toggle Voice Speed
  const handleToggleVoiceSpeed = () => {
    setIsSlowVoice(!isSlowVoice);
  };

  // Demo Mode Controller with localized voice generation for EVERY language!
  const handleStartDemo = () => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    setIsDemoActive(true);
    setDemoStepIndex(0);
    setScreenState('HOME');
    setSelectedScheme(SCHEMES[0]);
    handleSpeakGreeting();
  };

  const handleNextDemoStep = () => {
    clearSpeechTimeout();
    speechService.stopSpeaking();
    const nextStep = demoStepIndex + 1;
    setDemoStepIndex(nextStep);

    if (nextStep === 1) {
      setScreenState('QUESTIONS');
      setCurrentQuestionIndex(0);
      const activeQ = SCHEMES[0].questions[0];
      const audioPrompt = activeQ.spokenAudioText[currentLang];
      speakText(audioPrompt);
    } else if (nextStep === 2) {
      setScreenState('ELIGIBILITY_RESULT');
      let resultAudio = 'మీరు ఇచ్చిన వివరాల ప్రకారం ఉజ్జ్వల 2.0 పథకానికి మీరు అర్హత ఉండే అవకాశం ఉంది. తుది అర్హతను ప్రభుత్వం నిర్ధారిస్తుంది.';
      if (currentLang === 'hi') {
        resultAudio = 'आपकी जानकारी के अनुसार आप उज्ज्वला 2.0 योजना के लिए पात्र हो सकती हैं। अंतिम पात्रता सरकार द्वारा निर्धारित की जाएगी।';
      } else if (currentLang === 'ta') {
        resultAudio = 'உங்கள் பதில்களின்படி நீங்கள் உஜ்வாலா 2.0 திட்டத்திற்கு தகுதி பெற வாய்ப்புள்ளது.';
      } else if (currentLang === 'kn') {
        resultAudio = 'ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ ಉಜ್ವಲಾ 2.0 ಯೋಜನೆಗೆ ನೀವು ಅರ್ಹರಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಅಂತಿಮ ಅರ್ಹತೆಯನ್ನು ಸರ್ಕಾರ ನಿರ್ಧರಿಸುತ್ತದೆ.';
      } else if (currentLang === 'ml') {
        resultAudio = 'നൽകിയ വിവരങ്ങൾ അനുസരിച്ച് ഉജ്ജ്വല 2.0 പദ്ധതിക്ക് അർഹതയുണ്ടാകാം. അന്തിമ തീരുമാനം സർക്കാരിന്റേതാണ്.';
      } else if (currentLang === 'bn') {
        resultAudio = 'আপনার দেওয়া তথ্যের ভিত্তিতে আপনি উজ্জ্বলা ২.০ প্রকল্পের জন্য যোগ্য হতে পারেন। চূড়ান্ত যোগ্যতা সরকার নির্ধারণ করবে।';
      } else if (currentLang === 'en') {
        resultAudio = 'Based on the details provided, you are likely eligible for Ujjwala 2.0. Final eligibility is determined by the Government.';
      }
      speakText(resultAudio);
    } else if (nextStep === 3) {
      setScreenState('DOCUMENTS');
      let docAudio = 'దరఖాస్తుకు ముందు ఆధార్ కార్డు, రేషన్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్ సిద్ధంగా పెట్టుకోండి.';
      if (currentLang === 'hi') {
        docAudio = 'आवेदन से पहले आधार कार्ड, राशन कार्ड और बैंक पासबुक अपने पास तैयार रखें।';
      } else if (currentLang === 'ta') {
        docAudio = 'விண்ணப்பிக்கும் முன் ஆதார் அட்டை, ரேஷன் அட்டை மற்றும் வங்கி பாஸ்புக் தயார் செய்து கொள்ளவும்.';
      } else if (currentLang === 'kn') {
        docAudio = 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮುನ್ನ ಆಧಾರ್ ಕಾರ್ಡ್, ಪಡಿತರ ಚೀಟಿ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಸಿದ್ಧವಾಗಿಟ್ಟುಕೊಳ್ಳಿ.';
      } else if (currentLang === 'ml') {
        docAudio = 'അപേക്ഷിക്കുന്നതിന് മുൻപായി ആധാർ കാർഡ്, റേഷൻ കാർഡ്, ബാങ്ക് പാസ്ബുക്ക് എന്നിവ തയ്യാറാക്കുക.';
      } else if (currentLang === 'bn') {
        docAudio = 'আবেদনের আগে আধার কার্ড, রেশন কার্ড এবং ব্যাংক পাসবুক প্রস্তুত রাখুন।';
      } else if (currentLang === 'en') {
        docAudio = 'Keep your Aadhaar card, Ration card, and Bank passbook ready before applying.';
      }
      speakText(docAudio);
    } else if (nextStep === 4) {
      setScreenState('PORTAL_GUIDE');
      let portalAudio = 'అధికారిక వెబ్‌సైట్ తెరవండి. అక్కడ Apply for New Ujjwala 2.0 Connection బటన్ నొక్కండి.';
      if (currentLang === 'hi') {
        portalAudio = 'आधिकारिक पोर्टल खोलें। वहां Apply for New Ujjwala 2.0 Connection बटन दबाएं।';
      } else if (currentLang === 'ta') {
        portalAudio = 'அரசு தளத்தை திறந்து, Apply for New Ujjwala 2.0 Connection என்பதை அழுத்தவும்.';
      } else if (currentLang === 'kn') {
        portalAudio = 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ. ಅಲ್ಲಿ Apply for New Ujjwala 2.0 Connection ಬಟನ್ ಒತ್ತಿರಿ.';
      } else if (currentLang === 'ml') {
        portalAudio = 'ഔദ്യോഗിക പോർട്ടൽ തുറന്ന് Apply for New Ujjwala 2.0 Connection എന്ന ബട്ടൺ അമർത്തുക.';
      } else if (currentLang === 'bn') {
        portalAudio = 'সরকারি পোর্টাল খুলুন। সেখানে Apply for New Ujjwala 2.0 Connection বোতামটি চাপুন।';
      } else if (currentLang === 'en') {
        portalAudio = 'Open the official website and tap the Apply for New Ujjwala 2.0 Connection button.';
      }
      speakText(portalAudio);
    } else {
      setIsDemoActive(false);
      setDemoStepIndex(0);
    }
  };

  // Dynamic Root Font Size class
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'huge': return 'text-lg';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-amber-100/50 pb-28 ${getTextSizeClass()}`}>
      
      {/* Top Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={(newLang) => {
          clearSpeechTimeout();
          speechService.stopSpeaking();
          setCurrentLang(newLang);
        }}
        onStartDemo={handleStartDemo}
        onOpenHelpline={() => setShowHelpline(true)}
        textSize={textSize}
        onToggleTextSize={handleToggleTextSize}
        isSlowVoice={isSlowVoice}
        onToggleVoiceSpeed={handleToggleVoiceSpeed}
      />

      {/* Demo Tour Overlay Banner */}
      <DemoTour
        isActive={isDemoActive}
        currentStepIndex={demoStepIndex}
        onNextDemoStep={handleNextDemoStep}
        onExitDemo={() => {
          clearSpeechTimeout();
          speechService.stopSpeaking();
          setIsDemoActive(false);
        }}
        currentLang={currentLang}
      />

      {/* Main Content View Container */}
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        
        {screenState === 'HOME' && (
          <HomeScreen
            currentLang={currentLang}
            isListening={isListening}
            isSpeaking={isSpeaking}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            onSelectCategory={handleSelectCategory}
            onSpeakGreeting={handleSpeakGreeting}
            onManualSubmit={handleManualSubmit}
            transcript={transcript}
            errorMessage={errorMessage}
          />
        )}

        {screenState === 'QUESTIONS' && (
          <QuestionCard
            currentLang={currentLang}
            scheme={selectedScheme}
            question={selectedScheme.questions[currentQuestionIndex] || selectedScheme.questions[0]}
            currentIndex={currentQuestionIndex}
            totalQuestions={selectedScheme.questions.length}
            onSelectOption={handleSelectOption}
            onSpeakQuestion={() => {
              const q = selectedScheme.questions[currentQuestionIndex];
              if (q) {
                const text = q.spokenAudioText[currentLang];
                speakText(text);
              }
            }}
            isListening={isListening}
            isSpeaking={isSpeaking}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            onGoBack={handleGoBack}
            transcript={transcript}
          />
        )}

        {screenState === 'ELIGIBILITY_RESULT' && (
          <EligibilityResult
            currentLang={currentLang}
            scheme={selectedScheme}
            onProceedToDocuments={() => {
              setScreenState('DOCUMENTS');
              let docHeading = 'దరఖాస్తు చేసుకోవడానికి కావాల్సిన పత్రాల వివరాలు చూడండి.';
              if (currentLang === 'hi') docHeading = 'आवेदन करने के लिए आवश्यक दस्तावेजों की सूची देखें।';
              else if (currentLang === 'ta') docHeading = 'தேவையான ஆவணங்களை சரிபார்க்கவும்.';
              else if (currentLang === 'kn') docHeading = 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳ ಪಟ್ಟಿಯನ್ನು ನೋಡಿ.';
              else if (currentLang === 'ml') docHeading = 'അപേക്ഷിക്കാൻ ആവശ്യമായ രേഖകളുടെ പട്ടിക പരിശോധിക്കുക.';
              else if (currentLang === 'bn') docHeading = 'আবেদন করার জন্য প্রয়োজনীয় নথিপত্রের তালিকা দেখুন।';
              else if (currentLang === 'en') docHeading = 'Review the verified required documents before applying.';
              speakText(docHeading);
            }}
            onSpeakSummary={handleSpeakEligibilitySummary}
            isSpeaking={isSpeaking}
          />
        )}

        {screenState === 'DOCUMENTS' && (
          <DocumentAssistant
            currentLang={currentLang}
            scheme={selectedScheme}
            onProceedToPortalGuide={() => {
              setScreenState('PORTAL_GUIDE');
              if (selectedScheme.steps.length > 0) {
                const text = selectedScheme.steps[0].voiceInstruction[currentLang];
                speakText(text);
              }
            }}
            onSpeakDocExplanation={handleSpeakDocExplanation}
            onGoBack={handleGoBack}
            isSpeaking={isSpeaking}
          />
        )}

        {screenState === 'PORTAL_GUIDE' && (
          <PortalGuide
            currentLang={currentLang}
            scheme={selectedScheme}
            onGoBack={handleGoBack}
            onOpenHelpline={() => setShowHelpline(true)}
            onSpeakStep={handleSpeakStep}
            isSpeaking={isSpeaking}
          />
        )}

      </main>

      {/* Human Helpline Dialog */}
      {showHelpline && (
        <HumanHelpModal
          currentLang={currentLang}
          scheme={selectedScheme}
          onClose={() => setShowHelpline(false)}
        />
      )}

      {/* Fixed Zero-Knowledge Bottom Control Dock */}
      <BottomControls
        currentLang={currentLang}
        onRepeatAudio={handleRepeatAudio}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
        onOpenHelpline={() => setShowHelpline(true)}
        canGoBack={screenState !== 'HOME'}
      />

    </div>
  );
};

export default App;
