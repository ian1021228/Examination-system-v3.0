# PET 英文週考命題專用 AI Skill 指南 (Cambridge L4-PET Exam Generation Skill)

> **說明**：此 Skill 專門為「劍橋 L4-PET 英文週考測驗系統」設計。你可以直接將本文檔內容複製並貼給任何 AI（ChatGPT、Claude、Gemini），請它依據指定考期自動產出格式 100% 吻合、可以直接匯入本系統題庫的完整考卷 JSON。

---

## 1. 考試範圍來源與出題依據 (Exam Scope Sources)

依據本系統官方標準教學進度表《週考範圍.pdf》與《OD單字表 L4 (含動詞表)》，各部分之出題範圍具有嚴格規定：

1. **第一部分 (Part I – Vocabulary，共 50 分)**：
   - **考試範圍來源**：嚴格依循《週考範圍.pdf》表格中的**「右邊數來第二直排」（即【單字考試進度】）**。
   - **出題規則**：從該週指定單字範圍（例如 W2 為 `a.an - actually`，W3 為 `ad - animal`）中挑選出 30 個符合 CEFR B1 / PET 難度的英文單字進行命題。
   - **核心規範：絕不可提供 Section A 單字候選庫 (No Word Bank)**：
     - 在考題與作答介面中，**嚴禁提供 Section A 單字候選字庫**（不提供可點選之備選詞彙框），讓學生必須從語境中主動回想並拼出正確單字。
   - **結構**：
     - **Section A**：30 題單字中翻英（1 題 1 分，共 30 分）。
     - **Section B**：20 題語境填空（1 題 1 分，共 20 分），填入之單字**必須 100% 取自 Section A 的 30 個單字**。

2. **第二部分 (Part II – Verbs，共 20 分)**：
   - **考試範圍來源**：嚴格依循《週考範圍.pdf》表格中的**「最右邊直排」（即【動詞考試進度】）**。
   - **動詞表依據**：動詞全部收錄於《OD單字表 L4 (含動詞表)》最後一頁（第 16 頁）之《100 MOST COMMON ESL IRREGULAR VERBS LIST》（100 個常用不規則動詞表）。
   - **題型必備要求**：**第二部分務必要考「時態填空」和「動詞時態獨立單句填空（無短文、無括號提示）」**！
   - **結構**：
     - **Section A – 時態填空 (Verb Tense Conjugation Table，共 15 分)**：
       - 從當週進度範圍挑選 5 組動詞。
       - 指定主詞代名詞（如 He, She, They, We, I），考三態時態變化：Present Simple (現在式)、Past Simple (過去式)、Participle (完成式/過去分詞)，共 5 組 x 3 態 = 15 格（每格 1 分，共 15 分）。
     - **Section B – 時態獨立單句填空 (Verb Tense Sentence Completion，共 5 分)**：
       - **完全無短文篇章**：沒有任何 `clozePassage`，不考整篇閱讀克漏字。
       - **5 題完全獨立的語境單句**：每回僅有 5 道互相獨立的日常生活造句（1~5 題，每題 1 分，共 5 分）。
       - **無動詞原形提示**：句末不附括號提示（如無 `(blow)`、`(awake)` 等），要求學生自主從 Part II Sec A 的 5 個動詞中選詞，並依句型與時間副詞變換為正確時態。
       - 核心考點為動詞語境選擇與時態判斷變化（現在式、過去式、現在完成式等）。共 5 題（每題 1 分，共 5 分）。

3. **系統自動歸類核心規範：每一題必須明確標註所屬日期 (`examDate`)**：
   - 本測驗系統支援「**匯入指定考期之 PET 專用考卷 JSON 後，自動將每道題目精準歸類為正確的日期**」。
   - 因此，產出的 JSON 中**每一道考題物件內，都必須明確帶有 `"examDate": "MMDD"`（如 `"examDate": "0916"`）**！
   - 涵蓋範圍：Part I Section A 30 題、Part I Section B 20 題、Part II Section A 5 組動詞、Part II Section B 5 題獨立動詞時態單句填空。

---

