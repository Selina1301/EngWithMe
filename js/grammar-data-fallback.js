const ex = (prompt, options, answer, hint, explanation) => ({
  prompt,
  options,
  answer,
  hint,
  explanation
});

let grammarTopics = [
  {
    id: "tu-loai",
    order: "01",
    title: "Từ loại",
    level: "Nền tảng",
    time: "18 phút",
    summary: "Nhận diện vai trò của từ trong câu để đọc, viết và sửa lỗi chính xác hơn.",
    theory: [
      "Từ loại cho biết một từ đang làm nhiệm vụ gì trong câu: gọi tên sự vật, diễn tả hành động, mô tả đặc điểm, bổ nghĩa hoặc nối ý.",
      "Vị trí trong câu là dấu hiệu quan trọng: danh từ thường làm chủ ngữ hoặc tân ngữ, động từ đứng sau chủ ngữ, tính từ bổ nghĩa danh từ, trạng từ bổ nghĩa động từ, tính từ hoặc cả câu.",
      "Một từ có thể đổi vai trò theo ngữ cảnh, ví dụ study là động từ trong I study English nhưng là danh từ trong a study plan."
    ],
    formulas: [
      "Subject + Verb + Object/Complement",
      "Determiner + Adjective + Noun",
      "Adverb + Verb/Adjective/Clause"
    ],
    examples: [
      { en: "She quickly finished the difficult task.", vi: "She là đại từ, quickly là trạng từ, finished là động từ, difficult là tính từ, task là danh từ." },
      { en: "Learning English requires steady practice.", vi: "Learning English làm chủ ngữ; requires là động từ chính." }
    ],
    mistakes: [
      "Không dùng tính từ thay cho trạng từ: He speaks fluent English, nhưng He speaks English fluently.",
      "Không chỉ nhìn đuôi từ. Friendly là tính từ dù kết thúc bằng -ly."
    ],
    exercises: [
      ex("All employees must submit the ___ form by noon.", ["revise","revised","revision","revising"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - revised."),
      ex("The manager spoke ___ about the new company policy.", ["confident","confidence","confidently","confide"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - confidently."),
      ex("The hotel offers ___ rates for corporate clients.", ["compete","competition","competitive","competitively"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - competitive."),
      ex("Please check the ___ of each invoice before approving it.", ["accurate","accuracy","accurately","accurateness"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - accuracy."),
      ex("Ms. Park is responsible for the ___ of new staff members.", ["train","trained","training","trainer"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - training."),
      ex("The technician repaired the printer ___ and efficiently.", ["quick","quickly","quicker","quickness"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - quickly."),
      ex("The company announced a significant ___ in operating costs.", ["reduce","reduced","reduction","reducing"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - reduction."),
      ex("The proposal was ___ accepted by the board of directors.", ["wide","widely","widen","width"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - widely."),
      ex("We need a detailed ___ of last quarter's sales performance.", ["analyze","analyst","analytical","analysis"], 3, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: D - analysis."),
      ex("The new software is designed to improve employee ___.", ["productive","productivity","productively","produce"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - productivity.")
    ]
  },
  {
    id: "thi",
    order: "02",
    title: "Thì",
    level: "Cốt lõi",
    time: "45 phút",
    summary: "Hệ thống đầy đủ 12 thì tiếng Anh theo hiện tại, quá khứ và tương lai.",
    theory: [
      "Thì cho biết hành động xảy ra ở hiện tại, quá khứ hay tương lai, đồng thời thể hiện hành động là thói quen, đang tiếp diễn, đã hoàn thành hay kéo dài.",
      "Khi chọn thì, cần xác định mốc thời gian, quan hệ trước-sau của hành động và ý nghĩa muốn nhấn mạnh: sự thật, quá trình, kết quả hay kế hoạch.",
      "Công thức phủ định và nghi vấn thay đổi theo trợ động từ của từng thì: do/does, did, am/is/are, was/were, have/has, had, will."
    ],
    sections: [
      {
        title: "I. Nhóm thì hiện tại",
        items: [
          {
            name: "Present Simple",
            viName: "Hiện tại đơn",
            formulas: {
              "Khẳng định": "S + V(s/es) + O",
              "Phủ định": "S + do/does + not + V nguyên mẫu",
              "Nghi vấn": "Do/Does + S + V nguyên mẫu?"
            },
            uses: ["Diễn tả thói quen", "Diễn tả sự thật hiển nhiên", "Diễn tả lịch trình, thời gian biểu", "Diễn tả trạng thái lâu dài"],
            signals: ["always", "usually", "often", "sometimes", "rarely", "never", "every day", "every week"],
            examples: ["I study English every day.", "She goes to school by bus.", "The sun rises in the east."]
          },
          {
            name: "Present Continuous",
            viName: "Hiện tại tiếp diễn",
            formulas: {
              "Khẳng định": "S + am/is/are + V-ing",
              "Phủ định": "S + am/is/are + not + V-ing",
              "Nghi vấn": "Am/Is/Are + S + V-ing?"
            },
            uses: ["Diễn tả hành động đang xảy ra ngay lúc nói", "Diễn tả hành động tạm thời", "Diễn tả kế hoạch gần trong tương lai", "Diễn tả sự thay đổi đang diễn ra"],
            signals: ["now", "right now", "at the moment", "at present", "look", "listen", "today", "this week"],
            examples: ["I am learning English now.", "She is watching TV.", "They are studying for the exam."]
          },
          {
            name: "Present Perfect",
            viName: "Hiện tại hoàn thành",
            formulas: {
              "Khẳng định": "S + have/has + V3/ed",
              "Phủ định": "S + have/has + not + V3/ed",
              "Nghi vấn": "Have/Has + S + V3/ed?"
            },
            uses: ["Diễn tả hành động đã xảy ra nhưng không nói rõ thời gian", "Diễn tả trải nghiệm", "Diễn tả hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại", "Diễn tả hành động vừa mới xảy ra"],
            signals: ["already", "just", "yet", "ever", "never", "recently", "lately", "so far", "up to now", "for", "since"],
            examples: ["I have finished my homework.", "She has lived here for five years.", "Have you ever been to Japan?"]
          },
          {
            name: "Present Perfect Continuous",
            viName: "Hiện tại hoàn thành tiếp diễn",
            formulas: {
              "Khẳng định": "S + have/has + been + V-ing",
              "Phủ định": "S + have/has + not + been + V-ing",
              "Nghi vấn": "Have/Has + S + been + V-ing?"
            },
            uses: ["Nhấn mạnh quá trình của hành động", "Hành động bắt đầu trong quá khứ và vẫn đang tiếp tục", "Hành động vừa kết thúc nhưng còn để lại kết quả ở hiện tại"],
            signals: ["for", "since", "all day", "all morning", "recently", "lately", "how long"],
            examples: ["I have been studying English for two hours.", "She has been working all day.", "It has been raining since morning."]
          }
        ]
      },
      {
        title: "II. Nhóm thì quá khứ",
        items: [
          {
            name: "Past Simple",
            viName: "Quá khứ đơn",
            formulas: {
              "Khẳng định": "S + V2/ed",
              "Phủ định": "S + did + not + V nguyên mẫu",
              "Nghi vấn": "Did + S + V nguyên mẫu?"
            },
            uses: ["Diễn tả hành động đã xảy ra và kết thúc trong quá khứ", "Kể lại một chuỗi hành động trong quá khứ", "Diễn tả thói quen trong quá khứ"],
            signals: ["yesterday", "last night", "last week", "last month", "last year", "ago", "in 2020", "when I was young"],
            examples: ["I watched a movie yesterday.", "She visited Da Nang last year.", "They played football two days ago."]
          },
          {
            name: "Past Continuous",
            viName: "Quá khứ tiếp diễn",
            formulas: {
              "Khẳng định": "S + was/were + V-ing",
              "Phủ định": "S + was/were + not + V-ing",
              "Nghi vấn": "Was/Were + S + V-ing?"
            },
            uses: ["Diễn tả hành động đang xảy ra tại một thời điểm trong quá khứ", "Diễn tả hành động đang xảy ra thì hành động khác xen vào", "Diễn tả hai hành động xảy ra song song trong quá khứ"],
            signals: ["at 7 o'clock yesterday", "at this time last night", "while", "when"],
            examples: ["I was studying at 8 p.m. yesterday.", "She was cooking when I came home.", "They were playing while I was reading."]
          },
          {
            name: "Past Perfect",
            viName: "Quá khứ hoàn thành",
            formulas: {
              "Khẳng định": "S + had + V3/ed",
              "Phủ định": "S + had + not + V3/ed",
              "Nghi vấn": "Had + S + V3/ed?"
            },
            uses: ["Diễn tả hành động xảy ra trước một hành động khác trong quá khứ", "Diễn tả hành động hoàn thành trước một thời điểm trong quá khứ"],
            signals: ["before", "after", "by the time", "when", "already", "until"],
            examples: ["I had finished my homework before I went out.", "She had left before I arrived.", "By the time we got there, the movie had started."]
          },
          {
            name: "Past Perfect Continuous",
            viName: "Quá khứ hoàn thành tiếp diễn",
            formulas: {
              "Khẳng định": "S + had + been + V-ing",
              "Phủ định": "S + had + not + been + V-ing",
              "Nghi vấn": "Had + S + been + V-ing?"
            },
            uses: ["Nhấn mạnh quá trình của một hành động xảy ra trước một hành động khác trong quá khứ", "Diễn tả hành động kéo dài đến trước một thời điểm trong quá khứ"],
            signals: ["for", "since", "before", "until", "by the time"],
            examples: ["I had been studying for three hours before she called me.", "They had been working all day before they went home.", "She was tired because she had been running."]
          }
        ]
      },
      {
        title: "III. Nhóm thì tương lai",
        items: [
          {
            name: "Future Simple",
            viName: "Tương lai đơn",
            formulas: {
              "Khẳng định": "S + will + V nguyên mẫu",
              "Phủ định": "S + will not + V nguyên mẫu",
              "Nghi vấn": "Will + S + V nguyên mẫu?"
            },
            uses: ["Diễn tả quyết định ngay lúc nói", "Dự đoán tương lai", "Lời hứa", "Lời đề nghị", "Lời đe dọa"],
            signals: ["tomorrow", "next week", "next month", "next year", "soon", "in the future", "one day"],
            examples: ["I will call you tomorrow.", "She will be successful.", "I will help you."]
          },
          {
            name: "Future Continuous",
            viName: "Tương lai tiếp diễn",
            formulas: {
              "Khẳng định": "S + will + be + V-ing",
              "Phủ định": "S + will not + be + V-ing",
              "Nghi vấn": "Will + S + be + V-ing?"
            },
            uses: ["Diễn tả hành động đang xảy ra tại một thời điểm trong tương lai", "Diễn tả hành động sẽ đang diễn ra theo kế hoạch"],
            signals: ["at this time tomorrow", "at 8 p.m. tomorrow", "this time next week", "when"],
            examples: ["I will be studying at 8 p.m. tomorrow.", "She will be working this time next week.", "They will be traveling tomorrow morning."]
          },
          {
            name: "Future Perfect",
            viName: "Tương lai hoàn thành",
            formulas: {
              "Khẳng định": "S + will + have + V3/ed",
              "Phủ định": "S + will not + have + V3/ed",
              "Nghi vấn": "Will + S + have + V3/ed?"
            },
            uses: ["Diễn tả hành động sẽ hoàn thành trước một thời điểm trong tương lai", "Diễn tả hành động sẽ hoàn thành trước một hành động khác trong tương lai"],
            signals: ["by", "by the time", "before", "by tomorrow", "by next week", "by the end of this month"],
            examples: ["I will have finished this project by tomorrow.", "She will have left before you arrive.", "By next year, I will have graduated."]
          },
          {
            name: "Future Perfect Continuous",
            viName: "Tương lai hoàn thành tiếp diễn",
            formulas: {
              "Khẳng định": "S + will + have + been + V-ing",
              "Phủ định": "S + will not + have + been + V-ing",
              "Nghi vấn": "Will + S + have + been + V-ing?"
            },
            uses: ["Nhấn mạnh quá trình của hành động kéo dài đến một thời điểm trong tương lai", "Diễn tả hành động sẽ đã đang diễn ra được bao lâu trước một mốc tương lai"],
            signals: ["for", "since", "by", "by the time", "by next month", "by the end of this year"],
            examples: ["By next month, I will have been studying English for one year.", "She will have been working here for ten years by 2030.", "They will have been waiting for two hours by the time we arrive."]
          }
        ]
      }
    ],
    formulas: [
      "Simple: thói quen, sự thật, hành động hoàn tất ở một mốc thời gian",
      "Continuous: hành động đang diễn ra hoặc nhấn mạnh quá trình",
      "Perfect: hành động hoàn thành trước hiện tại/quá khứ/tương lai",
      "Perfect Continuous: hành động kéo dài và nhấn mạnh thời lượng"
    ],
    examples: [
      { en: "I study English every evening.", vi: "Hiện tại đơn diễn tả thói quen." },
      { en: "She has lived here for five years.", vi: "Hiện tại hoàn thành nối quá khứ với hiện tại." },
      { en: "By next year, I will have graduated.", vi: "Tương lai hoàn thành nhấn mạnh kết quả trước một mốc tương lai." }
    ],
    mistakes: [
      "Khi có mốc before/after trong quá khứ, hành động xảy ra trước thường dùng Past Perfect.",
      "Sau did, do/does, will dùng động từ nguyên mẫu; không chia V2 hoặc thêm s/es."
    ],
    exercises: [
      ex("By the time Ms. Lee arrived, the meeting ___ already ___.", ["has / begun","had / begun","was / beginning","will / begin"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - had / begun."),
      ex("The sales team ___ the new product line next month.", ["launches","launched","will launch","has launched"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - will launch."),
      ex("Mr. Carter ___ for this company since 2018.", ["works","worked","has worked","is working"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - has worked."),
      ex("The receptionist ___ a phone call when the visitor arrived.", ["answers","answered","was answering","has answered"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - was answering."),
      ex("Our department usually ___ its weekly report on Friday.", ["submits","submitted","is submitting","has submitted"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - submits."),
      ex("The shipment ___ at the warehouse yesterday afternoon.", ["arrives","arrived","has arrived","will arrive"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - arrived."),
      ex("We ___ the contract before the client requested changes.", ["finalize","finalized","had finalized","will finalize"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - had finalized."),
      ex("The company ___ a new branch in Manila next year.", ["opened","has opened","opens","will open"], 3, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: D - will open."),
      ex("I ___ the budget figures right now, so I cannot join the call.", ["review","reviewed","am reviewing","have reviewed"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - am reviewing."),
      ex("The training session ___ by the time you return from lunch.", ["ends","ended","will have ended","has ended"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - will have ended.")
    ]
  },
  {
    id: "danh-tu",
    order: "03",
    title: "Danh từ",
    level: "Nền tảng",
    time: "20 phút",
    summary: "Dùng danh từ đếm được, không đếm được, số ít/số nhiều và sở hữu đúng ngữ cảnh.",
    theory: [
      "Danh từ gọi tên người, vật, nơi chốn, ý tưởng hoặc khái niệm.",
      "Danh từ đếm được có số ít và số nhiều; danh từ không đếm được thường không dùng a/an và không thêm s.",
      "Sở hữu cách dùng 's cho người/vật sống hoặc of cho vật/khái niệm."
    ],
    formulas: ["a/an + singular countable noun", "some/any + plural noun/uncountable noun", "Noun + 's + noun"],
    examples: [
      { en: "There are three students in the room.", vi: "Students là danh từ số nhiều đếm được." },
      { en: "I need some advice.", vi: "Advice là danh từ không đếm được." }
    ],
    mistakes: [
      "Không dùng a/an trước danh từ số nhiều hoặc không đếm được.",
      "Một số danh từ số nhiều bất quy tắc: child -> children, person -> people, knife -> knives."
    ],
    exercises: [
      ex("The company received several ___ from customers after the update.", ["complaint","complaints","complain","complaining"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - complaints."),
      ex("We need more ___ before making a final decision.", ["information","informations","informative","inform"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - information."),
      ex("The ___ suggestions were discussed during the meeting.", ["employees","employee's","employees'","employee"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - employees'."),
      ex("Please send me two ___ of the signed agreement.", ["copy","copies","copying","copied"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - copies."),
      ex("The restaurant's new menu includes several vegetarian ___.", ["option","options","optional","optionally"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - options."),
      ex("Ms. Brown has ten years of ___ in project management.", ["experience","experiences","experienced","experiencing"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - experience."),
      ex("The marketing team prepared a list of potential ___.", ["client","clients","client's","cliented"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - clients."),
      ex("The ___ report must be submitted before the end of the month.", ["accountant","accounting","account","accounted"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - accounting."),
      ex("The director reviewed the ___ performance carefully.", ["department","departments","department's","departmental"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - department's."),
      ex("All ___ must wear identification badges in the building.", ["visitor","visitors","visiting","visits"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - visitors.")
    ]
  },
  {
    id: "dong-tu",
    order: "04",
    title: "Động từ",
    level: "Nền tảng",
    time: "21 phút",
    summary: "Nắm động từ chính, trợ động từ, nội động từ, ngoại động từ và mẫu động từ.",
    theory: [
      "Động từ diễn tả hành động, trạng thái hoặc sự tồn tại.",
      "Ngoại động từ cần tân ngữ trực tiếp; nội động từ không cần tân ngữ trực tiếp.",
      "Trợ động từ như do, be, have, will giúp tạo phủ định, câu hỏi, thì và thể bị động."
    ],
    formulas: ["S + intransitive verb", "S + transitive verb + object", "Auxiliary + S + main verb?"],
    examples: [
      { en: "She sleeps early.", vi: "Sleep là nội động từ." },
      { en: "They built a house.", vi: "Build là ngoại động từ và cần tân ngữ a house." }
    ],
    mistakes: [
      "Không bỏ trợ động từ trong câu hỏi: Do you like music?",
      "Sau modal verbs dùng động từ nguyên mẫu không to."
    ],
    exercises: [
      ex("The manager ___ the final report before sending it to headquarters.", ["reviewed","review","reviewing","reviews to"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - reviewed."),
      ex("Please ___ the attached document carefully.", ["read","reading","to read","reads"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - read."),
      ex("The new policy will ___ all full-time employees.", ["apply","affect","happen","arrive"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - affect."),
      ex("The technician ___ the broken scanner this morning.", ["fixed","fixing","fixes to","was fixed"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - fixed."),
      ex("Our team ___ a solution to the delivery problem.", ["came up with","came over","came across","came down"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - came up with."),
      ex("The CEO ___ the importance of customer satisfaction.", ["emphasized","emphasized on","emphasized to","emphasized about"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - emphasized."),
      ex("The company ___ several candidates for the position.", ["interviewed","interviewed with","interviewed to","was interviewed"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - interviewed."),
      ex("The meeting ___ at exactly 9 a.m.", ["began","was begun","beginning","begins to"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - began."),
      ex("The supplier failed to ___ the goods on time.", ["delivery","deliver","delivered","delivering"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - deliver."),
      ex("Employees are encouraged to ___ any safety concerns immediately.", ["report","reporting","reported","reports"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - report.")
    ]
  },
  {
    id: "tinh-tu",
    order: "05",
    title: "Tính từ",
    level: "Nền tảng",
    time: "18 phút",
    summary: "Mô tả danh từ, dùng linking verbs và sắp xếp nhiều tính từ đúng thứ tự.",
    theory: [
      "Tính từ mô tả đặc điểm, trạng thái hoặc tính chất của danh từ.",
      "Tính từ có thể đứng trước danh từ hoặc sau linking verbs như be, seem, become, feel.",
      "Khi có nhiều tính từ, thứ tự thường là opinion, size, age, shape, color, origin, material, purpose."
    ],
    formulas: ["adjective + noun", "S + linking verb + adjective", "too/very/quite + adjective"],
    examples: [
      { en: "It is a beautiful old house.", vi: "Beautiful là ý kiến, old là tuổi." },
      { en: "The soup tastes delicious.", vi: "Delicious đứng sau linking verb tastes." }
    ],
    mistakes: [
      "Không thêm s cho tính từ khi danh từ số nhiều: beautiful houses.",
      "Không dùng trạng từ sau linking verb nếu cần mô tả chủ ngữ: She looks happy."
    ],
    exercises: [
      ex("The new office furniture is both comfortable and ___.", ["durability","durable","durably","endure"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - durable."),
      ex("The report provides a ___ summary of the company's performance.", ["brief","briefly","briefing","briefness"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - brief."),
      ex("Customers were pleased with the ___ service.", ["prompt","promptly","promptness","prompted"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - prompt."),
      ex("This is the most ___ proposal we have received so far.", ["impress","impressive","impressively","impression"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - impressive."),
      ex("The conference room looks ___ after the renovation.", ["modern","modernly","modernize","modernity"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - modern."),
      ex("We ordered three ___ leather office chairs.", ["black large Italian","Italian black large","large black Italian","black Italian large"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - large black Italian."),
      ex("The instructions were clear and easy to ___.", ["follow","following","followed","follows"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - follow."),
      ex("The new manager seems ___ with the team's progress.", ["satisfy","satisfied","satisfaction","satisfactorily"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - satisfied."),
      ex("The company is looking for a ___ candidate with strong communication skills.", ["qualify","qualified","qualification","qualifyingly"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - qualified."),
      ex("The delay was caused by ___ weather conditions.", ["severe","severely","severity","severeness"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - severe.")
    ]
  },
  {
    id: "trang-tu",
    order: "06",
    title: "Trạng từ",
    level: "Nền tảng",
    time: "18 phút",
    summary: "Bổ nghĩa cho động từ, tính từ, trạng từ khác hoặc cả câu.",
    theory: [
      "Trạng từ trả lời các câu hỏi how, when, where, how often và to what degree.",
      "Nhiều trạng từ cách thức được tạo bằng adjective + ly, nhưng có ngoại lệ như fast, hard, well.",
      "Vị trí trạng từ phụ thuộc vào loại trạng từ và ý muốn nhấn mạnh."
    ],
    formulas: ["S + V + adverb", "adverb + adjective", "frequency adverb + main verb"],
    examples: [
      { en: "He speaks English fluently.", vi: "Fluently bổ nghĩa cho speaks." },
      { en: "She usually gets up early.", vi: "Usually diễn tả tần suất." }
    ],
    mistakes: [
      "Không nhầm hard và hardly: hard là chăm chỉ/mạnh, hardly là hầu như không.",
      "Không dùng good thay cho well khi bổ nghĩa cho động từ."
    ],
    exercises: [
      ex("The finance team reviewed the budget ___ before approval.", ["careful","carefully","care","carefulness"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - carefully."),
      ex("The package arrived ___ than expected.", ["early","earlier","earliest","earliness"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - earlier."),
      ex("Mr. Johnson responded ___ to the client's complaint.", ["immediate","immediately","immediacy","more immediate"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - immediately."),
      ex("The new software runs ___ on older computers.", ["smoothly","smooth","smoothness","smoother"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - smoothly."),
      ex("Employees must dress ___ for client meetings.", ["professional","professionally","profession","professionalism"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - professionally."),
      ex("The marketing campaign was ___ successful.", ["high","height","highly","higher"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - highly."),
      ex("Please speak ___ during the presentation so everyone can hear you.", ["clear","clearly","clarity","clearing"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - clearly."),
      ex("The shipment was ___ delayed due to bad weather.", ["unexpected","unexpectedly","expecting","expectation"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - unexpectedly."),
      ex("The director ___ approved the revised proposal.", ["final","finally","finalize","finality"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - finally."),
      ex("The receptionist handled the situation very ___.", ["calm","calmly","calming","calmness"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - calmly.")
    ]
  },
  {
    id: "mao-tu",
    order: "07",
    title: "Mạo từ",
    level: "Cốt lõi",
    time: "20 phút",
    summary: "Dùng a, an, the và trường hợp không dùng mạo từ chính xác hơn.",
    theory: [
      "A/an dùng với danh từ đếm được số ít khi nhắc lần đầu hoặc chưa xác định.",
      "The dùng khi người nghe đã biết đối tượng, đối tượng là duy nhất hoặc đã được nhắc trước đó.",
      "Không dùng mạo từ trước danh từ số nhiều/không đếm được khi nói chung."
    ],
    formulas: ["a/an + singular countable noun", "the + specific noun", "zero article + general plural/uncountable noun"],
    examples: [
      { en: "I saw a dog. The dog was friendly.", vi: "A dùng khi nhắc lần đầu, the dùng khi nhắc lại." },
      { en: "Water is important.", vi: "Water nói chung nên không dùng mạo từ." }
    ],
    mistakes: [
      "An phụ thuộc vào âm bắt đầu, không chỉ chữ cái: an hour, a university.",
      "Không dùng the khi nói chung: I like music."
    ],
    exercises: [
      ex("Ms. Adams is ___ experienced consultant in international trade.", ["a","an","the","no article"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - an."),
      ex("The company opened ___ new branch near the airport.", ["a","an","the","no article"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - a."),
      ex("Please send the file to ___ accounting department.", ["a","an","the","no article"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - the."),
      ex("We need to hire ___ engineer for the new project.", ["a","an","the","no article"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - an."),
      ex("___ information you requested is attached to this email.", ["A","An","The","No article"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - The."),
      ex("Our office is located on ___ third floor.", ["a","an","the","no article"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - the."),
      ex("Employees must wear ___ uniform during working hours.", ["a","an","the","no article"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - a."),
      ex("Mr. Wilson gave us ___ useful advice about the presentation.", ["a","an","the","no article"], 3, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: D - no article."),
      ex("The meeting will be held in ___ Room 204.", ["a","an","the","no article"], 3, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: D - no article."),
      ex("She is ___ best candidate for the position.", ["a","an","the","no article"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - the.")
    ]
  },
  {
    id: "gioi-tu",
    order: "08",
    title: "Giới từ",
    level: "Cốt lõi",
    time: "22 phút",
    summary: "Dùng giới từ chỉ thời gian, nơi chốn, hướng di chuyển và cụm cố định.",
    theory: [
      "Giới từ thể hiện quan hệ giữa danh từ/cụm danh từ với phần còn lại của câu.",
      "At, on, in có quy tắc riêng cho thời gian và nơi chốn.",
      "Nhiều giới từ đi theo cụm cố định, cần học theo cụm thay vì dịch từng từ."
    ],
    formulas: ["at + exact time/place", "on + day/date/surface", "in + month/year/area"],
    examples: [
      { en: "The meeting starts at 9 a.m.", vi: "At dùng với giờ cụ thể." },
      { en: "She lives in Hanoi.", vi: "In dùng với thành phố/khu vực." }
    ],
    mistakes: [
      "Không dịch máy từng giới từ từ tiếng Việt sang tiếng Anh; hãy học theo cụm.",
      "Arrive dùng arrive in với thành phố/quốc gia và arrive at với địa điểm cụ thể."
    ],
    exercises: [
      ex("The meeting is scheduled ___ Monday morning.", ["in","on","at","by"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - on."),
      ex("Please submit your report ___ the end of the day.", ["on","at","by","in"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - by."),
      ex("The office is located ___ the second floor.", ["at","in","on","to"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - on."),
      ex("We are interested ___ expanding into new markets.", ["in","on","at","for"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - in."),
      ex("The manager is responsible ___ training new employees.", ["with","for","to","about"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - for."),
      ex("The package was delivered ___ the wrong address.", ["in","at","to","on"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to."),
      ex("The seminar will take place ___ 9 a.m. and noon.", ["among","between","during","through"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - between."),
      ex("Sales increased ___ 15 percent last quarter.", ["by","to","with","from"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - by."),
      ex("The report must be completed ___ Friday.", ["until","by","since","during"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - by."),
      ex("The company has been in business ___ more than twenty years.", ["since","during","for","at"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - for.")
    ]
  },
  {
    id: "so-sanh",
    order: "09",
    title: "So sánh",
    level: "Cốt lõi",
    time: "22 phút",
    summary: "Dùng so sánh bằng, hơn, nhất và các dạng bất quy tắc.",
    theory: [
      "So sánh bằng dùng as + adjective/adverb + as.",
      "So sánh hơn dùng adjective-er hoặc more + adjective, tùy độ dài của tính từ.",
      "So sánh nhất dùng the + adjective-est hoặc the most + adjective."
    ],
    formulas: ["as + adj/adv + as", "comparative + than", "the + superlative"],
    examples: [
      { en: "This book is more interesting than that one.", vi: "Interesting dùng more vì là tính từ dài." },
      { en: "She is the tallest student in class.", vi: "Tall dùng tallest ở so sánh nhất." }
    ],
    mistakes: [
      "Không dùng more với tính từ đã thêm -er: more faster là sai.",
      "Một số dạng bất quy tắc: good -> better -> best, bad -> worse -> worst."
    ],
    exercises: [
      ex("This year's sales figures are ___ than last year's.", ["high","higher","highest","highly"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - higher."),
      ex("The new printer is ___ efficient than the old one.", ["more","most","much","many"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - more."),
      ex("This is the ___ conference room in the building.", ["large","larger","largest","largely"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - largest."),
      ex("Ms. Green speaks English ___ than anyone else on the team.", ["fluently","more fluently","most fluently","fluent"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - more fluently."),
      ex("The revised proposal is ___ as detailed as the original version.", ["so","as","more","most"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - as."),
      ex("The second interview was much ___ than the first one.", ["difficult","more difficult","most difficult","difficulty"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - more difficult."),
      ex("This model is less expensive ___ the previous one.", ["as","than","from","to"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - than."),
      ex("Of all the applicants, Mr. Chen has the ___ qualifications.", ["strong","stronger","strongest","strongly"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - strongest."),
      ex("The new system works ___ than we expected.", ["well","better","best","good"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - better."),
      ex("The earlier you submit the form, the ___ it can be processed.", ["fast","faster","fastest","more fast"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - faster.")
    ]
  },
  {
    id: "modal-verbs",
    order: "10",
    title: "Modal verbs",
    level: "Cốt lõi",
    time: "20 phút",
    summary: "Dùng can, could, may, might, must, should, would để diễn tả khả năng, lời khuyên và nghĩa vụ.",
    theory: [
      "Modal verbs đứng trước động từ nguyên mẫu không to.",
      "Can/could diễn tả khả năng hoặc lời nhờ; may/might diễn tả khả năng; must/have to diễn tả nghĩa vụ; should diễn tả lời khuyên.",
      "Modal verbs không thêm s theo chủ ngữ và không dùng thêm do/does trong câu hỏi."
    ],
    formulas: ["S + modal + base verb", "Modal + S + base verb?", "S + modal + not + base verb"],
    examples: [
      { en: "You should review the lesson.", vi: "Should đưa ra lời khuyên." },
      { en: "She can swim very well.", vi: "Can diễn tả khả năng." }
    ],
    mistakes: [
      "Không viết she cans hoặc must to go.",
      "Must not là cấm làm; do not have to là không cần làm."
    ],
    exercises: [
      ex("Employees ___ wear their ID badges at all times.", ["must","might","would","could"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - must."),
      ex("You ___ submit the application online or in person.", ["may","must to","should to","can to"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - may."),
      ex("The delivery ___ arrive later than expected because of heavy traffic.", ["must","might","should","would"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - might."),
      ex("We ___ review the contract before signing it.", ["should","may to","can to","must to"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - should."),
      ex("Mr. Lee ___ attend the meeting yesterday because he was sick.", ["cannot","could not","must not","may not"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - could not."),
      ex("Visitors ___ enter the laboratory without permission.", ["must not","would not","might not","could not"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - must not."),
      ex("The manager said we ___ leave early after finishing the report.", ["could","must","should to","can to"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - could."),
      ex("You ___ contact customer service if the problem continues.", ["had better","would better","must better","may better"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - had better."),
      ex("The figures ___ be correct because they match the accounting records.", ["must","might","could","would"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - must."),
      ex("___ you please send me the updated schedule?", ["Must","Should","Could","May to"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - Could.")
    ]
  },
  {
    id: "cau-dieu-kien",
    order: "11",
    title: "Câu điều kiện",
    level: "Ứng dụng",
    time: "26 phút",
    summary: "Dùng câu điều kiện loại 0, 1, 2, 3 và mixed conditionals đúng ngữ cảnh.",
    theory: [
      "Câu điều kiện gồm mệnh đề if và mệnh đề chính.",
      "Loại 0 nói về sự thật chung; loại 1 nói về khả năng thật trong tương lai.",
      "Loại 2 nói về giả định hiện tại/tương lai; loại 3 nói về giả định trái với quá khứ."
    ],
    formulas: ["If + Present Simple, S + Present Simple", "If + Present Simple, S + will + V", "If + Past Simple, S + would + V", "If + Past Perfect, S + would have + V3/ed"],
    examples: [
      { en: "If it rains, I will stay home.", vi: "Điều kiện loại 1." },
      { en: "If I had studied harder, I would have passed.", vi: "Điều kiện loại 3." }
    ],
    mistakes: [
      "Không dùng will trong mệnh đề if của điều kiện loại 1: If it rains, not If it will rain.",
      "Were thường dùng với mọi chủ ngữ trong giả định trang trọng: If I were you."
    ],
    exercises: [
      ex("If the shipment arrives today, we ___ it to the client immediately.", ["send","sent","will send","would send"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - will send."),
      ex("If employees have questions, they ___ contact the HR department.", ["can","could have","would have","had"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - can."),
      ex("If we had ordered more supplies, we ___ enough folders for everyone.", ["have","had","would have had","will have"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - would have had."),
      ex("If I were the manager, I ___ the meeting schedule.", ["change","changed","would change","will change"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - would change."),
      ex("If customers are dissatisfied, they usually ___ a refund.", ["request","requested","will requested","would requested"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - request."),
      ex("If the printer stops working again, ___ the IT department.", ["call","called","calling","to call"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - call."),
      ex("If the company had invested earlier, it ___ more competitive now.", ["is","will be","would be","would have been"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - would be."),
      ex("Unless the report is submitted today, it ___ included in the review.", ["is not","will not be","would not","has not"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - will not be."),
      ex("If I ___ your email earlier, I would have replied sooner.", ["see","saw","had seen","have seen"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - had seen."),
      ex("If the weather improves, the outdoor event ___ as planned.", ["continues","continued","will continue","would continue"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - will continue.")
    ]
  },
  {
    id: "cau-bi-dong",
    order: "12",
    title: "Câu bị động",
    level: "Ứng dụng",
    time: "24 phút",
    summary: "Chuyển trọng tâm từ người làm hành động sang đối tượng chịu tác động.",
    theory: [
      "Câu bị động dùng khi người/vật chịu tác động quan trọng hơn người thực hiện hành động.",
      "Cấu trúc cốt lõi là be + V3/ed, trong đó be chia theo thì của câu.",
      "By + tác nhân chỉ dùng khi tác nhân quan trọng hoặc cần làm rõ."
    ],
    formulas: ["S + be + V3/ed", "S + modal + be + V3/ed", "S + have/has + been + V3/ed"],
    examples: [
      { en: "The report was finished yesterday.", vi: "Was finished là bị động quá khứ đơn." },
      { en: "This room is cleaned every day.", vi: "Is cleaned là bị động hiện tại đơn." }
    ],
    mistakes: [
      "Không quên chia be theo thì: was built, is built, will be built.",
      "Không dùng bị động với nội động từ không có tân ngữ trực tiếp."
    ],
    exercises: [
      ex("The annual report ___ by the finance department.", ["prepared","was prepared","preparing","has preparing"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - was prepared."),
      ex("All applications must ___ by Friday.", ["submit","submitted","be submitted","submitting"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - be submitted."),
      ex("The meeting room ___ every morning.", ["cleans","cleaned","is cleaned","cleaning"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - is cleaned."),
      ex("The new software ___ next week.", ["will install","will be installed","installed","installing"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - will be installed."),
      ex("The invitations have already ___ to all participants.", ["sent","been sent","sending","send"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - been sent."),
      ex("The damaged items ___ from the warehouse yesterday.", ["removed","were removed","removing","have removing"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - were removed."),
      ex("The contract is being ___ by our legal team.", ["review","reviewed","reviewing","reviews"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - reviewed."),
      ex("The final decision ___ after the board meeting.", ["will make","will be made","made","has made"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - will be made."),
      ex("Customers are ___ to complete a short survey.", ["encourage","encouraged","encouraging","encouragement"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - encouraged."),
      ex("The equipment should ___ carefully before use.", ["inspect","inspected","be inspected","inspecting"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - be inspected.")
    ]
  },
  {
    id: "cau-tuong-thuat",
    order: "13",
    title: "Câu tường thuật",
    level: "Ứng dụng",
    time: "25 phút",
    summary: "Tường thuật lời nói, câu hỏi và mệnh lệnh với lùi thì, đổi đại từ và trạng từ thời gian.",
    theory: [
      "Câu tường thuật chuyển lời nói trực tiếp sang gián tiếp.",
      "Khi động từ tường thuật ở quá khứ, thường lùi thì: present -> past, past -> past perfect, will -> would.",
      "Đại từ, trạng từ chỉ thời gian và nơi chốn cần đổi theo ngữ cảnh."
    ],
    formulas: ["S + said/told + (that) + clause", "S + asked + if/whether + clause", "S + told/asked + O + to V"],
    examples: [
      { en: "He said that he was tired.", vi: "I am tired đổi thành he was tired." },
      { en: "She asked me where I lived.", vi: "Câu hỏi gián tiếp dùng trật tự câu kể." }
    ],
    mistakes: [
      "Không giữ trật tự câu hỏi trong câu hỏi gián tiếp: where you live là sai trong She asked where you lived.",
      "Tell cần tân ngữ: told me, told him."
    ],
    exercises: [
      ex("Mr. Adams said that he ___ the report by Friday.", ["finishes","will finish","would finish","finish"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - would finish."),
      ex("She asked whether the meeting ___ been postponed.", ["has","had","have","having"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - had."),
      ex("The manager told us ___ late for the conference.", ["not be","not to be","do not be","not being"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - not to be."),
      ex("Ms. Taylor said she ___ the client the previous day.", ["meets","met","had met","has met"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - had met."),
      ex("He asked me where I ___ the files.", ["store","stored","storing","stores"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - stored."),
      ex("The supervisor said that the office ___ closed on Monday.", ["is","was","has","will"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - was."),
      ex("They asked if we ___ available for a meeting the next morning.", ["are","were","will be","have been"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - were."),
      ex("The director told employees ___ their passwords regularly.", ["update","updating","to update","updated"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to update."),
      ex("Sarah said that she ___ working on the budget at that moment.", ["is","was","has been","will be"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - was."),
      ex("The client asked when the shipment ___.", ["arrives","arrived","would arrive","arriving"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - would arrive.")
    ]
  },
  {
    id: "menh-de-quan-he",
    order: "14",
    title: "Mệnh đề quan hệ",
    level: "Ứng dụng",
    time: "24 phút",
    summary: "Dùng who, whom, which, that, whose, where, when để bổ sung thông tin cho danh từ.",
    theory: [
      "Mệnh đề quan hệ bổ nghĩa cho danh từ đứng trước nó.",
      "Who dùng cho người làm chủ ngữ; whom dùng cho người làm tân ngữ; which dùng cho vật; whose chỉ sở hữu.",
      "Mệnh đề xác định không dùng dấu phẩy; mệnh đề không xác định dùng dấu phẩy và không dùng that."
    ],
    formulas: ["Noun + who/which/that + clause", "Noun + whose + noun + clause", "Place + where + clause"],
    examples: [
      { en: "The woman who lives next door is a doctor.", vi: "Who bổ nghĩa cho the woman." },
      { en: "This is the book that I told you about.", vi: "That thay cho the book." }
    ],
    mistakes: [
      "Không dùng that trong mệnh đề quan hệ không xác định.",
      "Whose đi với danh từ phía sau: whose car, whose idea."
    ],
    exercises: [
      ex("The employee ___ submitted the report early received praise.", ["who","which","where","when"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - who."),
      ex("The laptop ___ I purchased last month has already stopped working.", ["who","whose","which","where"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - which."),
      ex("The hotel ___ we stayed during the conference was excellent.", ["when","where","which","whose"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - where."),
      ex("The manager ___ office is on the fifth floor is unavailable today.", ["who","whom","whose","which"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - whose."),
      ex("The restaurant ___ opened downtown is already very popular.", ["who","that","where","whose"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - that."),
      ex("The applicant ___ we interviewed yesterday has strong experience.", ["whom","which","whose","where"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - whom."),
      ex("The day ___ the product was launched was extremely busy.", ["where","when","which","whose"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - when."),
      ex("The company has hired a consultant ___ specializes in digital marketing.", ["who","which","where","when"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - who."),
      ex("The document ___ you requested is attached to this email.", ["who","whose","that","where"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - that."),
      ex("The city ___ our new branch is located has excellent transportation.", ["which","where","when","whose"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - where.")
    ]
  },
  {
    id: "gerund-infinitive",
    order: "15",
    title: "Gerund / Infinitive",
    level: "Ứng dụng",
    time: "25 phút",
    summary: "Chọn V-ing hoặc to V sau động từ, giới từ và tính từ.",
    theory: [
      "Gerund là V-ing dùng như danh từ; infinitive là to + V.",
      "Một số động từ theo sau bởi V-ing như enjoy, avoid, finish, keep.",
      "Một số động từ theo sau bởi to V như want, decide, hope, plan."
    ],
    formulas: ["verb + V-ing", "verb + to V", "preposition + V-ing"],
    examples: [
      { en: "I enjoy reading books.", vi: "Enjoy đi với V-ing." },
      { en: "She decided to study abroad.", vi: "Decide đi với to V." }
    ],
    mistakes: [
      "Sau giới từ dùng V-ing: interested in learning, good at speaking.",
      "Một số động từ đổi nghĩa theo dạng sau: remember doing khác remember to do."
    ],
    exercises: [
      ex("We decided ___ the conference until next month.", ["postpone","postponing","to postpone","postponed"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to postpone."),
      ex("Ms. Rivera enjoys ___ with international clients.", ["work","working","to work","worked"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - working."),
      ex("The manager agreed ___ the proposal again.", ["review","reviewing","to review","reviewed"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to review."),
      ex("Employees are responsible for ___ their passwords secure.", ["keep","keeping","to keep","kept"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - keeping."),
      ex("The company plans ___ a new branch overseas.", ["open","opening","to open","opened"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to open."),
      ex("Please avoid ___ confidential information by email.", ["send","sending","to send","sent"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - sending."),
      ex("Mr. Kim offered ___ us with the presentation.", ["help","helping","to help","helped"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to help."),
      ex("The director suggested ___ the budget before approval.", ["revise","revising","to revise","revised"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - revising."),
      ex("We look forward to ___ you at the annual conference.", ["see","seeing","to see","saw"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - seeing."),
      ex("The technician refused ___ the equipment without proper authorization.", ["repair","repairing","to repair","repaired"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to repair.")
    ]
  },
  {
    id: "cau-hoi",
    order: "16",
    title: "Câu hỏi",
    level: "Nền tảng",
    time: "22 phút",
    summary: "Tạo Yes/No questions, Wh-questions, tag questions và câu hỏi gián tiếp.",
    theory: [
      "Yes/No questions đảo trợ động từ lên trước chủ ngữ.",
      "Wh-questions dùng từ hỏi như what, when, where, why, who, how.",
      "Câu hỏi gián tiếp dùng trật tự câu kể, không đảo trợ động từ như câu hỏi trực tiếp."
    ],
    formulas: ["Auxiliary + S + V?", "Wh-word + auxiliary + S + V?", "Could you tell me + wh-word + S + V?"],
    examples: [
      { en: "Do you like English?", vi: "Yes/No question với trợ động từ do." },
      { en: "Where does she live?", vi: "Wh-question với does." }
    ],
    mistakes: [
      "Không quên đưa động từ chính về nguyên mẫu sau do/does/did.",
      "Không đảo từ trong câu hỏi gián tiếp: Do you know where he lives?"
    ],
    exercises: [
      ex("___ the marketing team finished the campaign plan?", ["Has","Does","Is","Did"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - Has."),
      ex("Where ___ the conference be held this year?", ["does","is","will","has"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - will."),
      ex("___ you send me the updated invoice, please?", ["Could","Must","Should","May to"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - Could."),
      ex("How often ___ the company hold training sessions?", ["do","does","is","has"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - does."),
      ex("You attended yesterday's meeting, ___?", ["did you","didn't you","do you","aren't you"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - didn't you."),
      ex("Could you tell me where the nearest copy room ___?", ["is","does","has","be"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - is."),
      ex("Why ___ the shipment delayed?", ["did","was","has","does"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - was."),
      ex("Who ___ responsible for booking the venue?", ["are","is","do","have"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - is."),
      ex("The report is complete, ___?", ["is it","isn't it","does it","didn't it"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - isn't it."),
      ex("Do you know when Mr. Carter ___ back from his business trip?", ["returns","does return","returning","return"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - returns.")
    ]
  },
  {
    id: "cau-phu-dinh",
    order: "17",
    title: "Câu phủ định",
    level: "Nền tảng",
    time: "20 phút",
    summary: "Tạo câu phủ định với not, no, never, hardly và trợ động từ đúng.",
    theory: [
      "Câu phủ định thường dùng not sau trợ động từ hoặc động từ be.",
      "Với động từ thường ở Present Simple/Past Simple, cần do/does/did + not + V nguyên mẫu.",
      "Never, hardly, rarely đã mang nghĩa phủ định hoặc gần phủ định nên không dùng thêm not trong cùng ý."
    ],
    formulas: ["S + be + not + complement", "S + do/does/did + not + base verb", "S + have/has + not + V3/ed"],
    examples: [
      { en: "She does not like coffee.", vi: "Does not đi với động từ nguyên mẫu like." },
      { en: "I have never been to London.", vi: "Never mang nghĩa chưa bao giờ." }
    ],
    mistakes: [
      "Không viết She doesn't likes. Sau doesn't dùng động từ nguyên mẫu.",
      "Tránh phủ định kép trong tiếng Anh chuẩn: I don't know anything, không phải I don't know nothing."
    ],
    exercises: [
      ex("The manager did ___ approve the revised budget.", ["no","not","never","none"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - not."),
      ex("We have ___ received confirmation from the supplier.", ["not","no","none","nothing"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - not."),
      ex("There are ___ available seats for the morning session.", ["no","not","never","neither"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - no."),
      ex("Employees should ___ share their passwords with anyone.", ["no","not","none","nothing"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - not."),
      ex("The client has ___ complained about our service before.", ["never","no","none","not ever"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - never."),
      ex("The printer is ___ working properly today.", ["no","not","none","never"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - not."),
      ex("We found ___ errors in the final version of the report.", ["no","not","never","nothing"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - no."),
      ex("Mr. Han hardly ___ misses a team meeting.", ["ever","never","no","not"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - ever."),
      ex("The company does ___ allow smoking inside the building.", ["not","no","never","none"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - not."),
      ex("There is ___ reason to delay the project any further.", ["no","not","none","never"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - no.")
    ]
  },
  {
    id: "cau-truc-thong-dung",
    order: "18",
    title: "Cấu trúc thông dụng",
    level: "Ứng dụng",
    time: "24 phút",
    summary: "Ôn các mẫu câu hay gặp như used to, be used to, too/enough, so/such, would rather.",
    theory: [
      "Used to + V diễn tả thói quen trong quá khứ không còn đúng ở hiện tại.",
      "Be/get used to + noun/V-ing diễn tả việc quen với điều gì, khác với used to + V.",
      "Too/enough, so/such, prefer và would rather giúp viết câu tự nhiên hơn khi diễn tả mức độ, sở thích và lựa chọn."
    ],
    formulas: [
      "S + used to + base verb",
      "S + be/get used to + noun/V-ing",
      "too + adjective/adverb + to V",
      "adjective/adverb + enough + to V"
    ],
    examples: [
      { en: "I used to live in Da Nang.", vi: "Trước đây tôi từng sống ở Đà Nẵng, hiện tại có thể không còn." },
      { en: "She is used to working under pressure.", vi: "Cô ấy đã quen với việc làm việc dưới áp lực." }
    ],
    mistakes: [
      "Không nhầm used to + V với be used to + V-ing.",
      "Enough đứng sau tính từ/trạng từ nhưng trước danh từ: old enough, enough time."
    ],
    exercises: [
      ex("I used to ___ by train before I bought a car.", ["commute","commuting","commuted","to commute"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - commute."),
      ex("Ms. Park is used to ___ under pressure.", ["work","working","worked","to work"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - working."),
      ex("The meeting room is too small ___ forty people.", ["accommodate","accommodating","to accommodate","accommodated"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to accommodate."),
      ex("The instructions are clear enough ___ without assistance.", ["follow","following","to follow","followed"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to follow."),
      ex("The presentation was so informative ___ everyone stayed until the end.", ["that","such","enough","too"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - that."),
      ex("It was such a successful event ___ the company decided to hold it again.", ["so","that","enough","too"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - that."),
      ex("I would rather ___ the report today than wait until Monday.", ["finish","finishing","to finish","finished"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - finish."),
      ex("The company had better ___ the issue immediately.", ["address","addressing","to address","addressed"], 0, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: A - address."),
      ex("The new software makes it easier ___ customer information.", ["manage","managing","to manage","managed"], 2, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: C - to manage."),
      ex("The manager asked us to keep ___ the project until it is completed.", ["work on","working on","to work on","worked on"], 1, "Look at the words around the blank and choose the correct grammar form.", "Correct answer: B - working on.")
    ]
  }
];

const grammarTopicEnhancements = {
  "danh-tu": {
    theory: [
      "Khi viết câu, hãy xác định danh từ đang là chủ ngữ, tân ngữ hay bổ ngữ để chọn đúng mạo từ, lượng từ và dạng số nhiều.",
      "Danh từ tập hợp như team, family, staff có thể nhấn mạnh cả nhóm hoặc từng thành viên tùy ngữ cảnh."
    ],
    formulas: ["a/an + singular countable noun", "some/any + plural countable noun or uncountable noun", "noun + 's / of + noun"],
    examples: [
      { en: "The team is preparing its final report.", vi: "Team được xem như một đơn vị nên dùng is và its." },
      { en: "I need two pieces of advice.", vi: "Advice không đếm được, cần dùng piece of advice khi muốn đếm." }
    ],
    mistakes: ["Không thêm s cho information, furniture, homework, equipment.", "Không dùng a/an với danh từ không đếm được."]
  },
  "dong-tu": {
    theory: [
      "Động từ quyết định khung câu: có động từ cần tân ngữ, có động từ cần tính từ bổ nghĩa, có động từ đi với V-ing hoặc to V.",
      "Trợ động từ như do, be, have giúp tạo câu hỏi, phủ định, tiếp diễn và hoàn thành."
    ],
    formulas: ["Subject + transitive verb + object", "Subject + linking verb + adjective/noun", "Modal verb + base verb"],
    examples: [
      { en: "The soup tastes salty.", vi: "Taste là linking verb, phía sau dùng tính từ salty." },
      { en: "She explained the rule clearly.", vi: "Explain là ngoại động từ, cần tân ngữ the rule." }
    ],
    mistakes: ["Không dùng to sau modal verbs: can go, must study.", "Không bỏ tân ngữ với các động từ cần tân ngữ như discuss, explain, attend."]
  },
  "tinh-tu": {
    theory: [
      "Tính từ nêu phẩm chất, trạng thái, kích thước, tuổi, màu sắc, nguồn gốc hoặc chất liệu của danh từ.",
      "Một số tính từ kết thúc bằng -ed mô tả cảm xúc của người; -ing mô tả thứ gây ra cảm xúc đó."
    ],
    formulas: ["linking verb + adjective", "opinion + size + age + shape + color + origin + material + noun", "so/too/very + adjective"],
    examples: [
      { en: "The lesson was confusing, so I felt confused.", vi: "Confusing mô tả bài học; confused mô tả cảm xúc của người học." },
      { en: "She bought a beautiful small wooden box.", vi: "Beautiful, small, wooden đứng theo thứ tự tự nhiên trước danh từ." }
    ],
    mistakes: ["Không dùng trạng từ sau linking verbs: feel happy, không phải feel happily.", "Không đặt nhiều tính từ tùy tiện trước danh từ."]
  },
  "trang-tu": {
    theory: [
      "Trạng từ có thể bổ nghĩa cho hành động, mức độ, tần suất, thời gian, nơi chốn hoặc thái độ của cả câu.",
      "Vị trí trạng từ thay đổi theo loại: trạng từ tần suất thường đứng trước động từ thường, sau be."
    ],
    formulas: ["frequency adverb + main verb", "be + frequency adverb", "verb + manner adverb"],
    examples: [
      { en: "She usually studies after dinner.", vi: "Usually đứng trước động từ thường studies." },
      { en: "He answered the question surprisingly well.", vi: "Surprisingly bổ nghĩa cho well, well bổ nghĩa cho answered." }
    ],
    mistakes: ["Hard là trạng từ nghĩa là chăm chỉ/mạnh, hardly nghĩa là hầu như không.", "Không phải trạng từ nào cũng thêm -ly: fast, late, well."]
  },
  "mao-tu": {
    theory: [
      "Mạo từ giúp người nghe biết danh từ đang được nói chung, nhắc lần đầu hay đã xác định.",
      "Âm đầu quyết định a/an, không phải chữ cái đầu: an hour, a university."
    ],
    formulas: ["a/an + singular countable noun", "the + specific noun", "zero article + plural/general noun"],
    examples: [
      { en: "I saw a dog. The dog was very small.", vi: "A dùng khi nhắc lần đầu; the dùng khi người nghe đã biết con chó nào." },
      { en: "Children need time to play.", vi: "Children nói chung nên không dùng the." }
    ],
    mistakes: ["Không dùng the khi nói khái quát về danh từ số nhiều.", "Không quên mạo từ trước danh từ đếm được số ít."]
  },
  "gioi-tu": {
    theory: [
      "Giới từ thường đi theo cụm cố định, vì vậy cần học theo cụm như interested in, good at, responsible for.",
      "At nhấn điểm cụ thể, on nhấn bề mặt/ngày, in nhấn không gian hoặc khoảng thời gian rộng."
    ],
    formulas: ["adjective + preposition", "verb + preposition + object", "preposition + noun phrase"],
    examples: [
      { en: "She is responsible for the schedule.", vi: "Responsible thường đi với for." },
      { en: "We met at the station on Friday in March.", vi: "At địa điểm cụ thể, on ngày, in tháng." }
    ],
    mistakes: ["Không dịch từng chữ giới từ từ tiếng Việt sang tiếng Anh.", "Không dùng in Monday; ngày trong tuần dùng on."]
  },
  "so-sanh": {
    theory: [
      "So sánh hơn nhấn sự khác biệt giữa hai đối tượng; so sánh nhất nhấn một đối tượng nổi bật trong một nhóm.",
      "Tính từ ngắn thường thêm -er/-est; tính từ dài dùng more/most; một số từ bất quy tắc cần học riêng."
    ],
    formulas: ["comparative + than", "the + superlative + noun", "as + adjective/adverb + as"],
    examples: [
      { en: "This route is less crowded than the main road.", vi: "Less dùng để so sánh mức độ ít hơn." },
      { en: "It is one of the most useful tools.", vi: "One of đi với the most và danh từ số nhiều." }
    ],
    mistakes: ["Không dùng more better hoặc most easiest.", "Sau than cần đối tượng được so sánh rõ ràng."]
  },
  "modal-verbs": {
    theory: [
      "Modal verbs thể hiện thái độ của người nói: khả năng, mức độ chắc chắn, lời khuyên, sự cho phép hoặc nghĩa vụ.",
      "Modal verbs không chia theo chủ ngữ và động từ sau modal luôn ở dạng nguyên mẫu."
    ],
    formulas: ["modal + base verb", "modal + not + base verb", "modal + subject + base verb?"],
    examples: [
      { en: "You should review the notes before class.", vi: "Should đưa ra lời khuyên." },
      { en: "The package might arrive today.", vi: "Might diễn tả khả năng không chắc chắn." }
    ],
    mistakes: ["Không dùng to sau should, must, can.", "Must not là cấm; don't have to là không cần, hai nghĩa khác nhau."]
  },
  "cau-dieu-kien": {
    theory: [
      "Câu điều kiện cần khớp giữa mức độ thật/giả định và thời gian của kết quả.",
      "Nếu mệnh đề if đứng đầu câu, thường dùng dấu phẩy trước mệnh đề chính."
    ],
    formulas: ["If + present simple, will + base verb", "If + past simple, would + base verb", "If + past perfect, would have + V3"],
    examples: [
      { en: "If you heat water to 100°C, it boils.", vi: "Loại 0 nói về sự thật chung." },
      { en: "If I had left earlier, I would have caught the bus.", vi: "Loại 3 nói về điều không xảy ra trong quá khứ." }
    ],
    mistakes: ["Không dùng will trong mệnh đề if của điều kiện loại 1.", "Không trộn loại 2 và loại 3 nếu không có ý mixed conditional rõ ràng."]
  },
  "cau-bi-dong": {
    theory: [
      "Câu bị động hữu ích khi đối tượng chịu tác động quan trọng hơn người thực hiện hành động.",
      "By + agent chỉ dùng khi người thực hiện hành động thật sự cần thiết."
    ],
    formulas: ["object + be + V3/ed", "object + modal + be + V3/ed", "object + have/has been + V3/ed"],
    examples: [
      { en: "The report has been updated.", vi: "Hiện tại hoàn thành bị động: has been updated." },
      { en: "The meeting can be moved to Friday.", vi: "Modal bị động: can be moved." }
    ],
    mistakes: ["Không quên chia be theo thì của câu.", "Không dùng bị động với động từ nội động không có tân ngữ như happen, arrive, sleep."]
  },
  "cau-tuong-thuat": {
    theory: [
      "Câu tường thuật cần đổi đại từ, trạng từ thời gian/nơi chốn và thường lùi thì khi động từ tường thuật ở quá khứ.",
      "Câu hỏi gián tiếp dùng trật tự câu kể, không đảo trợ động từ như câu hỏi trực tiếp."
    ],
    formulas: ["said that + clause", "asked + object + if/whether + clause", "told + object + to V"],
    examples: [
      { en: "She said that she was working from home.", vi: "Am working lùi thành was working." },
      { en: "He asked me where I lived.", vi: "Câu hỏi gián tiếp dùng I lived, không dùng did I live." }
    ],
    mistakes: ["Không giữ nguyên today, tomorrow, here nếu ngữ cảnh đã đổi.", "Không dùng said me; dùng told me hoặc said to me."]
  },
  "menh-de-quan-he": {
    theory: [
      "Mệnh đề quan hệ giúp nối câu và tránh lặp danh từ, nhưng cần phân biệt thông tin thiết yếu và thông tin bổ sung.",
      "Mệnh đề không xác định cần dấu phẩy và không dùng that thay cho who/which."
    ],
    formulas: ["noun + who/which/that + verb", "noun + whose + noun", "place + where + clause"],
    examples: [
      { en: "The app that I use every day is simple.", vi: "That thay cho app và làm tân ngữ trong mệnh đề quan hệ." },
      { en: "My brother, who lives in Hue, is a teacher.", vi: "Thông tin bổ sung nên đặt giữa hai dấu phẩy." }
    ],
    mistakes: ["Không dùng where cho người hoặc vật không phải nơi chốn.", "Không bỏ dấu phẩy trong mệnh đề quan hệ không xác định."]
  },
  "gerund-infinitive": {
    theory: [
      "Gerund nhấn hoạt động như một danh từ; infinitive thường nhấn mục đích, dự định hoặc hành động hướng tới.",
      "Một số động từ đổi nghĩa khi đi với V-ing hoặc to V như remember, stop, try."
    ],
    formulas: ["verb + V-ing", "verb + to V", "preposition + V-ing"],
    examples: [
      { en: "I stopped smoking last year.", vi: "Stop + V-ing nghĩa là dừng hẳn việc hút thuốc." },
      { en: "I stopped to call my mother.", vi: "Stop + to V nghĩa là dừng lại để làm việc khác." }
    ],
    mistakes: ["Sau giới từ dùng V-ing, không dùng to V.", "Không học máy móc mọi động từ; cần học theo cụm verb pattern."]
  },
  "cau-hoi": {
    theory: [
      "Câu hỏi tiếng Anh cần xác định có động từ be, trợ động từ, modal verb hay động từ thường để đảo đúng.",
      "Câu hỏi lịch sự thường dùng indirect question với trật tự câu kể."
    ],
    formulas: ["auxiliary + subject + base verb?", "Wh-word + auxiliary + subject + verb?", "Could you tell me + clause?"],
    examples: [
      { en: "How long have you studied English?", vi: "How long đi với hiện tại hoàn thành khi hỏi khoảng thời gian đến hiện tại." },
      { en: "Could you tell me where the station is?", vi: "Câu hỏi gián tiếp không đảo is ra trước chủ ngữ." }
    ],
    mistakes: ["Không dùng hai trợ động từ sai chỗ như Do you can...?", "Không quên trợ động từ do/does/did với động từ thường."]
  },
  "cau-phu-dinh": {
    theory: [
      "Phủ định cần đặt not đúng sau trợ động từ hoặc be; với động từ thường cần do/does/did.",
      "Một số từ đã mang nghĩa phủ định như never, hardly, rarely nên tránh dùng thêm not gây double negative."
    ],
    formulas: ["subject + be + not", "subject + do/does/did + not + base verb", "subject + have/has + not + V3"],
    examples: [
      { en: "She does not agree with the plan.", vi: "Does not đi với động từ nguyên mẫu agree." },
      { en: "I have never tried this dish.", vi: "Never đã mang nghĩa chưa bao giờ." }
    ],
    mistakes: ["Không viết she doesn't likes.", "Không dùng not never trong tiếng Anh chuẩn."]
  },
  "cau-truc-thong-dung": {
    theory: [
      "Các cấu trúc thông dụng giúp câu tự nhiên hơn nhưng cần phân biệt sắc thái: thói quen cũ, mức độ quá/đủ, kết quả và sở thích.",
      "Nên học cấu trúc theo ví dụ trọn câu thay vì chỉ nhớ công thức rời."
    ],
    formulas: ["so + adjective + that + clause", "such + adjective + noun + that + clause", "would rather + base verb"],
    examples: [
      { en: "The room was so quiet that I could hear the clock.", vi: "So + adjective + that diễn tả kết quả." },
      { en: "I would rather stay home tonight.", vi: "Would rather + V diễn tả lựa chọn muốn làm hơn." }
    ],
    mistakes: ["Không dùng would rather to stay.", "Phân biệt too tired to work và tired enough to sleep."]
  }
};

grammarTopics.forEach((topic) => {
  const extra = grammarTopicEnhancements[topic.id];
  if (!extra) return;
  topic.theory = [...topic.theory, ...(extra.theory || [])];
  topic.formulas = [...topic.formulas, ...(extra.formulas || [])];
  topic.examples = [...topic.examples, ...(extra.examples || [])];
  topic.mistakes = [...topic.mistakes, ...(extra.mistakes || [])];
});

if (typeof window !== "undefined") {
  window.GRAMMAR_TOPICS_FALLBACK = cloneGrammarTopics(grammarTopics);
  window.grammarTopics = grammarTopics;
  window.loadGrammarTopicsFromApi = loadGrammarTopicsFromApi;
}

async function loadGrammarTopicsFromApi() {
  try {
    const response = await fetch("api/learning_content.php?section=grammar", {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) return false;

    const result = await response.json();
    const loaded = Array.isArray(result.items)
      ? result.items.map(normalizeGrammarTopic).filter(Boolean)
      : [];

    if (!loaded.length) return false;
    grammarTopics = loaded;
    if (typeof window !== "undefined") {
      window.grammarTopics = grammarTopics;
      window.GRAMMAR_TOPICS_SOURCE = result.source || "database";
    }
    return true;
  } catch (error) {
    console.warn("Grammar content API unavailable; using bundled topics.", error);
    return false;
  }
}

function normalizeGrammarTopic(item, index) {
  const payload = item?.payload && typeof item.payload === "object" ? item.payload : item;
  if (!payload || typeof payload !== "object") return null;

  const sortOrder = Number(item?.sortOrder || payload.order || index + 1);
  const topic = {
    ...payload,
    id: item?.key || payload.id,
    order: String(payload.order || sortOrder || index + 1).padStart(2, "0"),
    title: payload.title || item?.title || item?.key,
    level: payload.level || item?.level || "Core",
    time: payload.time || "20 phút",
    summary: payload.summary || payload.description || item?.description || "",
    theory: Array.isArray(payload.theory) ? payload.theory : [],
    formulas: Array.isArray(payload.formulas) ? payload.formulas : [],
    examples: Array.isArray(payload.examples) ? payload.examples : [],
    mistakes: Array.isArray(payload.mistakes) ? payload.mistakes : [],
    exercises: Array.isArray(payload.exercises) ? payload.exercises : []
  };

  return topic.id && topic.title && topic.exercises.length ? topic : null;
}

function cloneGrammarTopics(topics) {
  try {
    return JSON.parse(JSON.stringify(topics));
  } catch (error) {
    return topics.map((topic) => ({ ...topic }));
  }
}
