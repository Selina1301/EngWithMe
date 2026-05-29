(function () {
  const STORAGE_KEY = "engWithMeListeningLabState";

  const modes = {
    slow: { label: "Slow Mode", note: "Nghe rõ từng chữ, tốc độ chậm để bắt âm.", rate: 0.78, native: false, noise: false },
    natural: { label: "Natural Mode", note: "Tốc độ hội thoại thực tế.", rate: 1, native: false, noise: false },
    native: { label: "Native Mode", note: "Tốc độ nhanh hơn, có nối âm và dạng nói thật.", rate: 1.24, native: true, noise: false },
    chaos: { label: "Chaos Mode", note: "Có tiếng nền nhẹ để mô phỏng đời thật.", rate: 1.08, native: false, noise: true }
  };

  const mistakeLabels = {
    connected: "Nối âm",
    ending: "Âm cuối",
    fast: "Tốc độ nhanh",
    reduced: "Nuốt âm",
    numbers: "Số / thời gian",
    accent: "Khác accent",
    noise: "Tiếng ồn nền",
    emotion: "Nghe sắc thái"
  };

  const defaultGoal = "self-introduction";

  const goalText = {
    "self-introduction": "Giới thiệu bản thân",
    "family-friends": "Gia đình & bạn bè",
    "work-career": "Công việc & nghề nghiệp",
    "study-school": "Học tập & trường lớp",
    "daily-routine": "Thói quen hằng ngày",
    "shopping-prices": "Mua sắm & giá cả",
    "food-restaurant": "Ăn uống & nhà hàng",
    "travel-directions": "Du lịch & hỏi đường",
    "health-doctor": "Sức khỏe & đi khám",
    "weather-seasons": "Thời tiết & mùa",
    "hobbies-free-time": "Sở thích & thời gian rảnh",
    "news-society": "Tin tức & đời sống",
    "tech-internet": "Công nghệ & Internet"
  };

  const voiceRoutes = [
    { label: "American", lang: "en-US", fallbackLang: "en-US" },
    { label: "British", lang: "en-GB", fallbackLang: "en-GB" },
    { label: "Australian", lang: "en-AU", fallbackLang: "en-GB" },
    { label: "Indian", lang: "en-IN", fallbackLang: "en-GB" },
    { label: "Canadian", lang: "en-CA", fallbackLang: "en-US" },
    { label: "Irish", lang: "en-IE", fallbackLang: "en-GB" }
  ];

  const missions = [
    {
      id: "coffee-shop",
      title: "Coffee Shop Secret",
      label: "Session 1",
      icon: "ti-cup",
      tone: "warm",
      goal: "food-restaurant",
      accent: "American",
      noise: "Coffee shop",
      level: "B1",
      badge: "Cafe Listener",
      baseScore: 72,
      opening: "Bạn bước vào quán cà phê ở New York. Nhân viên hỏi rất nhanh, phía sau có tiếng máy pha cà phê.",
      story: "Bạn là khách hàng. Hãy nghe nhân viên phục vụ hỏi và chọn câu phản hồi phù hợp trước khi xem transcript.",
      role: "Khách hàng đang gọi món",
      target: "Hiểu câu hỏi gọi món ở tốc độ tự nhiên",
      transcript: "Are you ready to order, or do you need a few more minutes?",
      nativeLine: "Are ya ready t'order, or d'ya need a few more minutes?",
      connectedSpeech: "Are you -> Are ya / or do you -> or d'ya / to order -> t'order",
      hardPart: "Are you ready to order, or do you",
      questionTitle: "Nhân viên đang hỏi bạn điều gì?",
      context: "Bạn cần phản hồi như một khách hàng trong quán.",
      options: [
        { key: "A", text: "I need a few more minutes.", correct: true },
        { key: "B", text: "Yes, I am food.", correct: false },
        { key: "C", text: "I already paid yesterday.", correct: false }
      ],
      keywords: ["ready", "order", "few", "minutes"],
      gapParts: ["Are you ", { answer: "ready" }, " to order, or do you need a few more ", { answer: "minutes" }, "?"],
      phrases: ["Are you ready", "to order", "or do you need", "a few more minutes"],
      whyHard: [
        "\"Are you\" thường nối thành \"Are ya\", nghe giống một cụm rất ngắn.",
        "\"to order\" bị lướt nhanh thành \"t'order\", người học dễ bỏ mất từ \"to\".",
        "Câu có hai lựa chọn nên trọng âm rơi vào \"ready\", \"order\", \"few\", \"minutes\"."
      ],
      missReason: "Nếu bạn chọn sai, khả năng cao bạn nghe được từ \"order\" nhưng bỏ lỡ cấu trúc câu hỏi hai lựa chọn.",
      mistakes: ["connected", "reduced", "fast"]
    },
    {
      id: "airport",
      title: "Airport Panic",
      label: "Session 2",
      icon: "ti-location-arrow",
      tone: "green",
      goal: "travel-directions",
      accent: "American",
      noise: "Airport announcement",
      level: "B1+",
      badge: "Airport Master",
      baseScore: 74,
      opening: "Bạn vừa đáp xuống sân bay ở New York. Nhân viên hỏi một câu rất nhanh khi bạn đang tìm cổng nối chuyến.",
      story: "Bạn là hành khách. Hãy nghe thông báo và chọn đúng việc cần làm tiếp theo.",
      role: "Hành khách nối chuyến",
      target: "Bắt thông tin cổng, thời gian và hướng di chuyển",
      transcript: "Your connecting flight leaves from gate twenty-four in fifteen minutes.",
      nativeLine: "Yer connecting flight leaves from gate twenny-four in fifteen minutes.",
      connectedSpeech: "Your -> Yer / twenty-four -> twenny-four / fifteen nhấn mạnh âm cuối",
      hardPart: "gate twenty-four in fifteen minutes",
      questionTitle: "Bạn cần chú ý thông tin nào?",
      context: "Chọn phản hồi cho thấy bạn hiểu thông báo sân bay.",
      options: [
        { key: "A", text: "I should go to gate twenty-four now.", correct: true },
        { key: "B", text: "I have twenty-four minutes to buy coffee.", correct: false },
        { key: "C", text: "My flight leaves tomorrow morning.", correct: false }
      ],
      keywords: ["connecting", "gate", "twenty-four", "fifteen"],
      gapParts: ["Your connecting flight leaves from gate ", { answer: "twenty-four" }, " in ", { answer: "fifteen" }, " minutes."],
      phrases: ["Your connecting flight", "leaves from gate twenty-four", "in fifteen minutes"],
      whyHard: [
        "\"twenty-four\" có âm /t/ giữa từ thường bị nói nhẹ.",
        "\"fifteen\" nhấn ở âm cuối, dễ nhầm với \"fifty\" nếu không nghe trọng âm.",
        "Tiếng thông báo sân bay làm người học bỏ lỡ số và thời gian."
      ],
      missReason: "Bạn dễ nhầm fifteen và fifty. Hãy nghe trọng âm: fifTEEN nhấn cuối, FIFty nhấn đầu.",
      mistakes: ["numbers", "ending", "noise"]
    },
    {
      id: "office-call",
      title: "Office Voicemail",
      label: "Session 3",
      icon: "ti-briefcase",
      tone: "green",
      goal: "work-career",
      accent: "British",
      noise: "Phone call",
      level: "B2",
      badge: "Meeting Decoder",
      baseScore: 76,
      opening: "Sếp để lại voicemail ngắn trước cuộc họp. Bạn cần ghi đúng giờ và việc cần chuẩn bị.",
      story: "Bạn là trợ lý. Hãy nghe voicemail và chọn hành động chính xác.",
      role: "Trợ lý văn phòng",
      target: "Ghi lại việc cần làm từ voicemail",
      transcript: "Could you move the client meeting to half past three and send the updated agenda?",
      nativeLine: "Couldja move the client meeting t'half past three 'n send the updated agenda?",
      connectedSpeech: "Could you -> Couldja / to half -> t'half / and -> 'n",
      hardPart: "move the client meeting to half past three",
      questionTitle: "Bạn phải làm gì sau voicemail?",
      context: "Chọn hành động đúng nhất trong môi trường công sở.",
      options: [
        { key: "A", text: "Move the meeting to 3:30 and send the new agenda.", correct: true },
        { key: "B", text: "Cancel the meeting and call the client tomorrow.", correct: false },
        { key: "C", text: "Send the old agenda before 3:00.", correct: false }
      ],
      keywords: ["move", "client meeting", "half past three", "agenda"],
      gapParts: ["Could you move the client meeting to ", { answer: "half past three" }, " and send the updated ", { answer: "agenda" }, "?"],
      phrases: ["Could you move", "the client meeting", "to half past three", "send the updated agenda"],
      whyHard: [
        "\"Could you\" thường biến thành \"Couldja\" khi nói nhanh.",
        "\"half past three\" là cụm thời gian; nếu bỏ một từ sẽ hiểu sai lịch.",
        "Giọng điện thoại làm âm cuối của \"updated\" và \"agenda\" mờ hơn."
      ],
      missReason: "Nếu bạn nghe thiếu giờ hẹn, hãy loop riêng cụm \"half past three\" và chú ý nhịp rơi vào \"three\".",
      mistakes: ["connected", "numbers", "noise"]
    },
    {
      id: "movie-sarcasm",
      title: "Movie Mode: Hidden Meaning",
      label: "Session 4",
      icon: "ti-video-camera",
      tone: "danger",
      goal: "hobbies-free-time",
      accent: "American",
      noise: "Street background",
      level: "B2",
      badge: "Emotion Listener",
      baseScore: 78,
      opening: "Hai nhân vật đang cãi nhau nhẹ. Một câu nghe có vẻ tích cực, nhưng sắc thái lại không đơn giản.",
      story: "Bạn nghe một câu trong phim. Hãy đoán ý nghĩa thật sự phía sau câu nói.",
      role: "Người xem cần hiểu sắc thái",
      target: "Nghe cảm xúc, sarcasm và ý ngầm",
      transcript: "Yeah, that's just great. Now we're going to miss the train.",
      nativeLine: "Yeah, that's jus' great. Now we're gonna miss the train.",
      connectedSpeech: "just -> jus' / going to -> gonna / that's just great có thể là mỉa mai",
      hardPart: "that's just great",
      questionTitle: "Người nói thật sự đang cảm thấy gì?",
      context: "Đừng chỉ nghe từ vựng; hãy nghe ngữ điệu.",
      options: [
        { key: "A", text: "Họ đang khó chịu và mỉa mai.", correct: true },
        { key: "B", text: "Họ rất vui vì kế hoạch tốt hơn.", correct: false },
        { key: "C", text: "Họ đang gọi món ở nhà hàng.", correct: false }
      ],
      keywords: ["yeah", "great", "miss", "train"],
      gapParts: ["Yeah, that's just ", { answer: "great" }, ". Now we're going to miss the ", { answer: "train" }, "."],
      phrases: ["Yeah, that's just great", "Now we're going to", "miss the train"],
      whyHard: [
        "\"great\" không luôn mang nghĩa tích cực; ngữ điệu xuống và ngữ cảnh tạo sắc thái mỉa mai.",
        "\"going to\" trong hội thoại thường thành \"gonna\".",
        "Cụm \"miss the train\" cho biết tình huống đang xấu đi."
      ],
      missReason: "Bạn có thể hiểu từng từ nhưng bỏ lỡ cảm xúc. Hãy nghe pitch và ngữ cảnh sau câu.",
      mistakes: ["emotion", "reduced", "fast"]
    },
    {
      id: "university",
      title: "University Class",
      label: "Session 5",
      icon: "ti-blackboard",
      tone: "green",
      goal: "study-school",
      accent: "Australian",
      noise: "Classroom",
      level: "B2",
      badge: "Lecture Catcher",
      baseScore: 75,
      opening: "Giảng viên nói nhanh ở cuối lớp. Bạn cần biết deadline bài essay trước khi mọi người rời phòng.",
      story: "Bạn là sinh viên. Hãy nghe giảng viên nhắc deadline và yêu cầu nộp bài.",
      role: "Sinh viên trong lớp đại học",
      target: "Bắt deadline và yêu cầu học thuật",
      transcript: "The essay is due next Friday, but you can submit a draft by Monday.",
      nativeLine: "The essay's due nex' Friday, but you can submit a draft by Monday.",
      connectedSpeech: "is due -> 's due / next Friday -> nex' Friday / can có âm yếu",
      hardPart: "due next Friday",
      questionTitle: "Deadline chính thức là khi nào?",
      context: "Chọn câu trả lời đúng về deadline.",
      options: [
        { key: "A", text: "The final essay is due next Friday.", correct: true },
        { key: "B", text: "The final essay is due this Monday.", correct: false },
        { key: "C", text: "There is no draft before the deadline.", correct: false }
      ],
      keywords: ["essay", "due", "next Friday", "draft"],
      gapParts: ["The essay is due ", { answer: "next Friday" }, ", but you can submit a ", { answer: "draft" }, " by Monday."],
      phrases: ["The essay is due", "next Friday", "submit a draft", "by Monday"],
      whyHard: [
        "\"next\" mất âm /t/ khi đứng trước \"Friday\".",
        "Câu có hai mốc thời gian nên người học dễ lấy nhầm Monday làm deadline chính.",
        "\"can\" thường là âm yếu, không được nhấn mạnh."
      ],
      missReason: "Nếu bạn nhầm Monday là deadline chính, hãy phân biệt final deadline và draft deadline.",
      mistakes: ["ending", "numbers", "accent"]
    },
    {
      id: "emergency",
      title: "Emergency Call",
      label: "Session 6",
      icon: "ti-support",
      tone: "danger",
      goal: "health-doctor",
      accent: "American",
      noise: "Street noise",
      level: "B2+",
      badge: "Crisis Listener",
      baseScore: 80,
      opening: "Bạn nghe một cuộc gọi khẩn cấp ngoài đường. Thông tin ngắn, nhanh và có tiếng xe phía sau.",
      story: "Bạn cần hiểu địa điểm và tình trạng để phản hồi đúng.",
      role: "Người hỗ trợ trong tình huống khẩn cấp",
      target: "Bắt thông tin quan trọng trong môi trường ồn",
      transcript: "I need an ambulance near the corner of Fifth and Main right away.",
      nativeLine: "I need an ambulance near the corner'a Fifth 'n Main right away.",
      connectedSpeech: "corner of -> corner'a / and -> 'n / right away nối nhanh",
      hardPart: "corner of Fifth and Main",
      questionTitle: "Xe cứu thương cần đến đâu?",
      context: "Chọn địa điểm chính xác.",
      options: [
        { key: "A", text: "Near the corner of Fifth and Main.", correct: true },
        { key: "B", text: "At the fifth main ambulance station.", correct: false },
        { key: "C", text: "Near the airport gate.", correct: false }
      ],
      keywords: ["ambulance", "corner", "Fifth", "Main"],
      gapParts: ["I need an ambulance near the corner of ", { answer: "Fifth" }, " and ", { answer: "Main" }, " right away."],
      phrases: ["I need an ambulance", "near the corner", "of Fifth and Main", "right away"],
      whyHard: [
        "Tên đường thường là thông tin quan trọng nhất nhưng bị tiếng nền che.",
        "\"of\" và \"and\" đều là âm yếu, dễ biến mất trong tốc độ thật.",
        "\"right away\" báo mức độ khẩn cấp, thường được nói rất nhanh."
      ],
      missReason: "Bạn cần ưu tiên nghe danh từ riêng trong môi trường ồn: Fifth, Main, ambulance.",
      mistakes: ["noise", "connected", "fast"]
    }
  ];

  const missionExpansions = [
    {
      id: "hotel-checkin",
      title: "Hotel Check-in Problem",
      icon: "ti-home",
      tone: "warm",
      goal: "travel-directions",
      accent: "British",
      noise: "Hotel lobby",
      level: "B1",
      badge: "Hotel Listener",
      baseScore: 73,
      opening: "Bạn đến khách sạn sau chuyến bay dài. Lễ tân nói nhanh về phòng và tiền đặt cọc.",
      story: "Bạn là khách nhận phòng. Hãy nghe lễ tân và chọn phản hồi đúng.",
      role: "Khách nhận phòng",
      target: "Hiểu yêu cầu check-in và deposit",
      transcript: "Your room is ready, but I need a card for the security deposit.",
      nativeLine: "Your room's ready, but I need a card for the security deposit.",
      connectedSpeech: "room is -> room's / need a -> needa / security deposit là cụm thông tin chính",
      hardPart: "a card for the security deposit",
      questionTitle: "Lễ tân cần bạn đưa gì?",
      context: "Chọn phản hồi phù hợp khi nhận phòng.",
      correct: "Sure, here is my card.",
      distractors: ["I want to deposit my luggage.", "The room is not security."],
      keywords: ["room", "ready", "card", "deposit"],
      gapParts: ["Your room is ", { answer: "ready" }, ", but I need a card for the security ", { answer: "deposit" }, "."],
      phrases: ["Your room is ready", "I need a card", "for the security deposit"],
      whyHard: ["\"room is\" nối thành \"room's\".", "\"need a\" thường nghe như \"needa\".", "Deposit là từ khóa tài chính dễ bị lướt qua trong lobby ồn."],
      missReason: "Nếu bạn bỏ lỡ deposit, hãy nghe danh từ sau giới từ \"for\" vì đó thường là yêu cầu chính.",
      mistakes: ["connected", "noise", "reduced"]
    },
    {
      id: "taxi-route",
      title: "Taxi Route Change",
      icon: "ti-car",
      tone: "green",
      goal: "travel-directions",
      accent: "American",
      noise: "Traffic",
      level: "B1",
      badge: "Route Catcher",
      baseScore: 72,
      opening: "Bạn đang trên taxi. Tài xế hỏi có muốn đi đường cao tốc để tránh kẹt xe không.",
      story: "Bạn là khách đi taxi. Hãy nghe tài xế và chọn câu trả lời đúng.",
      role: "Khách đi taxi",
      target: "Nghe hướng đi và lựa chọn tuyến đường",
      transcript: "Do you want me to take the highway, or should I avoid the toll?",
      nativeLine: "D'ya want me to take the highway, or should I avoid the toll?",
      connectedSpeech: "Do you -> D'ya / want me to -> wanna me t' / should I -> shoulda-like khi nói nhanh",
      hardPart: "take the highway, or should I avoid the toll",
      questionTitle: "Tài xế đang hỏi gì?",
      context: "Chọn phản hồi đúng về tuyến đường.",
      correct: "Please take the highway.",
      distractors: ["I want to buy a highway.", "The toll is my hotel."],
      keywords: ["highway", "avoid", "toll", "take"],
      gapParts: ["Do you want me to take the ", { answer: "highway" }, ", or should I avoid the ", { answer: "toll" }, "?"],
      phrases: ["Do you want me to", "take the highway", "avoid the toll"],
      whyHard: ["\"Do you\" bị rút thành \"D'ya\".", "Câu có hai lựa chọn nên dễ nghe sót vế sau.", "Toll là từ ngắn, dễ bị tiếng giao thông che."],
      missReason: "Bạn cần bắt hai từ khóa đối lập: highway và toll.",
      mistakes: ["connected", "noise", "fast"]
    },
    {
      id: "lost-luggage",
      title: "Lost Luggage Desk",
      icon: "ti-bag",
      tone: "danger",
      goal: "travel-directions",
      accent: "Australian",
      noise: "Airport desk",
      level: "B1+",
      badge: "Luggage Solver",
      baseScore: 75,
      opening: "Vali của bạn chưa ra băng chuyền. Nhân viên hỏi mô tả vali rất nhanh.",
      story: "Bạn ở quầy hành lý thất lạc. Hãy nghe câu hỏi và chọn câu trả lời đúng.",
      role: "Hành khách mất hành lý",
      target: "Hiểu yêu cầu mô tả đồ vật",
      transcript: "Could you describe the suitcase and tell me where you last saw it?",
      nativeLine: "Couldja describe the suitcase and tell me where ya last saw it?",
      connectedSpeech: "Could you -> Couldja / where you -> where ya / last saw it nối âm /t/ sang /s/",
      hardPart: "where you last saw it",
      questionTitle: "Nhân viên muốn biết điều gì?",
      context: "Chọn câu trả lời cho quầy lost luggage.",
      correct: "It is a black suitcase, and I last saw it at check-in.",
      distractors: ["I saw the airport tomorrow.", "My suitcase can describe me."],
      keywords: ["describe", "suitcase", "where", "last"],
      gapParts: ["Could you describe the ", { answer: "suitcase" }, " and tell me where you last ", { answer: "saw" }, " it?"],
      phrases: ["Could you describe", "the suitcase", "where you last saw it"],
      whyHard: ["\"Could you\" biến thành \"Couldja\".", "Cụm \"last saw it\" có nối âm nhanh.", "Có hai yêu cầu trong một câu: describe và where."],
      missReason: "Nếu bạn chỉ nghe được suitcase, hãy kiểm tra xem câu còn hỏi thêm where/when không.",
      mistakes: ["connected", "ending", "fast"]
    },
    {
      id: "standup-update",
      title: "Daily Stand-up Update",
      icon: "ti-calendar",
      tone: "green",
      goal: "work-career",
      accent: "American",
      noise: "Video call",
      level: "B1+",
      badge: "Stand-up Ready",
      baseScore: 74,
      opening: "Cuộc họp stand-up bắt đầu. Đồng nghiệp nói nhanh về block và deadline.",
      story: "Bạn là thành viên team. Hãy nghe update và chọn việc cần làm tiếp theo.",
      role: "Thành viên dự án",
      target: "Bắt task, blocker và deadline",
      transcript: "I'm blocked on the login bug, but I can send the report by noon.",
      nativeLine: "I'm blocked on the login bug, but I can send the report by noon.",
      connectedSpeech: "blocked on nối /t/ nhẹ / can là âm yếu / by noon là deadline chính",
      hardPart: "send the report by noon",
      questionTitle: "Đồng nghiệp có thể làm gì trước buổi trưa?",
      context: "Chọn hành động đúng trong stand-up.",
      correct: "They can send the report by noon.",
      distractors: ["They fixed the login bug already.", "They need a lunch report."],
      keywords: ["blocked", "login bug", "report", "noon"],
      gapParts: ["I'm blocked on the login ", { answer: "bug" }, ", but I can send the report by ", { answer: "noon" }, "."],
      phrases: ["I'm blocked", "on the login bug", "send the report", "by noon"],
      whyHard: ["\"blocked on\" có âm cuối /t/ rất nhẹ.", "\"can\" không được nhấn mạnh nên dễ bỏ lỡ.", "Noon là deadline ngắn, thường bị nghe lướt."],
      missReason: "Đừng chỉ nghe vấn đề; câu sau \"but\" thường chứa việc vẫn làm được.",
      mistakes: ["ending", "fast", "noise"]
    },
    {
      id: "job-interview",
      title: "Job Interview Follow-up",
      icon: "ti-user",
      tone: "green",
      goal: "self-introduction",
      accent: "British",
      noise: "Quiet room",
      level: "B2",
      badge: "Interview Listener",
      baseScore: 77,
      opening: "Người phỏng vấn hỏi câu follow-up về kinh nghiệm làm việc nhóm.",
      story: "Bạn là ứng viên. Hãy nghe câu hỏi và chọn ý họ muốn biết.",
      role: "Ứng viên phỏng vấn",
      target: "Hiểu câu hỏi follow-up trong interview",
      transcript: "Could you walk me through a time when you had to handle a difficult teammate?",
      nativeLine: "Couldja walk me through a time when you hadta handle a difficult teammate?",
      connectedSpeech: "Could you -> Couldja / had to -> hadta / walk me through là cụm hỏi ví dụ",
      hardPart: "walk me through a time when",
      questionTitle: "Người phỏng vấn muốn bạn nói về điều gì?",
      context: "Chọn hướng trả lời phù hợp.",
      correct: "A past situation with a difficult teammate.",
      distractors: ["A route to the office.", "A teammate who walks too slowly."],
      keywords: ["walk me through", "time", "handle", "teammate"],
      gapParts: ["Could you walk me through a ", { answer: "time" }, " when you had to handle a difficult ", { answer: "teammate" }, "?"],
      phrases: ["Could you walk me through", "a time when", "handle a difficult teammate"],
      whyHard: ["\"walk me through\" không có nghĩa đi bộ thật.", "\"had to\" rút thành \"hadta\".", "Câu dài nên cần bắt cụm hỏi chính."],
      missReason: "Nếu nghe literal từng từ, bạn có thể hiểu sai idiom \"walk me through\".",
      mistakes: ["reduced", "fast", "connected"]
    },
    {
      id: "sales-call",
      title: "Sales Call Objection",
      icon: "ti-comments",
      tone: "warm",
      goal: "shopping-prices",
      accent: "American",
      noise: "Phone call",
      level: "B2",
      badge: "Client Decoder",
      baseScore: 78,
      opening: "Khách hàng nói nhanh vì đang bận. Bạn cần hiểu lý do họ chưa mua.",
      story: "Bạn là sales rep. Hãy nghe phản hồi của khách và chọn next step.",
      role: "Nhân viên sales",
      target: "Nghe objection và next action",
      transcript: "We're interested, but the pricing is a little higher than we expected.",
      nativeLine: "We're interested, but the pricing's a little higher than we expected.",
      connectedSpeech: "pricing is -> pricing's / a little -> alil / than we nối nhanh",
      hardPart: "a little higher than we expected",
      questionTitle: "Khách hàng đang lo ngại điều gì?",
      context: "Chọn phản hồi đúng cho cuộc gọi sales.",
      correct: "They are concerned about the price.",
      distractors: ["They are not interested at all.", "They expected a higher phone call."],
      keywords: ["interested", "pricing", "higher", "expected"],
      gapParts: ["We're interested, but the ", { answer: "pricing" }, " is a little higher than we ", { answer: "expected" }, "."],
      phrases: ["We're interested", "the pricing is", "higher than expected"],
      whyHard: ["\"but\" báo hiệu phần quan trọng phía sau.", "\"pricing is\" rút thành \"pricing's\".", "Cụm so sánh dài dễ bị mất nghĩa."],
      missReason: "Nếu chỉ nghe interested, bạn sẽ bỏ lỡ objection sau \"but\".",
      mistakes: ["reduced", "connected", "fast"]
    },
    {
      id: "it-support",
      title: "IT Support Ticket",
      icon: "ti-settings",
      tone: "green",
      goal: "tech-internet",
      accent: "Indian",
      noise: "Office",
      level: "B1+",
      badge: "Support Listener",
      baseScore: 74,
      opening: "IT support gọi lại về lỗi đăng nhập. Accent khác khiến câu quen thuộc khó nghe hơn.",
      story: "Bạn là nhân viên cần hỗ trợ kỹ thuật. Hãy nghe và chọn việc cần làm.",
      role: "Người dùng nội bộ",
      target: "Nghe hướng dẫn kỹ thuật ngắn",
      transcript: "Please reset your password and try signing in again after five minutes.",
      nativeLine: "Please reset your password and try signing in again after five minutes.",
      connectedSpeech: "reset your nối /t/ sang /j/ / signing in nối /g/ nhẹ / five minutes là thời gian chờ",
      hardPart: "try signing in again after five minutes",
      questionTitle: "Bạn cần làm gì?",
      context: "Chọn bước xử lý ticket.",
      correct: "Reset the password and try again after five minutes.",
      distractors: ["Sign out forever.", "Wait five days before calling."],
      keywords: ["reset", "password", "signing in", "five minutes"],
      gapParts: ["Please reset your ", { answer: "password" }, " and try signing in again after five ", { answer: "minutes" }, "."],
      phrases: ["reset your password", "try signing in again", "after five minutes"],
      whyHard: ["Accent khác làm nhịp câu khác với giọng Mỹ quen thuộc.", "\"signing in\" là cụm phrasal verb.", "Five minutes dễ nhầm thành five seconds nếu vội."],
      missReason: "Bạn cần bắt động từ hành động: reset, try, wait.",
      mistakes: ["accent", "numbers", "fast"]
    },
    {
      id: "office-small-talk",
      title: "Office Small Talk",
      icon: "ti-comment-alt",
      tone: "warm",
      goal: "self-introduction",
      accent: "American",
      noise: "Office pantry",
      level: "A2+",
      badge: "Small Talk Ready",
      baseScore: 70,
      opening: "Đồng nghiệp nói chuyện nhanh ở pantry. Câu rất đơn giản nhưng bị nuốt âm.",
      story: "Bạn là nhân viên mới. Hãy nghe câu hỏi xã giao và chọn phản hồi tự nhiên.",
      role: "Nhân viên mới",
      target: "Phản xạ câu hỏi xã giao",
      transcript: "How's your first week going so far?",
      nativeLine: "How's your first week goin' so far?",
      connectedSpeech: "How is -> How's / going -> goin' / so far là cụm hỏi trải nghiệm tới hiện tại",
      hardPart: "first week going so far",
      questionTitle: "Đồng nghiệp đang hỏi gì?",
      context: "Chọn câu trả lời tự nhiên.",
      correct: "It's going well, thanks.",
      distractors: ["I go by bus every week.", "The first week is far away."],
      keywords: ["first week", "going", "so far"],
      gapParts: ["How's your first ", { answer: "week" }, " going so ", { answer: "far" }, "?"],
      phrases: ["How's your", "first week going", "so far"],
      whyHard: ["\"How is\" rút thành \"How's\".", "\"going\" mất /g/ cuối.", "Câu hỏi xã giao cần hiểu ý, không dịch từng từ."],
      missReason: "Bạn dễ nghe \"going\" thành di chuyển thật; ở đây là hỏi tình hình.",
      mistakes: ["reduced", "ending", "connected"]
    },
    {
      id: "netflix-conversation",
      title: "Netflix Conversation",
      icon: "ti-video-clapper",
      tone: "warm",
      goal: "hobbies-free-time",
      accent: "American",
      noise: "Living room",
      level: "B1",
      badge: "Series Listener",
      baseScore: 72,
      opening: "Hai người đang chọn phim. Họ dùng câu rút gọn như trong hội thoại thật.",
      story: "Bạn nghe một đoạn casual conversation và chọn ý chính.",
      role: "Người nghe hội thoại đời thường",
      target: "Hiểu slang nhẹ và quyết định xem phim",
      transcript: "I don't feel like watching another crime show tonight.",
      nativeLine: "I don' feel like watchin' another crime show tonight.",
      connectedSpeech: "don't -> don' / watching -> watchin' / feel like = muốn làm gì",
      hardPart: "don't feel like watching",
      questionTitle: "Người nói muốn gì?",
      context: "Chọn ý đúng của câu casual.",
      correct: "They do not want to watch another crime show.",
      distractors: ["They feel like a criminal.", "They want two crime shows."],
      keywords: ["don't feel like", "watching", "another", "crime show"],
      gapParts: ["I don't feel like watching another ", { answer: "crime" }, " show ", { answer: "tonight" }, "."],
      phrases: ["I don't feel like", "watching another", "crime show tonight"],
      whyHard: ["\"feel like\" là idiom, không dịch từng từ.", "\"don't\" mất âm /t/.", "\"watching\" thường thành \"watchin'\"."],
      missReason: "Nếu bạn hiểu từng từ riêng lẻ, cụm \"feel like\" sẽ gây nhầm.",
      mistakes: ["reduced", "ending", "emotion"]
    },
    {
      id: "first-date",
      title: "First Date Subtext",
      icon: "ti-heart",
      tone: "warm",
      goal: "family-friends",
      accent: "British",
      noise: "Restaurant",
      level: "B2",
      badge: "Subtext Listener",
      baseScore: 77,
      opening: "Trong buổi hẹn đầu, một câu nghe lịch sự nhưng thật ra là lời từ chối nhẹ.",
      story: "Bạn nghe sắc thái trong hội thoại hẹn hò và chọn ý ngầm.",
      role: "Người xem cần hiểu ý ngầm",
      target: "Nghe polite refusal",
      transcript: "I had a nice time, but I'm not really looking for anything serious right now.",
      nativeLine: "I had a nice time, but I'm not really lookin' for anything serious right now.",
      connectedSpeech: "had a -> hadda / looking -> lookin' / but báo hiệu ý chính phía sau",
      hardPart: "not really looking for anything serious",
      questionTitle: "Ý ngầm của người nói là gì?",
      context: "Chọn cách hiểu đúng sắc thái.",
      correct: "They are politely saying they do not want a serious relationship.",
      distractors: ["They want to schedule a serious meeting.", "They hated the whole evening."],
      keywords: ["nice time", "not really", "serious", "right now"],
      gapParts: ["I had a nice ", { answer: "time" }, ", but I'm not really looking for anything ", { answer: "serious" }, " right now."],
      phrases: ["I had a nice time", "but I'm not really", "looking for anything serious"],
      whyHard: ["\"but\" đổi hướng ý nghĩa của câu.", "\"not really\" làm lời từ chối mềm hơn.", "Sắc thái lịch sự dễ khiến người học hiểu quá tích cực."],
      missReason: "Bạn cần nghe cụm giảm nhẹ như \"not really\" và \"right now\".",
      mistakes: ["emotion", "reduced", "fast"]
    },
    {
      id: "party-gossip",
      title: "Party Gossip",
      icon: "ti-comments-smiley",
      tone: "danger",
      goal: "family-friends",
      accent: "Australian",
      noise: "Party",
      level: "B2",
      badge: "Gossip Decoder",
      baseScore: 78,
      opening: "Bạn nghe lén ở một bữa tiệc. Hai người nói nhanh về một bí mật.",
      story: "Bạn là người nghe lén. Hãy đoán thông tin bị giấu.",
      role: "Người nghe hội thoại trong tiệc",
      target: "Nghe trong tiếng ồn và đoán ngữ cảnh",
      transcript: "Don't tell anyone, but I think she's planning to quit next week.",
      nativeLine: "Don' tell anyone, but I think she's plannin' to quit next week.",
      connectedSpeech: "Don't -> Don' / planning -> plannin' / going to quit không xuất hiện nhưng ý định rõ",
      hardPart: "planning to quit next week",
      questionTitle: "Bí mật là gì?",
      context: "Chọn thông tin chính của đoạn gossip.",
      correct: "She may quit next week.",
      distractors: ["She is planning a party next week.", "They should tell everyone now."],
      keywords: ["don't tell", "planning", "quit", "next week"],
      gapParts: ["Don't tell anyone, but I think she's planning to ", { answer: "quit" }, " next ", { answer: "week" }, "."],
      phrases: ["Don't tell anyone", "I think she's planning", "to quit next week"],
      whyHard: ["Tiếng tiệc che các từ ngắn.", "\"planning\" mất /g/ cuối.", "\"Don't tell anyone\" báo đây là thông tin bí mật."],
      missReason: "Hãy ưu tiên động từ chính sau planning: quit.",
      mistakes: ["noise", "ending", "fast"]
    },
    {
      id: "slang-joke",
      title: "Slang Joke",
      icon: "ti-face-smile",
      tone: "warm",
      goal: "hobbies-free-time",
      accent: "American",
      noise: "Street",
      level: "B2",
      badge: "Slang Catcher",
      baseScore: 76,
      opening: "Một nhân vật nói đùa bằng slang. Nếu dịch từng từ, câu sẽ rất khó hiểu.",
      story: "Bạn nghe slang trong phim và chọn nghĩa tự nhiên.",
      role: "Người xem phim không phụ đề",
      target: "Hiểu slang và humor",
      transcript: "Relax, I'm just messing with you.",
      nativeLine: "Relax, I'm jus' messin' with ya.",
      connectedSpeech: "just -> jus' / messing -> messin' / with you -> with ya",
      hardPart: "just messing with you",
      questionTitle: "Người nói thật sự muốn nói gì?",
      context: "Chọn nghĩa tự nhiên của slang.",
      correct: "They are joking or teasing.",
      distractors: ["They are cleaning a mess.", "They are angry and serious."],
      keywords: ["relax", "just", "messing", "with you"],
      gapParts: ["Relax, I'm just ", { answer: "messing" }, " with ", { answer: "you" }, "."],
      phrases: ["Relax", "I'm just messing", "with you"],
      whyHard: ["\"messing with you\" là slang nghĩa là trêu thôi.", "\"just\" thường mất /t/.", "\"with you\" thành \"with ya\"."],
      missReason: "Nếu dịch \"mess\" là bừa bộn, bạn sẽ hiểu sai joke.",
      mistakes: ["reduced", "connected", "emotion"]
    },
    {
      id: "detective-clue",
      title: "Detective Clue",
      icon: "ti-search",
      tone: "danger",
      goal: "news-society",
      accent: "British",
      noise: "Rain",
      level: "B2+",
      badge: "Clue Hunter",
      baseScore: 80,
      opening: "Trong phim trinh thám, một manh mối được nói rất nhỏ dưới tiếng mưa.",
      story: "Bạn nghe một clue quan trọng và chọn kết luận đúng.",
      role: "Người xem phim trinh thám",
      target: "Bắt chi tiết then chốt trong tiếng nền",
      transcript: "He couldn't have taken the train; the station was closed by then.",
      nativeLine: "He couldn't've taken the train; the station was closed by then.",
      connectedSpeech: "couldn't have -> couldn't've / closed by then là mốc thời gian loại trừ",
      hardPart: "the station was closed by then",
      questionTitle: "Manh mối loại trừ điều gì?",
      context: "Chọn suy luận đúng.",
      correct: "He probably did not take the train.",
      distractors: ["The station is open now.", "He closed the train himself."],
      keywords: ["couldn't have", "train", "station", "closed"],
      gapParts: ["He couldn't have taken the ", { answer: "train" }, "; the station was ", { answer: "closed" }, " by then."],
      phrases: ["He couldn't have", "taken the train", "the station was closed"],
      whyHard: ["\"couldn't have\" rút thành một cụm rất ngắn.", "Tiếng mưa che âm cuối.", "Dấu chấm phẩy trong nghĩa nói tạo quan hệ nguyên nhân."],
      missReason: "Cấu trúc couldn't have là suy luận quá khứ, không phải khả năng hiện tại.",
      mistakes: ["reduced", "noise", "fast"]
    },
    {
      id: "weather-forecast",
      title: "Weather Forecast Change",
      icon: "ti-announcement",
      tone: "green",
      goal: "weather-seasons",
      accent: "American",
      noise: "Radio forecast",
      level: "B1",
      badge: "Weather Planner",
      baseScore: 73,
      opening: "Bạn nghe bản tin thời tiết buổi sáng. Người dẫn nói nhanh về mưa lớn và việc đổi kế hoạch ngoài trời.",
      story: "Bạn cần quyết định có nên mang ô và chuyển hoạt động vào trong nhà hay không.",
      role: "Người nghe bản tin thời tiết",
      target: "Bắt nhiệt độ, mưa, gió và thay đổi kế hoạch",
      transcript: "Heavy rain is expected after three, so the outdoor concert may move indoors.",
      nativeLine: "Heavy rain's expected after three, so the outdoor concert may move indoors.",
      connectedSpeech: "rain is -> rain's / expected after nối âm / may move indoors là khả năng đổi địa điểm",
      hardPart: "the outdoor concert may move indoors",
      questionTitle: "Điều gì có thể xảy ra với concert?",
      context: "Chọn thông tin đúng từ bản tin thời tiết.",
      correct: "It may move indoors because of heavy rain.",
      distractors: ["It will start before sunrise.", "It was canceled because of snow."],
      keywords: ["heavy rain", "after three", "outdoor concert", "indoors"],
      gapParts: ["Heavy rain is expected after ", { answer: "three" }, ", so the outdoor concert may move ", { answer: "indoors" }, "."],
      phrases: ["Heavy rain is expected", "after three", "outdoor concert", "move indoors"],
      whyHard: ["\"rain is\" rút thành \"rain's\".", "\"may\" chỉ khả năng, không phải chắc chắn.", "Outdoor/indoors là cặp ý đối lập nên dễ nghe nhầm khi bản tin nhanh."],
      missReason: "Khi nghe weather forecast, hãy bắt weather condition trước rồi mới nghe effect lên kế hoạch.",
      mistakes: ["connected", "fast", "noise"]
    },
    {
      id: "ielts-lecture",
      title: "IELTS Mini Lecture",
      icon: "ti-blackboard",
      tone: "green",
      goal: "study-school",
      accent: "British",
      noise: "Lecture hall",
      level: "B2",
      badge: "Lecture Note Taker",
      baseScore: 78,
      opening: "Một lecturer đưa ra nguyên nhân và kết quả trong câu dài kiểu IELTS.",
      story: "Bạn nghe mini lecture và chọn ý chính.",
      role: "Thí sinh IELTS Listening",
      target: "Bắt cause-effect trong lecture",
      transcript: "The main reason for the decline is not temperature, but loss of habitat.",
      nativeLine: "The main reason for the decline isn't temperature, but loss of habitat.",
      connectedSpeech: "is not -> isn't / but báo ý đúng / loss of nối thành lossof",
      hardPart: "not temperature, but loss of habitat",
      questionTitle: "Nguyên nhân chính là gì?",
      context: "Chọn đáp án theo lecture.",
      correct: "Loss of habitat.",
      distractors: ["Temperature only.", "A decline in reason."],
      keywords: ["main reason", "decline", "not temperature", "habitat"],
      gapParts: ["The main reason for the decline is not ", { answer: "temperature" }, ", but loss of ", { answer: "habitat" }, "."],
      phrases: ["The main reason", "not temperature", "loss of habitat"],
      whyHard: ["Cấu trúc not A but B đặt đáp án sau but.", "\"loss of\" nối âm rất nhanh.", "Lecture có danh từ học thuật dài."],
      missReason: "Nếu nghe temperature rồi chọn luôn, bạn sẽ mắc bẫy not A but B.",
      mistakes: ["connected", "fast", "accent"]
    },
    {
      id: "toeic-direction",
      title: "Map Direction Trap",
      icon: "ti-map",
      tone: "warm",
      goal: "travel-directions",
      accent: "Australian",
      noise: "Station",
      level: "B1+",
      badge: "Map Listener",
      baseScore: 75,
      opening: "Một câu chỉ đường có left/right và landmark nói rất nhanh.",
      story: "Bạn nghe hướng dẫn và chọn điểm đến đúng.",
      role: "Người làm bài map labeling",
      target: "Nghe chỉ đường và landmark",
      transcript: "Go past the ticket office and turn left just before the stairs.",
      nativeLine: "Go past the ticket office and turn left jus' before the stairs.",
      connectedSpeech: "past the nối /t/ nhẹ / just before -> jus' before / turn left là hướng chính",
      hardPart: "turn left just before the stairs",
      questionTitle: "Bạn phải rẽ ở đâu?",
      context: "Chọn chỉ dẫn đúng.",
      correct: "Turn left before the stairs.",
      distractors: ["Turn right after the stairs.", "Go inside the ticket office."],
      keywords: ["ticket office", "turn left", "before", "stairs"],
      gapParts: ["Go past the ticket office and turn ", { answer: "left" }, " just before the ", { answer: "stairs" }, "."],
      phrases: ["Go past the ticket office", "turn left", "before the stairs"],
      whyHard: ["Before/after là bẫy nghe thường gặp.", "\"just\" mất /t/.", "Tiếng station làm landmark khó nghe."],
      missReason: "Hãy bắt thứ tự: past ticket office -> before stairs -> turn left.",
      mistakes: ["ending", "noise", "fast"]
    },
    {
      id: "number-trap",
      title: "Number Trap",
      icon: "ti-stats-up",
      tone: "danger",
      goal: "tech-internet",
      accent: "American",
      noise: "Phone line",
      level: "B1",
      badge: "Number Defender",
      baseScore: 74,
      opening: "Một số điện thoại được đọc qua đường dây hơi rè, có cặp thirteen/thirty.",
      story: "Bạn nghe số và chọn bản ghi đúng.",
      role: "Thí sinh nghe số",
      target: "Phân biệt teen/ty và dãy số",
      transcript: "Please call me back at three one zero, thirteen, forty-eight.",
      nativeLine: "Please call me back at three one oh, thirteen, forty-eight.",
      connectedSpeech: "zero thường đọc là oh / thirteen nhấn âm cuối / forty-eight nối nhẹ",
      hardPart: "three one zero, thirteen, forty-eight",
      questionTitle: "Dãy số nào đúng?",
      context: "Chọn số nghe được.",
      correct: "310-13-48.",
      distractors: ["310-30-48.", "301-13-58."],
      keywords: ["three one zero", "thirteen", "forty-eight"],
      gapParts: ["Please call me back at three one ", { answer: "zero" }, ", thirteen, forty-", { answer: "eight" }, "."],
      phrases: ["call me back", "three one zero", "thirteen forty-eight"],
      whyHard: ["Zero có thể đọc là oh.", "Thirteen nhấn cuối, thirty nhấn đầu.", "Dãy số qua điện thoại không có ngữ cảnh hỗ trợ."],
      missReason: "Khi nghe teen/ty, hãy chú ý trọng âm chứ không chỉ phụ âm.",
      mistakes: ["numbers", "noise", "accent"]
    },
    {
      id: "short-talk-sale",
      title: "Store Promotion",
      icon: "ti-shopping-cart",
      tone: "warm",
      goal: "shopping-prices",
      accent: "British",
      noise: "Store PA",
      level: "B1",
      badge: "Promo Listener",
      baseScore: 73,
      opening: "Một thông báo khuyến mãi trong cửa hàng có điều kiện và thời hạn.",
      story: "Bạn nghe short talk và chọn điều kiện khuyến mãi.",
      role: "Khách nghe thông báo",
      target: "Bắt điều kiện giảm giá",
      transcript: "Customers who spend over fifty pounds today will receive a free delivery voucher.",
      nativeLine: "Customers who spend over fifty pounds today'll receive a free delivery voucher.",
      connectedSpeech: "today will -> today'll / fifty pounds là ngưỡng tiền / free delivery voucher là quyền lợi",
      hardPart: "spend over fifty pounds today",
      questionTitle: "Điều kiện để nhận voucher là gì?",
      context: "Chọn điều kiện đúng.",
      correct: "Spend over fifty pounds today.",
      distractors: ["Spend exactly fifteen pounds.", "Receive delivery before buying."],
      keywords: ["spend", "over fifty", "today", "voucher"],
      gapParts: ["Customers who spend over ", { answer: "fifty" }, " pounds today will receive a free delivery ", { answer: "voucher" }, "."],
      phrases: ["Customers who spend", "over fifty pounds today", "free delivery voucher"],
      whyHard: ["Fifty/fifteen là bẫy số.", "\"today will\" nối thành \"today'll\".", "Thông báo PA có tiếng vang."],
      missReason: "Trong promotion, hãy nghe condition trước reward.",
      mistakes: ["numbers", "connected", "noise"]
    },
    {
      id: "opinion-summary",
      title: "Opinion Summary",
      icon: "ti-thought",
      tone: "green",
      goal: "news-society",
      accent: "American",
      noise: "Class discussion",
      level: "B2",
      badge: "Opinion Catcher",
      baseScore: 77,
      opening: "Một người đổi ý giữa câu bằng however. Đây là dạng bẫy ý kiến trong bài thi.",
      story: "Bạn nghe ý kiến và chọn thái độ cuối cùng.",
      role: "Thí sinh nghe discussion",
      target: "Bắt opinion shift",
      transcript: "I liked the proposal at first; however, the budget seems unrealistic.",
      nativeLine: "I liked the proposal at first; however, the budget seems unrealistic.",
      connectedSpeech: "liked the nối âm / however đổi hướng ý kiến / budget seems nối /t s/",
      hardPart: "however, the budget seems unrealistic",
      questionTitle: "Thái độ cuối cùng là gì?",
      context: "Chọn ý đúng sau từ chuyển hướng.",
      correct: "They are concerned about the budget.",
      distractors: ["They fully support the proposal.", "They dislike every proposal."],
      keywords: ["liked", "however", "budget", "unrealistic"],
      gapParts: ["I liked the proposal at first; however, the ", { answer: "budget" }, " seems ", { answer: "unrealistic" }, "."],
      phrases: ["liked the proposal", "however", "budget seems unrealistic"],
      whyHard: ["However báo ý sau mới quyết định đáp án.", "\"liked the\" nối âm /d th/.", "Unrealistic là từ dài dễ nghe thiếu âm đầu."],
      missReason: "Đừng chọn ý đầu câu khi có however/but/yet.",
      mistakes: ["connected", "fast", "emotion"]
    },
    {
      id: "library-request",
      title: "Library Request",
      icon: "ti-book",
      tone: "green",
      goal: "study-school",
      accent: "British",
      noise: "Library desk",
      level: "B1",
      badge: "Library Ready",
      baseScore: 72,
      opening: "Thủ thư nói nhỏ về việc gia hạn sách và phí trễ hạn.",
      story: "Bạn là sinh viên ở thư viện. Hãy nghe và chọn hành động đúng.",
      role: "Sinh viên mượn sách",
      target: "Hiểu thủ tục thư viện",
      transcript: "You can renew the book online, but the late fee still has to be paid.",
      nativeLine: "You can renew the book online, but the late fee still hasta be paid.",
      connectedSpeech: "has to -> hasta / but báo thông tin giới hạn / late fee là phí chính",
      hardPart: "the late fee still has to be paid",
      questionTitle: "Bạn vẫn phải làm gì?",
      context: "Chọn thông tin đúng về thư viện.",
      correct: "Pay the late fee.",
      distractors: ["Return the website online.", "Renew the fee forever."],
      keywords: ["renew", "online", "late fee", "paid"],
      gapParts: ["You can renew the book online, but the late ", { answer: "fee" }, " still has to be ", { answer: "paid" }, "."],
      phrases: ["renew the book online", "but the late fee", "has to be paid"],
      whyHard: ["Câu có but nên ý sau quan trọng.", "\"has to\" thành \"hasta\".", "Late fee dễ bị nghe thành late free."],
      missReason: "Nếu nghe renew online mà bỏ qua but, bạn sẽ thiếu nghĩa chính.",
      mistakes: ["reduced", "connected", "ending"]
    },
    {
      id: "group-project",
      title: "Group Project Plan",
      icon: "ti-layout-grid2",
      tone: "warm",
      goal: "study-school",
      accent: "American",
      noise: "Campus cafe",
      level: "B1+",
      badge: "Project Partner",
      baseScore: 73,
      opening: "Nhóm học ở quán cà phê trong campus. Một bạn chia task nhanh.",
      story: "Bạn là thành viên nhóm. Hãy nghe task của mình.",
      role: "Sinh viên làm project",
      target: "Bắt phân công công việc",
      transcript: "Can you handle the slides while I work on the research summary?",
      nativeLine: "Can ya handle the slides while I work on the research summary?",
      connectedSpeech: "Can you -> Can ya / work on nối âm / research summary là cụm dài",
      hardPart: "handle the slides",
      questionTitle: "Bạn được giao làm gì?",
      context: "Chọn task đúng.",
      correct: "Prepare the slides.",
      distractors: ["Write the research summary.", "Handle the coffee cups."],
      keywords: ["handle", "slides", "research summary"],
      gapParts: ["Can you handle the ", { answer: "slides" }, " while I work on the research ", { answer: "summary" }, "?"],
      phrases: ["Can you handle", "the slides", "research summary"],
      whyHard: ["\"Can you\" nghe như \"Can ya\".", "\"while\" chia hai vai trò khác nhau.", "Summary là từ dài ở cuối câu dễ bị mờ."],
      missReason: "Hãy xác định ai làm gì quanh từ while.",
      mistakes: ["connected", "fast", "noise"]
    },
    {
      id: "office-hours",
      title: "Professor Office Hours",
      icon: "ti-time",
      tone: "green",
      goal: "study-school",
      accent: "American",
      noise: "Hallway",
      level: "B2",
      badge: "Office Hours Ready",
      baseScore: 76,
      opening: "Giáo sư nói nhanh ngoài hành lang về giờ gặp và tài liệu cần mang.",
      story: "Bạn là sinh viên muốn hỏi bài. Hãy nghe lịch hẹn.",
      role: "Sinh viên gặp giáo sư",
      target: "Bắt lịch hẹn và yêu cầu chuẩn bị",
      transcript: "Drop by my office after lunch, and bring your draft with comments.",
      nativeLine: "Drop by my office after lunch, and bring your draft with comments.",
      connectedSpeech: "drop by là phrasal verb / bring your nối /g j/ / draft with nối âm /t w/",
      hardPart: "bring your draft with comments",
      questionTitle: "Bạn cần mang gì?",
      context: "Chọn yêu cầu đúng.",
      correct: "Bring the draft with comments.",
      distractors: ["Bring lunch to the office.", "Drop the comments after class."],
      keywords: ["drop by", "after lunch", "draft", "comments"],
      gapParts: ["Drop by my office after ", { answer: "lunch" }, ", and bring your draft with ", { answer: "comments" }, "."],
      phrases: ["Drop by my office", "after lunch", "bring your draft"],
      whyHard: ["Drop by không phải thả đồ, mà là ghé qua.", "\"draft with\" nối âm nhanh.", "After lunch là thời điểm, không phải vật cần mang."],
      missReason: "Câu có hai phần: thời gian đến và vật cần mang.",
      mistakes: ["connected", "reduced", "fast"]
    },
    {
      id: "dorm-maintenance",
      title: "Dorm Maintenance Call",
      icon: "ti-home",
      tone: "danger",
      goal: "daily-routine",
      accent: "Indian",
      noise: "Phone call",
      level: "B1+",
      badge: "Dorm Solver",
      baseScore: 74,
      opening: "Ký túc xá gọi về lịch sửa điều hòa. Accent và đường dây làm câu khó hơn.",
      story: "Bạn là sinh viên ở dorm. Hãy nghe lịch sửa phòng.",
      role: "Sinh viên ở ký túc xá",
      target: "Nghe lịch bảo trì",
      transcript: "The technician will come between nine and eleven tomorrow morning.",
      nativeLine: "The technician'll come between nine and eleven tomorrow morning.",
      connectedSpeech: "technician will -> technician'll / between nine and eleven là khoảng thời gian",
      hardPart: "between nine and eleven tomorrow morning",
      questionTitle: "Kỹ thuật viên sẽ đến khi nào?",
      context: "Chọn khoảng thời gian đúng.",
      correct: "Between 9 and 11 tomorrow morning.",
      distractors: ["At 9:11 tonight.", "Between Monday and morning."],
      keywords: ["technician", "between", "nine", "eleven"],
      gapParts: ["The technician will come between ", { answer: "nine" }, " and eleven tomorrow ", { answer: "morning" }, "."],
      phrases: ["The technician will come", "between nine and eleven", "tomorrow morning"],
      whyHard: ["Between báo khoảng thời gian, không phải một mốc.", "Nine/eleven qua điện thoại dễ nhập nhầm.", "Accent khác làm rhythm thay đổi."],
      missReason: "Hãy nghe từ between để biết đây là time window.",
      mistakes: ["numbers", "accent", "noise"]
    },
    {
      id: "scholarship-call",
      title: "Scholarship Call",
      icon: "ti-medall",
      tone: "warm",
      goal: "study-school",
      accent: "British",
      noise: "Office phone",
      level: "B2",
      badge: "Scholarship Listener",
      baseScore: 78,
      opening: "Văn phòng học bổng gọi nhắc deadline bổ sung giấy tờ.",
      story: "Bạn là sinh viên nộp học bổng. Hãy nghe việc còn thiếu.",
      role: "Ứng viên học bổng",
      target: "Bắt deadline và tài liệu cần nộp",
      transcript: "We still need your recommendation letter before the deadline on Friday.",
      nativeLine: "We still need your recommendation letter before the deadline on Friday.",
      connectedSpeech: "need your nối /d j/ / recommendation letter là cụm dài / deadline on nối âm",
      hardPart: "recommendation letter before the deadline",
      questionTitle: "Bạn cần nộp gì?",
      context: "Chọn tài liệu còn thiếu.",
      correct: "A recommendation letter before Friday.",
      distractors: ["A Friday letter before recommendation.", "No documents are missing."],
      keywords: ["need", "recommendation letter", "deadline", "Friday"],
      gapParts: ["We still need your recommendation ", { answer: "letter" }, " before the deadline on ", { answer: "Friday" }, "."],
      phrases: ["We still need", "recommendation letter", "before the deadline"],
      whyHard: ["Recommendation là từ dài dễ mất âm giữa.", "Still need báo còn thiếu.", "Friday nằm cuối câu nên dễ bị bỏ qua."],
      missReason: "Trong cuộc gọi hành chính, still need thường báo action item.",
      mistakes: ["fast", "connected", "ending"]
    }
  ];

  const supplementalSessionExpansions = [
    {
      id: "new-colleague-intro",
      title: "New Colleague Intro",
      icon: "ti-id-badge",
      tone: "green",
      goal: "self-introduction",
      accent: "American",
      noise: "Office orientation",
      level: "A2+",
      badge: "First Day Ready",
      baseScore: 71,
      opening: "Bạn đang trong buổi orientation. Một nhân viên mới tự giới thiệu rất nhanh trước team.",
      story: "Bạn là đồng nghiệp mới. Hãy nghe để biết người đó làm bộ phận nào và có điểm mạnh gì.",
      role: "Đồng nghiệp trong ngày đầu",
      target: "Bắt tên, vị trí, kinh nghiệm và điểm mạnh cá nhân",
      transcript: "Hi, I'm Maya, and I just joined the design team after two years in marketing.",
      nativeLine: "Hi, I'm Maya, 'n I just joined the design team after two years in marketing.",
      connectedSpeech: "and I -> 'n I / just joined -> jus' joined / years in nối âm",
      hardPart: "joined the design team after two years",
      questionTitle: "Maya vừa vào team nào?",
      context: "Chọn thông tin đúng trong phần giới thiệu nhân viên mới.",
      correct: "She joined the design team.",
      distractors: ["She left the design team.", "She joined a travel group."],
      keywords: ["Maya", "joined", "design team", "marketing"],
      missReason: "Trong self-introduction, hãy bắt role mới trước rồi mới nghe kinh nghiệm cũ.",
      mistakes: ["connected", "fast", "ending"]
    },
    {
      id: "class-club-intro",
      title: "Club Introduction",
      icon: "ti-comments-smiley",
      tone: "warm",
      goal: "self-introduction",
      accent: "British",
      noise: "Student club",
      level: "B1",
      badge: "Club Starter",
      baseScore: 72,
      opening: "Bạn tham gia câu lạc bộ nói tiếng Anh. Một bạn tự giới thiệu lý do học tiếng Anh.",
      story: "Bạn là thành viên mới. Hãy nghe để biết mục tiêu học của người nói.",
      role: "Thành viên câu lạc bộ",
      target: "Bắt sở thích, mục tiêu và lý do học kỹ năng mới",
      transcript: "I joined this club because I want to speak more confidently with new people.",
      nativeLine: "I joined this club 'cause I wanna speak more confidently with new people.",
      connectedSpeech: "because -> 'cause / want to -> wanna / with new nối âm",
      hardPart: "speak more confidently with new people",
      questionTitle: "Người nói tham gia club để làm gì?",
      context: "Chọn mục tiêu đúng của người nói.",
      correct: "To speak more confidently with new people.",
      distractors: ["To avoid meeting new people.", "To teach marketing design."],
      keywords: ["club", "because", "speak", "confidently"],
      missReason: "Because thường bị rút thành 'cause, phần sau nó là lý do chính.",
      mistakes: ["reduced", "connected", "fast"]
    },
    {
      id: "personal-weakness-interview",
      title: "Interview Weakness Answer",
      icon: "ti-briefcase",
      tone: "green",
      goal: "self-introduction",
      accent: "American",
      noise: "Interview room",
      level: "B2",
      badge: "Interview Intro",
      baseScore: 77,
      opening: "Trong phỏng vấn, ứng viên nói về điểm yếu cá nhân theo cách chuyên nghiệp.",
      story: "Bạn là người phỏng vấn. Hãy nghe để hiểu điểm yếu và cách ứng viên cải thiện.",
      role: "Người phỏng vấn",
      target: "Nghe strength, weakness và improvement plan",
      transcript: "I used to avoid public speaking, but now I practice short presentations every week.",
      nativeLine: "I used to avoid public speaking, but now I practice short presentations every week.",
      connectedSpeech: "used to -> useta / but now đổi hướng ý / presentations every nối âm",
      hardPart: "practice short presentations every week",
      questionTitle: "Ứng viên đang cải thiện điều gì?",
      context: "Chọn kỹ năng đang được luyện.",
      correct: "Public speaking.",
      distractors: ["Public transportation.", "Weekly accounting."],
      keywords: ["avoid", "public speaking", "practice", "presentations"],
      missReason: "Câu có used to và but now: phần sau cho biết thay đổi hiện tại.",
      mistakes: ["reduced", "fast", "connected"]
    },
    {
      id: "hometown-nationality-intro",
      title: "Hometown and Nationality",
      icon: "ti-location-pin",
      tone: "warm",
      goal: "self-introduction",
      accent: "Australian",
      noise: "Meetup room",
      level: "A2+",
      badge: "Identity Catcher",
      baseScore: 70,
      opening: "Bạn gặp một người mới trong meetup quốc tế. Họ nói nhanh về quê quán và quốc tịch.",
      story: "Bạn cần nhớ thông tin cá nhân cơ bản để tiếp tục trò chuyện tự nhiên.",
      role: "Người gặp bạn mới",
      target: "Bắt hometown, nationality và nơi đang sống",
      transcript: "I'm originally from Seoul, but I've been living in Sydney for almost three years.",
      nativeLine: "I'm originally from Seoul, but I've been livin' in Sydney for almost three years.",
      connectedSpeech: "I am -> I'm / living in -> livin' in / for almost nối âm",
      hardPart: "originally from Seoul",
      questionTitle: "Người nói quê gốc ở đâu?",
      context: "Chọn hometown đúng.",
      correct: "Seoul.",
      distractors: ["Sydney.", "London."],
      keywords: ["originally", "Seoul", "Sydney", "three years"],
      missReason: "Originally from báo quê gốc; living in báo nơi đang sống, không phải cùng một ý.",
      mistakes: ["accent", "connected", "numbers"]
    },
    {
      id: "birthday-plan-call",
      title: "Birthday Plan Call",
      icon: "ti-gift",
      tone: "warm",
      goal: "family-friends",
      accent: "American",
      noise: "Phone call",
      level: "B1",
      badge: "Family Planner",
      baseScore: 72,
      opening: "Bạn nghe cuộc gọi giữa hai anh em đang lên kế hoạch sinh nhật cho mẹ.",
      story: "Bạn cần biết ai sẽ mua bánh và ai sẽ đón bà.",
      role: "Người trong gia đình",
      target: "Bắt phân công việc trong kế hoạch gia đình",
      transcript: "I'll pick up the cake, and you can drive Grandma to the restaurant.",
      nativeLine: "I'll pick up the cake, 'n you can drive Grandma to the restaurant.",
      connectedSpeech: "and you -> 'n you / pick up nối như một cụm / can là âm yếu",
      hardPart: "drive Grandma to the restaurant",
      questionTitle: "Người nghe cần làm gì?",
      context: "Chọn việc được giao trong cuộc gọi.",
      correct: "Drive Grandma to the restaurant.",
      distractors: ["Pick up the cake.", "Cancel the birthday."],
      keywords: ["pick up", "cake", "drive", "Grandma"],
      missReason: "Câu có hai người làm hai việc; hãy xác định I và you.",
      mistakes: ["connected", "fast", "noise"]
    },
    {
      id: "best-friend-memory",
      title: "Best Friend Memory",
      icon: "ti-heart",
      tone: "green",
      goal: "family-friends",
      accent: "British",
      noise: "Cafe",
      level: "B1+",
      badge: "Memory Listener",
      baseScore: 73,
      opening: "Hai người bạn thân nhắc lại kỷ niệm bị lỡ chuyến xe trong một chuyến đi.",
      story: "Bạn cần nghe chi tiết kỷ niệm và lý do họ vẫn thấy vui.",
      role: "Người nghe câu chuyện bạn bè",
      target: "Bắt relationship, memory và cảm xúc",
      transcript: "We missed the last bus, but that night became our funniest travel memory.",
      nativeLine: "We missed the last bus, but that night became our funniest travel memory.",
      connectedSpeech: "missed the nối / last bus mất /t/ nhẹ / but báo đổi cảm xúc",
      hardPart: "became our funniest travel memory",
      questionTitle: "Kỷ niệm đó cuối cùng trở thành gì?",
      context: "Chọn ý nghĩa của câu chuyện.",
      correct: "Their funniest travel memory.",
      distractors: ["Their worst exam result.", "Their first family argument."],
      keywords: ["missed", "last bus", "funniest", "memory"],
      missReason: "But đổi sắc thái: sự cố ban đầu trở thành kỷ niệm vui.",
      mistakes: ["ending", "emotion", "connected"]
    },
    {
      id: "family-misunderstanding",
      title: "Family Misunderstanding",
      icon: "ti-comments",
      tone: "danger",
      goal: "family-friends",
      accent: "American",
      noise: "Kitchen",
      level: "B2",
      badge: "Conflict Decoder",
      baseScore: 76,
      opening: "Một người giải thích hiểu lầm nhỏ trong gia đình về tiền thuê nhà.",
      story: "Bạn cần nghe ai quên chuyển khoản và cách họ sửa lỗi.",
      role: "Người nghe cuộc trò chuyện gia đình",
      target: "Bắt argument, misunderstanding và solution",
      transcript: "I thought my brother had paid the rent, but the transfer never went through.",
      nativeLine: "I thought my brother'd paid the rent, but the transfer never went through.",
      connectedSpeech: "brother had -> brother'd / paid the nối / went through là phrasal verb",
      hardPart: "the transfer never went through",
      questionTitle: "Vấn đề thật sự là gì?",
      context: "Chọn nguyên nhân của hiểu lầm.",
      correct: "The bank transfer did not go through.",
      distractors: ["His brother rented a bank.", "The rent was paid twice."],
      keywords: ["thought", "brother", "rent", "transfer"],
      missReason: "Never went through nghĩa là giao dịch không hoàn tất, không phải đi xuyên qua nơi nào.",
      mistakes: ["reduced", "connected", "fast"]
    },
    {
      id: "weekend-meetup-friend",
      title: "Weekend Meetup",
      icon: "ti-calendar",
      tone: "green",
      goal: "family-friends",
      accent: "Australian",
      noise: "Street",
      level: "B1",
      badge: "Meetup Catcher",
      baseScore: 72,
      opening: "Hai bạn học bàn nhanh về kế hoạch gặp mặt cuối tuần.",
      story: "Bạn cần biết thời gian, địa điểm và lý do đổi giờ.",
      role: "Bạn học trong nhóm",
      target: "Bắt schedule và địa điểm hẹn",
      transcript: "Let's meet at the bookstore around four, unless your class runs late.",
      nativeLine: "Let's meet at the bookstore around four, unless your class runs late.",
      connectedSpeech: "let us -> let's / at the nối / runs late là trễ giờ",
      hardPart: "unless your class runs late",
      questionTitle: "Họ định gặp ở đâu?",
      context: "Chọn địa điểm hẹn.",
      correct: "At the bookstore.",
      distractors: ["Inside the classroom.", "At the airport gate."],
      keywords: ["meet", "bookstore", "around four", "class"],
      missReason: "Unless đưa ra điều kiện thay đổi, nhưng địa điểm chính vẫn là bookstore.",
      mistakes: ["connected", "numbers", "noise"]
    },
    {
      id: "remote-work-benefits",
      title: "Remote Work Benefits",
      icon: "ti-desktop",
      tone: "green",
      goal: "work-career",
      accent: "American",
      noise: "Team call",
      level: "B1+",
      badge: "Work Mode Listener",
      baseScore: 74,
      opening: "Trong cuộc họp team, nhân viên nói về lịch làm việc từ xa và ngày lên văn phòng.",
      story: "Bạn cần nghe chính sách làm việc và ngày bắt buộc có mặt.",
      role: "Thành viên team",
      target: "Bắt remote work, office day và schedule",
      transcript: "You can work from home twice a week, but everyone comes in on Wednesdays.",
      nativeLine: "You can work from home twice a week, but everyone comes in on Wednesdays.",
      connectedSpeech: "can là âm yếu / comes in nối / on Wednesdays là lịch bắt buộc",
      hardPart: "comes in on Wednesdays",
      questionTitle: "Ngày nào mọi người phải lên văn phòng?",
      context: "Chọn ngày bắt buộc.",
      correct: "Wednesday.",
      distractors: ["Every weekend.", "Twice on Monday."],
      keywords: ["work from home", "twice", "week", "Wednesdays"],
      missReason: "But báo giới hạn của quyền làm việc từ xa.",
      mistakes: ["numbers", "connected", "fast"]
    },
    {
      id: "promotion-feedback",
      title: "Promotion Feedback",
      icon: "ti-stats-up",
      tone: "warm",
      goal: "work-career",
      accent: "British",
      noise: "Manager office",
      level: "B2",
      badge: "Promotion Ready",
      baseScore: 77,
      opening: "Sếp góp ý rất thẳng về kỹ năng cần cải thiện trước khi được thăng chức.",
      story: "Bạn cần nghe điểm mạnh và điều kiện để lên vị trí mới.",
      role: "Nhân viên nhận feedback",
      target: "Bắt promotion, responsibility và skill gap",
      transcript: "Your results are strong, but you need to delegate more before we discuss promotion.",
      nativeLine: "Your results are strong, but you needta delegate more before we discuss promotion.",
      connectedSpeech: "need to -> needta / but đổi hướng / discuss promotion là mục tiêu cuối",
      hardPart: "need to delegate more",
      questionTitle: "Nhân viên cần cải thiện điều gì?",
      context: "Chọn kỹ năng cần phát triển.",
      correct: "Delegating more.",
      distractors: ["Arriving later.", "Avoiding all results."],
      keywords: ["results", "strong", "delegate", "promotion"],
      missReason: "Đừng dừng ở lời khen; phần sau but mới là điều kiện thật.",
      mistakes: ["reduced", "fast", "emotion"]
    },
    {
      id: "career-change-podcast",
      title: "Career Change Podcast",
      icon: "ti-microphone",
      tone: "green",
      goal: "work-career",
      accent: "American",
      noise: "Podcast",
      level: "B2",
      badge: "Career Planner",
      baseScore: 78,
      opening: "Một podcast ngắn nói về đổi nghề từ giáo viên sang UX researcher.",
      story: "Bạn nghe để hiểu lý do đổi nghề và kỹ năng chuyển đổi được.",
      role: "Người nghe podcast nghề nghiệp",
      target: "Bắt career change và transferable skills",
      transcript: "She moved from teaching into UX research because she enjoyed interviewing people.",
      nativeLine: "She moved from teaching into UX research 'cause she enjoyed interviewing people.",
      connectedSpeech: "because -> 'cause / teaching into nối / interviewing people là kỹ năng chính",
      hardPart: "moved from teaching into UX research",
      questionTitle: "Vì sao cô ấy chuyển sang UX research?",
      context: "Chọn lý do đổi nghề.",
      correct: "She enjoyed interviewing people.",
      distractors: ["She disliked all people.", "She wanted to teach airports."],
      keywords: ["moved", "teaching", "UX research", "interviewing"],
      missReason: "Because/'cause thường mở ra lý do, cần nghe sau từ đó.",
      mistakes: ["reduced", "connected", "fast"]
    },
    {
      id: "salary-benefits-question",
      title: "Salary and Benefits",
      icon: "ti-wallet",
      tone: "warm",
      goal: "work-career",
      accent: "Indian",
      noise: "HR call",
      level: "B1+",
      badge: "Offer Listener",
      baseScore: 75,
      opening: "HR gọi về offer: mức lương ổn nhưng ngày nghỉ phép bắt đầu sau probation.",
      story: "Bạn cần nghe điều kiện phúc lợi trước khi phản hồi offer.",
      role: "Ứng viên nhận offer",
      target: "Bắt salary, benefits và probation condition",
      transcript: "The salary is fixed, but paid leave starts after your three-month probation.",
      nativeLine: "The salary is fixed, but paid leave starts after your three-month probation.",
      connectedSpeech: "paid leave nối / starts after nối / three-month probation là điều kiện thời gian",
      hardPart: "after your three-month probation",
      questionTitle: "Khi nào paid leave bắt đầu?",
      context: "Chọn điều kiện phúc lợi đúng.",
      correct: "After the three-month probation.",
      distractors: ["Before the interview starts.", "Every three days."],
      keywords: ["salary", "fixed", "paid leave", "probation"],
      missReason: "But giới thiệu giới hạn; probation là từ khóa hợp đồng.",
      mistakes: ["accent", "numbers", "connected"]
    },
    {
      id: "morning-habit-check",
      title: "Morning Habit Check",
      icon: "ti-alarm-clock",
      tone: "green",
      goal: "daily-routine",
      accent: "American",
      noise: "Kitchen",
      level: "A2+",
      badge: "Routine Starter",
      baseScore: 70,
      opening: "Một người kể routine buổi sáng trước khi đi làm.",
      story: "Bạn cần nghe thứ tự hành động để chọn lịch đúng.",
      role: "Người nghe daily vlog",
      target: "Bắt wake up, breakfast và commute",
      transcript: "I wake up at six, make coffee, and leave for work by seven fifteen.",
      nativeLine: "I wake up at six, make coffee, 'n leave for work by seven fifteen.",
      connectedSpeech: "wake up nối / and -> 'n / seven fifteen là giờ rời nhà",
      hardPart: "leave for work by seven fifteen",
      questionTitle: "Người nói rời nhà lúc nào?",
      context: "Chọn thời gian đúng.",
      correct: "By 7:15.",
      distractors: ["At 6:50.", "After lunch."],
      keywords: ["wake up", "six", "coffee", "seven fifteen"],
      missReason: "By seven fifteen nghĩa là muộn nhất 7:15, không phải sau 7:15.",
      mistakes: ["numbers", "connected", "fast"]
    },
    {
      id: "screen-time-routine",
      title: "Screen Time Routine",
      icon: "ti-mobile",
      tone: "warm",
      goal: "daily-routine",
      accent: "British",
      noise: "Bedroom",
      level: "B1",
      badge: "Habit Listener",
      baseScore: 72,
      opening: "Một người nói về thói quen giảm dùng điện thoại trước khi ngủ.",
      story: "Bạn nghe để biết rule mới và lý do ngủ tốt hơn.",
      role: "Người nghe podcast thói quen",
      target: "Bắt phone habit và sleep routine",
      transcript: "I put my phone across the room so I don't scroll in bed.",
      nativeLine: "I put my phone across the room so I don' scroll in bed.",
      connectedSpeech: "don't -> don' / across the nối / scroll in nối",
      hardPart: "so I don't scroll in bed",
      questionTitle: "Vì sao người nói để điện thoại xa giường?",
      context: "Chọn lý do đúng.",
      correct: "To avoid scrolling in bed.",
      distractors: ["To charge it at work.", "To cook dinner faster."],
      keywords: ["phone", "across the room", "scroll", "bed"],
      missReason: "So mở ra mục đích của hành động trước đó.",
      mistakes: ["ending", "connected", "fast"]
    },
    {
      id: "weekend-cleaning-plan",
      title: "Weekend Cleaning Plan",
      icon: "ti-brush",
      tone: "green",
      goal: "daily-routine",
      accent: "Australian",
      noise: "Apartment",
      level: "B1",
      badge: "Weekend Planner",
      baseScore: 72,
      opening: "Hai người ở chung căn hộ chia việc dọn dẹp cuối tuần.",
      story: "Bạn cần nghe ai làm laundry và ai đi chợ.",
      role: "Người ở chung nhà",
      target: "Bắt housework, groceries và schedule",
      transcript: "I'll do the laundry if you grab groceries on your way home.",
      nativeLine: "I'll do the laundry if ya grab groceries on your way home.",
      connectedSpeech: "you -> ya / grab groceries nối / way home là trên đường về",
      hardPart: "grab groceries on your way home",
      questionTitle: "Người nghe cần làm gì?",
      context: "Chọn việc được giao.",
      correct: "Buy groceries on the way home.",
      distractors: ["Do the laundry.", "Move to another apartment."],
      keywords: ["laundry", "grab groceries", "way home"],
      missReason: "If chia điều kiện trao đổi việc giữa hai người.",
      mistakes: ["connected", "reduced", "noise"]
    },
    {
      id: "exercise-after-work",
      title: "After-work Exercise",
      icon: "ti-heart",
      tone: "warm",
      goal: "daily-routine",
      accent: "American",
      noise: "Gym",
      level: "B1",
      badge: "Fitness Routine",
      baseScore: 73,
      opening: "Một người nói về thói quen tập luyện ngắn sau giờ làm.",
      story: "Bạn cần nghe thời lượng và lý do chọn bài tập ngắn.",
      role: "Người nghe health vlog",
      target: "Bắt exercise routine và time management",
      transcript: "After work, I do a twenty-minute workout because it's easier to stay consistent.",
      nativeLine: "After work, I do a twenty-minute workout 'cause it's easier to stay consistent.",
      connectedSpeech: "twenty-minute mất /t/ nhẹ / because -> 'cause / stay consistent nối",
      hardPart: "twenty-minute workout",
      questionTitle: "Bài tập kéo dài bao lâu?",
      context: "Chọn thời lượng đúng.",
      correct: "Twenty minutes.",
      distractors: ["Two hours.", "Twenty days."],
      keywords: ["after work", "twenty-minute", "workout", "consistent"],
      missReason: "Twenty-minute là tính từ ghép, đừng nhầm thành twenty workouts.",
      mistakes: ["numbers", "reduced", "fast"]
    },
    {
      id: "meal-prep-routine",
      title: "Meal Prep Routine",
      icon: "ti-package",
      tone: "green",
      goal: "daily-routine",
      accent: "British",
      noise: "Kitchen",
      level: "B1+",
      badge: "Meal Prepper",
      baseScore: 74,
      opening: "Một người chia sẻ cách chuẩn bị bữa trưa để tiết kiệm thời gian trong tuần.",
      story: "Bạn cần nghe món được chuẩn bị và lý do làm từ Chủ nhật.",
      role: "Người nghe routine podcast",
      target: "Bắt cooking, weekly schedule và time saving",
      transcript: "On Sundays, I cook rice and chicken so lunch is ready for the next three days.",
      nativeLine: "On Sundays, I cook rice 'n chicken so lunch is ready for the next three days.",
      connectedSpeech: "and -> 'n / lunch is -> lunch's / next three nối",
      hardPart: "ready for the next three days",
      questionTitle: "Meal prep dùng cho bao nhiêu ngày tiếp theo?",
      context: "Chọn số ngày đúng.",
      correct: "Three days.",
      distractors: ["Thirteen days.", "Only Sunday morning."],
      keywords: ["Sundays", "rice", "chicken", "three days"],
      missReason: "Next three days là mốc thời gian chính, dễ bị lẫn với Sundays ở đầu câu.",
      mistakes: ["numbers", "connected", "ending"]
    },
    {
      id: "checkout-price-problem",
      title: "Checkout Price Problem",
      icon: "ti-receipt",
      tone: "warm",
      goal: "shopping-prices",
      accent: "American",
      noise: "Checkout line",
      level: "B1",
      badge: "Checkout Listener",
      baseScore: 72,
      opening: "Ở quầy thanh toán, khách phát hiện giá trên hóa đơn không giống giá trên kệ.",
      story: "Bạn cần nghe vấn đề giá và cách nhân viên xử lý.",
      role: "Khách ở quầy checkout",
      target: "Bắt price, receipt và discount issue",
      transcript: "The tag said thirty dollars, but it rang up as thirty-eight at the register.",
      nativeLine: "The tag said thirty dollars, but it rang up as thirty-eight at the register.",
      connectedSpeech: "rang up là cụm thanh toán / thirty-eight nối / but báo lỗi giá",
      hardPart: "rang up as thirty-eight",
      questionTitle: "Vấn đề là gì?",
      context: "Chọn lỗi tại quầy thanh toán.",
      correct: "The register showed a higher price.",
      distractors: ["The customer lost the receipt.", "The item was free."],
      keywords: ["tag", "thirty dollars", "rang up", "thirty-eight"],
      missReason: "Rang up as nghĩa là máy tính tiền hiện giá, không phải chuông kêu.",
      mistakes: ["numbers", "connected", "noise"]
    },
    {
      id: "online-delivery-delay",
      title: "Online Delivery Delay",
      icon: "ti-truck",
      tone: "danger",
      goal: "shopping-prices",
      accent: "British",
      noise: "Customer service call",
      level: "B1+",
      badge: "Delivery Tracker",
      baseScore: 74,
      opening: "Bạn gọi chăm sóc khách hàng vì đơn online chưa giao đúng ngày.",
      story: "Bạn cần nghe nguyên nhân delay và thời gian giao mới.",
      role: "Khách mua hàng online",
      target: "Bắt delivery delay, order number và new date",
      transcript: "Your order was delayed at the warehouse, but it should arrive by Friday evening.",
      nativeLine: "Your order was delayed at the warehouse, but it should arrive by Friday evening.",
      connectedSpeech: "delayed at nối / should arrive nối / by Friday là hạn cuối",
      hardPart: "should arrive by Friday evening",
      questionTitle: "Đơn hàng dự kiến đến khi nào?",
      context: "Chọn thời gian giao mới.",
      correct: "By Friday evening.",
      distractors: ["Before the warehouse opens.", "By Sunday morning."],
      keywords: ["order", "delayed", "warehouse", "Friday evening"],
      missReason: "By Friday evening là hạn giao dự kiến, không phải thời điểm đơn bị delay.",
      mistakes: ["connected", "fast", "noise"]
    },
    {
      id: "discount-code-trap",
      title: "Discount Code Trap",
      icon: "ti-tag",
      tone: "warm",
      goal: "shopping-prices",
      accent: "American",
      noise: "App checkout",
      level: "B1",
      badge: "Coupon Catcher",
      baseScore: 73,
      opening: "Một người giải thích vì sao mã giảm giá không áp dụng được trong app.",
      story: "Bạn cần nghe điều kiện tối thiểu của coupon.",
      role: "Người mua hàng online",
      target: "Bắt coupon condition và minimum spend",
      transcript: "The discount only works if your order is over fifty dollars before tax.",
      nativeLine: "The discount only works if your order's over fifty dollars before tax.",
      connectedSpeech: "order is -> order's / over fifty là điều kiện / before tax là giới hạn",
      hardPart: "over fifty dollars before tax",
      questionTitle: "Mã giảm giá áp dụng khi nào?",
      context: "Chọn điều kiện đúng.",
      correct: "When the order is over $50 before tax.",
      distractors: ["When tax is over $50.", "For every order under $15."],
      keywords: ["discount", "only works", "over fifty", "before tax"],
      missReason: "Only works if báo điều kiện; before tax thường là bẫy nhỏ ở cuối.",
      mistakes: ["numbers", "connected", "fast"]
    },
    {
      id: "exchange-size-color",
      title: "Exchange Size and Color",
      icon: "ti-exchange-vertical",
      tone: "green",
      goal: "shopping-prices",
      accent: "Australian",
      noise: "Clothing store",
      level: "A2+",
      badge: "Exchange Ready",
      baseScore: 71,
      opening: "Khách muốn đổi áo vì đúng màu nhưng sai size.",
      story: "Bạn cần nghe size mới và màu muốn giữ lại.",
      role: "Khách đổi hàng",
      target: "Bắt size, color và exchange request",
      transcript: "I like the navy color, but could I exchange this for a medium?",
      nativeLine: "I like the navy color, but could I exchange this for a medium?",
      connectedSpeech: "could I -> coulda-like khi nhanh / this for nối / medium là size",
      hardPart: "exchange this for a medium",
      questionTitle: "Khách muốn đổi sang size nào?",
      context: "Chọn size đúng.",
      correct: "Medium.",
      distractors: ["Navy.", "Extra receipt."],
      keywords: ["navy color", "exchange", "medium"],
      missReason: "Navy là màu, medium là size; câu có cả hai thông tin dễ lẫn.",
      mistakes: ["fast", "accent", "connected"]
    },
    {
      id: "menu-special-allergy",
      title: "Menu Special Allergy",
      icon: "ti-menu",
      tone: "danger",
      goal: "food-restaurant",
      accent: "American",
      noise: "Busy restaurant",
      level: "B1+",
      badge: "Allergy Listener",
      baseScore: 75,
      opening: "Nhân viên giới thiệu món đặc biệt nhưng nhắc có shellfish trong sốt.",
      story: "Bạn cần nghe thành phần để tránh dị ứng.",
      role: "Khách có dị ứng thức ăn",
      target: "Bắt ingredient, allergy và safe choice",
      transcript: "The special is great, but the sauce contains shellfish and a little cream.",
      nativeLine: "The special's great, but the sauce contains shellfish 'n a little cream.",
      connectedSpeech: "special is -> special's / and a -> 'n a / but báo cảnh báo",
      hardPart: "contains shellfish and a little cream",
      questionTitle: "Món đặc biệt có thành phần gì cần chú ý?",
      context: "Chọn thành phần được nhắc.",
      correct: "Shellfish and cream.",
      distractors: ["Peanuts and rice.", "Only iced tea."],
      keywords: ["special", "sauce", "shellfish", "cream"],
      missReason: "But sau lời khen thường đưa thông tin hạn chế, rất quan trọng với allergy.",
      mistakes: ["noise", "connected", "fast"]
    },
    {
      id: "reservation-change",
      title: "Reservation Change",
      icon: "ti-calendar",
      tone: "green",
      goal: "food-restaurant",
      accent: "British",
      noise: "Restaurant phone",
      level: "B1",
      badge: "Reservation Listener",
      baseScore: 73,
      opening: "Bạn gọi nhà hàng để đổi đặt bàn từ 7 giờ sang 8 giờ 30.",
      story: "Bạn cần nghe nhà hàng còn bàn lúc mấy giờ.",
      role: "Khách đặt bàn",
      target: "Bắt reservation time và availability",
      transcript: "We don't have seven-thirty, but we can seat you at eight fifteen.",
      nativeLine: "We don' have seven-thirty, but we can seat you at eight fifteen.",
      connectedSpeech: "don't -> don' / can là âm yếu / eight fifteen là giờ được nhận",
      hardPart: "seat you at eight fifteen",
      questionTitle: "Nhà hàng có thể xếp bàn lúc mấy giờ?",
      context: "Chọn giờ còn bàn.",
      correct: "8:15.",
      distractors: ["7:30.", "8:50."],
      keywords: ["don't have", "seven-thirty", "seat you", "eight fifteen"],
      missReason: "But đổi từ giờ không có sang giờ có thể đặt.",
      mistakes: ["numbers", "ending", "connected"]
    },
    {
      id: "takeout-order",
      title: "Takeout Order",
      icon: "ti-package",
      tone: "warm",
      goal: "food-restaurant",
      accent: "American",
      noise: "Phone order",
      level: "A2+",
      badge: "Takeout Ready",
      baseScore: 71,
      opening: "Một khách gọi món mang đi và yêu cầu không cho hành.",
      story: "Bạn cần nghe món, loại order và yêu cầu đặc biệt.",
      role: "Nhân viên nhận order",
      target: "Bắt takeout, dish và special request",
      transcript: "Can I get two chicken bowls to go, with no onions on either one?",
      nativeLine: "Can I get two chicken bowls t'go, with no onions on either one?",
      connectedSpeech: "to go -> t'go / no onions nối / either one là cả hai phần",
      hardPart: "with no onions on either one",
      questionTitle: "Yêu cầu đặc biệt là gì?",
      context: "Chọn yêu cầu đúng.",
      correct: "No onions on either bowl.",
      distractors: ["Extra onions on one bowl.", "No chicken in either bowl."],
      keywords: ["two", "chicken bowls", "to go", "no onions"],
      missReason: "Either one ở đây nghĩa là cả hai phần đều không hành.",
      mistakes: ["numbers", "reduced", "fast"]
    },
    {
      id: "complain-cold-food",
      title: "Cold Food Complaint",
      icon: "ti-alert",
      tone: "danger",
      goal: "food-restaurant",
      accent: "Australian",
      noise: "Dining room",
      level: "B1+",
      badge: "Polite Complaint",
      baseScore: 74,
      opening: "Khách phàn nàn lịch sự vì món pasta bị nguội khi mang ra.",
      story: "Bạn cần nghe vấn đề và yêu cầu sửa lại.",
      role: "Nhân viên phục vụ",
      target: "Bắt complaint và response request",
      transcript: "I'm sorry, but this pasta is cold in the middle. Could you warm it up?",
      nativeLine: "I'm sorry, but this pasta's cold in the middle. Couldja warm it up?",
      connectedSpeech: "pasta is -> pasta's / could you -> couldja / warm it up nối",
      hardPart: "cold in the middle",
      questionTitle: "Khách phàn nàn điều gì?",
      context: "Chọn vấn đề của món ăn.",
      correct: "The pasta is cold in the middle.",
      distractors: ["The pasta is too spicy.", "The bill is missing."],
      keywords: ["sorry", "pasta", "cold", "warm it up"],
      missReason: "Cold in the middle là chi tiết chính, không phải chỉ cảm giác của khách.",
      mistakes: ["connected", "accent", "fast"]
    },
    {
      id: "bill-split",
      title: "Split the Bill",
      icon: "ti-credit-card",
      tone: "green",
      goal: "food-restaurant",
      accent: "British",
      noise: "Restaurant checkout",
      level: "B1",
      badge: "Bill Handler",
      baseScore: 72,
      opening: "Hai khách muốn chia hóa đơn, một người trả bằng thẻ và một người trả tiền mặt.",
      story: "Bạn cần nghe cách chia thanh toán.",
      role: "Nhân viên thu ngân",
      target: "Bắt bill, cash, card và split payment",
      transcript: "Could we split the bill? I'll pay by card, and she'll pay in cash.",
      nativeLine: "Could we split the bill? I'll pay by card, 'n she'll pay in cash.",
      connectedSpeech: "could we nối / and she will -> 'n she'll / pay in cash nối",
      hardPart: "I'll pay by card, and she'll pay in cash",
      questionTitle: "Họ muốn thanh toán thế nào?",
      context: "Chọn cách chia hóa đơn.",
      correct: "One by card and one in cash.",
      distractors: ["Both by card.", "No one wants to pay."],
      keywords: ["split", "bill", "card", "cash"],
      missReason: "Card và cash thường nằm cuối hai vế; đừng chỉ nghe split bill.",
      mistakes: ["connected", "fast", "ending"]
    },
    {
      id: "train-platform-change",
      title: "Train Platform Change",
      icon: "ti-ticket",
      tone: "green",
      goal: "travel-directions",
      accent: "British",
      noise: "Train station",
      level: "B1",
      badge: "Platform Catcher",
      baseScore: 74,
      opening: "Thông báo nhà ga đổi platform vào phút cuối, có tiếng ồn phía sau.",
      story: "Bạn cần nghe số platform và hướng đi.",
      role: "Hành khách đi tàu",
      target: "Bắt platform, train time và direction",
      transcript: "The train to Oxford will now depart from platform six, not platform four.",
      nativeLine: "The train to Oxford'll now depart from platform six, not platform four.",
      connectedSpeech: "will -> 'll / not platform four là correction / platform six là đáp án",
      hardPart: "platform six, not platform four",
      questionTitle: "Tàu sẽ đi từ platform nào?",
      context: "Chọn platform mới.",
      correct: "Platform six.",
      distractors: ["Platform four.", "Gate twenty-four."],
      keywords: ["train", "Oxford", "platform six", "not platform four"],
      missReason: "Not platform four là thông tin phủ định; đáp án đứng trước đó.",
      mistakes: ["numbers", "noise", "connected"]
    },
    {
      id: "pharmacy-cold-medicine",
      title: "Pharmacy Cold Medicine",
      icon: "ti-support",
      tone: "green",
      goal: "health-doctor",
      accent: "American",
      noise: "Pharmacy",
      level: "B1",
      badge: "Pharmacy Ready",
      baseScore: 73,
      opening: "Dược sĩ hướng dẫn cách uống thuốc cảm và cảnh báo không lái xe.",
      story: "Bạn cần nghe liều lượng và cảnh báo an toàn.",
      role: "Khách mua thuốc",
      target: "Bắt medicine, dosage và warning",
      transcript: "Take one tablet before bed, and don't drive after taking it.",
      nativeLine: "Take one tablet before bed, 'n don' drive after taking it.",
      connectedSpeech: "and don't -> 'n don' / after taking nối / one tablet là liều",
      hardPart: "don't drive after taking it",
      questionTitle: "Cảnh báo của dược sĩ là gì?",
      context: "Chọn cảnh báo an toàn.",
      correct: "Do not drive after taking it.",
      distractors: ["Take it before driving.", "Take two tablets at lunch."],
      keywords: ["one tablet", "before bed", "don't drive", "taking it"],
      missReason: "Don't drive nằm sau liều lượng, dễ bị bỏ lỡ nếu chỉ nghe số lượng thuốc.",
      mistakes: ["ending", "connected", "fast"]
    },
    {
      id: "doctor-appointment-reschedule",
      title: "Doctor Appointment Reschedule",
      icon: "ti-calendar",
      tone: "warm",
      goal: "health-doctor",
      accent: "British",
      noise: "Clinic phone",
      level: "B1+",
      badge: "Clinic Scheduler",
      baseScore: 74,
      opening: "Phòng khám gọi đổi lịch khám vì bác sĩ bận phẫu thuật khẩn.",
      story: "Bạn cần nghe giờ hẹn mới.",
      role: "Bệnh nhân đặt lịch khám",
      target: "Bắt appointment, reschedule và time",
      transcript: "Dr. Evans is unavailable at ten, but we can see you at two thirty.",
      nativeLine: "Dr. Evans is unavailable at ten, but we can see you at two thirty.",
      connectedSpeech: "can là âm yếu / see you at nối / two thirty là giờ mới",
      hardPart: "see you at two thirty",
      questionTitle: "Lịch mới là mấy giờ?",
      context: "Chọn giờ hẹn mới.",
      correct: "2:30.",
      distractors: ["10:00.", "2:13."],
      keywords: ["unavailable", "ten", "see you", "two thirty"],
      missReason: "But chuyển từ giờ cũ không còn khả dụng sang giờ mới.",
      mistakes: ["numbers", "connected", "noise"]
    },
    {
      id: "symptom-description",
      title: "Symptom Description",
      icon: "ti-clipboard",
      tone: "danger",
      goal: "health-doctor",
      accent: "Australian",
      noise: "Clinic room",
      level: "B1+",
      badge: "Symptom Catcher",
      baseScore: 75,
      opening: "Bệnh nhân mô tả triệu chứng đau bụng sau bữa tối.",
      story: "Bạn cần nghe triệu chứng chính và thời điểm bắt đầu.",
      role: "Bác sĩ hoặc y tá",
      target: "Bắt symptom, timing và severity",
      transcript: "The stomach pain started last night, right after dinner, and it hasn't gone away.",
      nativeLine: "The stomach pain started last night, right after dinner, 'n it hasn't gone away.",
      connectedSpeech: "started last nối / and it -> 'n it / gone away là phrasal verb",
      hardPart: "right after dinner",
      questionTitle: "Cơn đau bắt đầu khi nào?",
      context: "Chọn thời điểm bắt đầu triệu chứng.",
      correct: "Last night after dinner.",
      distractors: ["This morning before breakfast.", "After taking exercise."],
      keywords: ["stomach pain", "last night", "after dinner", "gone away"],
      missReason: "Right after dinner là mốc chính, không phải chỉ last night chung chung.",
      mistakes: ["connected", "accent", "fast"]
    },
    {
      id: "mental-health-sleep",
      title: "Sleep and Stress Advice",
      icon: "ti-heart",
      tone: "green",
      goal: "health-doctor",
      accent: "American",
      noise: "Podcast",
      level: "B2",
      badge: "Wellness Listener",
      baseScore: 77,
      opening: "Một podcast sức khỏe tinh thần nói về stress và thói quen ngủ.",
      story: "Bạn cần nghe lời khuyên chính trong đoạn.",
      role: "Người nghe podcast sức khỏe",
      target: "Bắt mental health, sleep routine và advice",
      transcript: "If stress keeps you awake, try writing tomorrow's tasks before you go to bed.",
      nativeLine: "If stress keeps you awake, try writing tomorrow's tasks before ya go to bed.",
      connectedSpeech: "keeps you nối / writing tomorrow's nối / you -> ya",
      hardPart: "writing tomorrow's tasks before you go to bed",
      questionTitle: "Podcast khuyên làm gì trước khi ngủ?",
      context: "Chọn lời khuyên chính.",
      correct: "Write tomorrow's tasks.",
      distractors: ["Drink more coffee.", "Cancel every task."],
      keywords: ["stress", "awake", "writing", "tasks"],
      missReason: "If nêu vấn đề, try nêu giải pháp; hãy nghe động từ sau try.",
      mistakes: ["connected", "fast", "emotion"]
    },
    {
      id: "minor-accident-first-aid",
      title: "Minor Accident First Aid",
      icon: "ti-alert",
      tone: "danger",
      goal: "health-doctor",
      accent: "British",
      noise: "Sports field",
      level: "B1+",
      badge: "First Aid Listener",
      baseScore: 76,
      opening: "Một huấn luyện viên hướng dẫn sơ cứu khi người chơi bị trẹo cổ chân.",
      story: "Bạn cần nghe việc cần làm ngay và việc không nên làm.",
      role: "Người hỗ trợ sơ cứu",
      target: "Bắt injury, rest và first-aid instruction",
      transcript: "Keep your ankle raised, and don't put weight on it until the swelling goes down.",
      nativeLine: "Keep your ankle raised, 'n don' put weight on it until the swelling goes down.",
      connectedSpeech: "and don't -> 'n don' / put weight on it nối / goes down là giảm sưng",
      hardPart: "don't put weight on it",
      questionTitle: "Người bị thương không nên làm gì?",
      context: "Chọn chỉ dẫn sơ cứu đúng.",
      correct: "Put weight on the ankle.",
      distractors: ["Raise the ankle.", "Wait for swelling to go down."],
      keywords: ["ankle", "raised", "don't put weight", "swelling"],
      missReason: "Don't đảo nghĩa; nếu bỏ lỡ âm cuối /t/, bạn sẽ hiểu ngược hoàn toàn.",
      mistakes: ["ending", "noise", "connected"]
    },
    {
      id: "storm-warning",
      title: "Storm Warning",
      icon: "ti-cloud",
      tone: "danger",
      goal: "weather-seasons",
      accent: "American",
      noise: "Radio alert",
      level: "B1+",
      badge: "Storm Watcher",
      baseScore: 75,
      opening: "Bản tin cảnh báo bão yêu cầu người dân tránh đường ven biển.",
      story: "Bạn cần nghe khu vực nguy hiểm và thời gian cảnh báo.",
      role: "Người nghe cảnh báo thời tiết",
      target: "Bắt extreme weather và safety instruction",
      transcript: "Strong winds are expected overnight, so avoid the coastal road until morning.",
      nativeLine: "Strong winds're expected overnight, so avoid the coastal road until morning.",
      connectedSpeech: "winds are -> winds're / expected overnight nối / coastal road là địa điểm",
      hardPart: "avoid the coastal road until morning",
      questionTitle: "Người dân nên tránh đâu?",
      context: "Chọn hướng dẫn an toàn.",
      correct: "The coastal road.",
      distractors: ["The school cafeteria.", "The sunny park."],
      keywords: ["strong winds", "overnight", "avoid", "coastal road"],
      missReason: "So báo hành động cần làm sau thông tin thời tiết.",
      mistakes: ["noise", "connected", "fast"]
    },
    {
      id: "rainy-plan-change",
      title: "Rainy Plan Change",
      icon: "ti-cloud-down",
      tone: "warm",
      goal: "weather-seasons",
      accent: "British",
      noise: "Cafe",
      level: "A2+",
      badge: "Rain Plan",
      baseScore: 71,
      opening: "Hai người đổi kế hoạch picnic vì trời sắp mưa.",
      story: "Bạn cần nghe kế hoạch mới.",
      role: "Bạn trong nhóm đi chơi",
      target: "Bắt weather effect và plan change",
      transcript: "If it keeps raining, let's move the picnic to my apartment.",
      nativeLine: "If it keeps raining, let's move the picnic to my apartment.",
      connectedSpeech: "keeps raining nối / let us -> let's / to my nối",
      hardPart: "move the picnic to my apartment",
      questionTitle: "Họ sẽ chuyển picnic đi đâu nếu mưa tiếp?",
      context: "Chọn kế hoạch mới.",
      correct: "To the speaker's apartment.",
      distractors: ["To the airport.", "To a winter storm."],
      keywords: ["keeps raining", "move", "picnic", "apartment"],
      missReason: "If đặt điều kiện; let's move đưa kế hoạch thay thế.",
      mistakes: ["connected", "fast", "noise"]
    },
    {
      id: "heatwave-advice",
      title: "Heatwave Advice",
      icon: "ti-shine",
      tone: "danger",
      goal: "weather-seasons",
      accent: "Australian",
      noise: "News report",
      level: "B1",
      badge: "Heatwave Ready",
      baseScore: 74,
      opening: "Bản tin nói về nắng nóng và lời khuyên uống nước, tránh ra ngoài buổi trưa.",
      story: "Bạn cần nghe lời khuyên sức khỏe trong thời tiết cực đoan.",
      role: "Người nghe bản tin",
      target: "Bắt temperature, heatwave và advice",
      transcript: "During the heatwave, drink plenty of water and avoid going out at noon.",
      nativeLine: "During the heatwave, drink plenty of water 'n avoid going out at noon.",
      connectedSpeech: "and avoid -> 'n avoid / going out nối / at noon là thời điểm tránh",
      hardPart: "avoid going out at noon",
      questionTitle: "Người dân nên tránh làm gì vào buổi trưa?",
      context: "Chọn lời khuyên đúng.",
      correct: "Going out.",
      distractors: ["Drinking water.", "Checking the weather."],
      keywords: ["heatwave", "water", "avoid", "noon"],
      missReason: "Avoid đảo hướng hành động: việc sau avoid là việc không nên làm.",
      mistakes: ["connected", "accent", "fast"]
    },
    {
      id: "favorite-season-chat",
      title: "Favorite Season Chat",
      icon: "ti-world",
      tone: "green",
      goal: "weather-seasons",
      accent: "American",
      noise: "Campus walk",
      level: "A2+",
      badge: "Season Listener",
      baseScore: 70,
      opening: "Hai sinh viên nói chuyện xã giao về mùa yêu thích.",
      story: "Bạn cần nghe mùa và lý do người nói thích mùa đó.",
      role: "Người trò chuyện xã giao",
      target: "Bắt season, preference và reason",
      transcript: "I prefer autumn because it's cool enough to walk outside after class.",
      nativeLine: "I prefer autumn 'cause it's cool enough to walk outside after class.",
      connectedSpeech: "because -> 'cause / cool enough nối / after class là thời điểm",
      hardPart: "cool enough to walk outside",
      questionTitle: "Vì sao người nói thích autumn?",
      context: "Chọn lý do đúng.",
      correct: "It is cool enough to walk outside.",
      distractors: ["It is too stormy to study.", "It is hotter than summer."],
      keywords: ["prefer", "autumn", "cool enough", "walk outside"],
      missReason: "Because/'cause mở ra lý do, đừng chỉ ghi season.",
      mistakes: ["reduced", "connected", "fast"]
    },
    {
      id: "flight-weather-delay",
      title: "Weather Flight Delay",
      icon: "ti-location-arrow",
      tone: "danger",
      goal: "weather-seasons",
      accent: "British",
      noise: "Airport announcement",
      level: "B1+",
      badge: "Delay Catcher",
      baseScore: 75,
      opening: "Thông báo sân bay nói chuyến bay bị trễ do sương mù dày.",
      story: "Bạn cần nghe lý do delay và thời gian cập nhật tiếp theo.",
      role: "Hành khách ở sân bay",
      target: "Bắt weather cause và delay update",
      transcript: "Because of thick fog, boarding is delayed until we get an update at noon.",
      nativeLine: "'Cause of thick fog, boarding's delayed until we get an update at noon.",
      connectedSpeech: "because of -> 'cause of / boarding is -> boarding's / at noon là update time",
      hardPart: "boarding is delayed until we get an update at noon",
      questionTitle: "Vì sao boarding bị trễ?",
      context: "Chọn lý do thời tiết.",
      correct: "Thick fog.",
      distractors: ["A missing passport.", "A restaurant bill."],
      keywords: ["thick fog", "boarding", "delayed", "noon"],
      missReason: "Because of đứng đầu câu đưa lý do chính, không phải thông tin phụ.",
      mistakes: ["noise", "reduced", "numbers"]
    },
    {
      id: "book-club-review",
      title: "Book Club Review",
      icon: "ti-book",
      tone: "green",
      goal: "hobbies-free-time",
      accent: "British",
      noise: "Book club",
      level: "B1+",
      badge: "Book Reviewer",
      baseScore: 74,
      opening: "Một thành viên book club review sách và nói vì sao kết truyện gây bất ngờ.",
      story: "Bạn cần nghe opinion và điểm người nói thích.",
      role: "Thành viên câu lạc bộ sách",
      target: "Bắt hobby, opinion và plot detail",
      transcript: "The ending surprised me because the quiet character solved the whole mystery.",
      nativeLine: "The ending surprised me 'cause the quiet character solved the whole mystery.",
      connectedSpeech: "because -> 'cause / solved the nối / whole mystery là cụm ý chính",
      hardPart: "the quiet character solved the whole mystery",
      questionTitle: "Điều gì làm người nói bất ngờ?",
      context: "Chọn chi tiết plot đúng.",
      correct: "The quiet character solved the mystery.",
      distractors: ["The book had no ending.", "The author stopped reading."],
      keywords: ["ending", "surprised", "quiet character", "mystery"],
      missReason: "Because/'cause đưa nguyên nhân của opinion.",
      mistakes: ["reduced", "connected", "fast"]
    },
    {
      id: "guitar-practice",
      title: "Guitar Practice",
      icon: "ti-music",
      tone: "warm",
      goal: "hobbies-free-time",
      accent: "American",
      noise: "Music room",
      level: "A2+",
      badge: "Music Habit",
      baseScore: 70,
      opening: "Một người kể về thói quen luyện guitar sau giờ học.",
      story: "Bạn cần nghe thời lượng luyện và mục tiêu nhỏ.",
      role: "Người nghe câu chuyện sở thích",
      target: "Bắt hobby routine và practice goal",
      transcript: "I practice guitar for fifteen minutes a day so my fingers get stronger.",
      nativeLine: "I practice guitar for fifteen minutes a day so my fingers get stronger.",
      connectedSpeech: "fifteen minutes nối / get stronger nối / so báo mục tiêu",
      hardPart: "fifteen minutes a day",
      questionTitle: "Người nói luyện guitar bao lâu mỗi ngày?",
      context: "Chọn thời lượng đúng.",
      correct: "Fifteen minutes.",
      distractors: ["Fifty minutes.", "Five hours."],
      keywords: ["practice", "guitar", "fifteen minutes", "stronger"],
      missReason: "Fifteen/fifty cần nghe trọng âm: fifTEEN nhấn cuối.",
      mistakes: ["numbers", "fast", "ending"]
    },
    {
      id: "weekend-football-invite",
      title: "Weekend Football Invite",
      icon: "ti-basketball",
      tone: "green",
      goal: "hobbies-free-time",
      accent: "Australian",
      noise: "Park",
      level: "B1",
      badge: "Sport Invite",
      baseScore: 72,
      opening: "Một người rủ bạn chơi thể thao cuối tuần nhưng đổi sân vào phút cuối.",
      story: "Bạn cần nghe môn chơi, giờ và địa điểm.",
      role: "Bạn được rủ đi chơi",
      target: "Bắt sport plan và location change",
      transcript: "We're playing football at Riverside Park at ten, not at the school field.",
      nativeLine: "We're playing football at Riverside Park at ten, not at the school field.",
      connectedSpeech: "playing football nối / at ten là giờ / not at phủ định địa điểm cũ",
      hardPart: "Riverside Park at ten",
      questionTitle: "Họ sẽ chơi ở đâu?",
      context: "Chọn địa điểm đúng.",
      correct: "Riverside Park.",
      distractors: ["The school field.", "A movie theater."],
      keywords: ["football", "Riverside Park", "ten", "not"],
      missReason: "Not at the school field là correction; đáp án là Riverside Park.",
      mistakes: ["numbers", "accent", "connected"]
    },
    {
      id: "street-interview-rent",
      title: "Street Interview: Rent",
      icon: "ti-microphone",
      tone: "warm",
      goal: "news-society",
      accent: "American",
      noise: "Street interview",
      level: "B2",
      badge: "Street Reporter",
      baseScore: 77,
      opening: "Phóng viên hỏi người dân về giá thuê nhà tăng trong thành phố.",
      story: "Bạn cần nghe ý kiến cá nhân và vấn đề xã hội.",
      role: "Người nghe street interview",
      target: "Bắt opinion, social issue và supporting reason",
      transcript: "Rent has gone up so fast that many young workers are moving farther out.",
      nativeLine: "Rent has gone up so fast that many young workers are moving farther out.",
      connectedSpeech: "gone up nối / fast that nối / moving farther out là hệ quả",
      hardPart: "young workers are moving farther out",
      questionTitle: "Hệ quả của giá thuê tăng là gì?",
      context: "Chọn ý chính trong phỏng vấn.",
      correct: "Young workers are moving farther away.",
      distractors: ["Rent is getting cheaper.", "Workers are moving into offices."],
      keywords: ["rent", "gone up", "young workers", "farther out"],
      missReason: "So fast that tạo quan hệ nguyên nhân - kết quả.",
      mistakes: ["connected", "fast", "noise"]
    },
    {
      id: "traffic-safety-report",
      title: "Traffic Safety Report",
      icon: "ti-car",
      tone: "danger",
      goal: "news-society",
      accent: "British",
      noise: "Newsroom",
      level: "B1+",
      badge: "News Listener",
      baseScore: 75,
      opening: "Bản tin ngắn nói về camera giao thông mới gần trường học.",
      story: "Bạn cần nghe mục đích của chính sách mới.",
      role: "Người nghe tin tức",
      target: "Bắt traffic, community và safety purpose",
      transcript: "New cameras will be installed near schools to reduce speeding during rush hour.",
      nativeLine: "New cameras'll be installed near schools to reduce speeding during rush hour.",
      connectedSpeech: "cameras will -> cameras'll / installed near nối / rush hour là giờ cao điểm",
      hardPart: "reduce speeding during rush hour",
      questionTitle: "Mục đích của camera mới là gì?",
      context: "Chọn mục tiêu của bản tin.",
      correct: "To reduce speeding near schools.",
      distractors: ["To close the schools.", "To sell new cameras."],
      keywords: ["cameras", "schools", "reduce speeding", "rush hour"],
      missReason: "To reduce báo mục đích của hành động.",
      mistakes: ["connected", "noise", "fast"]
    },
    {
      id: "environment-community-cleanup",
      title: "Community Cleanup",
      icon: "ti-trash",
      tone: "green",
      goal: "news-society",
      accent: "Australian",
      noise: "Community event",
      level: "B1",
      badge: "Community Listener",
      baseScore: 73,
      opening: "Một thông báo cộng đồng mời người dân dọn rác bên bờ sông vào sáng thứ Bảy.",
      story: "Bạn cần nghe địa điểm, thời gian và vật dụng cần mang.",
      role: "Người tham gia sự kiện cộng đồng",
      target: "Bắt community event và environment vocabulary",
      transcript: "Volunteers should meet by the river at nine and bring gloves if they have them.",
      nativeLine: "Volunteers should meet by the river at nine 'n bring gloves if they have them.",
      connectedSpeech: "should meet nối / at nine là giờ / and bring -> 'n bring",
      hardPart: "bring gloves if they have them",
      questionTitle: "Người tham gia nên mang gì nếu có?",
      context: "Chọn vật dụng được nhắc.",
      correct: "Gloves.",
      distractors: ["Umbrellas.", "Passports."],
      keywords: ["volunteers", "river", "nine", "gloves"],
      missReason: "If they have them nghĩa là nếu có sẵn, không phải bắt buộc tuyệt đối.",
      mistakes: ["connected", "numbers", "noise"]
    },
    {
      id: "economy-price-news",
      title: "Price News Brief",
      icon: "ti-money",
      tone: "warm",
      goal: "news-society",
      accent: "American",
      noise: "Radio news",
      level: "B2",
      badge: "Economy Catcher",
      baseScore: 78,
      opening: "Bản tin đời sống nói giá thực phẩm tăng nhưng xăng giảm nhẹ.",
      story: "Bạn cần nghe đối lập giữa hai chỉ số giá.",
      role: "Người nghe bản tin kinh tế đời sống",
      target: "Bắt economy, prices và contrast signal",
      transcript: "Food prices rose again this month, while fuel costs fell slightly.",
      nativeLine: "Food prices rose again this month, while fuel costs fell slightly.",
      connectedSpeech: "prices rose nối / while báo đối lập / fell slightly nối",
      hardPart: "while fuel costs fell slightly",
      questionTitle: "Điều gì giảm nhẹ?",
      context: "Chọn thông tin đối lập trong bản tin.",
      correct: "Fuel costs.",
      distractors: ["Food prices.", "The whole economy."],
      keywords: ["food prices", "rose", "fuel costs", "fell slightly"],
      missReason: "While báo hai xu hướng trái nhau; cần nghe cả hai vế.",
      mistakes: ["connected", "fast", "emotion"]
    },
    {
      id: "app-password-reset",
      title: "Password Reset",
      icon: "ti-lock",
      tone: "green",
      goal: "tech-internet",
      accent: "American",
      noise: "Support chat",
      level: "B1",
      badge: "Security Listener",
      baseScore: 73,
      opening: "Nhân viên hỗ trợ hướng dẫn reset password và bật xác minh hai bước.",
      story: "Bạn cần nghe bước tiếp theo để bảo mật tài khoản.",
      role: "Người dùng app",
      target: "Bắt password, account security và two-step verification",
      transcript: "Reset your password first, then turn on two-step verification in settings.",
      nativeLine: "Reset your password first, then turn on two-step verification in settings.",
      connectedSpeech: "reset your nối / turn on là phrasal verb / two-step verification là cụm dài",
      hardPart: "turn on two-step verification",
      questionTitle: "Sau khi reset password, cần làm gì?",
      context: "Chọn bước bảo mật tiếp theo.",
      correct: "Turn on two-step verification.",
      distractors: ["Delete the account.", "Upload a shopping receipt."],
      keywords: ["reset", "password", "turn on", "two-step verification"],
      missReason: "Then báo bước thứ hai trong quy trình.",
      mistakes: ["connected", "fast", "reduced"]
    },
    {
      id: "video-call-lag",
      title: "Video Call Lag",
      icon: "ti-video-camera",
      tone: "danger",
      goal: "tech-internet",
      accent: "British",
      noise: "Video call",
      level: "B1+",
      badge: "Call Fixer",
      baseScore: 74,
      opening: "Trong lớp online, giáo viên giải thích cách xử lý cuộc gọi bị lag.",
      story: "Bạn cần nghe giải pháp kỹ thuật đơn giản.",
      role: "Học viên học online",
      target: "Bắt app issue, Internet connection và troubleshooting",
      transcript: "If the video keeps freezing, turn off your camera and rejoin the call.",
      nativeLine: "If the video keeps freezing, turn off your camera 'n rejoin the call.",
      connectedSpeech: "keeps freezing nối / turn off là phrasal verb / and rejoin -> 'n rejoin",
      hardPart: "turn off your camera and rejoin the call",
      questionTitle: "Người học nên làm gì nếu video bị đứng?",
      context: "Chọn cách xử lý đúng.",
      correct: "Turn off the camera and rejoin.",
      distractors: ["Turn off the teacher.", "Buy a new phone immediately."],
      keywords: ["video", "freezing", "camera", "rejoin"],
      missReason: "If nêu lỗi, các động từ sau đó là bước xử lý.",
      mistakes: ["connected", "noise", "fast"]
    },
    {
      id: "social-media-screen-time",
      title: "Social Media Screen Time",
      icon: "ti-mobile",
      tone: "warm",
      goal: "tech-internet",
      accent: "Australian",
      noise: "Podcast",
      level: "B2",
      badge: "Digital Balance",
      baseScore: 77,
      opening: "Podcast công nghệ nói về cách giảm thời gian dùng mạng xã hội.",
      story: "Bạn cần nghe tính năng được khuyên bật.",
      role: "Người nghe podcast công nghệ",
      target: "Bắt social media, screen time và app settings",
      transcript: "Set a daily limit for social media apps instead of deleting them completely.",
      nativeLine: "Set a daily limit for social media apps instead'a deleting them completely.",
      connectedSpeech: "instead of -> instead'a / daily limit là cài đặt chính / deleting them nối",
      hardPart: "instead of deleting them completely",
      questionTitle: "Podcast khuyên làm gì?",
      context: "Chọn giải pháp cân bằng.",
      correct: "Set a daily limit for social media apps.",
      distractors: ["Delete every app immediately.", "Upload more videos."],
      keywords: ["daily limit", "social media", "instead of", "deleting"],
      missReason: "Instead of báo điều không làm; đáp án là set a daily limit.",
      mistakes: ["reduced", "accent", "fast"]
    },
    {
      id: "ai-study-tool",
      title: "AI Study Tool",
      icon: "ti-light-bulb",
      tone: "green",
      goal: "tech-internet",
      accent: "American",
      noise: "Class discussion",
      level: "B2",
      badge: "AI Listener",
      baseScore: 78,
      opening: "Hai sinh viên bàn cách dùng AI để học, nhưng giảng viên yêu cầu kiểm tra nguồn.",
      story: "Bạn cần nghe lợi ích và cảnh báo.",
      role: "Sinh viên dùng công cụ học online",
      target: "Bắt AI, source checking và study advice",
      transcript: "AI can help you brainstorm, but you still need to check the sources yourself.",
      nativeLine: "AI can help you brainstorm, but you still needta check the sources yourself.",
      connectedSpeech: "can là âm yếu / need to -> needta / but báo cảnh báo",
      hardPart: "check the sources yourself",
      questionTitle: "Người nói nhắc phải làm gì?",
      context: "Chọn cảnh báo khi dùng AI.",
      correct: "Check the sources yourself.",
      distractors: ["Let AI submit the essay.", "Ignore all sources."],
      keywords: ["AI", "brainstorm", "check", "sources"],
      missReason: "But chuyển từ lợi ích sang điều bắt buộc phải làm.",
      mistakes: ["reduced", "connected", "fast"]
    }
  ];

  missions.push(...[...missionExpansions, ...supplementalSessionExpansions].map((spec, index) => createMissionFromSpec(spec, index + 7)));
  assignSessionVoiceRoutes();
  window.LISTENING_MISSIONS_FALLBACK = cloneContentList(missions);

  async function loadListeningMissionsFromApi() {
    try {
      const response = await fetch("api/learning_content.php?section=listening", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) return false;

      const result = await response.json();
      const loaded = Array.isArray(result.items)
        ? result.items.map((item, index) => normalizeListeningMission(item, index)).filter(Boolean)
        : [];

      if (!loaded.length) return false;
      missions.splice(0, missions.length, ...loaded);
      assignSessionVoiceRoutes();
      window.LISTENING_MISSIONS_SOURCE = result.source || "database";
      return true;
    } catch (error) {
      console.warn("Listening content API unavailable; using bundled sessions.", error);
      return false;
    }
  }

  function normalizeListeningMission(item, index) {
    const payload = item?.payload && typeof item.payload === "object" ? item.payload : item;
    if (!payload || typeof payload !== "object") return null;

    const mission = {
      ...payload,
      id: item.key || payload.id,
      title: payload.title || item.title || item.key,
      goal: payload.goal || item.goal || defaultGoal,
      level: payload.level || item.level || "B1",
      opening: payload.opening || payload.description || item.description || "",
      story: payload.story || payload.description || item.description || "",
      tone: payload.tone || "green",
      icon: payload.icon || "ti-headphone-alt"
    };

    if (!mission.id || !mission.title || !mission.transcript) return null;

    return mission.options?.length
      ? mission
      : createMissionFromSpec(mission, index + 1);
  }

  function cloneContentList(items) {
    try {
      return JSON.parse(JSON.stringify(items));
    } catch (error) {
      return items.map((item) => ({ ...item }));
    }
  }

  function createMissionFromSpec(spec, number) {
    const mission = { ...spec };
    const keywords = Array.isArray(mission.keywords) ? mission.keywords : [];
    const gapParts = mission.gapParts || createGapParts(mission.transcript, keywords);
    const phrases = mission.phrases || createPhraseTimeline(mission.transcript);
    const whyHard = mission.whyHard || createDefaultWhyHard(mission);

    return {
      ...mission,
      label: mission.label || `Session ${number}`,
      options: mission.options || [
        { key: "A", text: mission.correct, correct: true },
        { key: "B", text: mission.distractors[0], correct: false },
        { key: "C", text: mission.distractors[1], correct: false }
      ],
      gapParts,
      phrases,
      whyHard
    };
  }

  function createGapParts(transcript, keywords) {
    const answers = keywords
      .filter(Boolean)
      .filter((keyword) => transcript.toLowerCase().includes(String(keyword).toLowerCase()))
      .slice(-2);

    if (!answers.length) return [transcript];

    const parts = [];
    let cursor = 0;
    answers.forEach((answer) => {
      const lowerTranscript = transcript.toLowerCase();
      const lowerAnswer = String(answer).toLowerCase();
      const index = lowerTranscript.indexOf(lowerAnswer, cursor);
      if (index < 0) return;
      if (index > cursor) parts.push(transcript.slice(cursor, index));
      parts.push({ answer: transcript.slice(index, index + String(answer).length) });
      cursor = index + String(answer).length;
    });
    if (cursor < transcript.length) parts.push(transcript.slice(cursor));
    return parts.length ? parts : [transcript];
  }

  function createPhraseTimeline(transcript) {
    const clean = transcript.replace(/[?.!]$/g, "");
    const words = clean.split(/\s+/).filter(Boolean);
    const phrases = [];
    for (let index = 0; index < words.length; index += 4) {
      phrases.push(words.slice(index, index + 4).join(" "));
    }
    return phrases.filter(Boolean).slice(0, 4);
  }

  function createDefaultWhyHard(mission) {
    return [
      mission.connectedSpeech || "Câu có nối âm và dạng nói nhanh như hội thoại thật.",
      `"${mission.hardPart}" là đoạn cần loop riêng vì chứa thông tin quyết định đáp án.`,
      "Hãy nghe từ khóa nội dung trước, rồi mới mở transcript để kiểm tra chi tiết."
    ];
  }

  function stableHash(value) {
    const input = String(value || "");
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
    }
    return hash;
  }

  function assignSessionVoiceRoutes() {
    Object.keys(goalText).forEach((goal) => {
      const topicMissions = missions
        .filter((mission) => mission.goal === goal)
        .sort((a, b) => a.id.localeCompare(b.id));
      const startIndex = stableHash(goal) % voiceRoutes.length;

      topicMissions.forEach((mission, index) => {
        const route = voiceRoutes[(startIndex + index) % voiceRoutes.length];
        mission.accent = route.label;
        mission.voiceRoute = route;
      });
    });
  }

  window.initListeningLab = async function initListeningLab() {
    const page = document.querySelector(".audio-lab-page");
    if (!page) return;

    await loadListeningMissionsFromApi();

    const state = loadState();
    if (!goalText[state.goal]) state.goal = defaultGoal;
    const els = collectElements();
    let currentMission = null;
    let selectedMode = "natural";
    let listenCount = 0;
    let wrongOptionAttempted = false;
    let answerWasCorrect = false;
    let blankWrongAttempts = 0;
    let usedFullAnswer = false;
    let isPlaying = false;
    let timer = null;
    let remaining = 30;
    let missionSearch = "";
    const sessionShuffleSeed = `${Date.now()}-${Math.random()}`;
    let availableVoices = [];
    let noiseContext = null;
    let noiseSource = null;

    syncStickyOffset();
    generateWaveform();
    renderDashboard();
    bindDashboard();
    bindWorkspace();
    setupVoiceEngine();
    openInitialMissionFromHash();

    function collectElements() {
      return {
        dashboard: document.getElementById("lab-dashboard"),
        workspace: document.getElementById("lab-workspace"),
        missionGrid: document.querySelector("[data-mission-grid]"),
        missionSearch: document.querySelector("[data-mission-search]"),
        missionCount: document.querySelector("[data-mission-count]"),
        startFeatured: document.querySelector("[data-start-featured]"),
        dailyButtons: document.querySelectorAll("[data-daily-challenge]"),
        goalChips: document.querySelectorAll("[data-goal]"),
        openingScenario: document.querySelector("[data-opening-scenario]"),
        nativeScore: document.querySelector("[data-native-score]"),
        scoreRing: document.querySelector("[data-score-ring]"),
        listeningLevel: document.querySelector("[data-listening-level]"),
        streakCount: document.querySelector("[data-streak-count]"),
        weaknessSummary: document.querySelector("[data-weakness-summary]"),
        nextDrill: document.querySelector("[data-next-drill]"),
        mistakeBank: document.querySelector("[data-mistake-bank]"),
        backBtn: document.getElementById("back-to-map"),
        missionKicker: document.querySelector("[data-mission-kicker]"),
        missionTitle: document.querySelector("[data-mission-title]"),
        missionStory: document.querySelector("[data-mission-story]"),
        missionRole: document.querySelector("[data-mission-role]"),
        missionAccent: document.querySelector("[data-mission-accent]"),
        missionNoise: document.querySelector("[data-mission-noise]"),
        missionTarget: document.querySelector("[data-mission-target]"),
        challengeBox: document.querySelector("[data-challenge-box]"),
        challengeTimer: document.querySelector("[data-challenge-timer]"),
        sessionAudit: document.querySelector("[data-session-audit]"),
        layerSteps: document.querySelectorAll("[data-layer-step]"),
        listenCount: document.querySelector("[data-listen-count]"),
        currentMode: document.querySelector("[data-current-mode]"),
        audioNote: document.querySelector("[data-audio-note]"),
        stickySessionTitle: document.querySelector("[data-sticky-session-title]"),
        voiceRoute: document.querySelector("[data-voice-route]"),
        waveform: document.getElementById("waveform"),
        modeTabs: document.querySelectorAll("[data-mode]"),
        playBtn: document.getElementById("master-play"),
        replayHardBtn: document.getElementById("replay-hard"),
        questionTitle: document.querySelector("[data-question-title]"),
        questionContext: document.querySelector("[data-question-context]"),
        options: document.getElementById("roleplay-options"),
        answerFeedback: document.querySelector("[data-answer-feedback]"),
        stage2: document.getElementById("stage-2"),
        keywordHints: document.querySelector("[data-keyword-hints]"),
        dictation: document.querySelector("[data-dictation]"),
        revealLetterBtn: document.getElementById("reveal-letter"),
        playSlowerBtn: document.getElementById("play-slower"),
        showConnectedBtn: document.getElementById("show-connected"),
        showAnswerBtn: document.getElementById("show-answer"),
        checkBlanksBtn: document.getElementById("check-blanks"),
        connectedPanel: document.querySelector("[data-connected-panel]"),
        connectedSpeech: document.querySelector("[data-connected-speech]"),
        stage3: document.getElementById("stage-3"),
        transcript: document.querySelector("[data-transcript]"),
        nativeLine: document.querySelector("[data-native-line]"),
        phraseTimeline: document.querySelector("[data-phrase-timeline]"),
        whyHard: document.querySelector("[data-why-hard]"),
        missReason: document.querySelector("[data-miss-reason]"),
        finishBtn: document.getElementById("finish-mission"),
        resultPanel: document.querySelector("[data-result-panel]"),
        resultTitle: document.querySelector("[data-result-title]"),
        resultCopy: document.querySelector("[data-result-copy]"),
        earnedBadges: document.querySelector("[data-earned-badges]")
      };
    }

    function bindDashboard() {
      els.startFeatured.addEventListener("click", () => openMission(getRecommendedMission().id));

      els.dailyButtons.forEach((button) => {
        button.addEventListener("click", () => openMission(getRecommendedMission().id, { challenge: true }));
      });

      els.goalChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          state.goal = chip.dataset.goal || "travel";
          saveState();
          renderDashboard();
        });
      });

      els.missionSearch?.addEventListener("input", () => {
        missionSearch = els.missionSearch.value.trim().toLowerCase();
        renderMissionGrid();
      });

      window.addEventListener("resize", syncStickyOffset);
    }

    function bindWorkspace() {
      els.backBtn.addEventListener("click", () => {
        stopSpeech();
        stopTimer();
        els.workspace.hidden = true;
        els.dashboard.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      els.modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          selectedMode = tab.dataset.mode || "natural";
          els.modeTabs.forEach((item) => item.classList.toggle("active", item === tab));
          updateModeStatus();
        });
      });

      els.playBtn.addEventListener("click", () => {
        if (!currentMission) return;
        if (isPlaying) {
          stopSpeech();
          return;
        }
        listenCount += 1;
        updateListenLayers();
        speak(getCurrentAudioText());
      });

      els.replayHardBtn.addEventListener("click", () => currentMission && speak(currentMission.hardPart, false));
      els.playSlowerBtn.addEventListener("click", () => currentMission && speak(currentMission.transcript, false, "slow"));
      els.revealLetterBtn.addEventListener("click", revealFirstLetter);
      els.showConnectedBtn.addEventListener("click", () => { els.connectedPanel.hidden = false; });
      els.showAnswerBtn.addEventListener("click", showFullAnswer);
      els.checkBlanksBtn.addEventListener("click", checkDictation);
      els.finishBtn.addEventListener("click", finishMission);
    }

    function setupVoiceEngine() {
      if (!("speechSynthesis" in window)) {
        updateVoiceStatus();
        return;
      }

      const refreshVoices = () => {
        availableVoices = window.speechSynthesis.getVoices().filter((voice) => voice.lang?.startsWith("en"));
        updateVoiceStatus();
      };

      refreshVoices();
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }

    function updateVoiceStatus() {
      if (!els.voiceRoute) return;
      const route = getMissionVoiceRoute(currentMission);

      if (!("speechSynthesis" in window)) {
        els.voiceRoute.textContent = "Browser không hỗ trợ auto voice";
        els.voiceRoute.title = "";
        return;
      }

      const selected = pickVoice(route.lang, currentMission);
      els.voiceRoute.textContent = `${route.label} voice`;
      els.voiceRoute.title = selected ? `${selected.name} (${selected.lang})` : `${route.label} (${route.lang})`;
    }

    function renderDashboard() {
      els.goalChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.goal === state.goal));

      const score = Math.round(state.nativeScore || 72);
      els.nativeScore.textContent = `${score}%`;
      els.scoreRing.setAttribute("stroke-dasharray", `${score}, 100`);
      els.listeningLevel.textContent = getLevelName(score);
      els.streakCount.textContent = `Streak ${state.streak || 3} ngày`;

      const topMistake = getTopMistake();
      els.weaknessSummary.textContent = `Hay miss: ${mistakeLabels[topMistake] || "nối âm"}`;
      els.nextDrill.textContent = getDrillSuggestion(topMistake);
      els.openingScenario.textContent = getGoalScenario(state.goal);

      renderMissionGrid();
      renderMistakeBank();
    }

    function syncStickyOffset() {
      const header = document.querySelector(".site-header");
      const headerBottom = header ? Math.ceil(header.getBoundingClientRect().bottom) : 77;
      page.style.setProperty("--listening-sticky-top", `${Math.max(headerBottom, 0)}px`);
    }

    function renderMissionGrid() {
      const visibleMissions = getVisibleMissions();
      els.missionCount.textContent = `${visibleMissions.length}/${missions.length} sessions`;

      if (!visibleMissions.length) {
        els.missionGrid.innerHTML = `
          <div class="mission-empty">
            <strong>Không tìm thấy session phù hợp.</strong>
            <span>Thử đổi mục tiêu hoặc xóa từ khóa tìm kiếm.</span>
          </div>
        `;
        return;
      }

      els.missionGrid.innerHTML = visibleMissions.map((mission) => {
        const completed = state.completed.includes(mission.id);
        const score = state.scores[mission.id] || 0;
        const recommended = mission.goal === state.goal;
        const progressLabel = completed ? `${score}% completed` : "Ready";

        return `
          <button class="mission-card ${recommended ? "active" : ""}" type="button" data-mission="${escapeAttr(mission.id)}" data-tone="${escapeAttr(mission.tone)}">
            <span class="mission-icon ${escapeAttr(mission.icon)}" aria-hidden="true"></span>
            <span class="mission-info">
              <h3>${escapeHtml(getTopicSessionLabel(mission))}: ${escapeHtml(mission.title)}</h3>
              <p>${escapeHtml(mission.opening)}</p>
              <span class="mission-tags">
                <span>${escapeHtml(mission.level)}</span>
                <span>${escapeHtml(mission.accent)}</span>
                <span>${escapeHtml(goalText[mission.goal])}</span>
                ${recommended ? "<span>Recommended</span>" : ""}
              </span>
              <span class="mission-progress">
                <span>${escapeHtml(progressLabel)}</span>
                <span class="progress-track"><i style="width: ${completed ? score : 0}%"></i></span>
              </span>
            </span>
          </button>
        `;
      }).join("");

      els.missionGrid.querySelectorAll("[data-mission]").forEach((card) => {
        card.addEventListener("click", () => {
          const mission = missions.find((item) => item.id === card.dataset.mission);
          if (!mission) return;
          openMission(mission.id);
        });
      });
    }

    function renderMistakeBank() {
      els.mistakeBank.innerHTML = Object.entries(state.mistakes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => `<li><span>${escapeHtml(mistakeLabels[key] || key)}</span><strong>${count} lần</strong></li>`)
        .join("");
    }

    function getVisibleMissions() {
      return missions.filter((mission) => {
        const matchesGoal = mission.goal === state.goal;
        if (!matchesGoal) return false;
        if (!missionSearch) return true;

        const searchTarget = [
          mission.title,
          mission.opening,
          mission.accent,
          mission.noise,
          mission.level,
          mission.transcript,
          mission.keywords.join(" ")
        ].join(" ").toLowerCase();

        return searchTarget.includes(missionSearch);
      }).sort((a, b) => getSessionRank(a.id, a.goal) - getSessionRank(b.id, b.goal));
    }

    function getSessionRank(id, goal = state.goal) {
      const input = `${sessionShuffleSeed}:${goal}:${id}`;
      let hash = 0;
      for (let index = 0; index < input.length; index += 1) {
        hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
      }
      return hash;
    }

    function getTopicSessions(goal) {
      return missions
        .filter((mission) => mission.goal === goal)
        .sort((a, b) => getSessionRank(a.id, goal) - getSessionRank(b.id, goal));
    }

    function getTopicSessionLabel(mission) {
      const topicSessions = getTopicSessions(mission.goal);
      const index = topicSessions.findIndex((item) => item.id === mission.id);
      return `Session ${index >= 0 ? index + 1 : 1}`;
    }

    function openMission(id, options = {}) {
      const mission = missions.find((item) => item.id === id) || missions[0];
      currentMission = mission;
      selectedMode = "natural";
      listenCount = 0;
      wrongOptionAttempted = false;
      answerWasCorrect = false;
      blankWrongAttempts = 0;
      usedFullAnswer = false;

      stopSpeech();
      stopTimer();
      populateMission(mission);
      renderOptions(mission);
      renderKeywordHints(mission);
      renderDictation(mission);
      renderBreakdown(mission);
      resetStages();
      resetModeTabs();
      updateListenLayers();
      updateModeStatus();

      els.dashboard.hidden = true;
      els.workspace.hidden = false;
      els.resultPanel.hidden = true;

      if (options.challenge) startTimer();
      else els.challengeBox.hidden = true;

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openInitialMissionFromHash() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const missionId = params.get("mission");
      if (!missionId || !missions.some((mission) => mission.id === missionId)) return;
      window.requestAnimationFrame(() => openMission(missionId));
    }

    function populateMission(mission) {
      els.missionKicker.textContent = `${goalText[mission.goal]} · ${getTopicSessionLabel(mission)}`;
      els.missionTitle.textContent = mission.title;
      els.stickySessionTitle.textContent = `${getTopicSessionLabel(mission)} · ${mission.title}`;
      els.missionStory.textContent = mission.story;
      els.missionRole.textContent = mission.role;
      els.missionAccent.textContent = mission.accent;
      els.missionNoise.textContent = mission.noise;
      els.missionTarget.textContent = mission.target;
      els.questionTitle.textContent = mission.questionTitle;
      els.questionContext.textContent = mission.context;
      els.connectedSpeech.textContent = mission.connectedSpeech;
      els.transcript.textContent = `"${mission.transcript}"`;
      els.nativeLine.textContent = mission.nativeLine;
      els.missReason.textContent = mission.missReason;
      els.answerFeedback.textContent = "";
      updateVoiceStatus();
      renderSessionAudit();
    }

    function renderSessionAudit() {
      if (!currentMission || !els.sessionAudit) return;
      const hasTts = "speechSynthesis" in window;
      const route = getMissionVoiceRoute(currentMission);
      const checks = [
        { label: "Session data", ok: Boolean(currentMission.transcript && currentMission.options?.length === 3) },
        { label: `${route.label} voice`, ok: hasTts },
        { label: "Progress save", ok: storageAvailable() },
        { label: "Unlock flow", ok: Boolean(currentMission.gapParts?.length && currentMission.whyHard?.length) }
      ];

      els.sessionAudit.innerHTML = `
        <h3>Session quality check</h3>
        <ul>
          ${checks.map((check) => `<li class="${check.ok ? "ok" : "warn"}"><span>${check.ok ? "OK" : "!"}</span>${escapeHtml(check.label)}</li>`).join("")}
        </ul>
        <p>${hasTts ? `Auto voice route: ${escapeHtml(route.label)} (${escapeHtml(route.lang)})` : "Browser này không hỗ trợ Web Speech API."}</p>
      `;
    }

    function renderOptions(mission) {
      els.options.innerHTML = mission.options.map((option) => `
        <button class="roleplay-btn" type="button" data-correct="${option.correct}">
          <span class="option-key">${escapeHtml(option.key)}</span>
          <span>${escapeHtml(option.text)}</span>
        </button>
      `).join("");

      els.options.querySelectorAll(".roleplay-btn").forEach((button) => {
        button.addEventListener("click", () => handleOption(button));
      });
    }

    function renderKeywordHints(mission) {
      els.keywordHints.innerHTML = mission.keywords.map((keyword) => `<span>${escapeHtml(maskKeyword(keyword))}</span>`).join("");
      els.keywordHints.classList.add("is-hidden");
    }

    function renderDictation(mission) {
      els.dictation.innerHTML = "";
      mission.gapParts.forEach((part) => {
        if (typeof part === "string") {
          els.dictation.appendChild(document.createTextNode(part));
          return;
        }

        const input = document.createElement("input");
        input.type = "text";
        input.dataset.answer = part.answer;
        input.disabled = true;
        input.setAttribute("aria-label", `Điền: ${part.answer}`);
        input.addEventListener("keyup", (event) => {
          if (event.key === "Enter") els.checkBlanksBtn.click();
        });
        els.dictation.appendChild(input);
      });
    }

    function renderBreakdown(mission) {
      els.whyHard.innerHTML = mission.whyHard.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      els.phraseTimeline.innerHTML = mission.phrases.map((phrase) => `
        <button class="phrase-chip" type="button" data-phrase="${escapeAttr(phrase)}"><span class="ti-control-play"></span>${escapeHtml(phrase)}</button>
      `).join("");

      els.phraseTimeline.querySelectorAll("[data-phrase]").forEach((button) => {
        button.addEventListener("click", () => speak(button.dataset.phrase, false));
      });
    }

    function resetStages() {
      els.stage2.classList.add("stage-locked");
      els.stage3.classList.add("stage-locked");
      els.finishBtn.disabled = true;
      els.connectedPanel.hidden = true;
      setDictationControls(false);
      els.options.querySelectorAll(".roleplay-btn").forEach((button) => {
        button.disabled = false;
        button.classList.remove("correct", "wrong");
      });
      const medium = document.querySelector('input[name="confidence"][value="medium"]');
      if (medium) medium.checked = true;
    }

    function resetModeTabs() {
      selectedMode = "natural";
      els.modeTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === "natural"));
    }

    function updateModeStatus() {
      const mode = modes[selectedMode] || modes.natural;
      els.currentMode.textContent = mode.label;
      els.audioNote.textContent = mode.note;
      updateVoiceStatus();
    }

    function updateListenLayers() {
      const capped = Math.min(listenCount, 3);
      els.listenCount.textContent = capped;

      els.layerSteps.forEach((step) => {
        const index = Number(step.dataset.layerStep);
        step.classList.toggle("done", capped >= index);
        step.classList.toggle("active", capped + 1 === index || (capped === 3 && index === 3));
      });

      if (listenCount >= 2) {
        els.stage2.classList.remove("stage-locked");
        els.keywordHints.classList.remove("is-hidden");
      }

      setDictationControls(listenCount >= 3);

      if (listenCount === 1) els.answerFeedback.textContent = "Lần 1: cố đoán ý chính trước, chưa cần transcript.";
      if (listenCount === 2) els.answerFeedback.textContent = "Lần 2: từ khóa đã mở. Hãy nghe xem câu đang hỏi điều gì.";
      if (listenCount >= 3) els.answerFeedback.textContent = "Lần 3: gap transcript đã mở. Điền chỗ trống trước khi xem breakdown.";
    }

    function setDictationControls(enabled) {
      [els.revealLetterBtn, els.playSlowerBtn, els.showConnectedBtn, els.showAnswerBtn, els.checkBlanksBtn].forEach((button) => {
        button.disabled = !enabled;
      });
      getBlankInputs().forEach((input) => {
        input.disabled = !enabled;
        if (!enabled) {
          input.value = "";
          input.classList.remove("correct", "wrong");
        }
      });
    }

    function handleOption(button) {
      const correct = button.dataset.correct === "true";
      els.options.querySelectorAll(".roleplay-btn").forEach((item) => item.classList.remove("correct", "wrong"));

      if (correct) {
        answerWasCorrect = true;
        button.classList.add("correct");
        els.answerFeedback.textContent = "Đúng ngữ cảnh. Tiếp tục nghe lần 2 và lần 3 để bóc tách âm thanh.";
        return;
      }

      wrongOptionAttempted = true;
      answerWasCorrect = false;
      button.classList.add("wrong");
      addMistakes(currentMission.mistakes, 1);
      els.answerFeedback.textContent = `Bạn có thể đã miss phần khó: ${currentMission.missReason}`;
      saveState();
      renderDashboard();
    }

    function checkDictation() {
      let allCorrect = true;
      getBlankInputs().forEach((input) => {
        const isCorrect = normalize(input.value) === normalize(input.dataset.answer);
        input.classList.toggle("correct", isCorrect);
        input.classList.toggle("wrong", !isCorrect);
        if (!isCorrect) allCorrect = false;
      });

      if (allCorrect) {
        els.answerFeedback.textContent = "Dictation đúng. Breakdown đã mở để xem vì sao câu này khó nghe.";
        unlockStage3();
        return;
      }

      blankWrongAttempts += 1;
      addMistakes(currentMission.mistakes, 1);
      saveState();
      renderDashboard();
      els.answerFeedback.textContent = "Chưa đúng. Hãy dùng Replay hard part hoặc Show connected speech trước khi hiện đáp án.";
    }

    function revealFirstLetter() {
      const target = getBlankInputs().find((input) => normalize(input.value) !== normalize(input.dataset.answer));
      if (!target) return;
      target.value = target.dataset.answer.charAt(0);
      target.focus();
    }

    function showFullAnswer() {
      usedFullAnswer = true;
      getBlankInputs().forEach((input) => {
        input.value = input.dataset.answer;
        input.classList.add("correct");
        input.classList.remove("wrong");
      });
      unlockStage3();
    }

    function unlockStage3() {
      els.stage3.classList.remove("stage-locked");
      els.finishBtn.disabled = false;
      els.connectedPanel.hidden = false;
    }

    function finishMission() {
      const confidence = document.querySelector('input[name="confidence"]:checked')?.value || "medium";
      let score = currentMission.baseScore;

      if (answerWasCorrect && !wrongOptionAttempted) score += 8;
      if (wrongOptionAttempted) score -= 8;
      if (blankWrongAttempts === 0 && !usedFullAnswer) score += 8;
      if (blankWrongAttempts > 0) score -= Math.min(10, blankWrongAttempts * 4);
      if (usedFullAnswer) score -= 6;
      if (selectedMode === "native") score += 3;
      if (selectedMode === "chaos") score += 4;
      if (confidence === "high" && wrongOptionAttempted) score -= 4;
      if (confidence === "low" && answerWasCorrect) score += 2;
      score = clamp(Math.round(score), 48, 96);

      state.completed = unique([...state.completed, currentMission.id]);
      state.scores[currentMission.id] = Math.max(state.scores[currentMission.id] || 0, score);
      state.nativeScore = computeNativeScore(state.scores);
      state.xp = (state.xp || 120) + 40;
      state.streak = Math.max(state.streak || 3, 3);
      saveState();

      els.resultTitle.textContent = `Bạn hiểu được ${score}% session "${currentMission.title}" ở ${modes[selectedMode].label}.`;
      els.resultCopy.textContent = score >= 85
        ? "Bạn đã đủ điều kiện mở các session khó hơn ở Native Mode."
        : `Mục tiêu tiếp theo: đạt 85%. Gợi ý luyện tiếp: ${getDrillSuggestion(getTopMistake())}`;
      els.earnedBadges.innerHTML = [currentMission.badge, "+40 XP", getLevelBadge(score)]
        .map((badge) => `<span>${escapeHtml(badge)}</span>`)
        .join("");
      els.resultPanel.hidden = false;
      els.finishBtn.disabled = true;
      stopTimer();
      renderDashboard();
    }

    function getCurrentAudioText() {
      const mode = modes[selectedMode] || modes.natural;
      return mode.native ? currentMission.nativeLine : currentMission.transcript;
    }

    function speak(text, countListen = false, modeOverride = null) {
      const mode = modes[modeOverride || selectedMode] || modes.natural;
      if (countListen) listenCount += 1;
      stopSpeech();
      isPlaying = true;
      els.waveform.classList.add("playing");
      els.playBtn.innerHTML = '<span class="ti-control-pause"></span> Stop audio';
      els.currentMode.textContent = `Speaking · ${modes[modeOverride || selectedMode]?.label || "Audio"}`;

      if (mode.noise) startNoise();

      if (!("speechSynthesis" in window)) {
        window.setTimeout(stopSpeech, Math.max(1200, text.split(/\s+/).length * 260));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getMissionVoiceRoute(currentMission).lang;
      utterance.rate = mode.rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voice = pickVoice(utterance.lang, currentMission);
      if (voice) utterance.voice = voice;
      utterance.onend = stopSpeech;
      utterance.onerror = stopSpeech;
      window.speechSynthesis.speak(utterance);
    }

    function stopSpeech() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopNoise();
      isPlaying = false;
      els.waveform?.classList.remove("playing");
      if (els.playBtn) els.playBtn.innerHTML = '<span class="ti-control-play"></span> Play session audio';
      updateModeStatus();
    }

    function startNoise() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        noiseContext = noiseContext || new AudioContext();
        if (noiseContext.state === "suspended") noiseContext.resume();
        const buffer = noiseContext.createBuffer(1, noiseContext.sampleRate * 2, noiseContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let index = 0; index < output.length; index += 1) output[index] = (Math.random() * 2 - 1) * 0.08;
        const source = noiseContext.createBufferSource();
        const gain = noiseContext.createGain();
        gain.gain.value = 0.08;
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain).connect(noiseContext.destination);
        source.start();
        noiseSource = source;
      } catch (error) {
        noiseSource = null;
      }
    }

    function stopNoise() {
      if (!noiseSource) return;
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch (error) {
        // The node may already be stopped by the browser.
      }
      noiseSource = null;
    }

    function startTimer() {
      els.challengeBox.hidden = false;
      remaining = 30;
      els.challengeTimer.textContent = `${remaining}s`;
      timer = window.setInterval(() => {
        remaining -= 1;
        els.challengeTimer.textContent = `${remaining}s`;
        if (remaining <= 0) {
          stopTimer();
          els.answerFeedback.textContent = "Hết 30 giây. Hãy hoàn thành câu đang nghe để nhận điểm Quick Listen.";
        }
      }, 1000);
    }

    function stopTimer() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function generateWaveform() {
      if (!els.waveform || els.waveform.children.length) return;
      [28, 52, 34, 70, 42, 64, 36, 78, 48, 58, 30, 66, 74, 40, 56, 34, 82, 46, 62, 38, 72, 52, 36, 68, 44, 76, 32, 58, 84, 48, 60, 40, 70, 54, 36, 64].forEach((height, index) => {
        const bar = document.createElement("span");
        bar.className = "wave-bar";
        bar.style.height = `${height}%`;
        bar.style.animationDelay = `${(index % 8) * 0.06}s`;
        els.waveform.appendChild(bar);
      });
    }

    function getBlankInputs() {
      return Array.from(els.dictation.querySelectorAll("input"));
    }

    function addMistakes(keys, amount) {
      keys.forEach((key) => {
        state.mistakes[key] = (state.mistakes[key] || 0) + amount;
      });
    }

    function getTopMistake() {
      return Object.entries(state.mistakes).sort((a, b) => b[1] - a[1])[0]?.[0] || "connected";
    }

    function getRecommendedMission() {
      return missions.find((mission) => mission.goal === state.goal) || missions[0];
    }

    function getGoalScenario(goal) {
      return (missions.find((mission) => mission.goal === goal) || missions[0]).opening;
    }

    function getLevelName(score) {
      if (score >= 88) return "Level 5: Native Speed Survivor";
      if (score >= 78) return "Level 4: Real-life Listener";
      if (score >= 68) return "Level 3: Sentence Decoder";
      if (score >= 58) return "Level 2: Phrase Hunter";
      return "Level 1: Word Catcher";
    }

    function getLevelBadge(score) {
      if (score >= 88) return "Native Speed Survivor";
      if (score >= 78) return "Real-life Listener";
      if (score >= 68) return "Sentence Decoder";
      if (score >= 58) return "Phrase Hunter";
      return "Word Catcher";
    }

    function getDrillSuggestion(key) {
      return {
        connected: "Luyện 5 phút với did you -> didja, want to -> wanna, let me -> lemme.",
        ending: "Luyện âm cuối /t/, /d/, /s/ bằng cách loop từng cụm ngắn.",
        fast: "Nghe Natural Mode trước, sau đó tăng lên Native Mode và replay hard part.",
        reduced: "Tập nhận diện dạng nói thật: gonna, wanna, shoulda, kinda.",
        numbers: "Luyện cặp fifteen/fifty, thirteen/thirty và giờ hẹn trong voicemail.",
        accent: "Nghe cùng một câu bằng American, British và Australian accent.",
        noise: "Bật Chaos Mode ở âm lượng thấp rồi tăng dần độ khó.",
        emotion: "Luyện Movie Mode: nghe pitch, ngữ cảnh và câu sau để đoán ý ngầm."
      }[key] || "Luyện 5 phút với did you -> didja, want to -> wanna, let me -> lemme.";
    }

    function loadState() {
      const fallback = {
        nativeScore: 72,
        streak: 3,
        xp: 120,
        goal: defaultGoal,
        completed: [],
        scores: {},
        mistakes: { connected: 3, ending: 2, fast: 2, numbers: 1, noise: 1 }
      };

      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!parsed) return fallback;
        return {
          ...fallback,
          ...parsed,
          completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          scores: parsed.scores || {},
          mistakes: { ...fallback.mistakes, ...(parsed.mistakes || {}) }
        };
      } catch (error) {
        return fallback;
      }
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function storageAvailable() {
      try {
        localStorage.setItem(`${STORAGE_KEY}Check`, "1");
        localStorage.removeItem(`${STORAGE_KEY}Check`);
        return true;
      } catch (error) {
        return false;
      }
    }

    function computeNativeScore(scores) {
      const values = Object.values(scores).map(Number);
      if (!values.length) return 72;
      return Math.round(clamp(values.reduce((sum, value) => sum + value, 0) / values.length, 52, 96));
    }

    function pickVoice(lang, mission = currentMission) {
      const route = getMissionVoiceRoute(mission);
      const voices = availableVoices.length ? availableVoices : (window.speechSynthesis?.getVoices?.() || []);
      return pickVoiceFromPool(voices.filter((voice) => voice.lang === lang), mission?.id)
        || pickVoiceFromPool(voices.filter((voice) => voice.lang === route.fallbackLang), mission?.id)
        || pickVoiceFromPool(voices.filter((voice) => voice.lang?.startsWith(lang.slice(0, 2))), mission?.id)
        || pickVoiceFromPool(voices.filter((voice) => voice.lang?.startsWith("en")), mission?.id);
    }

    function pickVoiceFromPool(voices, seed) {
      if (!voices.length) return null;
      return voices[stableHash(seed || currentMission?.id || "voice") % voices.length];
    }

    function getMissionVoiceRoute(mission) {
      return mission?.voiceRoute
        || voiceRoutes.find((route) => route.label === mission?.accent)
        || voiceRoutes[0];
    }

    function maskKeyword(keyword) {
      if (keyword.length <= 4) return `${keyword.charAt(0)}__`;
      return `${keyword.slice(0, 2)}${"_".repeat(Math.min(5, keyword.length - 2))}`;
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase().replace(/[.,!?']/g, "").replace(/\s+/g, " ");
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function unique(values) {
      return Array.from(new Set(values));
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char]));
    }

    function escapeAttr(value) {
      return escapeHtml(value).replace(/`/g, "&#096;");
    }
  };
})();