## 2. 17 個週考考期範圍總對照表 (Weekly Scope Schedule)

下表為各週考期與對應之「單字考試進度（右邊數來第二直排）」與「動詞考試進度（最右邊直排）」：

| 週次 | 考期代碼 (`examDate`) | 考試日期 (`dateLabel`) | 單字考試進度範圍 (右邊數來第二直排) | 動詞考試進度範圍 (最右邊直排) | 涵蓋不規則動詞 (動詞表最後一頁) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **W2** | `0909` | 9月9日 | `a.an - actually` | `awake - blow` | awake, be, beat, begin, bite, blow (編號 1~6) |
| **W3** | `0916` | 9月16日 | `ad - animal` | `break - choose` | break, bring, build, buy, catch, choose (編號 7~12) |
| **W4** | `0923` | 9月23日 | `ankle - at once` | `come - dig` | come, cost, cut, do, deal, dig (編號 13~18) |
| **W5** | `0930` | 9月30日 | `at present - be` | `dream - fall` | dream, draw, drink, drive, eat, fall (編號 19~24) |
| **W6** | `1007` | 10月7日 | `beach - board game` | `feed - forget` | feed, feel, fight, find, fly, forget (編號 25~30) |
| **W7** | `1014` | 10月14日 | `boarding pass - bus` | `forgive - grow` | forgive, freeze, get, give, go, grow (編號 31~36) |
| **W8** | `1021` | 10月21日 | `business - cat` | `hang - hold` | hang, have, hear, hide, hit, hold (編號 37~42) |
| **W9** | `1028` | 10月28日 | `catch - chin` | `hurt - leave` | hurt, keep, know, lay, lead, leave (編號 43~48) |
| **W10** | — | 11月4日 | *(期中評量週 暫停一次)* | *(期中評量週 暫停一次)* | — |
| **W11** | `1111` | 11月11日 | `chip - complain` | `lend - mean` | lend, let, lie, lose, make, mean (編號 49~54) |
| **W12** | `1118` | 11月18日 | `complaint - creature` | `meet - ride` | meet, pay, put, quit, read, ride (編號 55~60) |
| **W13** | `1125` | 11月25日 | `credit - decorate` | `ring - seek` | ring, rise, run, say, see, seek (編號 61~66) |
| **W14** | `1202` | 12月2日 | `decrease - disappointing` | `sell - shine` | sell, send, set, sew, shake, shine (編號 67~72) |
| **W15** | `1209` | 12月9日 | `disappointment - dvd player` | `shoot - sleep` | shoot, show, sing, sink, sit, sleep (編號 73~78) |
| **W16** | `1216` | 12月16日 | `each - environment` | `slide - steal` | slide, speak, spend, spread, stand, steal (編號 79~84) |
| **W17** | `1223` | 12月23日 | `environmental - false` | `stick - swim` | stick, strike, swear, sweep, swell, swim (編號 85~90) |
| **W18** | `1230` | 12月30日 | `familiar - flood` | `swing - think` | swing, take, teach, tear, tell, think (編號 91~96) |
| **W19** | `0106` | 1月6日 | `floor - further` | `wear - write` | wear, weep, win, write (編號 97~100) |
| **W20** | — | 1月13日 | *(期末評量週 暫停一次)* | *(期末評量週 暫停一次)* | — |

---

## 3. 100 個常用不規則動詞三態權威總表 (動詞表最後一頁)

所有 Part II 的動詞三態變化，必須 100% 依循下表之規範形式（Base Form / Past Simple / Participle）：

| 編號 | Base Form (原形) | Past Simple (過去式) | Participle (過去分詞) | 編號 | Base Form (原形) | Past Simple (過去式) | Participle (過去分詞) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | awake | awoke | awaken | 51 | lie | lay | lain |
| 2 | be | was / were | been | 52 | lose | lost | lost |
| 3 | beat | beat | beaten | 53 | make | made | made |
| 4 | begin | began | begun | 54 | mean | meant | meant |
| 5 | bite | bit | bitten | 55 | meet | met | met |
| 6 | blow | blew | blown | 56 | pay | paid | paid |
| 7 | break | broke | broken | 57 | put | put | put |
| 8 | bring | brought | brought | 58 | quit | quit | quit |
| 9 | build | built | built | 59 | read | read | read |
| 10 | buy | bought | bought | 60 | ride | rode | ridden |
| 11 | catch | caught | caught | 61 | ring | rang | rung |
| 12 | choose | chose | chosen | 62 | rise | rose | risen |
| 13 | come | came | come | 63 | run | ran | run |
| 14 | cost | cost | cost | 64 | say | said | said |
| 15 | cut | cut | cut | 65 | see | saw | seen |
| 16 | do | did | done | 66 | seek | sought | sought |
| 17 | deal | dealt | dealt | 67 | sell | sold | sold |
| 18 | dig | dug | dug | 68 | send | sent | sent |
| 19 | dream | dreamt | dreamt | 69 | set | set | set |
| 20 | draw | drew | drawn | 70 | sew | sewed | sewn |
| 21 | drink | drank | drunk | 71 | shake | shook | shaken |
| 22 | drive | drove | driven | 72 | shine | shone | shone |
| 23 | eat | ate | eaten | 73 | shoot | shot | shot |
| 24 | fall | fell | fallen | 74 | show | showed | shown |
| 25 | feed | fed | fed | 75 | sing | sang | sung |
| 26 | feel | felt | felt | 76 | sink | sank | sunk |
| 27 | fight | fought | fought | 77 | sit | sat | sat |
| 28 | find | found | found | 78 | sleep | slept | slept |
| 29 | fly | flew | flown | 79 | slide | slid | slid |
| 30 | forget | forgot | forgotten | 80 | speak | spoke | spoken |
| 31 | forgive | forgave | forgiven | 81 | spend | spent | spent |
| 32 | freeze | froze | frozen | 82 | spread | spread | spread |
| 33 | get | got | gotten | 83 | stand | stood | stood |
| 34 | give | gave | given | 84 | steal | stole | stolen |
| 35 | go | went | gone | 85 | stick | stuck | stuck |
| 36 | grow | grew | grown | 86 | strike | struck | stricken |
| 37 | hang | hung | hung | 87 | swear | swore | sworn |
| 38 | have | had | had | 88 | sweep | swept | swept |
| 39 | hear | heard | heard | 89 | swell | swelled | swollen |
| 40 | hide | hid | hidden | 90 | swim | swam | swum |
| 41 | hit | hit | hit | 91 | swing | swung | swung |
| 42 | hold | held | held | 92 | take | took | taken |
| 43 | hurt | hurt | hurt | 93 | teach | taught | taught |
| 44 | keep | kept | kept | 94 | tear | tore | torn |
| 45 | know | knew | known | 95 | tell | told | told |
| 46 | lay | laid | laid | 96 | think | thought | thought |
| 47 | lead | led | led | 97 | wear | wore | worn |
| 48 | leave | left | left | 98 | weep | wept | wept |
| 49 | lend | lent | lent | 99 | win | won | won |
| 50 | let | let | let | 100 | write | wrote | written |

---

## 4. 嚴格 JSON 輸出結構與規範 (JSON Schema)

AI 產出之結果必須是純 JSON 物件。**特別注意：每一題物件中都必須包含 `"examDate"` 欄位，以支援系統全自動日期歸類**：

```typescript
interface PetExamPaper {
  examDate: string; // 4位數字字串，如 "0916"
  dateLabel: string; // 如 "9月16日"
  title: string; // 如 "9/16 L4-PET Vocabulary & Verb Quiz"
  totalScore: 70; // 固定 70
  timeLimitMinutes: number; // 預設 45
  
  part1_vocabulary: {
    // 30 題中翻英，單字出自該週「單字考試進度」
    sectionA_translation: Array<{
      id: number; // 1 ~ 30
      examDate: string; // 【必須明確標註所屬考期日期】，如 "0916"
      chinese: string; // 中文提示，如 "能力"、"進入;使用權"
      english: string; // 正確英文單字，如 "Ability"、"Access"
      acceptableAnswers?: string[]; // 允許之同義詞或小寫形
    }>;
    
    // 20 題語境填空，答案必須 100% 取自 Section A 的 30 個單字（禁止提供單字候選庫）
    sectionB_sentences: Array<{
      id: number; // 1 ~ 20
      examDate: string; // 【必須明確標註所屬考期日期】，如 "0916"
      sentence: string; // 題目句子，包含 __________ 空格
      correctAnswer: string; // 正確填入單字
      acceptableAnswers?: string[];
      clue?: string; // 繁體中文語境提示
    }>;
  };
  
  part2_verbs: {
    // 5 組動詞三態時態填空（15 格），動詞出自該週「動詞考試進度」
    sectionA_tenses: Array<{
      id: number; // 1 ~ 5
      examDate: string; // 【必須明確標註所屬考期日期】，如 "0916"
      verbChinese: string; // 中文意思，如 "打；跳動"
      subject: string; // 指定主詞代名詞，如 "He", "They", "We", "I", "She"
      presentSimple: string; // 現在式（依主詞變化，如 "beats" 或 "blow"）
      pastSimple: string; // 過去式，如 "beat" 或 "blew"
      participle: string; // 完成式/過去分詞，如 "has beaten" 或 "have blown"
      acceptableAnswers?: {
        presentSimple?: string[];
        pastSimple?: string[];
        participle?: string[]; // 包含純分詞 "beaten" 與 "has beaten"
      };
    }>;
    
    // 5 題獨立動詞時態填空（完全無短文、無動詞原形括號提示，自主從 Sec A 選詞並變換時態）
    sectionB_sentences: Array<{
      id: number; // 1 ~ 5
      examDate: string; // 【必須明確標註所屬考期日期】，如 "0916"
      sentence: string; // 句中含有 ________ 空格，句末絕無動詞原形提示
      correctAnswer: string; // 正確時態變化形（如 "blew", "awoke", "has broken"）
      acceptableAnswers?: string[];
      clue?: string; // 時態與文法判斷線索
    }>;
  };
}
```

---

## 5. 09/09 官方真題黃金樣卷 (Golden Ground Truth Example)

```json
{
  "examDate": "0909",
  "dateLabel": "9月9日",
  "title": "9/9 L4-PET Vocabulary & Verb Quiz",
  "totalScore": 70,
  "timeLimitMinutes": 45,
  "part1_vocabulary": {
    "sectionA_translation": [
      { "id": 1, "examDate": "0909", "chinese": "能力", "english": "Ability", "acceptableAnswers": ["ability"] },
      { "id": 2, "examDate": "0909", "chinese": "會計師", "english": "Accountant", "acceptableAnswers": ["accountant"] },
      { "id": 3, "examDate": "0909", "chinese": "口音", "english": "Accent", "acceptableAnswers": ["accent"] },
      { "id": 4, "examDate": "0909", "chinese": "成就", "english": "Achievement", "acceptableAnswers": ["achievement"] },
      { "id": 5, "examDate": "0909", "chinese": "進入;使用權", "english": "Access", "acceptableAnswers": ["access"] },
      { "id": 6, "examDate": "0909", "chinese": "根據", "english": "According to", "acceptableAnswers": ["according to"] },
      { "id": 7, "examDate": "0909", "chinese": "能夠的", "english": "Able", "acceptableAnswers": ["able"] },
      { "id": 8, "examDate": "0909", "chinese": "活躍的", "english": "Active", "acceptableAnswers": ["active"] },
      { "id": 9, "examDate": "0909", "chinese": "住宿", "english": "Accommodation", "acceptableAnswers": ["accommodation"] },
      { "id": 10, "examDate": "0909", "chinese": "男演員", "english": "Actor", "acceptableAnswers": ["actor"] },
      { "id": 11, "examDate": "0909", "chinese": "在...上方", "english": "Above", "acceptableAnswers": ["above"] },
      { "id": 12, "examDate": "0909", "chinese": "幕;表演", "english": "Act", "acceptableAnswers": ["act"] },
      { "id": 13, "examDate": "0909", "chinese": "準確的", "english": "Accurate", "acceptableAnswers": ["accurate"] },
      { "id": 14, "examDate": "0909", "chinese": "達成", "english": "Achieve", "acceptableAnswers": ["achieve"] },
      { "id": 15, "examDate": "0909", "chinese": "接受", "english": "Accept", "acceptableAnswers": ["accept"] },
      { "id": 16, "examDate": "0909", "chinese": "一個", "english": "a/an", "acceptableAnswers": ["a", "an"] },
      { "id": 17, "examDate": "0909", "chinese": "陪同", "english": "Accompany", "acceptableAnswers": ["accompany"] },
      { "id": 18, "examDate": "0909", "chinese": "在國外", "english": "Abroad", "acceptableAnswers": ["abroad"] },
      { "id": 19, "examDate": "0909", "chinese": "行動;動作", "english": "Action", "acceptableAnswers": ["action"] },
      { "id": 20, "examDate": "0909", "chinese": "缺席的", "english": "Absent", "acceptableAnswers": ["absent"] },
      { "id": 21, "examDate": "0909", "chinese": "完全地", "english": "Absolutely", "acceptableAnswers": ["absolutely"] },
      { "id": 22, "examDate": "0909", "chinese": "疼痛", "english": "Ache", "acceptableAnswers": ["ache"] },
      { "id": 23, "examDate": "0909", "chinese": "女演員", "english": "Actress", "acceptableAnswers": ["actress"] },
      { "id": 24, "examDate": "0909", "chinese": "意外", "english": "Accident", "acceptableAnswers": ["accident"] },
      { "id": 25, "examDate": "0909", "chinese": "穿過;橫越", "english": "Across", "acceptableAnswers": ["across"] },
      { "id": 26, "examDate": "0909", "chinese": "可接受的", "english": "Acceptable", "acceptableAnswers": ["acceptable"] },
      { "id": 27, "examDate": "0909", "chinese": "其實;實際上", "english": "Actually", "acceptableAnswers": ["actually"] },
      { "id": 28, "examDate": "0909", "chinese": "大約;關於", "english": "About", "acceptableAnswers": ["about"] },
      { "id": 29, "examDate": "0909", "chinese": "活動", "english": "Activity", "acceptableAnswers": ["activity"] },
      { "id": 30, "examDate": "0909", "chinese": "帳號;帳戶", "english": "Account", "acceptableAnswers": ["account"] }
    ],
    "sectionB_sentences": [
      { "id": 1, "examDate": "0909", "sentence": "The museum is free, so visitors do not have to pay for __________ to the exhibits.", "correctAnswer": "access", "clue": "免費進入" },
      { "id": 2, "examDate": "0909", "sentence": "Emma has the __________ to learn new languages very quickly.", "correctAnswer": "ability", "clue": "學習的能力" },
      { "id": 3, "examDate": "0909", "sentence": "The weather was __________ terrible, so we decided to stay at home.", "correctAnswer": "absolutely", "clue": "完全地、極其糟糕" },
      { "id": 4, "examDate": "0909", "sentence": "The doctor asked me to describe where I felt the __________.", "correctAnswer": "ache", "clue": "疼痛處" },
      { "id": 5, "examDate": "0909", "sentence": "He finally __________ his dream of becoming a professional photographer.", "correctAnswer": "achieved", "acceptableAnswers": ["achieve"], "clue": "達成夢想（過去式）" },
      { "id": 6, "examDate": "0909", "sentence": "Please make sure that all the information in your report is __________.", "correctAnswer": "accurate", "clue": "資訊準確的" },
      { "id": 7, "examDate": "0909", "sentence": "My parents are going __________ next month to visit some friends in Canada.", "correctAnswer": "abroad", "clue": "前往國外" },
      { "id": 8, "examDate": "0909", "sentence": "__________ the weather forecast, it will rain heavily this evening.", "correctAnswer": "According to", "acceptableAnswers": ["according to"], "clue": "根據氣象預報" },
      { "id": 9, "examDate": "0909", "sentence": "Regular physical __________ can help people stay healthy.", "correctAnswer": "activity", "clue": "身體運動活動" },
      { "id": 10, "examDate": "0909", "sentence": "Jack was __________ from school because he had a high fever.", "correctAnswer": "absent", "clue": "從學校缺席/請假" },
      { "id": 11, "examDate": "0909", "sentence": "We need __________ hour to finish this project before dinner.", "correctAnswer": "an", "acceptableAnswers": ["a/an"], "clue": "冠詞（h不發音接 an）" },
      { "id": 12, "examDate": "0909", "sentence": "The hotel offers cheap __________ for students during the summer.", "correctAnswer": "accommodation", "clue": "平價住宿" },
      { "id": 13, "examDate": "0909", "sentence": "I don't __________ his explanation because some of the facts are incorrect.", "correctAnswer": "accept", "clue": "無法接受其解釋" },
      { "id": 14, "examDate": "0909", "sentence": "The firefighters took immediate __________ when they saw smoke coming from the building.", "correctAnswer": "action", "clue": "採取即時行動" },
      { "id": 15, "examDate": "0909", "sentence": "Sarah speaks English with a noticeable American __________.", "correctAnswer": "accent", "clue": "美式口音" },
      { "id": 16, "examDate": "0909", "sentence": "The students were asked to write a short report __________ their experience during the school trip.", "correctAnswer": "about", "clue": "關於其旅程經驗" },
      { "id": 17, "examDate": "0909", "sentence": "The film's main __________ won several awards for his performance.", "correctAnswer": "actor", "clue": "電影男主角/男演員" },
      { "id": 18, "examDate": "0909", "sentence": "The teacher said that cheating in an exam was not __________.", "correctAnswer": "acceptable", "clue": "考試作弊是不可接受的" },
      { "id": 19, "examDate": "0909", "sentence": "She is now __________ to work independently after receiving enough training.", "correctAnswer": "able", "clue": "能夠獨立工作" },
      { "id": 20, "examDate": "0909", "sentence": "We walked __________ the bridge to get to the other side of the river.", "correctAnswer": "across", "clue": "穿過/走過橋樑" }
    ]
  },
  "part2_verbs": {
    "sectionA_tenses": [
      {
        "id": 1,
        "examDate": "0909",
        "verbChinese": "打；跳動",
        "subject": "He",
        "presentSimple": "beats",
        "pastSimple": "beat",
        "participle": "has beaten",
        "acceptableAnswers": {
          "presentSimple": ["beats"],
          "pastSimple": ["beat"],
          "participle": ["has beaten", "beaten"]
        }
      },
      {
        "id": 2,
        "examDate": "0909",
        "verbChinese": "吹；吹動",
        "subject": "They",
        "presentSimple": "blow",
        "pastSimple": "blew",
        "participle": "has blown",
        "acceptableAnswers": {
          "presentSimple": ["blow"],
          "pastSimple": ["blew"],
          "participle": ["has blown", "blown"]
        }
      },
      {
        "id": 3,
        "examDate": "0909",
        "verbChinese": "咬",
        "subject": "We",
        "presentSimple": "bite",
        "pastSimple": "bit",
        "participle": "has bitten",
        "acceptableAnswers": {
          "presentSimple": ["bite"],
          "pastSimple": ["bit"],
          "participle": ["has bitten", "bitten"]
        }
      },
      {
        "id": 4,
        "examDate": "0909",
        "verbChinese": "醒來",
        "subject": "I",
        "presentSimple": "awake",
        "pastSimple": "awoke",
        "participle": "have awaken",
        "acceptableAnswers": {
          "presentSimple": ["awake"],
          "pastSimple": ["awoke"],
          "participle": ["have awaken", "awaken", "awoken"]
        }
      },
      {
        "id": 5,
        "examDate": "0909",
        "verbChinese": "開始",
        "subject": "She",
        "presentSimple": "begins",
        "pastSimple": "began",
        "participle": "has begun",
        "acceptableAnswers": {
          "presentSimple": ["begins"],
          "pastSimple": ["began"],
          "participle": ["has begun", "begun"]
        }
      }
    ],
    "sectionB_sentences": [
      { "id": 1, "examDate": "0909", "sentence": "The cold wind ________ strongly through the tall trees yesterday afternoon.", "correctAnswer": "blew", "acceptableAnswers": ["Blew", "blew"], "clue": "自主從 Sec A 動詞 (blow) 選詞並依 yesterday 變換過去式 blew" },
      { "id": 2, "examDate": "0909", "sentence": "When I ________ from my deep sleep at dawn, I heard thunder in the distance.", "correctAnswer": "awoke", "acceptableAnswers": ["Awoke", "awoke"], "clue": "自主從 Sec A 動詞 (awake) 選詞並依過去敘事 heard 變換過去式 awoke" },
      { "id": 3, "examDate": "0909", "sentence": "His heart ________ fast because the sudden loud noise startled him.", "correctAnswer": "beat", "acceptableAnswers": ["Beat", "beat"], "clue": "自主從 Sec A 動詞 (beat) 選詞並依過去式 startled 變換過去式 beat" },
      { "id": 4, "examDate": "0909", "sentence": "Soon after the sun rose, the town cleanup crew ________ their work on the street.", "correctAnswer": "began", "acceptableAnswers": ["Began", "began"], "clue": "自主從 Sec A 動詞 (begin) 選詞並依 rose 變換過去式 began" },
      { "id": 5, "examDate": "0909", "sentence": "Please be careful around the frightened dog so it will not ________ anyone.", "correctAnswer": "bite", "acceptableAnswers": ["Bite", "bite"], "clue": "自主從 Sec A 動詞 (bite) 選詞，助動詞 will not 後接原形動詞 bite" }
    ]
  }
}
```

---

## 6. 給下一個 AI 的快速召喚咒語 (Quick Prompt Template)

當需要為某個指定週次或考期出題時，只需複製下方這段話給 AI：

> 「請依照《PET 英文週考命題專用 AI Skill 指南》，為考試日期【9月16日 (W3)】（examDate: "0916"）命製一份完整的 L4-PET Vocabulary & Verb Quiz。
> 
> **出題範圍依據**：
> 1. **Part I (Vocabulary) 範圍**：查閱進度表『右邊數來第二直排（單字考試進度）』——本週單字範圍為【ad - animal】。
>    - Section A 產出 30 個單字英譯（附繁體中文）。
>    - Section B 產出 20 題句子填空，填入的單字**必須 100% 取自 Section A 的 30 個單字**。
>    - **嚴禁顯示 Section A 單字候選庫（No Word Bank）**，考查學生主動拼寫記憶。
> 2. **Part II (Verbs) 範圍**：查閱進度表『最右邊直排（動詞考試進度）』——本週動詞範圍為【break - choose】（動詞三態表第 16 頁動詞編號 7~12：break, bring, build, buy, catch, choose）。
>    - **務必考時態填空與時態獨立單句填空**：
>    - Section A【時態填空】：挑選 5 組動詞，指定主詞（如 He, They, We 等），填入現在式、過去式、過去分詞/完成式（共 15 格）。
>    - Section B【動詞時態獨立單句填空（完全無短文篇章、無動詞原形提示）】：
>      * **完全無短文篇章**：沒有任何 `clozePassage`，不考整篇閱讀克漏字。
>      * **5 題完全獨立的語境單句**：每回僅有 5 道互相獨立的日常生活造句（1~5 題，每題 1 分）。
>      * **無動詞原形提示**：句末不附括號提示（如無 (blow)），要求學生自主從 Part II Sec A 的 5 個動詞中選詞，並依句型與時間副詞變換為正確時態。
> 3. **【關鍵要求：每一題物件內皆必須明確標註所屬日期 `"examDate": "0916"`】**：
>    - 包含 Part I Sec A (1~30 題)、Sec B (1~20 題)、Part II Sec A (1~5 組)、Sec B (1~5 題) 的每一題 JSON 物件中，都必須包含 `"examDate": "0916"`，讓系統匯入時能全自動將題目歸類為正確的考期日期！
> 
> 請輸出格式 100% 正確之純 JSON，勿加任何前綴或後綴廢話。」
